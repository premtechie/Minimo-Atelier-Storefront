"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icon";
import { useShop } from "./shop-provider";

/*
 * Signing in, the way Bluebee does it: a sheet with the mobile number, then a
 * 4-digit code, and the shopper is in. No passwords and no separate sign-up.
 * The session is an httpOnly cookie set by this site's server, so it lasts
 * across visits and tabs until the shopper signs out.
 */

export type Account = { phone: string; first_name: string; last_name: string; name: string; member_since: string };
export type AuthConfig = { available: boolean; test_mode: boolean; otp_digits: number; resend_seconds: number };

type Open = { reason?: "checkout" | "account" | "wishlist"; then?: () => void };
type Ctx = {
  /** "loading" until the first answer from the server. */
  status: "loading" | "signed_in" | "signed_out";
  account: Account | null;
  config: AuthConfig | null;
  /** Sign-in is on: checkout needs it. */
  required: boolean;
  openSignIn: (o?: Open) => void;
  signOut: () => Promise<void>;
  setAccount: (a: Account) => void;
};

const AccountCtx = createContext<Ctx | null>(null);
const DISMISS_KEY = "mm_login_sheet_dismissed_at";
/** Closing the sheet keeps it from popping up again for three days, as on Bluebee. */
const SNOOZE_MS = 3 * 24 * 60 * 60_000;
const POP_AFTER_MS = 6000;

async function post<T>(url: string, body: unknown = {}): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string; code?: string }> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, data: data as T };
    return { ok: false, status: res.status, message: data?.error?.message || "Something went wrong. Please try again.", code: data?.error?.code };
  } catch {
    return { ok: false, status: 0, message: "You seem to be offline. Check your connection and try again." };
  }
}
export { post as accountPost };

export function AccountProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Ctx["status"]>("loading");
  const [account, setAccountState] = useState<Account | null>(null);
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [sheet, setSheet] = useState<Open | null>(null);
  // A tap on the account icon before the first answer waits for it: the sheet
  // opens if sign-in is on, otherwise the shopper goes to their orders.
  const router = useRouter();
  const early = useRef<Open | null>(null);
  const loaded = useRef(false);
  const { wish, setWishAll, ready } = useShop();
  const synced = useRef(false);
  const path = usePathname();

  useEffect(() => {
    let live = true;
    Promise.all([
      fetch("/api/auth/config").then((r) => r.json()).catch(() => null),
      fetch("/api/auth/me").then((r) => r.json()).catch(() => null),
    ]).then(([c, me]) => {
      if (!live) return;
      const conf: AuthConfig = c && typeof c.available === "boolean" ? c : { available: false, test_mode: false, otp_digits: 4, resend_seconds: 30 };
      setConfig(conf);
      loaded.current = true;
      if (!conf.available && early.current?.reason === "account") router.push("/orders");
      early.current = null;
      const a = me?.account ?? null;
      setAccountState(a);
      setStatus(a ? "signed_in" : "signed_out");
    });
    return () => {
      live = false;
    };
  }, [router]);

  // Signed in: the phone's saved list and the account's are merged, both ways.
  useEffect(() => {
    if (status !== "signed_in" || !ready || synced.current) return;
    synced.current = true;
    void post<{ wishlist: string[] }>("/api/account/overview").then(async (res) => {
      if (!res.ok) return;
      const theirs = new Set(res.data.wishlist);
      const add = [...wish].filter((id) => !theirs.has(id));
      if (add.length) await post("/api/account/wishlist", { add });
      setWishAll([...new Set([...res.data.wishlist, ...wish])]);
    });
  }, [status, ready, wish, setWishAll]);

  useEffect(() => {
    if (status !== "signed_in") return;
    const on = (e: Event) => {
      const { id, on } = (e as CustomEvent<{ id: string; on: boolean }>).detail;
      void post("/api/account/wishlist", on ? { add: [id] } : { remove: [id] });
    };
    window.addEventListener("mm:wish", on);
    return () => window.removeEventListener("mm:wish", on);
  }, [status]);

  // Like Bluebee, the sheet offers itself once to a signed-out visitor, then waits three days.
  useEffect(() => {
    if (status !== "signed_out" || !config?.available || sheet) return;
    if (path.startsWith("/account") || path.startsWith("/cart") || path.startsWith("/orders")) return;
    let last = 0;
    try {
      last = Number(localStorage.getItem(DISMISS_KEY) || 0);
    } catch {
      return;
    }
    if (Date.now() - last < SNOOZE_MS) return;
    const t = setTimeout(() => setSheet({}), POP_AFTER_MS);
    return () => clearTimeout(t);
  }, [status, config, path, sheet]);

  const signedIn = useCallback((a: Account) => {
    setAccountState(a);
    setStatus("signed_in");
    synced.current = false;
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      status,
      account,
      config,
      required: !!config?.available,
      openSignIn: (o = {}) => {
        if (!loaded.current) early.current = o;
        setSheet(o);
      },
      signOut: async () => {
        await post("/api/auth/logout");
        setAccountState(null);
        setStatus("signed_out");
        synced.current = false;
        // Orders filed under the account leave this phone with it; guest orders stay.
        try {
          const list = JSON.parse(localStorage.getItem("minimo-orders") || "[]");
          if (Array.isArray(list)) localStorage.setItem("minimo-orders", JSON.stringify(list.filter((o: { token?: string }) => o && o.token)));
          window.dispatchEvent(new Event("mm:orders"));
        } catch {
          /* blocked storage */
        }
      },
      setAccount: (a) => setAccountState(a),
    }),
    [status, account, config],
  );

  const close = (done: boolean) => {
    const then = sheet?.then;
    setSheet(null);
    if (!done) {
      try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      } catch {
        /* blocked storage */
      }
    } else then?.();
  };

  return (
    <AccountCtx.Provider value={value}>
      {children}
      {config?.available && (
        <SignInSheet
          open={!!sheet}
          reason={sheet?.reason}
          config={config}
          onClose={() => close(false)}
          onDone={(a) => {
            signedIn(a);
            close(true);
          }}
        />
      )}
    </AccountCtx.Provider>
  );
}

