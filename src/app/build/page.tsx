import type { Metadata } from "next";
import { InnerHeader } from "@/components/header";
import { Offline } from "@/components/offline";
import { Studio } from "@/components/studio";
import { getStore } from "@/lib/catalogue";
import { studioData, studioStart } from "@/lib/studio-data";

export const metadata: Metadata = {
  title: "Gift studio: build a return-gift bag or hamper",
  description: "Pick a bag, fill it from what is in our store today, add name tags and see the price per guest as you go. Ready in 48 hours.",
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
