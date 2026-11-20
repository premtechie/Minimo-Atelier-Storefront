import type { Metadata } from "next";
import { InnerHeader } from "@/components/header";
import { WishView } from "@/components/wish-view";
import { getStore } from "@/lib/catalogue";
import { liteCatalogue } from "@/lib/lite";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };
export const revalidate = 60;

export default async function Wishlist() {
  const store = await getStore();
  return (
    <>
      <InnerHeader />
      <main id="main" className="m-wrap m-col">
        <header className="m-col-head">
          <div>
            <p className="m-eyebrow">Saved items</p>
            <h1 className="m-col-h1">Your wishlist</h1>
          </div>
        </header>
        <WishView items={liteCatalogue(store)} />
      </main>
    </>
  );
}