export function useAccount() {
  const v = useContext(AccountCtx);
  if (!v) throw new Error("useAccount outside AccountProvider");
  return v;
}

const fmtMobile = (m: string) => `+91 ${m}`;

/** Mobile → code → (first time) name. Used by the sheet and by the signed-out account page. */
export function SignInFlow({ config, onDone, autoFocus = true, idPrefix = "si" }: { config: AuthConfig; onDone: (a: Account) => void; autoFocus?: boolean; idPrefix?: string }) {
  const [step, setStep] = useState<"phone" | "code" | "name">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState<string[]>(() => Array(config.otp_digits).fill(""));
  const [testCode, setTestCode] = useState("");
  const [wait, setWait] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [bad, setBad] = useState(false);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [pending, setPending] = useState<Account | null>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);
  useEffect(() => {
    if (!autoFocus) return;
    const t = setTimeout(() => (step === "phone" ? phoneRef.current : step === "code" ? boxes.current[0] : nameRef.current)?.focus({ preventScroll: true }), 120);
    return () => clearTimeout(t);
  }, [step, autoFocus]);

  const send = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setErr("Enter a valid 10-digit mobile number.");
      phoneRef.current?.focus();
      return;
    }
    setBusy(true);
    setErr("");
    const res = await post<{ resend_in: number; test_code?: string }>("/api/auth/otp", { phone });
    setBusy(false);
    if (!res.ok) return setErr(res.message);
    setTestCode(res.data.test_code ?? "");
    setCode(Array(config.otp_digits).fill(""));
    setBad(false);
    setWait(res.data.resend_in || config.resend_seconds);
    setStep("code");
  };

  const verify = async (digits: string[]) => {
    const c = digits.join("");
    if (c.length !== config.otp_digits) return setErr(`Enter the ${config.otp_digits}-digit code.`);
    setBusy(true);
    setErr("");
    const res = await post<{ account: Account; created: boolean }>("/api/auth/verify", { phone, code: c });
    setBusy(false);
    if (!res.ok) {
      setBad(true);
      setErr(res.message);
      setCode(Array(config.otp_digits).fill(""));
      setTimeout(() => boxes.current[0]?.focus(), 30);
      return;
    }
    if (!res.data.account.first_name) {
      setPending(res.data.account);
      setStep("name");
      return;
    }
    onDone(res.data.account);
  };

  const type = (i: number, v: string) => {
    const digits = v.replace(/\D/g, "");
    const next = [...code];
    if (digits.length > 1) {
      // A pasted or autofilled code fills every box.
      digits.slice(0, config.otp_digits).split("").forEach((d, k) => (next[k] = d));
      setCode(next);
      setBad(false);
      if (next.every(Boolean)) void verify(next);
      else boxes.current[Math.min(digits.length, config.otp_digits - 1)]?.focus();
      return;
    }
    next[i] = digits;
    setCode(next);
    setBad(false);
    if (digits && i < config.otp_digits - 1) boxes.current[i + 1]?.focus();
    if (next.every(Boolean)) void verify(next);
  };

  const saveName = async () => {
    if (!first.trim()) {
      setErr("Add your first name.");
      return nameRef.current?.focus();
    }
    setBusy(true);
    setErr("");
    const res = await post<{ account: Account }>("/api/account/profile", { first_name: first, last_name: last });
    setBusy(false);
    if (!res.ok) return setErr(res.message);
    onDone(res.data.account);
  };

  if (step === "name")
    return (
      <form
        className="a-form"
        onSubmit={(e) => {
          e.preventDefault();
          void saveName();
        }}
      >
        <p className="a-sent">You&apos;re in. What should we call you?</p>
        <div className="a-row2">
          <label className="a-field">
            <span className="a-label">First name *</span>
            <input ref={nameRef} className="a-input" value={first} onChange={(e) => setFirst(e.target.value.slice(0, 40))} autoComplete="given-name" />
          </label>
          <label className="a-field">
            <span className="a-label">Last name</span>
            <input className="a-input" value={last} onChange={(e) => setLast(e.target.value.slice(0, 40))} autoComplete="family-name" />
          </label>
        </div>
        <p className="a-err" aria-live="polite">
          {err}
        </p>
        <button className="a-btn" style={{ marginTop: 0 }} disabled={busy} aria-busy={busy}>
          {busy ? "Saving…" : "Continue"}
        </button>
        <button type="button" className="a-link" style={{ alignSelf: "center", fontSize: 13 }} onClick={() => pending && onDone(pending)}>
          Skip for now
        </button>
      </form>
    );

  if (step === "code")
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void verify(code);
        }}
      >
        <p className="a-sent">
          Code sent to <b>{fmtMobile(phone)}</b> ·{" "}
          <button type="button" className="a-link" onClick={() => (setStep("phone"), setErr(""))}>
            Change
          </button>
        </p>
        <div className="a-code" role="group" aria-label={`${config.otp_digits}-digit code`}>
          {code.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                boxes.current[i] = el;
              }}
              id={`${idPrefix}-code-${i}`}
              className={bad ? "is-bad" : ""}
              value={d}
              onChange={(e) => type(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !code[i] && i > 0) boxes.current[i - 1]?.focus();
              }}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={i === 0 ? config.otp_digits : 1}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>
        {testCode && (
          <p className="a-note" role="status">
            Test mode: no SMS is sent on this site. Your code is <b>{testCode}</b>.
          </p>
        )}
        <p className="a-err" aria-live="polite">
          {err}
        </p>
        <button className="a-btn" style={{ marginTop: 6 }} disabled={busy} aria-busy={busy}>
          {busy ? "Checking…" : "Verify OTP"}
        </button>
        <p className="a-resend">
          {wait > 0 ? (
            `Resend in ${wait}s`
          ) : (
            <button type="button" className="a-link" onClick={() => void send()} disabled={busy}>
              Resend code
            </button>
          )}
        </p>
      </form>
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
    >
      <div className="a-phone">
        <span className="a-phone-prefix">
          <span aria-hidden="true">🇮🇳</span> +91
        </span>
        <input
          ref={phoneRef}
          id={`${idPrefix}-phone`}
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "").slice(0, 10));
            setErr("");
          }}
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="Phone number"
          aria-label="Mobile number"
        />
      </div>
      <p className="a-err" aria-live="polite">
        {err}
      </p>
      <button className="a-btn" style={{ marginTop: 6 }} disabled={busy} aria-busy={busy}>
        {busy ? "Sending…" : "Send OTP"}
      </button>
    </form>
  );
}

