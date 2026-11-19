import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { InnerHeader } from "@/components/header";
import { getStore } from "@/lib/catalogue";
import { pairsFor } from "@/lib/store";
import { liteCatalogue } from "@/lib/lite";

export const metadata: Metadata = { title: "Cart", robots: { index: false } };
export const revalidate = 60;

export default async function Cart() {
  const store = await getStore();
  // Add-ons for the summary: a bag and a few fillers, from today's stock.
  const pairs = pairsFor(store, { skip: new Set(), bags: 1, extras: 5 }).map((p) => ({ ...p, filler: store.bySku.get(p.sku)?.role === "filler" }));
  return (
    <>
      <InnerHeader />
      <main id="main" className="dz d-cartpg">
        <CartView items={liteCatalogue(store)} pairs={pairs} />
      </main>
    </>
  );
}
