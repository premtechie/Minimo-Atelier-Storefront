"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Icon, type IconName } from "./icon";
import { SafeImg } from "./safe-img";
import { useShop } from "./shop-provider";
import { useAccount } from "./account-provider";
import { inr, plural } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import {
  DELIVERY_NAME,
  current,
  eta,
  fmtDate,
  dayAfter,
  isPast,
  pieces,
  prettyPhone,
  saveOrders,
  savedOrders,
  status,
  steps,
  type Order,
  type SavedOrder,
} from "@/lib/orders";

/*
 * The design's orders screens (orders.js): the full-screen "Order placed"
 * moment, the orders list with Active / Past tabs, and one order's page with
 * its status card, step tracker, timeline, items, delivery, payment and help.
 * Plain classes are e- here, the design's mm- classes d-; styles/design/orders.css.
 */

const noop = () => () => {};
const subscribe = (cb: () => void) => {
  window.addEventListener("mm:orders", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("mm:orders", cb);
    window.removeEventListener("storage", cb);
  };
};
let snapKey = "";
let snapVal: SavedOrder[] = [];
function snapshot() {
  let raw = "";
  try {
    raw = localStorage.getItem("minimo-orders") || "";
  } catch {
    /* blocked storage */
  }
  if (raw !== snapKey) {
    snapKey = raw;
    snapVal = savedOrders();
  }
  return snapVal;
}
const EMPTY: SavedOrder[] = [];

/** The orders saved on this phone, refreshed from the shop. */
export function useOrders() {
  const saved = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const asked = useRef("");
  const { status: auth } = useAccount();
  const signedIn = auth === "signed_in";

  const refresh = useCallback(async () => {
    // Orders placed on this phone carry their own secret; a signed-in shopper's
    // account brings every order placed with their number, from any device.
    const list = savedOrders().filter((o) => o.token);
    if (!list.length && !signedIn) return setState("ok");
    setState((s) => (s === "ok" ? s : "loading"));
    try {
      const [mine, theirs] = await Promise.all([
        list.length
          ? fetch("/api/orders/status", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ orders: list.map((o) => ({ number: o.number, token: o.token })) }),
            }).then((res) => {
              if (!res.ok) throw new Error(String(res.status));
              return res.json() as Promise<{ orders: Order[] }>;
            })
          : { orders: [] as Order[] },
        signedIn
          ? fetch("/api/account/orders", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }).then((res) => (res.ok ? (res.json() as Promise<{ orders: Order[] }>) : { orders: [] as Order[] }))
          : { orders: [] as Order[] },
      ]);
      const by = new Map([...theirs.orders, ...mine.orders].map((o) => [o.number, o]));
      const now = savedOrders().filter((o) => o.token || signedIn);
      const known = new Set(now.map((o) => o.number));
      const extra: SavedOrder[] = theirs.orders.filter((o) => !known.has(o.number)).map((o) => ({ number: o.number, token: "", at: Date.parse(o.placed_at), order: o }));
      saveOrders([...now.map((o) => (by.has(o.number) ? { ...o, order: by.get(o.number) } : o)), ...extra].sort((a, b) => b.at - a.at));
      setState("ok");
    } catch {
      setState("error");
    }
  }, [signedIn]);

  useEffect(() => {
    if (!mounted || auth === "loading") return;
    const key = `${auth}:${saved.map((o) => o.number).join(",")}`;
    if (asked.current === key) return;
    asked.current = key;
    void refresh();
  }, [mounted, saved, refresh, auth]);

  // Keep an open page current while the shop works on the order.
  useEffect(() => {
    if (!mounted) return;
    const t = setInterval(() => document.visibilityState === "visible" && void refresh(), 60_000);
    return () => clearInterval(t);
  }, [mounted, refresh]);

  return { saved, mounted, state, refresh };
}

function Thumbs({ o, s }: { o: Order; s: SavedOrder }) {
  return (
    <div className="e-od-thumbs">
      {o.lines.slice(0, 3).map((l, i) => (
        <span key={i}>
          <SafeImg src={s.images?.[i] || (l.sku ? `/img/${l.sku}` : undefined)} fallback={l.sku ? `/img/${l.sku}` : null} alt="" loading="lazy" decoding="async" />
        </span>
      ))}
      {o.lines.length > 3 && <span className="e-od-more">+{o.lines.length - 3}</span>}
    </div>
  );
}

