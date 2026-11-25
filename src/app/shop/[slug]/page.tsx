import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PackCard, ProductCard } from "@/components/cards";
import { InnerHeader } from "@/components/header";
import { Offline } from "@/components/offline";
import { SearchButton } from "@/components/search-sheet";
import { SortSheet } from "@/components/sort-sheet";
import { getStore } from "@/lib/catalogue";
import { BUDGET_BANDS, RG_TABS } from "@/lib/merch";
import { featured, inSection } from "@/lib/store";
import type { Product } from "@/lib/types";
import { BUDGET_COPY, breadcrumbs, itemList, ldJson, pageMeta } from "@/lib/seo";
import { packHref, productHref } from "@/lib/format";

const PAGE = 24;
const COLS = {
  "return-gifts": { title: "Return gifts", eyebrow: "Shop", desc: "Ready-made packs and single pieces to mix your own. Wrapped and name-tagged, ready in 48 h." },
  kids: { title: "Kids' favourites", eyebrow: "In the store now", desc: "Bottles, lamps, bags and toys kids actually use. Everything here is in stock today." },
  all: { title: "Shop all", eyebrow: "Shop", desc: "Everything in the store today. Sold-out pieces are hidden." },
} as const;
type Slug = keyof typeof COLS;
const SORTS = [
  ["", "Recommended"],
  ["price-asc", "Price, low to high"],
  ["price-desc", "Price, high to low"],
  ["saving", "Biggest saving"],
  ["new", "Newest in store"],
] as const;

/** What each collection is called in search results. */
const SEO: Record<Slug, { title: string; description: string }> = {
  "return-gifts": {
    title: "Return gifts for kids' birthday parties in Hyderabad",
    description: "Shop birthday return gifts for kids in Hyderabad: ready-made return-gift packs and single pieces from under ₹99. Gift-wrapped, name-tagged and ready in 48 hours.",
  },
  kids: {
    title: "Kids' gifts in Hyderabad: bottles, lamps, bags and toys",
    description: "Gifts kids actually use: water bottles, night lamps, backpacks, lunch boxes and toys, all in stock today at Minimo Atelier, Hyderabad.",
  },
  all: {
    title: "Shop all gifts and return gifts",
    description: "Every gift and return gift in our Hyderabad store today: stationery, toys, bags, bottles, jewellery and hampers. Sold-out pieces are hidden.",
  },
};

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }): Promise<Metadata> {
  const { slug } = await params;
  if (!(slug in COLS)) return {};
  const sp = await searchParams;
  // A price band of return gifts is its own page in search ("return gifts under 99");
  // every other filter, sort or page points search at the plain collection.
  const band = slug === "return-gifts" && sp.budget ? BUDGET_COPY[sp.budget] : undefined;
  const m = band ?? SEO[slug as Slug];
  const path = band ? `/shop/${slug}?budget=${sp.budget}` : `/shop/${slug}`;
  return { title: { absolute: `${m.title} · Minimo Atelier` }, description: m.description, ...pageMeta(path, m.title, m.description) };
}

/** Share of the MRP saved; 0 when there is no real MRP above the price. */
const saving = (p: Product) => (p.mrp && p.mrp > p.price ? (p.mrp - p.price) / p.mrp : 0);

function sortBy(list: Product[], sort: string) {
  if (sort === "price-asc") return [...list].sort((a, b) => a.price - b.price);
  if (sort === "price-desc") return [...list].sort((a, b) => b.price - a.price);
  if (sort === "saving") return [...list].sort((a, b) => saving(b) - saving(a) || a.price - b.price);
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
  const ld = [
    breadcrumbs(band && slug === "return-gifts" ? [["Home", "/"], [c.title, `/shop/${slug}`], [title, null]] : [["Home", "/"], [c.title, null]]),
    itemList(title, [...packs.map((k) => packHref(k.id)), ...shown.map((p) => productHref(p.sku))]),
  ];

  return (
    <>
      <InnerHeader />
      <main id="main" className="m-wrap m-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
        <Offline ok={store.ok} />
        <div className="m-col-head">
          <div>
            <p className="m-eyebrow">{c.eyebrow}</p>
            <h1 className="m-col-h1">{title}</h1>
            <p className="m-col-desc">{band && slug === "return-gifts" && BUDGET_COPY[band.id] ? BUDGET_COPY[band.id].description : c.desc}</p>
          </div>
          <SearchButton />
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

        <div className="m-col-bar">
          <p className="m-col-count">
            {items.length + packs.length} {items.length + packs.length === 1 ? "gift" : "gifts"}
          </p>
          <SortSheet current={sort} options={SORTS.map(([k, label]) => ({ key: k, label, href: href({ sort: k || null, page: null }) }))} />
        </div>

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
