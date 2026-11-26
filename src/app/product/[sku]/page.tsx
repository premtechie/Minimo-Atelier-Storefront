import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/cards";
import { InnerHeader } from "@/components/header";
import { Suspense } from "react";
import { Care, Crumbs, Faq, Related, Story, type CareItem } from "@/components/pdp";
import { BuyBox, Gallery, Pairs, type GalleryImage } from "@/components/pdp-client";
import { RatingLink, ReviewsSection } from "@/components/reviews";
import { fetchReviews } from "@/lib/reviews-server";
import { getStore } from "@/lib/catalogue";
import { inr } from "@/lib/format";
import { featured, pairsFor, stockCap } from "@/lib/store";
import { SITE_URL } from "@/lib/whatsapp";
import { abs, breadcrumbs, ldJson, pageMeta, STORE_ID } from "@/lib/seo";
import type { Product } from "@/lib/types";
import { compareFor, compareSnippet } from "@/lib/compare";

export const revalidate = 60;

async function find(sku: string) {
  const store = await getStore();
  return { store, p: store.bySku.get(decodeURIComponent(sku).toUpperCase()) };
}

export async function generateMetadata({ params }: { params: Promise<{ sku: string }> }): Promise<Metadata> {
  const { p } = await find((await params).sku);
  if (!p) return { title: "Not found" };
  const title = seoTitle(p);
  const description = describe(p);
  const meta = pageMeta(`/product/${p.sku.toLowerCase()}`, title, description);
  // Shared on WhatsApp, the product's own photo shows instead of the shop card.
  const photo = p.photoUrl ? [{ url: p.photoUrl, alt: p.name }] : null;
  return {
    title: { absolute: `${title} · Minimo Atelier` },
    description,
    ...meta,
    ...(photo ? { openGraph: { ...meta.openGraph, images: photo }, twitter: { ...meta.twitter, images: [photo[0].url] } } : {}),
  };
}

const isGift = (p: Product) => p.sections.includes("return-gifts");
/** "Unicorn Pencil Pack, return gift for kids, ₹49": what people search for, with the price. */
function seoTitle(p: Product) {
  const kind = isGift(p) ? "Return gift for kids" : p.sections.includes("for-her") ? "Gift for her" : p.sections.includes("for-him") ? "Gift for him" : "Kids' gift";
  return `${p.name}, ${inr(p.price)}: ${kind} in Hyderabad`;
}
function describe(p: Product) {
  // Only a product that really is the lowest price we found says so in search results.
  const vs = compareSnippet(compareFor(p.price, p.price_check));
  return (vs ? `${vs} ` : "") + base(p);
}
function base(p: Product) {
  return isGift(p)
    ? `Buy ${p.name} as a birthday return gift for ${inr(p.price)} a piece. ${p.category}${p.material ? `, ${p.material}` : ""}. Mix it into a return-gift bag, gift-wrapped and name-tagged in 48 hours. Pickup or delivery in Hyderabad, courier across India.`
    : `Buy ${p.name} for ${inr(p.price)} at Minimo Atelier, Hyderabad. ${p.category}${p.material ? `, ${p.material}` : ""}. Gift-wrapped with a card, ready in 48 hours. Pickup or delivery in Hyderabad, courier across India.`;
}

export default async function ProductPage({ params }: { params: Promise<{ sku: string }> }) {
  const { store, p } = await find((await params).sku);
  if (!p) notFound();
  const gift = p.sections.includes("return-gifts");
  // Jewellery's breadcrumb leads to the Jewellery page rather than For her.
  const sec = p.sections.includes("jewellery") ? "jewellery" : p.sections[0] ?? "kids";
  const secName = { "return-gifts": "Return gifts", kids: "Kids' favourites", "for-her": "For her", "for-him": "For him", jewellery: "Jewellery" }[sec];
  const secHref = sec === "for-her" || sec === "for-him" || sec === "jewellery" ? `/${sec}` : `/shop/${sec}`;
  const related = featured(store.live.filter((x) => x.category_slug === p.category_slug && x.sku !== p.sku)).slice(0, 4);
  const more = related.length < 4 ? featured(store.live.filter((x) => x.sections.includes(sec) && x.sku !== p.sku && !related.includes(x))).slice(0, 4 - related.length) : [];
  const cap = stockCap(p);
  const url = `${SITE_URL}/product/${p.sku.toLowerCase()}`;
  const reviews = await fetchReviews(p.sku);
  const summary = reviews?.summary;
  const rated = summary && summary.count > 0 ? summary : null;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${url}#product`,
      name: p.name,
      sku: p.sku,
      category: p.category,
      description: describe(p),
      ...(p.material ? { material: p.material } : {}),
      brand: { "@type": "Brand", name: "Minimo Atelier" },
      image: p.photoUrl ? [abs(p.photoUrl)] : p.art ? [abs(p.art)] : undefined,
      offers: {
        "@type": "Offer",
        url,
        price: p.price,
        priceCurrency: "INR",
        itemCondition: "https://schema.org/NewCondition",
        availability: `https://schema.org/${p.availability === "out_of_stock" ? "OutOfStock" : p.availability === "few_left" ? "LimitedAvailability" : "InStock"}`,
        seller: { "@id": STORE_ID },
      },
      // Only real, approved reviews from verified buyers.
      ...(rated && reviews
        ? {
            aggregateRating: { "@type": "AggregateRating", ratingValue: rated.average, reviewCount: rated.count, bestRating: 5, worstRating: 1 },
            review: reviews.reviews.slice(0, 5).map((r) => ({
              "@type": "Review",
              reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
              author: { "@type": "Person", name: r.name },
              datePublished: r.date.slice(0, 10),
              ...(r.title ? { name: r.title } : {}),
              reviewBody: r.body,
            })),
          }
        : {}),
    },
    breadcrumbs([["Home", "/"], [secName, secHref], [p.name, null]]),
  ];

  const main: GalleryImage[] = p.photoUrl ? [{ src: p.photoUrl, alt: p.name, sample: false, fallback: p.art }] : p.art ? [{ src: p.art, alt: p.name, sample: true }] : [];
  // The shop's further photos follow the main one; a broken one just hides.
  const images: GalleryImage[] = [...main, ...p.morePhotoUrls.map((src, i) => ({ src, alt: `${p.name}, photo ${i + 2}`, sample: false }))];
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(jsonLd) }} />
        <Crumbs back={secHref} trail={[["Home", "/"], [secName, secHref], [p.name, null]]} />
        <section className="d-pdp-hero">
          <div className="d-pdp-grid d-pdp-grid--fold">
            <Gallery images={images} wishId={p.sku} name={p.name} />
            <BuyBox
              eyebrow={p.category}
              badge={p.is_new ? "New arrival" : null}
              title={p.name}
              compare={compareFor(p.price, p.price_check)}
              rating={rated ? <RatingLink average={rated.average} count={rated.count} /> : null}
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
        <Suspense>
          <ReviewsSection sku={p.sku} name={p.name} initial={reviews} />
        </Suspense>
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
