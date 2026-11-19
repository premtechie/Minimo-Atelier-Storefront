"use client";

import { SafeImg } from "./safe-img";
import Link from "next/link";
import { inr } from "@/lib/format";
import type { LiteItem } from "@/lib/lite";
import { Icon } from "./icon";
import { useShop } from "./shop-provider";

export function WishView({ items }: { items: LiteItem[] }) {
  const { wish, toggleWish, ready } = useShop();
  const saved = items.filter((x) => wish.has(x.id));
  const gone = ready ? [...wish].filter((id) => !items.some((x) => x.id === id)).length : 0;
  if (!ready) return <div className="m-grid" aria-busy="true" />;
  if (!saved.length)
    return (
      <div className="m-empty">
        <span className="m-empty-icon">
          <Icon name="heart" size={24} />
        </span>
        <h2 className="m-h2">Nothing saved yet</h2>
        <p>Tap the heart on anything you like and it waits here.</p>
        <div className="m-empty-btns">
          <Link className="m-btn m-btn--primary" href="/shop/return-gifts">
            Shop return gifts
          </Link>
        </div>
      </div>
    );
  return (
    <>
      <p className="m-col-count">
        {saved.length} saved{gone ? ` · ${gone} no longer sold` : ""} · kept on this device
      </p>
      <div className="m-grid">
        {saved.map((x) => (
          <article key={x.id} className="m-card">
            <Link href={x.href} className="m-card-link">
              <div className="m-card-media">
                {x.image && (
                   
                  <SafeImg src={x.image} alt="" loading="lazy" />
                )}
                {x.cap === 0 && <span className="m-badge is-low">Sold out</span>}
              </div>
              <h3 className="m-card-name">{x.name}</h3>
              <p className="m-card-price">
                <b>{inr(x.price)}</b>
                {x.unit && <small>{x.unit}</small>}
              </p>
            </Link>
            <button className="m-card-heart is-on" aria-pressed="true" aria-label={`Remove ${x.name} from wishlist`} onClick={() => toggleWish(x.id, x.name)}>
              <Icon name="heart" size={16} />
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
