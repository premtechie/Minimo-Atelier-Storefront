"use client";

import Link from "next/link";
import { useState } from "react";
import { inr, packHref, productHref } from "@/lib/format";
import type { Product, ResolvedPack } from "@/lib/types";
import { Icon } from "./icon";
import { useShop } from "./shop-provider";

/** A product photo: the shop's own photo, else the clearly labelled sample picture, else a plain tile. */
export function Photo({ p, sizes = "(min-width: 1024px) 25vw, 50vw", eager = false }: { p: Pick<Product, "photoUrl" | "art" | "name" | "category">; sizes?: string; eager?: boolean }) {
  // If the shop's photo can't be loaded, fall back to the sample picture rather than a broken image.
  const [failed, setFailed] = useState(false);
  if (p.photoUrl && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.photoUrl} alt={p.name} loading={eager ? "eager" : "lazy"} decoding="async" sizes={sizes} onError={() => setFailed(true)} ref={(el) => {
          // the error can fire before hydration, so check once on mount too
          if (el?.complete && el.naturalWidth === 0) setFailed(true);
        }} />;
  }
  if (p.art) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.art} alt="" loading={eager ? "eager" : "lazy"} decoding="async" />
        <span className="m-sample">Sample picture</span>
      </>
    );
  }
  return (
    <span className="m-noimg" role="img" aria-label={`${p.name}: photo coming soon`}>
      <Icon name="gift" size={22} />
      <small>{p.category}</small>
    </span>
  );
}

export function Heart({ id, name }: { id: string; name: string }) {
  const { wish, toggleWish, ready } = useShop();
  const on = ready && wish.has(id);
  return (
    <button
      className={`m-card-heart ${on ? "is-on" : ""}`}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      onClick={(e) => {
        e.preventDefault();
        toggleWish(id, name);
      }}
    >
      <Icon name="heart" size={16} />
    </button>
  );
}

function badgeFor(p: Product) {
  if (p.availability === "few_left") return { text: `Only ${p.left} left`, cls: "is-low" };
  if (p.is_new) return { text: "New arrival", cls: "" };
  if (p.percent_off >= 5) return { text: `${p.percent_off}% off`, cls: "is-off" };
  return null;
}

export function ProductCard({ p, unit = "per piece" }: { p: Product; unit?: string | null }) {
  const badge = badgeFor(p);
  return (
    <article className="m-card">
      <Link href={productHref(p.sku)} className="m-card-link">
        <div className="m-card-media">
          <Photo p={p} />
          {badge && <span className={`m-badge ${badge.cls}`}>{badge.text}</span>}
        </div>
        <h3 className="m-card-name">{p.name}</h3>
        <p className="m-card-price">
          <b>{inr(p.price)}</b>
          {p.mrp && <s>{inr(p.mrp)}</s>}
          {unit && <small>{unit}</small>}
        </p>
      </Link>
      <Heart id={p.sku} name={p.name} />
    </article>
  );
}

export function PackCard({ k }: { k: ResolvedPack }) {
  return (
    <article className="m-card">
      <Link href={packHref(k.id)} className="m-card-link">
        <div className="m-card-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={k.art} alt="" loading="lazy" decoding="async" />
          <span className="m-sample">Sample picture</span>
          <span className="m-badge">Ready-made</span>
        </div>
        <h3 className="m-card-name">{k.name}</h3>
        <p className="m-card-price">
          <b>{inr(k.price)}</b>
          <small>per guest</small>
        </p>
      </Link>
      <Heart id={`pack:${k.id}`} name={k.name} />
    </article>
  );
}
