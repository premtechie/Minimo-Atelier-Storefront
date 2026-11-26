"use client";

import { SafeImg } from "./safe-img";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { addLine, cartTotals, couponSaving, freeDelivery, mrpGross, type AppliedCoupon as Applied, lineRate, lineTotal, shortages, unitPrice, type CartLine, type PriceLookup } from "@/lib/cart";
import { newToken, rememberOrder, type Order, type SavedOrder } from "@/lib/orders";
import { OrderPlaced } from "./orders-view";
import { inr, plural } from "@/lib/format";
import type { LiteItem } from "@/lib/lite";
import { useAccount } from "./account-provider";
import { useAddresses } from "./account-view";
import { Icon } from "./icon";
import { etaText, fetchQuote, isPin, savePin, savedPin, shortDate, SPEED_NAME, type Quote, type Speed } from "@/lib/delivery";
import { useShop } from "./shop-provider";
import { track } from "@/lib/analytics";
import { FREE_DELIVERY_FROM } from "@/lib/merch";

// Called only from the Place order handler, never while rendering.
const placedAt = () => Date.now();

/*
 * The cart and its checkout sheet, in the approved design's markup: its mm-
 * classes are d- here and its plain classes e-; rules in styles/design/cart.css.
 * Nothing is charged on the site: the order is placed in the shop's admin and paid by UPI once confirmed.
 */

export type CartPair = { sku: string; name: string; price: number; img: string; cap: number; filler: boolean };

type Delivery = "pickup" | "flat" | "hyd" | "india";
const DELIVERY: { id: Delivery; label: string; tag: string }[] = [
  { id: "pickup", label: "Store pickup", tag: "Pick up at our store" },
  { id: "flat", label: "To your flat", tag: "Free flat delivery" },
  { id: "hyd", label: "Hyderabad", tag: "Hyderabad delivery" },
  { id: "india", label: "Pan-India", tag: "Courier" },
];

