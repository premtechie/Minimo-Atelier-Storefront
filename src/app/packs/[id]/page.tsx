import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackCard } from "@/components/cards";
import { InnerHeader } from "@/components/header";
import { Care, Crumbs, Faq, PackReviews, Related, Story } from "@/components/pdp";
import { BuyBox, Gallery, Pairs, type GalleryImage } from "@/components/pdp-client";
import { getStore } from "@/lib/catalogue";
import { productHref } from "@/lib/format";
import { PACKS } from "@/lib/merch";
import { pairsFor } from "@/lib/store";
import type { Product } from "@/lib/types";
import Link from "next/link";
import { abs, breadcrumbs, ldJson, pageMeta, STORE_ID } from "@/lib/seo";
import { inr } from "@/lib/format";

export const revalidate = 60;

export function generateStaticParams() {
  return PACKS.map((k) => ({ id: k.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const k = PACKS.find((x) => x.id === id);
  if (!k) return { title: "Not found" };
  const title = `${k.name} return gift pack for kids' birthday parties`;
  const description = `${k.theme === "Any theme" ? "Return gift pack" : `${k.theme} return gift pack`}: ${k.blurb} Gift-wrapped with a name tag, ready in 48 hours in Hyderabad. Bulk price from 15 guests.`;
  return { title: { absolute: `${title} · Minimo Atelier` }, description, ...pageMeta(`/packs/${k.id}`, title, description) };
}

export default async function PackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getStore();
  const k = store.packs.find((x) => x.id === id);
  if (!k) {
    if (PACKS.some((x) => x.id === id)) {
      return (
        <>
          <InnerHeader />
          <main id="main" className="m-wrap m-empty">
            <h1 className="m-h2">This pack can&apos;t be made right now</h1>
            <p>Something inside it is sold out. Build your own from what is in stock today.</p>
            <div className="m-empty-btns">
              <Link className="m-btn m-btn--primary" href="/build">
                Build your own
              </Link>
              <Link className="m-btn m-btn--ghost" href="/shop/return-gifts">
                See other packs
              </Link>
            </div>
          </main>
        </>
      );
    }
    notFound();
  }
  const parts = [
    ...k.parts.map((x) => ({ sku: x.product.sku, qty: x.qty })),
    { sku: k.bagProduct.sku, qty: 1 },
    ...(k.tagProduct ? [{ sku: k.tagProduct.sku, qty: 1 }] : []),
  ];
  const detail = [...k.parts.map((x) => x.product.name), k.bagProduct.name, k.tagProduct?.name].filter(Boolean).join(", ");
  const pic = (p: Product) => (p.photoUrl ? { src: p.photoUrl, sample: false } : p.art ? { src: p.art, sample: true } : null);
  const images: GalleryImage[] = [{ src: k.art, alt: k.name, sample: true }];
  for (const x of [...k.parts.map((y) => y.product), k.bagProduct]) {
    const im = pic(x);
    if (im && !images.some((i) => i.src === im.src) && images.length < 5) images.push({ ...im, alt: x.name });
  }
  const pairs = pairsFor(store, { skip: new Set([k.bagProduct.sku, ...k.parts.map((x) => x.product.sku)]), bags: 2, extras: 1 });
  const url = abs(`/packs/${k.id}`);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${url}#product`,
      name: `${k.name} return gift pack`,
      description: `${k.blurb} Packed in ${k.bagProduct.name} with a name tag. ${inr(k.price)} a bag.`,
      category: "Return gifts",
      brand: { "@type": "Brand", name: "Minimo Atelier" },
      image: images.map((i) => abs(i.src)),
      offers: {
        "@type": "Offer",
        url,
        price: k.price,
        priceCurrency: "INR",
        itemCondition: "https://schema.org/NewCondition",
        availability: `https://schema.org/${k.canMake > 0 ? "InStock" : "OutOfStock"}`,
        seller: { "@id": STORE_ID },
      },
    },
    breadcrumbs([["Home", "/"], ["Return gifts", "/shop/return-gifts"], [k.name, null]]),
  ];
  return (
    <>
      <InnerHeader />
      <main id="main" className="dz d-pdp">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(jsonLd) }} />
        <Crumbs back="/shop/return-gifts" trail={[["Home", "/"], ["Return gifts", "/shop/return-gifts"], [k.name, null]]} />
        <section className="d-pdp-hero">
          <div className="d-pdp-grid d-pdp-grid--fold">
            <Gallery images={images} wishId={`pack:${k.id}`} name={k.name} />
            <BuyBox
              eyebrow="Return gifts"
              badge="Ready-made · wrapped & tagged"
              title={k.name}
              item={{ kind: "pack", ref: k.id, name: k.name, price: k.price, image: k.art, parts, detail, max: k.canMake, bulk: true, nameTag: true }}
            />
          </div>
        </section>
        <Story
          name={k.name}
          lede="A finished return-gift bag, packed by hand and tied with your child's name."
          body={k.blurb}
          specs={[
            ["user", "Bulk price", "From 15 guests"],
            ["clock", "Ready in", "48 hours"],
            ["bag", "Bag", k.bagProduct.name],
            ["tag", "Tag", "Paper wish tag"],
          ]}
        />
        <Care
          id="h-in"
          eyebrow="Inside each bag"
          title="What's in the pack"
          items={[
            ...k.parts.map(({ product: p, qty }) => ({ label: `${qty > 1 ? `${qty} × ` : ""}${p.name}`, img: (p.photoUrl ?? p.art) || undefined, icon: "gift" as const, href: productHref(p.sku) })),
            { label: k.bagProduct.name, icon: "bag" as const },
            { label: "Wish tag with your child's name", icon: "tag" as const },
          ]}
        />
        <Faq />
        <PackReviews name={k.name} items={k.parts.map(({ product: p }) => ({ sku: p.sku, name: p.name, rating: p.rating }))} />
        {pairs.length > 0 && <Pairs self={{ name: k.name, price: k.price, img: k.art }} pairs={pairs} />}
        <Related title="You may also like">
          {store.packs
            .filter((x) => x.id !== k.id)
            .slice(0, 4)
            .map((x) => (
              <PackCard key={x.id} k={x} />
            ))}
        </Related>
      </main>
    </>
  );
}
