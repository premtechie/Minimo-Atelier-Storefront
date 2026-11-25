"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { keepRecording, track } from "@/lib/analytics";
import { checkedLabel, SITE_NAME, type Compare } from "@/lib/compare";
import { inr } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { Icon } from "./icon";

/*
 * "Compare prices" on the product page: a chip under the price and the bottom
 * sheet it opens. Which of the three sheets shows is decided on the server by
 * lib/compare.ts from the admin's hand check; this file only draws it.
 * Platform names are plain text (no logos: they are licensed marks).
 */

const PERKS = ["Gift-wrapped by hand", "Ready in 48 h", "Free store pickup"];

function useCountUp(to: number, run: boolean) {
  const [n, setN] = useState(to);
  useEffect(() => {
    if (!run || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let t0 = 0;
    const step = (t: number) => {
      t0 ||= t;
      const k = Math.min(1, (t - t0) / 900);
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, run]);
  return n;
}

function Ring({ text, id }: { text: string; id: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="d-cmp-ring">
      <defs>
        <path id={id} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
      </defs>
      <text>
        <textPath href={`#${id}`}>{text}</textPath>
      </text>
    </svg>
  );
}

export function ComparePrice({
  compare,
  sku,
  name,
  soldOut,
  inCart,
  onAdd,
}: {
  compare: Compare;
  sku: string;
  name: string;
  soldOut: boolean;
  inCart: boolean;
  onAdd: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [drag, setDrag] = useState(0);
  const y0 = useRef<number | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const tags = { compare_state: compare.state, compare_sku: sku };

  const show = useCallback(
    (from: string) => {
      setOpen(true);
      track("compare_open", { ...tags, compare_from: from });
      keepRecording("compare_open");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [compare.state, sku],
  );
  const hide = useCallback(() => {
    setOpen(false);
    setDrag(0);
    chipRef.current?.focus({ preventScroll: true });
  }, []);

  // Seen once per page, so Clarity can tell how many shoppers had the chip at all.
  useEffect(() => {
    track("compare_chip_seen", tags);
    // An ad or a shared link can open the sheet straight away: ?compare=1.
    if (new URLSearchParams(location.search).get("compare") === "1") {
      const t = setTimeout(() => show("link"), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sku]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && hide();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, hide]);

  const saving = useCountUp(compare.state === "lowest" ? compare.saving : 0, open && compare.state === "lowest");
  const chip =
    compare.state === "lowest"
      ? { icon: "₹", title: "Lowest price we found", sub: "vs Amazon, Flipkart & Meesho", pill: compare.saving > 0 ? `Save ${inr(compare.saving)}` : null }
      : compare.state === "only"
        ? { icon: "✦", title: "Only at Minimo", sub: "Not found on Amazon, Flipkart or Meesho", pill: "Exclusive" }
        : { icon: "♡", title: "Why buy from Minimo", sub: "Gift-wrapped by hand, ready in 48 h", pill: null };

  const out = (site: string) => {
    track("compare_outbound", { ...tags, compare_site: site });
    track(`compare_to_${site}`);
  };
  const add = () => {
    track("compare_add_to_cart", tags);
    onAdd();
    hide();
  };
  const max = compare.state === "lowest" ? Math.max(...compare.listings.map((l) => l.price), compare.price) : 1;
  const width = (p: number) => `${Math.max(18, Math.round((p / max) * 100))}%`;

  return (
    <>
      <button type="button" ref={chipRef} className={`d-cmp-chip is-${compare.state}`} onClick={() => show("chip")} aria-haspopup="dialog">
        <span className="d-cmp-chip-ic" aria-hidden="true">
          {chip.icon}
        </span>
        <span className="d-cmp-chip-t">
          <b>{chip.title}</b>
          <span>{chip.sub}</span>
        </span>
        {chip.pill ? <span className="d-cmp-chip-pill">{chip.pill}</span> : <Icon name="chevR" size={16} />}
      </button>

      <div className={`d-cmp ${open ? "is-open" : ""}`} inert={!open}>
        <div className="d-cmp-scrim" onClick={hide} />
        <div
          className={`d-cmp-sheet is-${compare.state}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cmp-title"
          style={drag ? { transform: `translateY(${drag}px)`, transition: "none" } : undefined}
          data-clarity-region="compare"
        >
          <div
            className="d-cmp-grab"
            onPointerDown={(e) => {
              y0.current = e.clientY;
              (e.target as Element).setPointerCapture?.(e.pointerId);
            }}
            onPointerMove={(e) => y0.current !== null && setDrag(Math.max(0, e.clientY - y0.current))}
            onPointerUp={() => {
              y0.current = null;
              if (drag > 90) hide();
              else setDrag(0);
            }}
          >
            <span />
          </div>
          <button type="button" ref={closeBtn} className="d-cmp-close" onClick={hide} aria-label="Close" tabIndex={open ? 0 : -1}>
            <Icon name="x" size={16} />
          </button>

          {compare.state === "lowest" && (
            <>
              <div className="d-cmp-hero is-low">
                <div className="d-cmp-stamp" aria-hidden="true">
                  <Ring id={`cmp-r-${sku}`} text={`PRICE CHECKED · ${checkedLabel(compare.checkedOn).toUpperCase()} · `} />
                  <span>
                    <Icon name="check" size={16} />
                  </span>
                </div>
                <p className="d-cmp-kicker">Lowest price we found</p>
                {compare.saving > 0 ? (
                  <h2 id="cmp-title" className="d-cmp-big">
                    You save <span>{inr(open ? saving : compare.saving)}</span>
                  </h2>
                ) : (
                  <h2 id="cmp-title" className="d-cmp-big">
                    Same price, <span>gift-wrapped</span>
                  </h2>
                )}
                <p className="d-cmp-sub">
                  compared with the same item on {compare.vs.name}, checked {checkedLabel(compare.checkedOn)}
                </p>
              </div>
              <ol className="d-cmp-ladder" aria-label="Prices for the same item">
                <li className="d-cmp-rung is-me" style={{ ["--w" as string]: width(compare.price) }}>
                  <span className="d-cmp-who">
                    <span className="d-cmp-mono is-me">m</span>Minimo
                  </span>
                  <span className="d-cmp-bar">
                    <i />
                  </span>
                  <span className="d-cmp-amt">{inr(compare.price)}</span>
                  <span className="d-cmp-note">Gift-wrapped by hand</span>
                </li>
                {compare.listings.map((l) => (
                  <li key={l.site} className="d-cmp-rung" style={{ ["--w" as string]: width(l.price) }}>
                    <span className="d-cmp-who">
                      <span className="d-cmp-mono">{l.name[0]}</span>
                      {l.name}
                    </span>
                    <span className="d-cmp-bar">
                      <i />
                    </span>
                    <span className="d-cmp-amt">{inr(l.price)}</span>
                    <span className="d-cmp-note">{l.more > 0 ? `${inr(l.more)} more` : "Same price"}</span>
                    <a className="d-cmp-out" href={l.url} target="_blank" rel="nofollow noopener noreferrer" onClick={() => out(l.site)}>
                      View on {l.name} ↗
                    </a>
                  </li>
                ))}
                {compare.missing.map((s) => (
                  <li key={s} className="d-cmp-rung is-na">
                    <span className="d-cmp-who">
                      <span className="d-cmp-mono">{SITE_NAME[s][0]}</span>
                      {SITE_NAME[s]}
                    </span>
                    <span className="d-cmp-na">Not listed when we checked</span>
                  </li>
                ))}
              </ol>
            </>
          )}

          {compare.state === "only" && (
            <>
              <div className="d-cmp-hero is-only">
                <div className="d-cmp-seal" aria-hidden="true">
                  <Ring id={`cmp-s-${sku}`} text="ONLY AT MINIMO · HAND-PICKED · " />
                  <span>✦</span>
                </div>
                <p className="d-cmp-kicker">Only at Minimo</p>
                <h2 id="cmp-title" className="d-cmp-title">
                  A find you won&apos;t see on the big apps
                </h2>
              </div>
              <ul className="d-cmp-searched" aria-label="Where we looked">
                {(["amazon", "flipkart", "meesho"] as const).map((s) => (
                  <li key={s}>
                    <span className="d-cmp-mono">{SITE_NAME[s][0]}</span>
                    {SITE_NAME[s]}
                    <span>Not found</span>
                  </li>
                ))}
              </ul>
              <p className="d-cmp-fine is-center">
                We searched for this exact piece on {checkedLabel(compare.checkedOn)}. It&apos;s picked for our shelf in Honer Vivantis.
              </p>
            </>
          )}

          {compare.state === "why" && (
            <>
              <div className="d-cmp-hero is-why">
                <p className="d-cmp-kicker">Made for gifting</p>
                <h2 id="cmp-title" className="d-cmp-title">
                  Why people buy {name} from Minimo
                </h2>
              </div>
              <ul className="d-cmp-tiles">
                <li>
                  <Icon name="gift" size={18} />
                  Gift-wrapped and name-tagged by hand
                </li>
                <li>
                  <Icon name="shield" size={18} />
                  Checked by hand before it&apos;s packed
                </li>
                <li>
                  <Icon name="store" size={18} />
                  See it in our store, free pickup
                </li>
                <li>
                  <Icon name="clock" size={18} />
                  Ready in 48 hours
                </li>
              </ul>
              <a className="d-cmp-seen" data-wa-source="Compare: seen it cheaper" href={waLink(`Hi Minimo, I've seen ${name} cheaper somewhere. Can you help?`)} target="_blank" rel="noopener">
                <span>Seen it cheaper somewhere?</span>
                <b>Tell us on WhatsApp ›</b>
              </a>
            </>
          )}

          {compare.state !== "why" && (
            <ul className="d-cmp-perks">
              {PERKS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          {compare.state === "lowest" && (
            <p className="d-cmp-fine">
              Same design, size and pack. Item prices only: other sites change prices often and may add delivery, so tap a link for today&apos;s price.{" "}
              <Link href="/how-we-check-prices">How we check prices</Link>
            </p>
          )}

          <div className="d-cmp-cta">
            {soldOut ? (
              <a className="d-cmp-btn" data-wa-source="Compare: sold out" href={waLink(`Hi Minimo, is ${name} back in stock?`)} target="_blank" rel="noopener">
                <Icon name="wa" size={18} />
                <span className="d-cmp-btn-label">Sold out · ask on WhatsApp</span>
              </a>
            ) : inCart ? (
              <Link className="d-cmp-btn" href="/cart" onClick={() => track("compare_go_to_cart", tags)}>
                <Icon name="bag" size={18} />
                <span className="d-cmp-btn-label">In your cart · Checkout</span>
                <Icon name="arrowR" size={18} />
              </Link>
            ) : (
              <button type="button" className="d-cmp-btn" onClick={add} tabIndex={open ? 0 : -1}>
                <Icon name="bag" size={18} />
                <span className="d-cmp-btn-label">Add to cart</span>
                <span className="d-cmp-btn-price">{inr(compare.price)}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
