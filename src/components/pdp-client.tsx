"use client";

/*
 * Product page pieces that react to the shopper: the gallery, the buy box and
 * "Goes well with". Markup and class names mirror the approved design (its
 * mm- classes are d- here; their rules live in styles/design/pdp.css).
 */

import { ComparePrice } from "./compare-sheet";
import type { Compare } from "@/lib/compare";
import { SafeImg } from "./safe-img";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { addLine, type CartLine, type CartPart } from "@/lib/cart";
import { inr } from "@/lib/format";
import { BULK_RULES, bulkRate } from "@/lib/merch";
import { waLink } from "@/lib/whatsapp";
import { DeliveryCheck } from "./delivery-check";
import { Icon, type IconName } from "./icon";
import { useShop } from "./shop-provider";

export type GalleryImage = { src: string; alt: string; sample: boolean; fallback?: string | null };

export function Gallery({ images, wishId, name }: { images: GalleryImage[]; wishId: string; name: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const { wish, toggleWish, ready } = useShop();
  const on = ready && wish.has(wishId);
  const go = (i: number) => {
    const g = track.current;
    if (g) g.scrollTo({ left: g.clientWidth * i, behavior: "smooth" });
    setAt(i);
  };
  return (
    <div className="d-gallery">
      <div className="d-gallery-main">
        <div>
          <div
            className="d-gal-track"
            ref={track}
            tabIndex={0}
            role="region"
            aria-label="Photos, scroll sideways for more"
            onScroll={(e) => {
              const g = e.currentTarget;
              setAt(Math.round(g.scrollLeft / Math.max(1, g.clientWidth)));
            }}
          >
            {images.map((im, i) => (
              <div className="d-gal-slide" key={im.src + i}>
                <SafeImg src={im.src} fallback={im.fallback} alt={i === 0 ? im.alt : ""} loading={i === 0 ? "eager" : "lazy"} decoding="async" draggable={false} />
                {im.sample && <span className="m-sample">Sample picture</span>}
              </div>
            ))}
          </div>
        </div>
        {images.length > 1 && (
          <div className="d-gallery-dots" aria-hidden="true">
            {images.map((_, i) => (
              <i key={i} className={i === at ? "on" : ""} />
            ))}
          </div>
        )}
        <button
          type="button"
          className="d-card-btn d-gal-heart"
          aria-pressed={on}
          aria-label={on ? `Remove ${name} from wishlist` : `Save ${name}`}
          onClick={() => toggleWish(wishId, name)}
        >
          <Icon name="heart" size={17} />
        </button>
      </div>
      <div className="d-gallery-thumbs">
        <div className="d-thumbs-scroll">
          {images.map((im, i) => (
            <button type="button" key={im.src + i} className="d-thumb" aria-pressed={i === at} aria-label={`Photo ${i + 1}`} onClick={() => go(i)}>
              <SafeImg src={im.src} fallback={im.fallback} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      </div>
      <PromiseTiles className="d-pdp-promise--side" />
    </div>
  );
}

const PROMISE: [IconName, string, string][] = [
  ["clock", "Ready", "in 48 h"],
  ["pin", "Packed in", "Hyderabad"],
  ["store", "Free store", "pickup"],
  ["truck", "Free in Honer", "Vivantis"],
];
export function PromiseTiles({ className }: { className: string }) {
  return (
    <ul className={`d-pdp-promise ${className}`}>
      {PROMISE.map(([i, a, b]) => (
        <li className="d-pdp-promise-tile" key={a}>
          <Icon name={i} size={22} />
          <span>
            {a}
            <br />
            {b}
          </span>
        </li>
      ))}
    </ul>
  );
}

export type BuyItem = {
  kind: CartLine["kind"];
  ref: string;
  name: string;
  /** Price of one unit today, from the admin. */
  price: number;
  image: string | null;
  parts: CartPart[];
  detail?: string;
  /** Most units today's stock allows (Infinity when plenty). */
  max: number;
  /** Return-gift items get guest-count chips and the bulk offer. */
  bulk: boolean;
  /** Packs take a name for the wish tags. */
  nameTag: boolean;
  /** The admin's MRP, shown struck through when it is above today's price. */
  mrp?: number | null;
  /** A gift hamper: never earns free delivery. */
  hamper?: boolean;
};

const [[TOP_N, TOP_R], [LOW_N, LOW_R]] = BULK_RULES;
const CHIPS = [10, 15, 20, 25, 30];
const pct = (r: number) => Math.round(r * 100);

function Ticket({ q, set }: { q: number; set: (n: number) => void }) {
  const rate = bulkRate(q);
  const target = q < LOW_N ? LOW_N : TOP_N;
  const need = q < LOW_N ? LOW_N - q : q < TOP_N ? TOP_N - q : 0;
  return (
    <div className="d-ticket-wrap d-ticket-in" key={`${rate}-${need}`}>
      <button type="button" className="d-ticket" onClick={() => set(target)} aria-label={`Bulk offer: ${need ? `add ${need} more for ${pct(q < LOW_N ? LOW_R : TOP_R)}% off` : "best bulk price unlocked"}`}>
        <span className="d-ticket-stub">
          <span className="d-ticket-stamp">
            <strong>{pct(rate || LOW_R)}%</strong>
            <small>Off</small>
          </span>
        </span>
        <span className="d-ticket-body">
          <span className="d-ticket-eyebrow">{rate ? "Bulk price applied" : "Bulk offer"}</span>
          <span className="d-ticket-cond">{need ? `Add ${need} more for ${pct(q < LOW_N ? LOW_R : TOP_R)}% off` : "Best bulk price unlocked"}</span>
        </span>
        <span className="d-ticket-code">
          <span className="d-ticket-code-face">
            {rate ? (
              <>
                <Icon name="check" size={13} /> Applied
              </>
            ) : (
              `${LOW_N}+ GUESTS`
            )}
          </span>
          <span className="d-ticket-code-face">Set</span>
        </span>
      </button>
    </div>
  );
}

export function BuyBox({ item, eyebrow, badge, title, rating, compare }: { item: BuyItem; eyebrow: string; badge: string | null; title: string; rating?: ReactNode; compare?: Compare }) {
  const { add, cart, setQty, ready } = useShop();
  const router = useRouter();
  const start = item.bulk ? Math.min(20, item.max) : 1;
  const [q, setQ] = useState(Math.max(1, start));
  const [name, setName] = useState("");
  // The floating add-to-cart pill shows once the main buttons scroll out of view.
  const ctaRef = useRef<HTMLDivElement>(null);
  const [float, setFloat] = useState(false);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setFloat(!e.isIntersecting && e.boundingClientRect.bottom < 60), { rootMargin: "-60px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const set = (n: number) => setQ(Math.max(1, Math.min(item.max, Math.min(999, Math.round(n) || 1))));
  const rate = item.bulk ? bulkRate(q) : 0;
  const now = item.price * (1 - rate);
  const soldOut = item.max < 1;
  const note = item.nameTag && name.trim() ? name.trim() : undefined;
  const inCart = ready ? cart.find((l) => l.kind === item.kind && l.ref === item.ref && (l.note ?? "") === (note ?? "")) : undefined;

  const line = (): CartLine => ({
    key: `${item.kind}:${item.ref}:${Date.now().toString(36)}`,
    kind: item.kind,
    ref: item.ref,
    name: item.name,
    price: item.price,
    qty: q,
    image: item.image,
    parts: item.parts,
    detail: item.detail,
    note,
    bulk: item.bulk,
    ...(item.hamper ? { hamper: true } : {}),
  });
  const addNow = () => add(line());
  const unit = item.kind === "pack" ? "per guest" : "per piece";
  const next = q < LOW_N ? `Add ${LOW_N - q} more for ${pct(LOW_R)}% off.` : q < TOP_N ? `Add ${TOP_N - q} more for ${pct(TOP_R)}% off.` : "Best bulk price applied.";
  const save = item.price * q * rate;

  return (
    <div className="d-pdp-buybox">
      <div className="d-pdp-group">
        <p className="d-eyebrow">{eyebrow}</p>
        {badge && <span className="d-pdp-badge">{badge}</span>}
        <h1 className="d-pdp-title">{title}</h1>
        {rating}
      </div>
      <div className="d-pdp-group">
        <p className="d-pdp-pricerow">
          <span className="d-pdp-now">{inr(now)}</span>
          {rate > 0 ? (
            <>
              <s className="d-pdp-was">{inr(item.price)}</s>
              <span className="d-pdp-off">{pct(rate)}% off</span>
            </>
          ) : (
            item.mrp != null &&
            item.mrp > item.price && (
              <>
                <s className="d-pdp-was" aria-label={`MRP ${inr(item.mrp)}`}>
                  {inr(item.mrp)}
                </s>
                <span className="d-pdp-off">{pct(1 - item.price / item.mrp)}% off</span>
              </>
            )
          )}
          <span className="d-pdp-per">{unit}</span>
        </p>
        {compare && <ComparePrice compare={compare} sku={item.ref} name={item.name} soldOut={soldOut} inCart={!!inCart} onAdd={addNow} />}
        {item.bulk && !soldOut && (
          <div className="d-pdp-offers">
            <div className="d-ticket-rail">
              <Ticket q={q} set={set} />
            </div>
          </div>
        )}
      </div>

      {!soldOut && (
        <div className="d-pdp-group d-pdp-qty">
          <div className="d-qty-head">
            <span className="d-opt-lbl" id="qty-lbl">
              {item.kind === "pack" ? "Guests" : "Quantity"}
            </span>
            <div className="d-qstep sm" role="group" aria-labelledby="qty-lbl">
              <button type="button" onClick={() => set(q - 1)} disabled={q <= 1} aria-label="One less">
                <Icon name="minus" size={15} />
              </button>
              <input inputMode="numeric" value={q} onChange={(e) => set(Number(e.target.value.replace(/\D/g, "")))} aria-label={item.kind === "pack" ? "Guests" : "Quantity"} />
              <button type="button" onClick={() => set(q + 1)} disabled={q >= item.max} aria-label="One more">
                <Icon name="plus" size={15} />
              </button>
            </div>
          </div>
          {item.bulk && (
            <div className="d-qty-row">
              <div className="d-chips">
                {CHIPS.filter((n) => n <= item.max).map((n) => (
                  <button key={n} type="button" className={`d-chip ${n === q ? "is-on" : ""}`} onClick={() => set(n)}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
          {item.bulk ? (
            <p className="d-bulk-live" aria-live="polite">
              <b>{inr(item.price)} each</b> · {q} pcs = <b>{inr(item.price * q - save)}</b>
              {save > 0 && (
                <>
                  {" "}
                  · <span className="save">you save {inr(save)}</span>
                </>
              )}
              <br />
              <span className="muted small">{next}</span>
            </p>
          ) : (
            Number.isFinite(item.max) && (
              <p className="d-bulk-live">
                <span className="muted small">Only {item.max} left in the store.</span>
              </p>
            )
          )}
        </div>
      )}

      {item.nameTag && !soldOut && (
        <div className="d-pdp-group">
          <label className="d-opt-lbl" htmlFor="tagname">
            Name on the wish tags <span>{name.length}/12</span>
          </label>
          <div className="d-pin-field d-name-field">
            <Icon name="pen" size={16} />
            <input id="tagname" maxLength={12} placeholder="e.g. Aarav" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          </div>
          <p className="d-name-prev" aria-live="polite">
            {name.trim() ? `Thank you for coming to ${name.trim()}'s party` : ""}
          </p>
        </div>
      )}

      {soldOut ? (
        <p className="d-bulk-live">Sold out right now. Ask us on WhatsApp and we&apos;ll tell you when it&apos;s back.</p>
      ) : (
        <div className="d-pdp-cta-row d-pdp-cta-row--pair" ref={ctaRef}>
          {inCart ? (
            <>
              <div className="d-qstep" role="group" aria-label="Quantity in cart">
                <button type="button" onClick={() => setQty(inCart.key, inCart.qty - 1)} disabled={inCart.qty <= 1} aria-label="One less">
                  <Icon name="minus" size={16} />
                </button>
                <span aria-live="polite">{inCart.qty}</span>
                <button type="button" onClick={() => setQty(inCart.key, inCart.qty + 1)} disabled={inCart.qty >= item.max} aria-label="One more">
                  <Icon name="plus" size={16} />
                </button>
              </div>
              <Link className="d-liquid-btn d-liquid-btn--buy d-pdp-checkout is-flowing" href="/cart" aria-label={`Buy now: ${inCart.qty} in your cart`}>
                <span className="d-pdp-dock-flow" />
                <span className="d-liquid-btn-label">
                  <Icon name="sparkle" size={16} /> Buy now
                </span>
              </Link>
            </>
          ) : (
            <>
              <button type="button" className="d-addcart" onClick={addNow}>
                Add to cart
              </button>
              <button
                type="button"
                className="d-liquid-btn d-liquid-btn--buy"
                onClick={() => {
                  add(line());
                  router.push("/cart");
                }}
              >
                <span className="d-liquid-btn-lens" />
                <span className="d-liquid-btn-edge" />
                <span className="d-liquid-btn-label">
                  <Icon name="sparkle" size={16} /> Buy now
                </span>
              </button>
            </>
          )}
        </div>
      )}
      <a className="d-pdp-ask" data-wa-source="Product: ask on WhatsApp" href={waLink(`Hi Minimo, I'd like ${q} × ${item.name}.`)} target="_blank" rel="noopener">
        Ask on WhatsApp
      </a>
      {item.kind === "pack" && (
        <>
          {" "}
          <Link className="d-pdp-ask d-pdp-custom" href={`/build?from=${item.ref}`}>
            Customise this pack
          </Link>
        </>
      )}
      <section className="d-pdp-delivery-sec" aria-labelledby="h-del">
        <h2 className="d-set-title" id="h-del">
          Delivery details
        </h2>
        <DeliveryCheck pieces={item.parts.map((p) => ({ sku: p.sku, qty: p.qty * q }))} />
      </section>
      <PromiseTiles className="d-pdp-promise--main" />

      {!soldOut &&
        (inCart ? (
          // Already in the cart: the pill takes the shopper to checkout instead of adding another.
          <Link className={`d-liquid-btn d-pdp-dock d-float-cta ${float ? "show" : ""}`} tabIndex={float ? 0 : -1} aria-hidden={!float} href="/cart">
            <span className="d-liquid-btn-lens" />
            <span className="d-liquid-btn-edge" />
            <span className="d-liquid-btn-label">
              <Icon name="sparkle" size={16} /> <span>{inCart.qty} in cart · Buy now</span>
            </span>
          </Link>
        ) : (
          <button type="button" className={`d-liquid-btn d-pdp-dock d-float-cta ${float ? "show" : ""}`} tabIndex={float ? 0 : -1} aria-hidden={!float} onClick={addNow}>
            <span className="d-liquid-btn-lens" />
            <span className="d-liquid-btn-edge" />
            <span className="d-liquid-btn-label">
              <Icon name="bag" size={16} /> <span>{inr(now * q)} · Add to cart</span>
            </span>
          </button>
        ))}
    </div>
  );
}

export type Pair = { sku: string; name: string; price: number; img: string; href: string; cap: number };

/** "Goes well with": tick the add-ons and add them in one go. */
export function Pairs({ self, pairs }: { self: { name: string; price: number; img: string }; pairs: Pair[] }) {
  const { cart, replace, toast, ready } = useShop();
  const [on, setOn] = useState<Set<string>>(() => new Set(pairs.map((p) => p.sku)));
  // Add-ons already in the cart are marked as such and never added a second time.
  const held = new Set(ready ? cart.filter((l) => l.kind === "product").map((l) => l.ref) : []);
  const picked = pairs.filter((p) => on.has(p.sku) && !held.has(p.sku));
  const anyHeld = pairs.some((p) => held.has(p.sku));
  const total = picked.reduce((s, p) => s + p.price, 0);
  return (
    <section className="d-pdp-pairs" aria-labelledby="h-pairs">
      <div className="d-care-inner">
        <div className="d-set">
          <h2 className="d-set-title" id="h-pairs">
            Goes well with
          </h2>
          <ul className="d-set-list">
            <li className="d-set-row">
              <span className="d-set-lock">
                <Icon name="check" size={12} />
              </span>
              <span className="d-set-link">
                <span className="d-set-thumb">
                  <SafeImg src={self.img} alt="" loading="lazy" />
                </span>
                <span className="d-set-name">
                  {self.name} <span className="d-set-this">· this item</span>
                </span>
              </span>
              <span className="d-set-price">{inr(self.price)}</span>
            </li>
            {pairs.map((x) => (
              <li className="d-set-row" key={x.sku}>
                {held.has(x.sku) ? (
                  <span className="d-set-lock" title="Already in your cart">
                    <Icon name="check" size={12} />
                  </span>
                ) : (
                <label className="d-set-check">
                  <input
                    type="checkbox"
                    checked={on.has(x.sku)}
                    aria-label={`Add ${x.name}`}
                    onChange={() => {
                      const n = new Set(on);
                      if (n.has(x.sku)) n.delete(x.sku);
                      else n.add(x.sku);
                      setOn(n);
                    }}
                  />
                </label>
                )}
                <Link className="d-set-link" href={x.href}>
                  <span className="d-set-thumb">
                    <SafeImg src={x.img} alt="" loading="lazy" />
                  </span>
                  <span className="d-set-name">
                    {x.name}
                    {held.has(x.sku) && <span className="d-set-this"> · in your cart</span>}
                  </span>
                </Link>
                <span className="d-set-price">{inr(x.price)}</span>
              </li>
            ))}
          </ul>
          <div className="d-set-foot">
            <p className="d-set-total">
              <span>
                {picked.length} add-on{picked.length === 1 ? "" : "s"}
              </span>
              <strong>{inr(total)}</strong>
            </p>
            {!picked.length && anyHeld ? (
              <Link className="d-set-btn" href="/cart">
                <span className="d-set-face">
                  <Icon name="sparkle" size={14} /> Buy now
                </span>
              </Link>
            ) : (
            <button
              type="button"
              className="d-set-btn"
              disabled={!picked.length}
              onClick={() => {
                const stamp = Date.now().toString(36);
                const next = picked.reduce(
                  (c, x) => addLine(c, { key: `product:${x.sku}:${stamp}`, kind: "product", ref: x.sku, name: x.name, price: x.price, qty: 1, image: x.img, parts: [{ sku: x.sku, qty: 1 }] }),
                  cart,
                );
                replace(next);
                toast(`${picked.length} add-on${picked.length === 1 ? "" : "s"} added to your cart`, { href: "/cart", label: "View cart" });
              }}
            >
              <span className="d-set-face">
                Add {picked.length} to cart
              </span>
            </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