/* ---------------- Order placed (full screen) ---------------- */

const CONFETTI = ["#e8c478", "#d6a096", "#a8c4b0", "#6b4433", "#f1d9cf"];

export function OrderPlaced({ saved, onClose }: { saved: SavedOrder; onClose: () => void }) {
  const o = saved.order!;
  const router = useRouter();
  const [inView, setIn] = useState(false);
  const [out, setOut] = useState(false);
  const [left, setLeft] = useState(5);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const pick = o.delivery === "pickup";
  const n = pieces(o);

  const leave = useCallback(
    (to: string) => {
      setOut(true);
      router.push(to);
      setTimeout(onClose, 420);
    },
    [onClose, router],
  );

  useEffect(() => {
    const r = requestAnimationFrame(() => setIn(true));
    document.body.style.overflow = "hidden";
    box.current?.querySelector<HTMLElement>(".e-od-btn--primary")?.focus({ preventScroll: true });
    const k = (e: KeyboardEvent) => e.key === "Escape" && leave(`/orders/${o.number}`);
    document.addEventListener("keydown", k);
    return () => {
      cancelAnimationFrame(r);
      document.body.style.overflow = "";
      document.removeEventListener("keydown", k);
    };
  }, [leave, o.number]);

  useEffect(() => {
    if (out) return;
    const t = setTimeout(() => (left <= 1 ? leave(`/orders/${o.number}`) : setLeft((x) => x - 1)), 1000);
    return () => clearTimeout(t);
  }, [left, out, leave, o.number]);

  return (
    <div ref={box} className={`dz e-od-placed ${inView ? "is-in" : ""} ${out ? "is-out" : ""}`} role="dialog" aria-modal="true" aria-labelledby="odph">
      <div className="e-od-pl-confetti" aria-hidden="true">
        {Array.from({ length: 26 }, (_, i) => (
          <i key={i} style={{ "--x": `${(i * 37) % 100}%`, "--d": `${(i % 7) * 90}ms`, "--r": `${(i * 53) % 360}deg`, "--c": CONFETTI[i % 5] } as React.CSSProperties} />
        ))}
      </div>
      <div className="e-od-pl-in">
        <svg className="e-od-pl-mark" viewBox="0 0 96 96" aria-hidden="true">
          <circle className="e-od-pl-ring" cx="48" cy="48" r="44" />
          <path className="e-od-pl-tick" d="M29 49.5 42 62l26-28" />
        </svg>
        <p className="d-eyebrow">Thank you</p>
        <h1 id="odph">Order placed</h1>
        <button
          className={`e-od-pl-id ${copied ? "is-copied" : ""}`}
          aria-label={`Copy order number ${o.number}`}
          onClick={() => {
            navigator.clipboard?.writeText(o.number).catch(() => {});
            setCopied(true);
          }}
        >
          {o.number}{" "}
          <span>
            <Icon name="copy" size={14} />
            {copied ? "Copied" : "Copy"}
          </span>
        </button>
        <div className="e-od-pl-card">
          <Thumbs o={o} s={saved} />
          <div className="e-od-pl-sum">
            <b>
              {plural(n, "item", "items")} · {inr(o.total)}
            </b>
            <span>{DELIVERY_NAME[o.delivery]}</span>
            <span className="e-od-pl-eta">
              <Icon name={pick ? "store" : "truck"} size={14} /> {eta(o)}
            </span>
          </div>
        </div>
        <ol className="e-od-pl-next" aria-label="What happens next">
          <li className="on">
            <i>
              <Icon name="check" size={14} />
            </i>
            <span>Placed</span>
          </li>
          <li>
            <i>
              <Icon name="clock" size={14} />
            </i>
            <span>We confirm stock</span>
          </li>
          <li>
            <i>
              <Icon name="tag" size={14} />
            </i>
            <span>You pay by UPI</span>
          </li>
          <li>
            <i>
              <Icon name="gift" size={14} />
            </i>
            <span>We pack it</span>
          </li>
        </ol>
        <p className="e-od-pl-msg">
          {o.phone ? (
            <>
              Updates will reach <b>{prettyPhone(o.phone)}</b>.{" "}
            </>
          ) : null}
          You can follow every step on your orders page.
        </p>
        <div className="e-od-pl-go">
          <button className="e-od-btn e-od-btn--primary" onClick={() => leave(`/orders/${o.number}`)}>
            <span className="e-od-pl-count" aria-hidden="true">
              <i />
            </span>
            View my order
          </button>
          <button className="e-od-btn" onClick={() => leave("/shop/return-gifts")}>
            Keep shopping
          </button>
        </div>
        <p className="e-od-pl-auto" aria-live="off">
          Opening your order in <b>{Math.max(left, 0)}</b>s
        </p>
      </div>
    </div>
  );
}

