import { describe, expect, it } from "vitest";
import { buildCatalogue, stockCap, toProduct } from "@/lib/store";
import { PACKS } from "@/lib/merch";
import type { ApiProduct } from "@/lib/types";

const p = (sku: string, o: Partial<ApiProduct> = {}): ApiProduct => ({
  sku, name: sku, category: "Pencils", category_slug: "pencils", photo_version: null, price: 10, mrp: null,
  percent_off: 0, you_save: 0, availability: "in_stock", left: null, material: null, is_new: false, ...o,
});

describe("store", () => {
  it("caps orders by what is left", () => {
    expect(stockCap({ availability: "out_of_stock", left: null })).toBe(0);
    expect(stockCap({ availability: "few_left", left: 3 })).toBe(3);
    expect(stockCap({ availability: "in_stock", left: null })).toBe(Infinity);
  });

  it("hides sold-out products and packs that can't be made", () => {
    const k = PACKS[0];
    const skus = [k.bag, ...(k.tag ? [k.tag] : []), ...k.items.map((i) => i.sku)];
    const full = buildCatalogue({ categories: [], products: skus.map((s) => p(s)) });
    expect(full.packs.map((x) => x.id)).toContain(k.id);
    const pr = full.packs.find((x) => x.id === k.id)!;
    expect(pr.price).toBe(skus.reduce((s, sku) => s + 10 * (k.items.find((i) => i.sku === sku)?.qty ?? 1), 0));

    const gone = buildCatalogue({ categories: [], products: skus.map((s, i) => p(s, i === 0 ? { availability: "out_of_stock" } : {})) });
    expect(gone.packs.map((x) => x.id)).not.toContain(k.id);
    expect(gone.live).toHaveLength(skus.length - 1);
  });

  it("works offline with no catalogue", () => {
    expect(buildCatalogue(null)).toMatchObject({ ok: false, products: [], packs: [] });
  });
});

describe("further photos", () => {
  it("turns the admin's more_photos into this site's /img/{sku}/{id} addresses and drops anything malformed", () => {
    const base = { sku: "HAIR-001", name: "Pin", category: "Hair Clip", category_slug: "hair-clip", photo_version: 1700000000, price: 80, mrp: null, percent_off: 0, you_save: 0, availability: "in_stock" as const, left: null, material: null, is_new: false };
    const p = toProduct({ ...base, more_photos: ["0F8E2D3A-1B2C-4D5E-8F90-123456789ABC-1700000001", "../etc/passwd-1", "nope"] });
    expect(p.photoUrl).toBe("/img/hair-001?v=1700000000");
    expect(p.morePhotoUrls).toEqual(["/img/hair-001/0f8e2d3a-1b2c-4d5e-8f90-123456789abc?v=1700000001"]);
    expect(toProduct({ ...base, more_photos: [] }).morePhotoUrls).toEqual([]);
  });
});

describe("jewellery", () => {
  it("puts the admin's jewellery categories on the Jewellery page and keeps them under For her", () => {
    for (const slug of ["earrings", "necklace", "chain", "bracelet", "finger-rings", "charms"]) {
      const s = toProduct(p("J", { category_slug: slug })).sections;
      expect(s).toContain("jewellery");
      expect(s).toContain("for-her");
    }
    for (const slug of ["hair-claw", "hair-ties", "korean-bags", "mirror", "jewellery-box", "key-chains"]) {
      expect(toProduct(p("X", { category_slug: slug })).sections).not.toContain("jewellery");
    }
  });
});
