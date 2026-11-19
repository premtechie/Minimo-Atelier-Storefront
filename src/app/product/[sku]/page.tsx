import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/cards";
import { InnerHeader } from "@/components/header";
import { Care, Crumbs, Faq, Related, Reviews, Story, type CareItem } from "@/components/pdp";
import { BuyBox, Gallery, Pairs, type GalleryImage } from "@/components/pdp-client";
import { getStore } from "@/lib/catalogue";
import { inr } from "@/lib/format";
import { featured, pairsFor, stockCap } from "@/lib/store";
import { SITE_URL } from "@/lib/whatsapp";

export const revalidate = 60;

async function find(sku: string) {
  const store = await getStore();
  return { store, p: store.bySku.get(decodeURIComponent(sku).toUpperCase()) };
}

export async function generateMetadata({ params }: { params: Promise<{ sku: string }> }): Promise<Metadata> {
  const { p } = await find((await params).sku);
  if (!p) return { title: "Not found" };
  return {
    title: p.name,
    description: `${p.name}, ${inr(p.price)} at Minimo Atelier. Wrapped and ready in 48 h, free pickup inside Honer Vivantis.`,
    alternates: { canonical: `/product/${p.sku.toLowerCase()}` },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ sku: string }> }) {
  const { store, p } = await find((await params).sku);
  if (!p) notFound();
  const gift = p.sections.includes("return-gifts");
  const sec = p.sections[0] ?? "kids";
  const secName = { "return-gifts": "Return gifts", kids: "Kids' favourites", "for-her": "For her", "for-him": "For him" }[sec];
  const secHref = sec === "for-her" || sec === "for-him" ? `/${sec}` : `/shop/${sec}`;
  const related = featured(store.live.filter((x) => x.category_slug === p.category_slug && x.sku !== p.sku)).slice(0, 4);
  const more = related.length < 4 ? featured(store.live.filter((x) => x.sections.includes(sec) && x.sku !== p.sku && !related.includes(x))).slice(0, 4 - related.length) : [];
  const cap = stockCap(p);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.sku,
    category: p.category,
    image: p.photoUrl ?? undefined,
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: "INR",
      availability: `https://schema.org/${p.availability === "out_of_stock" ? "OutOfStock" : p.availability === "few_left" ? "LimitedAvailability" : "InStock"}`,
      url: `${SITE_URL}/product/${p.sku.toLowerCase()}`,
    },
  };

  const images: GalleryImage[] = p.photoUrl ? [{ src: p.photoUrl, alt: p.name, sample: false }] : p.art ? [{ src: p.art, alt: p.name, sample: true }] : [];
  const pairs = pairsFor(store, { skip: new Set([p.sku]), bags: gift ? 1 : 0, extras: gift ? 2 : 3, tab: p.tab });
  const care: CareItem[] = [
    { icon: "drop", label: "Wipe with a dry cloth" },
    { icon: "sun", label: "Keep out of direct sun" },
    { icon: "hand", label: gift ? "Small parts, 3 years and up" : "Handle with care" },
    { icon: "box", label: "Store in its pouch" },
  ];

  return (
    <>
      <InnerHeader />
      <main id="main" className="dz d-pdp">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Crumbs back={secHref} trail={[["Home", "/"], [secName, secHref], [p.name, null]]} />
        <section className="d-pdp-hero">
          <div className="d-pdp-grid d-pdp-grid--fold">
            <Gallery images={images} wishId={p.sku} name={p.name} />
            <BuyBox
              eyebrow={p.category}
              badge={p.is_new ? "New arrival" : null}
              title={p.name}
              item={{ kind: "product", ref: p.sku, name: p.name, price: p.price, image: p.photoUrl ?? p.art, parts: [{ sku: p.sku, qty: 1 }], max: cap, bulk: gift, nameTag: false, mrp: p.mrp }}
            />
          </div>
        </section>
        <Story
          name={p.name}
          lede={gift ? "A piece kids actually use, picked for party bags." : "Picked for gifting, from the shelf in our store."}
          body={`${p.name}, sold ${gift ? "per piece. Mix it into a ready-made pack or your own return-gift bag" : "as a single gift. We can wrap it and add a card"}.`}
          specs={[
            ["box", "Sold as", "Per piece"],
            ["grid", "In stock", p.availability === "out_of_stock" ? "Sold out" : p.availability === "few_left" ? `Only ${p.left} left` : "Yes"],
            ["clock", "Ready in", "48 hours"],
            ["tag", "Category", p.category + (p.material ? ` · ${p.material}` : "")],
          ]}
        />
        <Care id="h-care" eyebrow="Care" title="Keeps looking new" items={care} />
        <Faq />
        <Reviews name={p.name} />
        {pairs.length > 0 && images[0] && <Pairs self={{ name: p.name, price: p.price, img: images[0].src }} pairs={pairs} />}
        {related.length + more.length > 0 && (
          <Related title="You may also like">
            {[...related, ...more].map((x) => (
              <ProductCard key={x.sku} p={x} unit={gift ? "per piece" : null} />
            ))}
          </Related>
        )}
      </main>
    </>
  );
}
