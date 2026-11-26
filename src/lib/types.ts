import { z } from "zod";

export const CompareSite = z.enum(["amazon", "flipkart", "meesho"]);
export type CompareSite = z.infer<typeof CompareSite>;
export const PriceCheck = z.object({
  checked_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sites: z.array(
    z.union([
      z.object({ site: CompareSite, found: z.literal(true), price: z.number().positive(), url: z.string().url() }),
      z.object({ site: CompareSite, found: z.literal(false) }),
    ]),
  ),
});
export type PriceCheck = z.infer<typeof PriceCheck>;

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
  /**
   * "Compare prices": the same item on Amazon, Flipkart and Meesho, checked by
   * hand in the admin. Missing (older admin) or null means not checked.
   */
  price_check: PriceCheck.nullable().optional(),
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
