import type { Metadata } from "next";
import Link from "next/link";
import { PackCard, ProductCard } from "@/components/cards";
import { InnerHeader } from "@/components/header";
import { Icon } from "@/components/icon";
import { getStore } from "@/lib/catalogue";
import { featured } from "@/lib/store";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

const IDEAS = ["unicorn", "pencil", "hair clip", "bottle", "earrings", "keychain", "photo frame"];

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 60);
  const store = await getStore();
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hit = (s: string) => words.every((w) => s.toLowerCase().includes(w));
  const packs = words.length ? store.packs.filter((k) => hit(`${k.name} ${k.theme} ${k.blurb}`)) : [];
  const items = words.length ? featured(store.live.filter((p) => hit(`${p.name} ${p.category} ${p.sku}`))) : [];
  return (
    <>
      <InnerHeader />
      <main id="main" className="m-wrap m-search">
        <h1 className="m-col-h1">Search</h1>
        <form className="m-inputpill m-search-box" role="search" action="/search">
          <Icon name="search" size={18} />
          <input name="q" defaultValue={q} placeholder="Search gifts, e.g. unicorn" aria-label="Search gifts" autoFocus={!q} enterKeyHint="search" />
          <button className="m-btn m-btn--primary m-btn--sm">Search</button>
        </form>
        {!q && (
          <div className="m-chiprow m-search-ideas">
            {IDEAS.map((w) => (
              <Link key={w} className="m-chip" href={`/search?q=${encodeURIComponent(w)}`}>
                {w}
              </Link>
            ))}
          </div>
        )}
        {q && (
          <p className="m-col-count" aria-live="polite">
            {packs.length + items.length} results for &ldquo;{q}&rdquo;
          </p>
        )}
        <div className="m-grid">
          {packs.map((k) => (
            <PackCard key={k.id} k={k} />
          ))}
          {items.slice(0, 60).map((p) => (
            <ProductCard key={p.sku} p={p} unit={p.sections.includes("return-gifts") ? "per piece" : null} />
          ))}
        </div>
        {q && !packs.length && !items.length && (
          <div className="m-empty">
            <p>Nothing matches that. Try a simpler word, or ask us on WhatsApp.</p>
            <div className="m-empty-btns">
              <Link className="m-btn m-btn--ghost" href="/shop/all">
                Browse everything
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
