import type { MetadataRoute } from "next";
import { getStore } from "@/lib/catalogue";
import { packHref, productHref } from "@/lib/format";
import { SITE_URL } from "@/lib/whatsapp";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const store = await getStore();
  const pages = ["/", "/shop/return-gifts", "/shop/kids", "/shop/all", "/build", "/for-her", "/for-him", "/visit-our-store", "/bulk-orders"];
  return [
    ...pages.map((p) => ({ url: SITE_URL + p, changeFrequency: "daily" as const, priority: p === "/" ? 1 : 0.8 })),
    ...store.packs.map((k) => ({ url: SITE_URL + packHref(k.id), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...store.live.map((p) => ({ url: SITE_URL + productHref(p.sku), changeFrequency: "weekly" as const, priority: 0.5 })),
  ];
}