/* ---------------- Orders list ---------------- */

export function OrdersList() {
  const { saved, mounted, state, refresh } = useOrders();
  const [tab, setTab] = useState<"active" | "past">("active");
  const known = saved.filter((s) => s.order);
  const act = known.filter((s) => !isPast(s.order!));
  const past = known.filter((s) => isPast(s.order!));
  const list = tab === "active" ? act : past;
  const waiting = mounted && saved.length > 0 && !known.length && state !== "error";

  return (
    <div className="e-od-in">
      <p className="d-eyebrow">Your account</p>
      <h1 className="e-od-h1">My orders</h1>
      <div className="e-od-tabs" role="tablist">
        {(["active", "past"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
            {t === "active" ? "Active" : "Past"} <span>{(t === "active" ? act : past).length}</span>
          </button>
        ))}
      </div>
      <div className="e-od-list">
        {!mounted || waiting ? (
          <p className="e-od-note">Loading your orders…</p>
        ) : list.length ? (
          list.map((s) => <OrderCard key={s.number} s={s} />)
        ) : state === "error" && saved.length ? (
          <div className="e-od-empty">
            <Icon name="bag" size={28} />
            <b>We couldn&apos;t reach the shop</b>
            <span>Your orders are safe. Check your connection and try again.</span>
            <button className="e-od-btn e-od-btn--primary" onClick={() => void refresh()}>
              Try again
            </button>
          </div>
        ) : (
          <div className="e-od-empty">
            <Icon name="bag" size={28} />
            <b>{tab === "active" ? "No active orders" : "No past orders yet"}</b>
            <span>Orders you place show up here with every step.</span>
            <Link className="e-od-btn e-od-btn--primary" href="/shop/return-gifts">
              Start shopping
            </Link>
          </div>
        )}
      </div>
      {mounted && <OrdersNote />}
    </div>
  );
}

function OrdersNote() {
  const { status: auth, required, openSignIn } = useAccount();
  if (auth === "signed_in") return <p className="e-od-note">Every order placed with your number shows here, from any device.</p>;
  if (required)
    return (
      <p className="e-od-note">
        Orders placed on this phone show here.{" "}
        <button className="a-link" onClick={() => openSignIn({ reason: "account" })}>
          Sign in
        </button>{" "}
        to see every order placed with your number.
      </p>
    );
  return <p className="e-od-note">Orders placed on this phone show here. For an order placed elsewhere, message us on WhatsApp.</p>;
}

export function OrderCard({ s }: { s: SavedOrder }) {
  const o = s.order!;
  const st = steps(o);
  const [label, cls] = status(o);
  const n = pieces(o);
  const cancelled = o.status === "cancelled";
  const pct = cancelled ? 0 : Math.round((current(o) / (st.length - 1)) * 100);
  return (
    <Link className="e-od-card" href={`/orders/${o.number}`}>
      <div className="e-od-card-top">
        <span className={`e-od-chip ${cls}`}>
          {!cancelled && <i className="e-od-dot" />}
          {label}
        </span>
        <span className="e-od-card-date">{fmtDate(o.placed_at, false)}</span>
      </div>
      <div className="e-od-card-mid">
        <Thumbs o={o} s={s} />
        <div className="e-od-card-txt">
          <b>
            {o.lines[0]?.name}
            {o.lines.length > 1 ? ` + ${o.lines.length - 1} more` : ""}
          </b>
          <span>
            {o.number} · {plural(n, "piece", "pieces")} · {inr(o.total)}
          </span>
        </div>
        <Icon name="chevR" size={18} />
      </div>
      {!cancelled && (
        <>
          <div className="e-od-card-bar">
            <i style={{ width: `${pct}%` }} />
          </div>
          <span className="e-od-card-eta">{eta(o)}</span>
        </>
      )}
    </Link>
  );
}

/* ---------------- One order ---------------- */