function SignInSheet({ open, reason, config, onClose, onDone }: { open: boolean; reason?: Open["reason"]; config: AuthConfig; onClose: () => void; onDone: (a: Account) => void }) {
  const box = useRef<HTMLDivElement>(null);
  // A fresh flow each time the sheet opens.
  const [round, setRound] = useState(0);
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start a fresh sign-in each time the sheet opens
    setRound((r) => r + 1);
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    document.documentElement.classList.add("m-lock");
    return () => {
      document.removeEventListener("keydown", k);
      document.documentElement.classList.remove("m-lock");
    };
  }, [open, onClose]);

  return (
    <>
      <div className={`a-overlay ${open ? "open" : ""}`} onClick={onClose} aria-hidden="true" />
      <div ref={box} className={`a-sheet ${open ? "open" : ""}`} role="dialog" aria-modal="true" aria-labelledby="a-sheet-title" inert={!open}>
        <div className="a-drag">
          <span className="a-handle" />
        </div>
        <div className="a-top">
          <Image src="/brand/logo.png" alt="Minimo Atelier" width={240} height={112} />
          <button className="a-close" onClick={onClose} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>
        <p className="a-eyebrow">Welcome to Minimo</p>
        <h2 className="a-title" id="a-sheet-title">
          {reason === "checkout" ? "Sign in to place your order" : "Sign in to shop smarter"}
        </h2>
        <ul className="a-benefits">
          <li>
            <Icon name="tag" size={13} /> Offers
          </li>
          <li>
            <Icon name="bolt" size={13} /> Faster checkout
          </li>
          <li>
            <Icon name="box" size={13} /> Order tracking
          </li>
        </ul>
        {open && <SignInFlow key={round} config={config} onDone={onDone} />}
        <p className="a-legal">
          By continuing you agree to our <Link href="/visit-our-store">Privacy Policy</Link>.
        </p>
      </div>
    </>
  );
}
