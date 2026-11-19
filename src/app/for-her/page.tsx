import type { Metadata } from "next";
import { Curated, pairIdea, type PairIdea } from "@/components/curated";
import { getStore } from "@/lib/catalogue";
import { HER_BANDS } from "@/lib/merch";
import { inr } from "@/lib/format";
import { featured, inSection } from "@/lib/store";

export const metadata: Metadata = { title: "For her", description: "Earrings, hair claws, scrunchies, bracelets and bags, wrapped by hand at Minimo Atelier." };

export default async function ForHer({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const store = await getStore();
  const items = inSection(store.live, "for-her");
  const from = items.length ? Math.min(...items.map((p) => p.price)) : 0;
  const first = (...slugs: string[]) => featured(items.filter((p) => slugs.includes(p.category_slug)))[0];
  const ideas = [
    pairIdea("Mom & me", "Girls' hair tie + mom's earrings", first("hair-ties"), first("earrings")),
    pairIdea("Teacher gift", "Compact mirror + bag charm", first("mirror"), first("charms")),
    { eyebrow: "Add to a hamper", title: "Put a piece in a hamper", note: "Start the hamper builder", href: "/build?mode=hampers" },
  ].filter((x): x is PairIdea => !!x);
  return (
    <Curated
      path="/for-her"
      ok={store.ok}
      eyebrow="For Her"
      title={["Little luxuries,", "for her"]}
      desc={`Earrings, hair claws, scrunchies, bracelets and bags.${from ? ` From ${inr(from)}.` : ""}`}
      art="/art/cards/tile-for-her.webp"
      items={items}
      groupOf={(p) => p.herGroup ?? "More"}
      bands={HER_BANDS}
      ideas={ideas}
      order={["Earrings", "Hair Claws & Clips", "Hair Ties & Scrunchies", "Bracelets & Rings", "Necklaces & Chains", "Charms", "Bags & Wallets", "Beauty"]}
      sp={await searchParams}
    />
  );
}
