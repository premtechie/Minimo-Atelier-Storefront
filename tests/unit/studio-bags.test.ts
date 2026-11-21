import { describe, expect, it } from "vitest";
import { buildCatalogue } from "@/lib/store";
import { studioData } from "@/lib/studio-data";
import type { ApiProduct } from "@/lib/types";

const p = (sku: string, name: string, category: string, category_slug: string, price: number, o: Partial<ApiProduct> = {}): ApiProduct => ({
  sku, name, category, category_slug, photo_version: null, price, mrp: null,
  percent_off: 0, you_save: 0, availability: "in_stock", left: null, material: null, is_new: false, ...o,
});

describe("studio bags", () => {
  it("offers every bag in the shop, drawn ones first and the rest by price", () => {
    const store = buildCatalogue({
      categories: [],
      products: [
        p("PACK-003", "Brown Bags - 8 x 10", "Packaging", "packaging", 20),
        p("BROW-001", "Space Theme Bag", "Brown Themed Bag", "brown-themed-bag", 20),
        p("BROW-002", "Mermaid Theme Bag", "Brown Themed Bag", "brown-themed-bag", 20),
        p("KOR-001", "Korean Sling bag", "Korean Sling bag", "korean-sling-bag", 189, { photo_version: 5 }),
        p("KORE-001", "Korean Jute Bags", "Korean Jute Bags", "korean-jute-bags", 300),
        p("JUT-001", "Return Gift Jute Bag", "Jute window bag", "jute-window-bag", 70),
        p("POT-001", "Festive Potli bag", "Potli Bag", "potli-bag", 70),
        p("JELL-001", "Mini Jelly Bag", "Jelly Bags", "jelly-bags", 130, { availability: "out_of_stock" }),
        p("PENS-001", "Erasable Pen", "Pens", "pens", 30),
      ],
    });
    const rg = studioData(store).boxes.filter((b) => !b.hamper);
    expect(rg.map((b) => b.sku)).toEqual(["PACK-003", "BROW-001", "BROW-002", "JUT-001", "POT-001", "KOR-001", "KORE-001"]);
    expect(new Set(rg.map((b) => b.key)).size).toBe(rg.length);
    const sling = rg.find((b) => b.sku === "KOR-001")!;
    expect(sling.photo).toBe(true);
    expect(sling.img).toBe("/img/kor-001?v=5");
    expect(rg.find((b) => b.sku === "BROW-002")!.photo).toBeUndefined();
    expect(rg.find((b) => b.sku === "BROW-002")!.name).toBe("Mermaid Theme Bag");
    expect(rg.find((b) => b.sku === "KORE-001")!.photo).toBe(true);
  });
});