function dayName(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

export function CartView({ items, pairs }: { items: LiteItem[]; pairs: CartPair[] }) {
  const { cart, ready, setQty, remove, replace, clear, toast } = useShop();
  const byId = useMemo(() => new Map(items.map((x) => [x.id, x])), [items]);
  const lookup = useMemo<PriceLookup>(
    () => (sku) => {
      const x = byId.get(sku);
      return x ? { price: x.price, cap: x.cap ?? Infinity, name: x.name, mrp: x.mrp } : undefined;
    },
    [byId],
  );

  // Re-price every line from today's catalogue; a price kept in the browser is never trusted.
  const priced = useMemo(() => cart.map((l) => ({ line: l, today: unitPrice(l, lookup) })), [cart, lookup]);
  useEffect(() => {
    if (!ready) return;
    const changed = priced.some(({ line, today }) => today !== null && today !== line.price);
    if (changed) replace(priced.map(({ line, today }) => (today !== null ? { ...line, price: today } : line)));
  }, [priced, ready, replace]);

  const live = priced.filter((x) => x.today !== null).map((x) => x.line);
  const gone = priced.filter((x) => x.today === null).map((x) => x.line);
  const short = shortages(live, lookup);
  const t = cartTotals(live);
  // Saving against MRP (pieces with a real MRP) plus any bulk discount.
  const atMrp = mrpGross(live, lookup);
  const youSave = Math.max(0, atMrp - t.total);
  const fd = freeDelivery(live, t.total, FREE_DELIVERY_FROM);
  const [sheet, setSheet] = useState(false);
  const [placed, setPlaced] = useState<SavedOrder | null>(null);
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [applied, setApplied] = useState<Applied | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const saving = couponSaving(applied, t.total);
  const toPay = t.total - saving;
  const applyCoupon = async () => {
    const v = coupon.trim().toUpperCase();
    if (!v) return setCouponMsg("Enter a code first.");
    setCheckingCoupon(true);
    setCouponMsg("");
    try {
      const res = await fetch("/api/coupons/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: v, amount: t.total }),
      });
      const data = (await res.json().catch(() => ({}))) as { coupon?: Applied; error?: { message?: string } };
      if (!res.ok || !data.coupon) {
        setApplied(null);
        setCouponMsg(data.error?.message || "We couldn't check that code just now. Please try again.");
        return;
      }
      setApplied(data.coupon);
      setCoupon(data.coupon.code);
      track("coupon_applied");
    } catch {
      setCouponMsg("We couldn't check that code just now. Please try again.");
    } finally {
      setCheckingCoupon(false);
    }
  };
  const removeCoupon = () => {
    setApplied(null);
    setCoupon("");
    setCouponMsg("");
  };
  const [gift, setGift] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const blocked = !live.length || short.length > 0;

  // The bottom Checkout bar is there whenever the summary's own Checkout
  // button is off screen (above it, below it, or over the footer), and steps
  // aside while that button is in view, so there is never two at once.
  const cta = useRef<HTMLButtonElement>(null);
  const [ctaSeen, setCtaSeen] = useState(true);
  useEffect(() => {
    const el = cta.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCtaSeen(e.isIntersecting), { rootMargin: "-110px 0px -90px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ready, cart.length]);
  const barHidden = sheet || ctaSeen;

  const hrefFor = (l: CartLine) => {
    if (l.kind === "build") return "/build";
    const it = byId.get(l.kind === "pack" ? `pack:${l.ref}` : (l.ref ?? l.parts[0]?.sku ?? ""));
    return it?.href ?? "/shop/return-gifts";
  };
  const inCart = new Set(cart.flatMap((l) => (l.kind === "product" ? [l.ref ?? l.parts[0]?.sku] : [])));
  const addons = pairs.filter((p) => !inCart.has(p.sku)).slice(0, 3);
  const n = cart.length;

  return (
    <div className="d-cart-wrap">
      <Link className="d-pdp-back d-cart-back" href="/shop/return-gifts">
        <Icon name="arrowL" size={16} /> Back
      </Link>
      <p className="d-eyebrow">Cart</p>
      <h1 className="d-h1 d-cart-title">Your cart{ready && n ? ` · ${plural(n, "item", "items")}` : ""}</h1>
      {!ready ? (
        <div className="m-cart-wait" aria-busy="true" />
      ) : !n ? (
        <div className="d-cart-empty">
          <span className="d-care-icon">
            <Icon name="bag" size={24} />
          </span>
          <h2 className="d-cart-empty-title">Your cart is empty</h2>
          <p>Start with a ready-made pack or build your own.</p>
          <div className="d-empty-ctas">
            <Link className="d-sum-cta" href="/shop/return-gifts">
              Shop packs
            </Link>
            <Link className="d-pc-skip d-btn-line" href="/build">
              Build your own
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="d-cart-grid">
            <div className="d-cart-items">
              {gone.length > 0 && (
                <p className="m-cart-warn" role="alert">
                  {plural(gone.length, "item is", "items are")} no longer sold and won&apos;t be ordered: {gone.map((l) => l.name).join(", ")}.{" "}
                  <button className="d-ci-rm" onClick={() => gone.forEach((l) => remove(l.key))}>
                    Remove
                  </button>
                </p>
              )}
              {short.length > 0 && (
                <p className="m-cart-warn" role="alert">
                  Not enough in stock today: {short.map((s) => `${s.name} (you need ${s.need}, we have ${s.have})`).join("; ")}. Lower the quantity, or ask us on WhatsApp.
                </p>
              )}
              {live.map((l) => (
                <Line key={l.key} l={l} href={hrefFor(l)} cap={capFor(l, lookup)} setQty={setQty} remove={remove} />
              ))}
              <Link className="d-cont" href="/shop/return-gifts">
                ← Continue shopping
              </Link>
            </div>
            <div className="d-cart-side">
              <aside className="d-cart-summary" aria-labelledby="h-sum">
                <h3 className="d-cart-section-title" id="h-sum">
                  Order summary
                </h3>
                {fd.ok && (
                  <div className={fd.reached ? "d-unlock is-done" : "d-unlock"}>
                    <span>
                      {fd.reached ? (
                        <>
                          <Icon name="check" size={14} /> Free delivery in Hyderabad and across India
                        </>
                      ) : (
                        <>
                          Add <b>{inr(fd.left!)}</b> more for free delivery
                        </>
                      )}
                    </span>
                    <span
                      className="d-unlock-bar"
                      role="progressbar"
                      aria-label="Progress to free delivery"
                      aria-valuemin={0}
                      aria-valuemax={FREE_DELIVERY_FROM}
                      aria-valuenow={Math.min(FREE_DELIVERY_FROM, Math.round(t.total))}
                    >
                      <span style={{ width: `${Math.min(100, (t.total / FREE_DELIVERY_FROM) * 100)}%` }} />
                    </span>
                  </div>
                )}
                <div className="d-sum-rows">
                  <div className="d-sum-row">
                    <span>Subtotal</span>
                    <span>
                      {youSave > 0 && <s>{inr(Math.max(atMrp, t.gross))}</s>} {inr(t.total)}
                    </span>
                  </div>
                  <div className="d-sum-row">
                    <span>Delivery</span>
                    <span>{fd.reached ? "Free" : "Free pickup"}</span>
                  </div>
                  {youSave > 0 && (
                    <div className="d-sum-row is-save">
                      <span>
                        <Icon name="tag" size={14} /> You save
                      </span>
                      <span>{inr(youSave)}</span>
                    </div>
                  )}
                  {saving > 0 && (
                    <div className="d-sum-row is-save">
                      <span>Coupon {applied!.code}</span>
                      <span>−{inr(saving)}</span>
                    </div>
                  )}
                </div>
                <div className="d-sum-total">
                  <span>Total</span>
                  <strong>{inr(toPay)}</strong>
                </div>
                <button ref={cta} className="d-sum-cta" disabled={blocked} onClick={() => setSheet(true)}>
                  Checkout <Icon name="arrowR" size={16} />
                </button>
                <p className="d-sum-secure">
                  <Icon name="lock" size={13} /> Nothing charged now · Pay by UPI once we confirm
                </p>
                {addons.length > 0 && (
                  <section className="d-cart-addons" aria-labelledby="h-addons">
                    <h4 className="d-set-title" id="h-addons">
                      Pairs well with
                    </h4>
                    <ul className="d-freeship-adds">
                      {addons.map((x) => (
                        <li key={x.sku} className="d-freeship-add">
                          <span className="d-freeship-thumb">
                            <SafeImg src={x.img} alt="" loading="lazy" decoding="async" draggable={false} />
                          </span>
                          <span className="d-freeship-info">
                            <span className="d-freeship-name">{x.name}</span>
                            <span className="d-freeship-price">
                              {inr(x.price)}
                              {x.filler ? " · per piece" : ""}
                            </span>
                          </span>
                          <button
                            className="d-freeship-btn"
                            aria-label={`Add ${x.name}`}
                            onClick={() => {
                              const qty = Math.max(1, Math.min(x.filler ? 10 : 1, x.cap));
                              replace(addLine(cart, { key: `product:${x.sku}:${Date.now()}`, kind: "product", ref: x.sku, name: x.name, price: x.price, qty, image: x.img, parts: [{ sku: x.sku, qty: 1 }] }));
                              toast(`Added ${qty > 1 ? `${qty} × ` : ""}${x.name}`);
                            }}
                          >
                            <Icon name="plus" size={13} /> Add
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                <form
                  className="d-coupon"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (applied) removeCoupon();
                    else void applyCoupon();
                  }}
                >
                  <input
                    className="d-coupon-input"
                    value={coupon}
                    onChange={(e) => {
                      setCoupon(e.target.value.slice(0, 24));
                      // Editing the code takes the applied one off until Apply is pressed again.
                      if (applied) setApplied(null);
                      setCouponMsg("");
                    }}
                    placeholder="Coupon code"
                    aria-label="Coupon code"
                    autoComplete="off"
                    readOnly={checkingCoupon}
                  />
                  <button disabled={checkingCoupon} aria-busy={checkingCoupon}>
                    {checkingCoupon ? "Checking…" : applied ? "Remove" : "Apply"}
                  </button>
                </form>
                <p className="d-coupon-msg" data-ok={applied && saving > 0 ? "" : undefined} aria-live="polite">
                  {applied
                    ? saving > 0
                      ? `${applied.code} applied: ${applied.percent}% off, up to ${inr(applied.cap)}. You save ${inr(saving)}.`
                      : `Add ${inr(applied.min_bill - t.total)} more to use ${applied.code} (on orders of ${inr(applied.min_bill)} or more).`
                    : couponMsg}
                </p>
                <div className="d-gift" data-on={gift ? "" : undefined}>
                  <button className="d-gift-toggle" aria-pressed={gift} onClick={() => setGift(!gift)}>
                    <Icon name="gift" size={18} />
                    <span className="d-gift-label">
                      Make it a gift <small>with a card note</small>
                    </span>
                    <span className="d-gift-switch" />
                  </button>
                  <div className="d-gift-reveal">
                    <div>
                      <div className="d-gift-note">
                        <textarea rows={3} maxLength={150} placeholder="Add a note for the card" aria-label="Gift note" value={giftNote} onChange={(e) => setGiftNote(e.target.value)} tabIndex={gift ? 0 : -1} />
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
          <div className="d-cart-bar" data-hidden={barHidden ? "" : undefined}>
            <div className="d-cart-bar-total">
              <span>Total</span>
              <strong>{inr(toPay)}</strong>
            </div>
            <button className="d-cart-bar-btn" disabled={blocked} onClick={() => setSheet(true)} tabIndex={barHidden ? -1 : 0}>
              Checkout <Icon name="arrowR" size={16} />
            </button>
          </div>
        </>
      )}
      <Checkout
        open={sheet && live.length > 0}
        lines={live}
        itemsTotal={toPay}
        freeShip={fd.reached}
        // Only a code the shop accepted, and only once the cart reaches its minimum.
        coupon={applied && saving > 0 ? applied.code : ""}
        giftNote={gift ? giftNote.trim() || "Make it a gift" : ""}
        onClose={() => setSheet(false)}
        onPlaced={(o) => {
          clear();
          setSheet(false);
          setPlaced(o);
        }}
      />
      {placed && <OrderPlaced saved={placed} onClose={() => setPlaced(null)} />}
    </div>
  );
}

const lineName = (l: CartLine) => (l.kind === "pack" && !/pack$/i.test(l.name) ? `${l.name} pack` : l.name);

function capFor(l: CartLine, lookup: PriceLookup) {
  return Math.min(...l.parts.map((p) => Math.floor((lookup(p.sku)?.cap ?? 0) / p.qty)));
}

function Line({ l, href, cap, setQty, remove }: { l: CartLine; href: string; cap: number; setQty: (k: string, q: number) => void; remove: (k: string) => void }) {
  const rate = lineRate(l);
  const note = [l.note ? `Name: ${l.note}` : "", rate > 0 ? `${Math.round(rate * 100)}% bulk` : ""].filter(Boolean).join(" · ");
  return (
    <div className="d-cart-item">
      <Link className="d-cart-item-thumb" href={href} aria-label={lineName(l)}>
        {l.image && (
          <SafeImg src={l.image} alt="" loading="lazy" decoding="async" draggable={false} />
        )}
      </Link>
      <div className="d-ci-body">
        <div className="d-ci-top">
          <div className="d-ci-txt">
            <Link className="d-ci-name" href={href}>
              {lineName(l)}
            </Link>
            {note && <span className="d-ci-var">{note}</span>}
            {l.kind === "build" && l.detail && <span className="d-ci-var">{l.detail}</span>}
            <span className="d-ci-var">
              {inr(l.price)} {l.kind === "product" ? "each" : "per guest"}
            </span>
          </div>
          <div className="d-ci-price">
            <span className="d-price">{inr(lineTotal(l))}</span>
            {rate > 0 && <s>{inr(l.price * l.qty)}</s>}
          </div>
        </div>
        <div className="d-ci-ctl">
          <div className="d-mini-step">
            <button onClick={() => (l.qty > 1 ? setQty(l.key, l.qty - 1) : remove(l.key))} aria-label={`One less ${l.name}`}>
              <Icon name="minus" size={14} />
            </button>
            <span aria-live="polite">{l.qty}</span>
            <button onClick={() => setQty(l.key, l.qty + 1)} disabled={l.qty >= cap} aria-label={`One more ${l.name}`}>
              <Icon name="plus" size={14} />
            </button>
          </div>
          <button className="d-ci-rm" onClick={() => remove(l.key)}>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The design's two-step pre-checkout sheet. Continue places the order in the
 * shop's admin (prices are worked out there, never taken from this page) and
 * hands over to the full-screen "Order placed" moment.
 */
function Checkout({
  open,
  lines,
  itemsTotal,
  freeShip,
  coupon,
  giftNote,
  onClose,
  onPlaced,
}: {
  open: boolean;
  lines: CartLine[];
  itemsTotal: number;
  /** The cart earns free courier delivery (the admin checks it again). */
  freeShip: boolean;
  coupon: string;
  giftNote: string;
  onClose: () => void;
  onPlaced: (o: SavedOrder) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<Delivery>("pickup");
  const [addr, setAddr] = useState("");
  const [pin, setPin] = useState("");
  const [mob, setMob] = useState("");
  // Courier prices (Velocity, through the admin) for Hyderabad and pan-India.
  const [got, setGot] = useState<{ k: string; q: Quote } | null>(null);
  const [speed, setSpeed] = useState<Speed>("standard");
  const [updates, setUpdates] = useState(true);
  const [err, setErr] = useState("");
  const [err2, setErr2] = useState("");
  // One secret per checkout: it identifies this order to the shop, and a
  // second tap on Continue places the same order, not a second one.
  const [token, setToken] = useState(() => newToken());
  const box = useRef<HTMLDivElement>(null);
  // Once sign-in is on, an order needs a signed-in shopper (Bluebee asks at
  // this same step); their mobile is the order's, and saved addresses fill in.
  const { status: auth, account, required, openSignIn } = useAccount();
  const signedIn = auth === "signed_in" && !!account;
  const gate = required && !signedIn;
  const phone = signedIn ? account.phone : mob;
  const { list: addresses } = useAddresses(signedIn && open);
  const [picked, setPicked] = useState<string | null>(null);
  const pickAddress = (a: NonNullable<typeof addresses>[number]) => {
    setPicked(a.id);
    setAddr([a.line1, a.line2, a.city].filter(Boolean).join(", ").slice(0, 160));
    setPin(a.pin);
    if (del === "pickup" || del === "flat") setDel(a.pin.startsWith("500") ? "hyd" : "india");
    setErr("");
  };

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    const f = setTimeout(() => box.current?.querySelector<HTMLElement>("button, input, a")?.focus({ preventScroll: true }), 50);
    return () => {
      clearTimeout(f);
      document.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) track("checkout_start");
  }, [open]);

  const pick = del === "pickup";
  const mobRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (step !== 2) return;
    const f = setTimeout(() => mobRef.current?.focus({ preventScroll: true }), 400);
    return () => clearTimeout(f);
  }, [step]);
  const needAddr = !pick;
  const needPin = del === "hyd" || del === "india";
  const d = DELIVERY.find((x) => x.id === del)!;

  const pieceKey = lines.map((l) => l.parts.map((p) => `${p.sku}x${p.qty * l.qty}`).join(",")).join(",");
  const pinOk = needPin && isPin(pin) && (del !== "hyd" || pin.startsWith("500"));
  const quoteKey = `${pin}|${pieceKey}`;
  const quote = pinOk && got?.k === quoteKey ? got.q : null;
  useEffect(() => {
    if (!pinOk) return;
    let live = true;
    const pieces = lines.flatMap((l) => l.parts.map((p) => ({ sku: p.sku, qty: p.qty * l.qty })));
    void fetchQuote(pin, pieces).then((q) => live && setGot({ k: quoteKey, q }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinOk, quoteKey]);
  const priced = needPin && quote?.available ? quote : null;
  const options = priced ? [priced.standard, priced.express].filter((o) => o !== null) : [];
  const chosen = options.find((o) => o.speed === speed) ?? options[0] ?? null;
  const checking = pinOk && quote === null;
  const ship = freeShip ? 0 : (chosen?.price ?? 0);
  const when =
    pick || del === "flat"
      ? `Ready ${dayName(2)}`
      : chosen
        ? shortDate(chosen.by)
          ? `${etaText(chosen, pin)} · by ${shortDate(chosen.by)}`
          : `In ${etaText(chosen, pin)}`
        : pin.startsWith("500")
          ? `By ${dayName(3)}`
          : "In 4–7 days";
  const where = pick ? "Pickup at our store" : del === "flat" ? "To your flat in Honer Vivantis" : `Delivering to ${pin}`;

  const pos = (p: 1 | 2) => (p === step ? "on" : p < step ? "left" : "right");
  const place = async () => {
    if (gate) return openSignIn({ reason: "checkout" });
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setErr2("Enter a 10-digit mobile number.");
      mobRef.current?.focus();
      return;
    }
    setErr2("");
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          delivery: del,
          address: needAddr ? addr.trim() : "",
          pin: pick ? "" : pin,
          phone,
          updates,
          gift_note: giftNote,
          coupon,
          ...(chosen ? { speed: chosen.speed } : {}),
          lines: lines.map((l) => ({ name: lineName(l), qty: l.qty, parts: l.parts, note: l.note, detail: l.kind === "build" ? l.detail : undefined, bulk: l.bulk !== false })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { order?: Order; error?: { code?: string; message?: string } };
      if (res.status === 401 && data.error?.code === "sign_in_required") {
        openSignIn({ reason: "checkout" });
        throw new Error("Please sign in to place your order.");
      }
      if (!res.ok || !data.order) throw new Error(data.error?.message || "We couldn't place your order just now. Please try again.");
      const saved: SavedOrder = { number: data.order.number, token, at: placedAt(), images: lines.map((l) => l.image), order: data.order };
      rememberOrder(saved);
      track("order_placed", { delivery: del });
      setToken(newToken());
      setStep(1);
      onPlaced(saved);
    } catch (e) {
      setErr2(e instanceof Error ? e.message : "Please try again.");
      track("order_failed");
    } finally {
      setBusy(false);
    }
  };
  const step1 = () => {
    if (needAddr && addr.trim().length < 4) return setErr(del === "flat" ? "Add your tower and flat number." : "Add your delivery address.");
    if (needPin && !/^\d{6}$/.test(pin)) return setErr("Enter a 6-digit PIN code.");
    if (del === "hyd" && !pin.startsWith("500")) return setErr("That PIN is outside Hyderabad. Pick Pan-India instead.");
    if (needPin && checking) return setErr("Checking delivery prices…");
    if (needPin && quote && !quote.available && quote.reason === "not_serviceable") return setErr("Couriers don't reach this PIN code yet. Message us on WhatsApp and we'll find a way.");
    if (needPin) savePin(pin);
    setErr("");
    track("checkout_delivery_chosen", { checkout_delivery: del });
    setStep(2);
  };

  return (
    <>
      <div className={`e-overlay ${open ? "open" : ""}`} onClick={onClose} aria-hidden="true" />
      <div ref={box} className={`e-sheet ${open ? "open" : ""}`} data-clarity-mask="true" role="dialog" aria-modal="true" aria-labelledby="h-co" data-kind="pre" inert={!open}>
        <div className="dz d-pre">
          <div className="d-pre-drag">
            <span className="d-sheet-handle" />
            <div className="d-pre-top">
              <p className="d-eyebrow">Almost there</p>
              <button className="d-sheet-close" onClick={onClose} aria-label="Close">
                <Icon name="x" size={16} />
              </button>
            </div>
          </div>
          <div className="d-pc-track">
            <div className="d-pc-panel" data-pos={pos(1)} inert={step !== 1}>
              <h2 className="d-precheckout-title" id={step === 1 ? "h-co" : undefined}>
                Where should we deliver?
              </h2>
              <div className="d-pre-opts" role="radiogroup" aria-label="Delivery">
                {DELIVERY.map((o) => (
                  <label key={o.id} className="d-pre-opt">
                    <input
                      type="radio"
                      name="co-del"
                      value={o.id}
                      checked={del === o.id}
                      onChange={() => {
                        setDel(o.id);
                        setErr("");
                        // The last pincode checked on a product page fills in here.
                        if (!pin && (o.id === "hyd" || o.id === "india")) setPin(savedPin());
                      }}
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
              {needAddr && del !== "flat" && signedIn && addresses && addresses.length > 0 && (
                <div className="a-saved" role="group" aria-label="Saved addresses">
                  {addresses.map((a) => (
                    <button key={a.id} type="button" aria-pressed={picked === a.id} onClick={() => pickAddress(a)}>
                      {a.is_default ? "★ " : ""}
                      {a.line1}, {a.pin}
                    </button>
                  ))}
                </div>
              )}
              {needAddr && (
                <div className="d-phone-field d-precheckout-pin">
                  <input
                    value={addr}
                    onChange={(e) => setAddr(e.target.value.slice(0, 160))}
                    placeholder={del === "flat" ? "Tower and flat number" : "Delivery address"}
                    aria-label={del === "flat" ? "Tower and flat number" : "Delivery address"}
                    autoComplete={del === "flat" ? "off" : "street-address"}
                  />
                </div>
              )}
              <div className="d-phone-field d-precheckout-pin">
                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && step1()}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="PIN code"
                  aria-label="PIN code"
                  autoComplete="postal-code"
                />
                <span className="d-precheckout-tick">
                  <Icon name="pin" size={18} />
                </span>
              </div>
              {needPin && (checking || options.length > 0) && (
                <div className="d-ship-opts" role="radiogroup" aria-label="Delivery speed" aria-busy={checking}>
                  {checking ? (
                    <>
                      <span className="d-pin-skel" />
                      <span className="d-pin-skel d-pin-skel--short" />
                    </>
                  ) : (
                    options.map((o) => (
                      <label key={o.speed} className="d-ship-opt">
                        <input type="radio" name="co-speed" value={o.speed} checked={chosen?.speed === o.speed} onChange={() => setSpeed(o.speed)} />
                        <span className="d-ship-opt-body">
                          <span>
                            {SPEED_NAME[o.speed]} {o.speed === "express" && <Icon name="sparkle" size={12} />}
                          </span>
                          <small>
                            {etaText(o, pin)}
                            {shortDate(o.by) ? `, arrives by ${shortDate(o.by)}` : ""}
                          </small>
                        </span>
                        <span className="d-ship-opt-price">
                          {freeShip ? (
                            <>
                              <s>{inr(o.price)}</s> Free
                            </>
                          ) : (
                            inr(o.price)
                          )}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              )}
              <p className="d-precheckout-err" aria-live="polite">
                {err}
              </p>
              <ul className="d-sheet-benefits d-precheckout-pills">
                <li>
                  <Icon name="store" size={14} /> Free store pickup
                </li>
                <li>
                  <Icon name="clock" size={14} /> Ready in 48 h
                </li>
              </ul>
              <button className="d-sum-cta d-precheckout-cta" onClick={step1}>
                Check delivery
              </button>
            </div>
            <div className="d-pc-panel" data-pos={pos(2)} inert={step === 1}>
              {step === 2 && (
                <>
                  <div className="d-pc-card">
                    <div className="d-pc-thumbs">
                      {lines.slice(0, 2).map((l) => (
                        <span key={l.key} className="d-pc-thumb">
                          {l.image && (
                            <SafeImg src={l.image} alt="" loading="lazy" decoding="async" draggable={false} />
                          )}
                        </span>
                      ))}
                      {lines.length > 2 && <span className="d-pc-more">+{lines.length - 2}</span>}
                      <span className="d-pc-done-mark">
                        <Icon name="check" size={12} />
                      </span>
                    </div>
                    <div className="d-pc-card-body">
                      <p className="d-pc-done-text">
                        <span className="d-pc-where">{where}</span>
                        <span className="d-pc-when">{when}</span>
                      </p>
                      <ul className="d-pc-tags">
                        <li>
                          <Icon name="check" size={11} /> {chosen ? `${SPEED_NAME[chosen.speed]} · ${inr(chosen.price)}` : d.tag}
                        </li>
                        <li>
                          <Icon name="tag" size={11} /> Wrapped &amp; tagged
                        </li>
                      </ul>
                    </div>
                    <button className="d-pin-link d-pc-change" onClick={() => setStep(1)}>
                      Change
                    </button>
                  </div>
                  {gate ? (
                    <>
                      <h2 className="d-precheckout-title" id="h-co">
                        Sign in to place your order
                      </h2>
                      <p className="d-pre-legal" style={{ marginTop: 0, textAlign: "left" }}>
                        One quick code on your mobile, then your orders, addresses and wishlist stay with you on any device.
                      </p>
                    </>
                  ) : signedIn ? (
                    <>
                      <h2 className="d-precheckout-title" id="h-co">
                        Ordering as
                      </h2>
                      <div className="a-who">
                        <span className="a-avatar">{(account.first_name || "M").slice(0, 1).toUpperCase()}</span>
                        <span className="a-who-txt">
                          <b>{account.name || "Your account"}</b>
                          +91 {account.phone}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                    <h2 className="d-precheckout-title" id="h-co">
                      Your mobile number
                    </h2>
                    <div className="d-phone-field">
                      <span className="d-phone-field-prefix">+91</span>
                      <input
                        ref={mobRef}
                        value={mob}
                        onChange={(e) => setMob(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        onKeyDown={(e) => e.key === "Enter" && !busy && void place()}
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="10-digit mobile"
                        autoComplete="tel-national"
                        aria-label="Mobile number"
                      />
                    </div>
                    </>
                  )}
                  <p className="d-precheckout-err" aria-live="polite">
                    {err2}
                  </p>
                  {ship > 0 && (
                    <p className="d-ship-note">
                      Total {inr(itemsTotal + ship)}, with {inr(ship)} {SPEED_NAME[chosen!.speed].toLowerCase()} delivery
                    </p>
                  )}
                  <div className="d-pc-actions">
                    <button className="d-sum-cta d-precheckout-cta" onClick={() => void place()} disabled={busy} aria-busy={busy}>
                      {gate ? "Sign in to continue" : busy ? "Placing your order…" : "Place order"} {!busy && <Icon name="arrowR" size={16} />}
                    </button>
                  </div>
                  <label className="d-pc-optin">
                    <input type="checkbox" checked={updates} onChange={(e) => setUpdates(e.target.checked)} /> Order updates on WhatsApp
                  </label>
                  <p className="d-pre-legal">Nothing is charged now. We confirm stock, then send you a UPI link.{signedIn ? "" : " Your number is used only for this order."}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
