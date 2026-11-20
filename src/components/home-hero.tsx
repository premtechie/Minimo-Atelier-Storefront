"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { inr, packHref } from "@/lib/format";
import { bulkRate } from "@/lib/merch";
import type { ResolvedPack } from "@/lib/types";
import { Icon } from "./icon";
import { useShop } from "./shop-provider";
import { packLine } from "./pack-line";

// [x in card widths, y, tilt, scale, opacity, z] for 0, 1, 2 and 3+ steps from the centre card.
const POS = [
  [0, 0, 0, 1, 1, 10],
  [1, 0.14, 12, 0.58, 1, 9],
  [1.78, 0.36, 22, 0.48, 1, 8],
  [2.4, 0.6, 30, 0.4, 0, 7],
] as const;
const BULK_AT = 15;

function cardStyle(i: number, cur: number, n: number): React.CSSProperties {
  let d = i - cur;
  if (d > n / 2) d -= n;
  if (d < -n / 2) d += n;
  const a = Math.min(Math.abs(d), 3);
  const sg = d < 0 ? -1 : 1;
  const [x, y, t, sc, op, z] = POS[a];
  return { "--x": x * sg, "--y": y, "--tilt": `${t * sg}deg`, "--scale": sc, opacity: op, zIndex: z, pointerEvents: a >= 3 ? "none" : undefined } as React.CSSProperties;
}

function dayAfter(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" });
}

export function HomeHero({ packs }: { packs: ResolvedPack[] }) {
  const [cur, setCur] = useState(0);
  const [drag, setDrag] = useState(0);
  const start = useRef<{ x: number; t: number } | null>(null);
  const hero = useRef<HTMLElement>(null);
  // Like the design: the pills sit a fixed distance under the buy box, whatever its height.
  useLayoutEffect(() => {
    const el = hero.current;
    if (!el) return;
    const fit = () => {
      const st = el.querySelector<HTMLElement>(".m-hero-stage");
      const b = el.querySelector<HTMLElement>(".m-hero-buy");
      if (!st || !b) return;
      el.style.setProperty("--foot-anchor", `${Math.max(0, st.offsetHeight - (b.offsetTop + b.offsetHeight) - 18)}px`);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const { add } = useShop();
  const n = packs.length;
  const k = packs[cur];
  if (!k) return null;
  const rate = bulkRate(BULK_AT);
  const go = (i: number) => setCur(((i % n) + n) % n);

  return (
    <section ref={hero} className="m-hero" aria-roledescription="carousel" aria-label="Ready-made packs">
      <div className="m-hero-titlerow">
        <section className="m-facts" aria-label="Store facts">
          <figure className="m-fact m-fact--l">
            <blockquote className="m-fact-text">See every pack in person before you order.</blockquote>
            <figcaption className="m-fact-foot">
              <span className="m-fact-icon">
                <Icon name="store" size={13} />
              </span>
              <span className="m-fact-who">
                <span className="m-fact-name">Visit our store</span>
                <span className="m-fact-where">Honer Vivantis</span>
              </span>
            </figcaption>
          </figure>
          <figure className="m-fact m-fact--r">
            <blockquote className="m-fact-text" suppressHydrationWarning>
              Order today, ready by {dayAfter(2).split(",")[0]}. Wrapped by hand.
            </blockquote>
            <figcaption className="m-fact-foot">
              <span className="m-fact-icon">
                <Icon name="clock" size={13} />
              </span>
              <span className="m-fact-who">
                <span className="m-fact-name">Ready in 48 h</span>
                <span className="m-fact-where">24 h rush if stock allows</span>
              </span>
            </figcaption>
          </figure>
        </section>
        <div className="m-hero-title">
          <p className="m-eyebrow" key={`e${cur}`}>
            {k.theme}
          </p>
          <p className="m-h1 m-hero-name" key={`n${cur}`}>
            {k.name}
          </p>
        </div>
      </div>

      <div
        className={`m-hero-stage ${drag !== 0 ? "is-dragging" : ""}`}
        style={{ "--drag": `${drag}px` } as React.CSSProperties}
        onPointerDown={(e) => {
          start.current = { x: e.clientX, t: Date.now() };
        }}
        onPointerMove={(e) => {
          if (start.current && (e.pointerType !== "mouse" || e.buttons)) setDrag((e.clientX - start.current.x) * 0.6);
        }}
        onPointerUp={(e) => {
          const s = start.current;
          start.current = null;
          setDrag(0);
          if (!s) return;
          const dx = e.clientX - s.x;
          if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
        }}
        onPointerCancel={() => {
          start.current = null;
          setDrag(0);
        }}
      >
        {packs.map((p, i) => (
          <div key={p.id} className={`m-hero-card ${i === cur ? "is-current" : ""}`} style={cardStyle(i, cur, n)}>
            <div className="m-hero-media">
              <div className="m-hero-drift">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.art} alt="" draggable={false} decoding="async" loading={i === 0 ? "eager" : "lazy"} />
              </div>
            </div>
            {i === cur ? (
              <Link className="m-hero-hit" href={packHref(p.id)} draggable={false} aria-label={`Open ${p.name}`} />
            ) : (
              <button className="m-hero-hit" onClick={() => go(i)} aria-label={`Show ${p.name}`} />
            )}
          </div>
        ))}
        <div className="m-hero-buy">
          <p className="m-hero-deal" title={`Bulk price at ${BULK_AT}+ guests`}>
            <span className="m-hero-pct">
              {Math.round(rate * 100)}
              <small>%</small>
            </span>
            <span className="m-hero-off">Off</span>
          </p>
          <span className="m-hero-rule" />
          <p className="m-hero-prices">
            <s>
              <span className="m-sr">Was </span>
              {inr(k.price)}
            </s>
            <b>
              <span className="m-sr">Now </span>
              {inr(k.price * (1 - rate))}
            </b>
            <small>/ guest at {BULK_AT}+</small>
          </p>
          <button
            className="m-hero-add"
            aria-label={`Add ${BULK_AT} ${k.name} packs to cart`}
            onClick={() => add(packLine(k, BULK_AT), `Added ${BULK_AT} × ${k.name}`)}
          >
            <Icon name="bag" size={18} />
          </button>
        </div>
      </div>

      <div className="m-hero-foot">
        <span className="m-hero-pill m-hero-pill--solid">
          <span className="m-strip-dot" aria-hidden="true" /> Ready in 48 h
        </span>
        <Link className="m-hero-pill m-hero-pill--shop" href="/shop/return-gifts">
          <span className="m-beam" aria-hidden="true" />
          Shop all <Icon name="arrowR" size={14} />
        </Link>
      </div>
    </section>
  );
}
