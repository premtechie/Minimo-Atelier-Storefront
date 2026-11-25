import type { Metadata } from "next";
import { Curated, pairIdea, type PairIdea } from "@/components/curated";
import { getStore } from "@/lib/catalogue";
import { HER_BANDS, JEWELLERY_GROUPS, jewelleryGroupFor } from "@/lib/merch";
import { inr } from "@/lib/format";
import { featured, inSection } from "@/lib/store";
import type { Product } from "@/lib/types";

import { pageMeta } from "@/lib/seo";
const TITLE = "Jewellery gifts in Hyderabad: earrings, necklaces and bracelets";
const DESC = "Earrings, necklaces, chains, bracelets, rings and charms, gift-wrapped by hand at Minimo Atelier in Hyderabad. Pickup or delivery across Hyderabad, courier across India.";
export const metadata: Metadata = {
  title: { absolute: `${TITLE} · Minimo Atelier` },
  description: DESC,
  ...pageMeta("/jewellery", TITLE, DESC),
};

const groupOf = (p: Product) => jewelleryGroupFor(p.category_slug) ?? "More";

/** The jewellery-only collection: the same pieces as For her's jewellery chips, on a page of their own. */
export default async function Jewellery({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const store = await getStore();
  const items = inSection(store.live, "jewellery");
  const from = items.length ? Math.min(...items.map((p) => p.price)) : 0;
  const first = (g: string) => featured(items.filter((p) => groupOf(p) === g))[0];
  const box = featured(store.live.filter((p) => p.category_slug === "jewellery-box"))[0];
  const ideas = [
    pairIdea("Matching set", "Necklace + earrings", first("Necklaces & Chains"), first("Earrings")),
    pairIdea("Boxed to give", "Earrings in a jewellery box", first("Earrings"), box),
    { eyebrow: "Add to a hamper", title: "Put a piece in a hamper", note: "Start the hamper builder", href: "/build?mode=hampers" },
  ].filter((x): x is PairIdea => !!x);
  return (
    <Curated
      path="/jewellery"
      ok={store.ok}
      eyebrow="Jewellery"
      title={["Pieces she'll wear,", "every day"]}
      desc={`Earrings, necklaces and chains, bracelets, rings and charms.${from ? ` From ${inr(from)}.` : ""}`}
      art="/art/cards/tile-jewellery.webp"
      items={items}
      groupOf={groupOf}
      bands={HER_BANDS}
      ideas={ideas}
      order={JEWELLERY_GROUPS}
      sp={await searchParams}
    />
  );
}