export function OrderDetail({ number }: { number: string }) {
  const { saved, mounted, state, refresh } = useOrders();
  const { toast } = useShop();
  const s = saved.find((x) => x.number === number);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [arrive, setArrive] = useState(-1);
  const seen = useRef<{ n: string; k: number } | null>(null);
  const o = s?.order;
  const st = useMemo(() => (o ? steps(o) : []), [o]);
  const cur = o ? current(o) : 0;

  // A step the shop reached while the page was open gets the design's arrive animation.
  useEffect(() => {
    if (!o) return;
    const prev = seen.current;
    seen.current = { n: o.number, k: cur };
    if (prev && prev.n === o.number && prev.k < cur) {
      const t = setTimeout(() => setArrive(cur), 0);
      return () => clearTimeout(t);
    }
  }, [o, cur]);

  if (!mounted || (s && !o && state !== "error")) {
    return (
      <div className="e-od-in e-od-detail">
        <p className="e-od-note">Loading your order…</p>
      </div>
    );
  }
  if (!s || !o) {
    return (
      <div className="e-od-in e-od-detail">
        <Link className="e-od-back" href="/orders">
          <Icon name="chevR" size={16} /> My orders
        </Link>
        <div className="e-od-empty">
          <Icon name="bag" size={28} />
          <b>{s ? "We couldn't reach the shop" : "This order isn't on this phone"}</b>
          <span>{s ? "Check your connection and try again." : "Orders show on the phone they were placed from. Message us on WhatsApp with your order number and we'll help."}</span>
          {s ? (
            <button className="e-od-btn e-od-btn--primary" onClick={() => void refresh()}>
              Try again
            </button>
          ) : (
            <a className="e-od-btn e-od-btn--primary" href={waLink(`Hi Minimo, about my order ${number}`)} target="_blank" rel="noopener">
              <Icon name="wa" size={16} /> Chat with us
            </a>
          )}
        </div>
      </div>
    );
  }

  const cancelled = o.status === "cancelled";
  const pick = o.delivery === "pickup";
  const done = cur === st.length - 1 && !cancelled;
  const [label, cls] = status(o);
  const now = st[cur];
  const head: [string, string] = cancelled
    ? ["Order cancelled", o.refunded > 0 ? `${inr(o.refunded)} is on its way back to you.` : "Nothing was charged."]
    : cur === 0
      ? ["Order placed", st[1].wait]
      : done
        ? [now.title, now.done]
        : [now.title, st[cur + 1]?.wait || now.done];
  const n = pieces(o);
  const paid = !!o.paid_at;

  const cancel = async () => {
    setBusy(true);
    setErr("");
    try {
      const res = s.token
        ? await fetch("/api/orders/cancel", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ number: s.number, token: s.token }) })
        : await fetch("/api/account/order-cancel", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ number: s.number }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message || "We couldn't cancel it just now. Please message us on WhatsApp.");
      saveOrders(savedOrders().map((x) => (x.number === s.number ? { ...x, order: data.order } : x)));
      setAsking(false);
      toast("Order cancelled");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="e-od-in e-od-detail">
      <Link className="e-od-back" href="/orders">
        <Icon name="chevR" size={16} /> My orders
      </Link>
      <div className="e-od-grid">
        <div className="e-od-main">
          <section className={`e-od-hero ${cls}`} aria-live="polite">
            <div className="e-od-hero-top">
              <span className={`e-od-chip ${cls}`}>
                {!cancelled && <i className="e-od-dot" />}
                {label}
              </span>
            </div>
            <h1>{head[0]}</h1>
            <p>{head[1]}</p>
            {!cancelled && (
              <>
                <div className="e-od-hero-eta">
                  <Icon name={pick ? "store" : "truck"} size={16} />
                  <span>{eta(o)}</span>
                </div>
                <div className="e-od-rail" style={{ "--n": st.length, "--k": cur } as React.CSSProperties}>
                  {st.map((x, k) => (
                    <span key={x.key} className={k < cur ? "is-done" : k === cur ? "is-now" : ""} title={x.title}>
                      <Icon name={x.icon as IconName} size={13} />
                    </span>
                  ))}
                  <i />
                </div>
              </>
            )}
            <p className="e-od-hero-id">
              Order <b>{o.number}</b> · placed {fmtDate(o.placed_at)}
            </p>
          </section>

          {!cancelled && (
            <section className="e-od-sec">
              <h2>Order timeline</h2>
              <ol className="e-od-tl">
                {st.map((x, k) => (
                  <li key={x.key} className={`${k < cur ? "is-done" : k === cur ? "is-now" : "is-next"} ${k === arrive ? "is-arrive" : ""}`} style={{ "--i": k } as React.CSSProperties}>
                    <span className="e-od-tl-dot">{k <= cur && <Icon name={(k < cur || done ? "check" : x.icon) as IconName} size={13} />}</span>
                    <div className="e-od-tl-txt">
                      <b>{x.title}</b>
                      <span>{k <= cur ? x.done : x.wait}</span>
                      <time>{k <= cur ? fmtDate(x.at || o.placed_at) : k === st.length - 1 || x.day ? `Expected ${dayAfter(o.placed_at, x.day)}` : "Next"}</time>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="e-od-sec">
            <h2>{plural(n, "piece", "pieces")} in this order</h2>
            <ul className="e-od-items">
              {o.lines.map((l, i) => (
                <li key={i}>
                  <span className="e-od-it-img">
                    <SafeImg src={s.images?.[i] || (l.sku ? `/img/${l.sku}` : undefined)} fallback={l.sku ? `/img/${l.sku}` : null} alt="" loading="lazy" decoding="async" />
                  </span>
                  <span className="e-od-it-txt">
                    <b>{l.name}</b>
                    {l.note && <small>Name tag: {l.note}</small>}
                    {l.unit !== null && (
                      <small>
                        {inr(l.unit)} × {l.qty}
                      </small>
                    )}
                  </span>
                  {l.total !== null && <b className="e-od-it-amt">{inr(l.total)}</b>}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="e-od-side">
          <section className="e-od-sec e-od-box">
            <h2>{pick ? "Pickup" : "Delivery"}</h2>
            <p className="e-od-kv">
              <Icon name={pick ? "store" : "pin"} size={16} />
              <span>
                <b>{DELIVERY_NAME[o.delivery]}</b>
                {pick ? "Minimo Atelier, inside Honer Vivantis, Hyderabad" : o.address ? `${o.address.line}${o.address.pin ? `, ${o.address.pin}` : ""}` : ""}
              </span>
            </p>
            {o.phone && (
              <p className="e-od-kv">
                <Icon name="phone" size={16} />
                <span>
                  <b>Updates to</b>
                  {prettyPhone(o.phone)}
                </span>
              </p>
            )}
          </section>
          <section className="e-od-sec e-od-box">
            <h2>Payment</h2>
            <dl className="e-od-sum">
              <dt>Items</dt>
              <dd>{inr(o.items_total)}</dd>
              <dt>{pick ? "Pickup" : "Delivery"}</dt>
              <dd>{o.shipping ? inr(o.shipping) : "Free"}</dd>
              <dt className="e-od-tot">Total</dt>
              <dd className="e-od-tot">{inr(o.total)}</dd>
            </dl>
            <p className={`e-od-pay ${paid && !cancelled ? "is-paid" : ""}`}>
              {cancelled ? (
                o.refunded > 0 ? "Refunded" : "Not charged"
              ) : paid ? (
                <>
                  <Icon name="check" size={14} /> Paid
                </>
              ) : (
                <>
                  <Icon name="clock" size={14} /> Pay after we confirm
                </>
              )}
            </p>
          </section>
          <section className="e-od-sec e-od-box e-od-help">
            <h2>Need help with this order?</h2>
            <a className="e-od-btn" href={waLink(`Hi Minimo, about my order ${o.number}`)} target="_blank" rel="noopener">
              <Icon name="wa" size={16} /> Chat with us
            </a>
            {o.can_cancel && (
              <div className="e-od-cancel">
                {asking ? (
                  <>
                    <p>Cancel this order? Nothing has been charged.</p>
                    <div>
                      <button className="e-od-btn e-od-btn--sm" onClick={() => setAsking(false)} disabled={busy}>
                        Keep order
                      </button>
                      <button className="e-od-btn e-od-btn--sm e-od-btn--danger" onClick={() => void cancel()} disabled={busy}>
                        {busy ? "Cancelling…" : "Yes, cancel"}
                      </button>
                    </div>
                    {err && <p role="alert">{err}</p>}
                  </>
                ) : (
                  <button className="e-od-link" onClick={() => setAsking(true)}>
                    Cancel order
                  </button>
                )}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
