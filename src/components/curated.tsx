import Link from "next/link";
import { ProductCard } from "./cards";
import { InnerHeader } from "./header";
import { Offline } from "./offline";
import { inr } from "@/lib/format";
import { featured } from "@/lib/store";
import type { Product } from "@/lib/types";

type Band = { id: string; label: string; min: number; max: number };
export type PairIdea = { eyebrow: string; title: string; note: string; href: string };

const PAGE = 24;

/*
 * For her / For him, in the approved design's markup: its plain classes are
 * e- here and their rules live in styles/design/curated.css.
 */
export function Curated({
  path,
  ok,
  eyebrow,
  title,
  desc,
  art,
  him = false,
  items,
  groupOf,
  bands,
  ideas,
  order = [],
  sp,
}: {
  path: string;
  ok: boolean;
  eyebrow: string;
  /** Plain words, then the words set in the accent style. */
  title: [string, string];
  desc: string;
  art: string;
  him?: boolean;
  items: Product[];
  groupOf: (p: Product) => string;
  bands: Band[];
  ideas: PairIdea[];
  /** Group order as the design lists them; others follow alphabetically. */
  order?: string[];
  sp: Record<string, string | undefined>;
}) {
  const rank = (g: string) => (order.includes(g) ? order.indexOf(g) : order.length);
  const groups = [...new Set(items.map(groupOf))].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  const group = groups.includes(sp.group ?? "") ? sp.group! : null;
  const band = bands.find((b) => b.id === sp.price);
  const page = Math.max(1, Math.min(50, Number(sp.page) || 1));
  let list = items;
  if (group) list = list.filter((p) => groupOf(p) === group);
  if (band) list = list.filter((p) => p.price >= band.min && p.price <= band.max);
  list = featured(list);
  const shown = list.slice(0, page * PAGE);
  const href = (o: Record<string, string | null>) => {
    const q = new URLSearchParams();
    const next = { group, price: band?.id ?? null, page: null, ...o };
    for (const [k, v] of Object.entries(next)) if (v) q.set(k, v);
    const s = q.toString();
    return s ? `${path}?${s}` : path;
  };

  return (
    <>
      <InnerHeader />
      <main id="main" className="dy e-wrap">
        <Offline ok={ok} />
        <nav className="e-crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">·</span>
          <span aria-current="page">{eyebrow}</span>
        </nav>
        <section className={`e-fh-hero ${him ? "e-fm-hero" : ""}`} style={{ marginTop: 12 }}>
          <div className="e-photo has-img wide">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={art} alt="" decoding="async" draggable={false} />
          </div>
          <div className="e-txt">
            <span className="e-eyebrow">{eyebrow}</span>
            <h1>
              {title[0]} <em>{title[1]}</em>.
            </h1>
            <p className="muted">{desc}</p>
          </div>
        </section>

        <nav className="e-pillrow" aria-label="Type">
          <Link className={`e-chip ${!group ? "on" : ""}`} href={href({ group: null })} aria-current={!group ? "page" : undefined}>
            All
          </Link>
          {groups.map((g) => (
            <Link key={g} className={`e-chip ${group === g ? "on" : ""}`} href={href({ group: g })} aria-current={group === g ? "page" : undefined}>
              {g}
            </Link>
          ))}
        </nav>
        <nav className="e-chips" style={{ marginTop: 8 }} aria-label="Price">
          {bands.map((b) => (
            <Link key={b.id} className={`e-chip ${band?.id === b.id ? "on" : ""}`} href={href({ price: band?.id === b.id ? null : b.id })} aria-current={band?.id === b.id ? "true" : undefined}>
              {b.label}
            </Link>
          ))}
        </nav>
        <div className="e-result-line" style={{ marginTop: 16 }}>
          <span className="num" aria-live="polite">
            {list.length} {list.length === 1 ? "item" : "items"}
          </span>
        </div>
        {list.length ? (
          <div className="e-grid">
            {shown.map((p) => (
              <ProductCard key={p.sku} p={p} unit={null} />
            ))}
          </div>
        ) : (
          ok && (
            <div className="e-empty">
              <h3>Nothing in this price band yet</h3>
              <Link className="m-btn m-btn--ghost m-btn--sm" href={href({ group: null, price: null })}>
                Show everything
              </Link>
            </div>
          )
        )}
        {shown.length < list.length && (
          <div className="m-col-more">
            <p>
              Showing {shown.length} of {list.length}
            </p>
            <Link className="m-btn m-btn--ghost" href={href({ page: String(page + 1) })} scroll={false}>
              Show more
            </Link>
          </div>
        )}

        {ideas.length > 0 && (
          <section className="e-section" aria-labelledby="h-xs">
            <div className="e-sec-head">
              <div className="e-stack">
                <span className="e-eyebrow">Gift ideas</span>
                <h2 id="h-xs">Made to pair</h2>
              </div>
            </div>
            <div className="e-xsell">
              {ideas.map((x) => (
                <Link key={x.title} href={x.href}>
                  <span className="e-eyebrow">{x.eyebrow}</span>
                  <h3>{x.title}</h3>
                  <span className="muted small">{x.note}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

/** A pairing idea from two real products, priced from today's catalogue. */
export function pairIdea(eyebrow: string, title: string, a: Product | undefined, b: Product | undefined): PairIdea | null {
  if (!a || !b) return null;
  return { eyebrow, title, note: `${a.name} + ${b.name} · ${inr(a.price + b.price)}`, href: `/product/${a.sku.toLowerCase()}` };
}
