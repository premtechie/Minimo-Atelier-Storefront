import Link from "next/link";
import { ProductCard } from "@/components/cards";
import { InnerHeader } from "@/components/header";
import { Icon } from "@/components/icon";
import { getStore } from "@/lib/catalogue";
import { featured, inSection } from "@/lib/store";

/**
 * As on Bluebee: say what happened, offer search right there, then a few things worth a look,
 * so a dead link still lands somewhere useful.
 */
export default async function NotFound() {
  const store = await getStore();
  const picks = featured(inSection(store.live, "kids")).slice(0, 4);
  return (
    <>
      <InnerHeader />
      <main id="main" className="m-wrap m-empty m-404">
        <span className="m-empty-icon">
          <Icon name="gift" size={24} />
        </span>
        <p className="m-eyebrow">Page not found</p>
        <h1 className="m-h2">We couldn&apos;t find that page</h1>
        <p>It may have sold out or moved. Search for it, or start from the shop.</p>
        <form className="m-inputpill m-404-search" role="search" action="/search">
          <Icon name="search" size={18} />
          <input name="q" placeholder="Search gifts, e.g. unicorn" aria-label="Search gifts" enterKeyHint="search" />
          <button className="m-btn m-btn--primary m-btn--sm">Search</button>
        </form>
        <Link className="m-404-shop" href="/shop/return-gifts">
          Browse return gifts <Icon name="arrowR" size={16} />
        </Link>
        {picks.length > 0 && (
          <section className="m-404-picks" aria-labelledby="h-404-picks">
            <div className="m-sec-head">
              <div>
                <p className="m-eyebrow">This week</p>
                <h2 className="m-h2" id="h-404-picks">
                  You might like
                </h2>
              </div>
            </div>
            <div className="m-grid">
              {picks.map((p) => (
                <ProductCard key={p.sku} p={p} unit={null} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
