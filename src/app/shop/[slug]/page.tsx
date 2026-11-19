import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PackCard, ProductCard } from "@/components/cards";
import { InnerHeader } from "@/components/header";
import { Icon } from "@/components/icon";
import { Offline } from "@/components/offline";
import { getStore } from "@/lib/catalogue";
import { BUDGET_BANDS, RG_TABS } from "@/lib/merch";
import { featured, inSection } from "@/lib/store";
import type { Product } from "@/lib/types";

const PAGE = 24;
const COLS = {
  "return-gifts": { title: "Return gifts", eyebrow: "Shop", desc: "Ready-made packs and single pieces to mix your own. Wrapped and name-tagged, ready in 48 h." },
  kids: { title: "Kids' favourites", eyebrow: "In the store now", desc: "Bottles, lamps, bags and toys kids actually use. Everything here is in stock today." },
  all: { title: "Shop all", eyebrow: "Shop", desc: "Everything in the store today. Sold-out pieces are hidden." },
} as const;
type Slug = keyof typeof COLS;
const SORTS = [
  ["", "Featured"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
  ["new", "New arrivals"],
] as const;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = COLS[slug as Slug];
  return c ? { title: c.title, description: c.desc } : {};
}

function sortBy(list: Product[], sort: string) {
  if (sort === "price-asc") return [...list].sort((a, b) => a.price - b.price);
  if (sort === "price-desc") return [...list].sort((a, b) => b.price - a.price);
  if (sort === "new") return [...list].sort((a, b) => Number(b.is_new) - Number(a.is_new));
  return featured(list);
}

export default async function Collection({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { slug } = await params;
  if (!(slug in COLS)) notFound();
  const sp = await searchParams;
  const c = COLS[slug as Slug];
  const store = await getStore();
  const band = BUDGET_BANDS.find((b) => b.id === sp.budget);
  const tab = RG_TABS.includes(sp.tab ?? "") ? sp.tab! : null;
  const sort = SORTS.some(([k]) => k === sp.sort) ? sp.sort! : "";
  const page = Math.max(1, Math.min(50, Number(sp.page) || 1));

  let items = slug === "all" ? store.live : inSection(store.live, slug as "return-gifts" | "kids");
  if (band) items = items.filter((p) => p.price >= band.min && p.price <= band.max);
  if (tab) items = items.filter((p) => p.tab === tab);
  items = sortBy(items, sort);
  const packs = slug === "return-gifts" && !tab ? store.packs.filter((k) => !band || (k.price >= band.min && k.price <= band.max)) : [];
  const shown = items.slice(0, page * PAGE);

  const href = (o: Record<string, string | null | undefined>) => {
    const q = new URLSearchParams();
    const next = { budget: band?.id, tab, sort, ...o };
    for (const [k, v] of Object.entries(next)) if (v) q.set(k, v);
    const s = q.toString();
    return `/shop/${slug}${s ? `?${s}` : ""}`;
  };
  const title = band && slug === "return-gifts" ? `Return gifts ${band.label.toLowerCase()}` : c.title;

  return (
    <>
      <InnerHeader />
      <main id="main" className="m-wrap m-col">
        <Offline ok={store.ok} />
        <div className="m-col-head">
          <div>
            <p className="m-eyebrow">{c.eyebrow}</p>
            <h1 className="m-col-h1">{title}</h1>
            <p className="m-col-desc">{c.desc}</p>
          </div>
          <Link className="m-searchbtn" href="/search">
            <Icon name="search" size={16} />
            <span>Search gifts</span>
            <kbd aria-hidden="true">/</kbd>
          </Link>
        </div>

        <nav className="m-col-chips" aria-label="Price">
          <Link className={`m-chip ${!band ? "is-on" : ""}`} href={href({ budget: null, page: null })} aria-current={!band ? "page" : undefined}>
            All
          </Link>
          {BUDGET_BANDS.map((b) => (
            <Link key={b.id} className={`m-chip ${band?.id === b.id ? "is-on" : ""}`} href={href({ budget: b.id })} aria-current={band?.id === b.id ? "page" : undefined}>
              {b.label}
            </Link>
          ))}
          {slug !== "kids" && (
            <Link className="m-chip" href="/shop/kids">
              Kids&apos; favourites
            </Link>
          )}
        </nav>

        <div className="m-grid m-grid--3">
          {packs.map((k) => (
            <PackCard key={k.id} k={k} />
          ))}
          {shown.map((p) => (
            <ProductCard key={p.sku} p={p} unit={slug === "return-gifts" ? "per piece" : null} />
          ))}
        </div>
        {!items.length && !packs.length && store.ok && <p className="m-empty">Nothing in this range right now. Sold-out pieces are hidden.</p>}
        {shown.length < items.length && (
          <div className="m-col-more">
            <p>
              Showing {shown.length} of {items.length}
            </p>
            <Link className="m-btn m-btn--ghost" href={href({ page: String(page + 1) })} scroll={false}>
              Show more
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
