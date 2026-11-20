import { NextResponse } from "next/server";
import { getStore } from "@/lib/catalogue";
import { packHref, productHref } from "@/lib/format";

/**
 * Quick search for the header's search sheet, shaped like Bluebee's: the
 * matching categories (as chips) and up to 8 packs and in-stock pieces with
 * their category and struck-through MRP. Public fields only.
 */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 60);
  if (!q) return NextResponse.json({ hits: [], cats: [] });
  const store = await getStore();
  const n = parseInt(q, 10);
  const match = (name: string, extra: string, price: number) => name.toLowerCase().includes(q) || extra.toLowerCase().includes(q) || (n > 0 && price <= n);
  const hits = [
    ...store.packs.filter((k) => match(k.name, k.theme, k.price)).map((k) => ({ name: `${k.name} pack`, cat: "Return gift pack", price: k.price, mrp: null, href: packHref(k.id), img: k.art })),
    ...store.live
      .filter((p) => match(p.name, p.category, p.price))
      .map((p) => ({ name: p.name, cat: p.category, price: p.price, mrp: p.mrp && p.mrp > p.price ? p.mrp : null, href: productHref(p.sku), img: p.photoUrl ?? p.art })),
  ].slice(0, 8);
  const cats = [...new Set(store.live.map((p) => p.category))].filter((c) => c.toLowerCase().includes(q)).slice(0, 4);
  return NextResponse.json({ hits, cats }, { headers: { "Cache-Control": "public, max-age=60" } });
}
