"use client";

import { useEffect, useRef, useState } from "react";
import { currentToken, finishEmailLink, firebaseConfigured, firebaseMessage, firebaseSignOut, googleToken, isEmailLink, rememberedEmail, sendEmailLink } from "@/lib/firebase-client";
import { accountPost as post, type Account } from "./account-provider";

/*
 * Sign-in through Firebase (free, no SMS): "Continue with Google", or a
 * sign-in link by email. The first time, the shopper adds their name and
 * mobile, which orders and delivery updates use. Firebase only proves the
 * email; our server checks its token and keeps the session.
 */
type Step = "start" | "sent" | "confirm" | "finishing" | "profile";
type Verified = { account?: Account; needs_profile?: boolean; email?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_S = 30;

export function FirebaseSignIn({ onDone, autoFocus = true, handleLink = false }: { onDone: (a: Account) => void; autoFocus?: boolean; handleLink?: boolean }) {
  const linkOpen = handleLink && isEmailLink();
  // Opened from the emailed link: finish straight away when this browser remembers the email, else ask for it.
  const [email, setEmail] = useState(() => (linkOpen ? rememberedEmail() : ""));
  const [step, setStep] = useState<Step>(() => (linkOpen ? (rememberedEmail() ? "finishing" : "confirm") : "start"));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [wait, setWait] = useState(0);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);
  useEffect(() => {
    if (!autoFocus) return;
    const t = setTimeout(() => (step === "profile" ? firstRef.current : step === "start" || step === "confirm" ? emailRef.current : null)?.focus({ preventScroll: true }), 120);
    return () => clearTimeout(t);
  }, [step, autoFocus]);

  /** Hands Firebase's token to our server: signed in, or asked for name and mobile. */
  const exchange = async (token: string, profile?: Record<string, string>) => {
    const res = await post<Verified>("/api/auth/verify", { firebase_token: token, ...profile });
    if (!res.ok) {
      setErr(res.message);
      return false;
    }
    if (res.data.needs_profile) {
      setEmail(res.data.email ?? email);
      setStep("profile");
      return true;
    }
    if (res.data.account) {
      await firebaseSignOut();
      onDone(res.data.account);
    }
    return true;
  };

  const finish = async (addr: string) => {
    setBusy(true);
    setErr("");
    setStep("finishing");
    try {
      await exchange(await finishEmailLink(addr));
    } catch (e) {
      setErr(firebaseMessage(e));
      setStep("start");
    }
    setBusy(false);
  };

  useEffect(() => {
    if (step !== "finishing" || started.current || !email) return;
    started.current = true;
    finishEmailLink(email)
      .then((token) => exchange(token))
      .catch((e) => {
        setErr(firebaseMessage(e));
        setStep("start");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the sheet opens from a link
  }, [step]);

  const google = async () => {
    if (!firebaseConfigured()) return setErr("Sign-in isn't set up on this site yet. Please message us on WhatsApp.");
    setBusy(true);
    setErr("");
    try {
      await exchange(await googleToken());
    } catch (e) {
      setErr(firebaseMessage(e));
    }
    setBusy(false);
  };

  const sendLink = async () => {
    const addr = email.trim().toLowerCase();
    if (!EMAIL_RE.test(addr)) {
      setErr("Enter a valid email address.");
      return emailRef.current?.focus();
    }
    if (!firebaseConfigured()) return setErr("Sign-in isn't set up on this site yet. Please message us on WhatsApp.");
    setBusy(true);
    setErr("");
    try {
      await sendEmailLink(addr);
      setEmail(addr);
      setWait(RESEND_S);
      setStep("sent");
    } catch (e) {
      setErr(firebaseMessage(e));
    }
    setBusy(false);
  };

  const saveProfile = async () => {
    if (!first.trim()) {
      setErr("Add your first name.");
      return firstRef.current?.focus();
    }
    if (!/^[6-9]\d{9}$/.test(phone)) return setErr("Enter a valid 10-digit mobile number.");
    setBusy(true);
    setErr("");
    try {
      const token = await currentToken();
      if (!token) {
        setErr("Your sign-in timed out. Please start again.");
        setStep("start");
      } else await exchange(token, { first_name: first.trim(), last_name: last.trim(), phone });
    } catch (e) {
      setErr(firebaseMessage(e));
    }
    setBusy(false);
  };

  const errLine = (
    <p className="a-err" aria-live="polite">
      {err}
    </p>
  );

  if (step === "finishing")
    return (
      <div className="a-form">
        <p className="a-sent">{err || "Signing you in…"}</p>
        {err && (
          <button type="button" className="a-btn" onClick={() => (setErr(""), setStep("start"))}>
            Try again
          </button>
        )}
      </div>
    );

  if (step === "profile")
    return (
      <form
        className="a-form"
        onSubmit={(e) => {
          e.preventDefault();
          void saveProfile();
        }}
      >
        <p className="a-sent">
          Signed in as <b>{email}</b>. Add your name and mobile for orders and delivery updates.
        </p>
        <div className="a-row2">
          <label className="a-field">
            <span className="a-label">First name *</span>
            <input ref={firstRef} className="a-input" value={first} onChange={(e) => setFirst(e.target.value.slice(0, 40))} autoComplete="given-name" />
          </label>
          <label className="a-field">
            <span className="a-label">Last name</span>
            <input className="a-input" value={last} onChange={(e) => setLast(e.target.value.slice(0, 40))} autoComplete="family-name" />
          </label>
        </div>
        <label className="a-field">
          <span className="a-label">Mobile number *</span>
          <span className="a-phone">
            <span className="a-phone-prefix">
              <span aria-hidden="true">🇮🇳</span> +91
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "").slice(0, 10));
                setErr("");
              }}
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="10-digit mobile"
              aria-label="Mobile number"
            />
          </span>
        </label>
        {errLine}
        <button className="a-btn" style={{ marginTop: 0 }} disabled={busy} aria-busy={busy}>
          {busy ? "Saving…" : "Continue"}
        </button>
      </form>
    );

  if (step === "sent")
    return (
      <div className="a-form">
        <p className="a-sent">
          We emailed a sign-in link to <b>{email}</b>. Open it on this device to finish. Check Spam if it isn&apos;t there in a minute.{" "}
          <button type="button" className="a-link" onClick={() => (setStep("start"), setErr(""))}>
            Change
          </button>
        </p>
        {errLine}
        <p className="a-resend">
          {wait > 0 ? (
            `Resend in ${wait}s`
          ) : (
            <button type="button" className="a-link" onClick={() => void sendLink()} disabled={busy}>
              Resend link
            </button>
          )}
        </p>
      </div>
    );

  const confirming = step === "confirm";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (confirming) void finish(email.trim().toLowerCase());
        else void sendLink();
      }}
    >
      {confirming ? (
        <p className="a-sent">Type the email you asked for the link with, to finish signing in.</p>
      ) : (
        <>
          <button type="button" className="a-btn a-btn--ghost a-google" onClick={() => void google()} disabled={busy}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
            </svg>
            Continue with Google
          </button>
          <p className="a-or">
            <span>or</span>
          </p>
        </>
      )}
      <input
        ref={emailRef}
        className="a-input"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value.slice(0, 254));
          setErr("");
        }}
        inputMode="email"
        autoComplete="email"
        placeholder="Email address"
        aria-label="Email address"
      />
      {errLine}
      <button className="a-btn" style={{ marginTop: 6 }} disabled={busy} aria-busy={busy}>
        {busy ? (confirming ? "Signing in…" : "Sending…") : confirming ? "Finish signing in" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
