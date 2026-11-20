import Link from "next/link";
import { PackCard, ProductCard } from "@/components/cards";
import { HomeHeader } from "@/components/header";
import { HomeHero } from "@/components/home-hero";
import { Offline } from "@/components/offline";
import { Scrolly } from "@/components/scrolly";
import { SeoIntro } from "@/components/seo-intro";
import { Trust } from "@/components/trust";
import { getStore } from "@/lib/catalogue";
import { BUDGET_BANDS } from "@/lib/merch";
import { featured, inSection } from "@/lib/store";

export const revalidate = 60;

export const metadata = { alternates: { canonical: "/" } };

const TILES = [
  ...BUDGET_BANDS.slice(0, 4).map((b) => ({ label: b.label, href: `/shop/return-gifts?budget=${b.id}`, art: b.art })),
  { label: "Hampers", href: "/build?mode=hampers", art: "/art/cards/tile-hampers.webp" },
  { label: "For Her", href: "/for-her", art: "/art/cards/tile-for-her.webp" },
  { label: "Bulk orders", href: "/bulk-orders", art: "/art/cards/tile-bulk.webp" },
];

export default async function Home() {
  const store = await getStore();
  const kids = featured(inSection(store.live, "kids")).slice(0, 8);
  return (
    <>
      <div className="m-home-top">
        <div className="m-home-bg" aria-hidden="true">
          <span className="m-band m-band--1" />
          <span className="m-band m-band--2" />
          <span className="m-band m-band--3" />
        </div>
        <HomeHeader />
        <main id="main">
          <div className="m-wrap">
            <Offline ok={store.ok} />
          </div>
          <HomeHero packs={store.packs} />
        </main>
        <Trust className="m-trust--in" />
      </div>
      <Trust className="m-trust--below" />

      <section className="m-sec" aria-labelledby="h-cats">
        <div className="m-wrap">
          <div className="m-sec-head">
            <h2 className="m-h2" id="h-cats">
              Shop by budget
            </h2>
            <Link className="m-viewall" href="/shop/return-gifts">
              View all →
            </Link>
          </div>
          <div className="m-tiles">
            {TILES.map((t) => (
              <Link key={t.label} href={t.href} className="m-tile">
                <span className="m-tile-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.art} alt="" loading="lazy" decoding="async" />
                </span>
                <span className="m-tile-label">{t.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Scrolly />

      {store.packs.length > 0 && (
        <section className="m-sec m-sec--best" aria-labelledby="h-packs">
          <div className="m-wrap">
            <div className="m-sec-head">
              <div>
                <p className="m-eyebrow">The fast path</p>
                <h2 className="m-h2" id="h-packs">
                  Ready-made packs
                </h2>
              </div>
              <Link className="m-viewall" href="/shop/return-gifts">
                View all →
              </Link>
            </div>
            <div className="m-grid">
              {store.packs.slice(0, 4).map((k) => (
                <PackCard key={k.id} k={k} />
              ))}
            </div>
          </div>
        </section>
      )}

      {kids.length > 0 && (
        <section className="m-sec m-sec--best" aria-labelledby="h-kids">
          <div className="m-wrap">
            <div className="m-sec-head">
              <div>
                <p className="m-eyebrow">This week</p>
                <h2 className="m-h2" id="h-kids">
                  Kids&apos; favourites
                </h2>
              </div>
              <Link className="m-viewall" href="/shop/kids">
                View all →
              </Link>
            </div>
            <div className="m-grid">
              {kids.map((p) => (
                <ProductCard key={p.sku} p={p} unit={null} />
              ))}
            </div>
          </div>
        </section>
      )}
      <SeoIntro />
    </>
  );
}
