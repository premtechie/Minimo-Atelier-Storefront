import type { Metadata } from "next";
import { InnerHeader } from "@/components/header";
import { Offline } from "@/components/offline";
import { Studio } from "@/components/studio";
import { getStore } from "@/lib/catalogue";
import { studioData, studioStart } from "@/lib/studio-data";

import { pageMeta } from "@/lib/seo";
export const metadata: Metadata = {
  title: { absolute: "Build your own return gift bag or gift hamper · Minimo Atelier" },
  description: "Make your own return-gift bag or gift hamper online: pick a bag, fill it from what is in our Hyderabad store today, add name tags and see the price per guest as you go. Ready in 48 hours.",
  ...pageMeta("/build", "Build your own return gift bag or gift hamper", "Make your own return-gift bag or gift hamper online: pick a bag, fill it from what is in our Hyderabad store today, add name tags and see the price per guest as you go. Ready in 48 hours."),
};

export default async function BuildPage({ searchParams }: { searchParams: Promise<{ mode?: string; from?: string }> }) {
  const [store, q] = await Promise.all([getStore(), searchParams]);
  const data = studioData(store);
  const start = studioStart(store, data, q);
  return (
    <>
      <InnerHeader />
      <main id="main" className="st">
        <Offline ok={store.ok} />
        <Studio key={`${start.mode}-${q.from ?? ""}`} data={data} start={start} />
      </main>
    </>
  );
}
