import { z } from "zod";

/** One product exactly as the admin's GET /api/v1/storefront/catalogue sends it. */
export const ApiProduct = z.object({
  sku: z.string(),
  name: z.string(),
  category: z.string(),
  category_slug: z.string(),
  /** When the photo last changed, or null when there is none. Served at /img/{sku}. */
  photo_version: z.number().nullable(),
  /** More photos for the product page, in order, as "{id}-{version}". Served at /img/{sku}/{id}. */
  more_photos: z.array(z.string()).optional(),
  price: z.number(),
  mrp: z.number().nullable(),
  percent_off: z.number(),
  you_save: z.number(),
  availability: z.enum(["in_stock", "few_left", "out_of_stock"]),
  left: z.number().nullable(),
  material: z.string().nullable(),
  is_new: z.boolean(),
  /** Published customer reviews: average stars and how many; null (or missing, from an older admin) when none. */
  rating: z.object({ average: z.number(), count: z.number() }).nullable().optional(),
});
export type ApiProduct = z.infer<typeof ApiProduct>;

export const ApiCategory = z.object({ name: z.string(), slug: z.string(), icon: z.string(), count: z.number() });
export type ApiCategory = z.infer<typeof ApiCategory>;

export const ApiCatalogue = z.object({ categories: z.array(ApiCategory), products: z.array(ApiProduct) });
export type ApiCatalogue = z.infer<typeof ApiCatalogue>;

export type Section = "return-gifts" | "kids" | "for-her" | "for-him" | "jewellery";
export type BuilderRole = "packaging" | "tag" | "filler" | "hero" | "none";

/** A product as the storefront uses it: the admin's fields plus where it sits on the site. */
export type Product = ApiProduct & {
  /** Absolute URL of the shop's own photo (its product shot when it has one), or null. */
  photoUrl: string | null;
  /** The product page's further photos, after the main one. */
  morePhotoUrls: string[];
  /** Illustration used until the shop photographs it (clearly a placeholder). */
  art: string | null;
  /** Transparent cut-out for the gift studio, when one fits the category. */
  cutout: string | null;
  sections: Section[];
  role: BuilderRole;
  /** Studio tray tab. */
  tab: string | null;
  /** For-her sub filter. */
  herGroup: string | null;
};

export type PackItem = { sku: string; qty: number };
export type Pack = {
  id: string;
  name: string;
  theme: string;
  blurb: string;
  art: string;
  /** Packaging SKU, the wish tag SKU, and the fillers. */
  bag: string;
  tag: string | null;
  items: PackItem[];
};
export type ResolvedPack = Pack & {
  /** Sum of today's admin prices for everything inside, per guest. */
  price: number;
  parts: { product: Product; qty: number }[];
  bagProduct: Product;
  tagProduct: Product | null;
  /** How many identical packs today's stock can make. */
  canMake: number;
};
