import type { Metadata } from "next";
import { Curated, pairIdea, type PairIdea } from "@/components/curated";
import { getStore } from "@/lib/catalogue";
import { featured, inSection } from "@/lib/store";
import type { Product } from "@/lib/types";

import { pageMeta } from "@/lib/seo";
export const metadata: Metadata = {
  title: { absolute: "Gifts for him in Hyderabad: wallets, bottles and desk gifts · Minimo Atelier" },
  description: "Gifts for him: wallets, bottles, photo frames and desk gifts, wrapped with a card at Minimo Atelier in Hyderabad. Pickup or delivery across Hyderabad, courier across India.",
  ...pageMeta("/for-him", "Gifts for him in Hyderabad: wallets, bottles and desk gifts", "Gifts for him: wallets, bottles, photo frames and desk gifts, wrapped with a card at Minimo Atelier in Hyderabad. Pickup or delivery across Hyderabad, courier across India."),
};

const GROUPS: Record<string, string> = {
  "wallet-adult": "Wallets",
  "photo-frame": "Photo frames",
  bottle: "Bottles",
  "glass-bottle": "Bottles",
  lamp: "Desk & home",
  "home-and-living": "Desk & home",
  "gift-hampers": "Hampers",
};
const BANDS = [
  { id: "under-199", label: "Under ₹199", min: 0, max: 199 },
  { id: "200-399", label: "₹200–399", min: 200, max: 399 },
  { id: "400-plus", label: "₹400+", min: 400, max: Infinity },
];
const groupOf = (p: Product) => GROUPS[p.category_slug] ?? "More";

export default async function ForHim({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const store = await getStore();
  const items = inSection(store.live, "for-him");
  const first = (g: string, skip?: Product) => featured(items.filter((p) => groupOf(p) === g && p !== skip))[0];
  const ideas = [
    pairIdea("Anniversary", "Wallet + photo frame, boxed together", first("Wallets"), first("Photo frames")),
    pairIdea("Office gift", "Bottle + a desk piece", first("Bottles"), first("Desk & home")),
    { eyebrow: "Make it a hamper", title: "Build a hamper for him", note: "Start the hamper builder", href: "/build?mode=hampers" },
  ].filter((x): x is PairIdea => !!x);
  return (
    <Curated
      path="/for-him"
      ok={store.ok}
      eyebrow="For Him"
      title={["Thoughtful picks,", "for him"]}
      desc="Wallets, bottles, photo frames and desk gifts. Wrapped with a card."
      art="/art/cards/tile-for-him.webp"
      items={items}
      him
      groupOf={groupOf}
      bands={BANDS}
      ideas={ideas}
      order={["Wallets", "Photo frames", "Bottles", "Desk & home", "Hampers"]}
      sp={await searchParams}
    />
  );
}
