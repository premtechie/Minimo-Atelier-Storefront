import { describe, expect, it } from "vitest";
import { addLine, cartTotals, couponSaving, mrpGross, needBySku, shortages, unitPrice, type CartLine, type PriceLookup } from "@/lib/cart";

const shop: Record<string, { price: number; cap: number; name: string }> = {
  BAG: { price: 20, cap: 100, name: "Bag" },
  PEN: { price: 30, cap: 10, name: "Pen" },
};
const lookup: PriceLookup = (s) => shop[s];
const pack = (qty: number, note?: string): CartLine => ({
  key: "k" + qty, kind: "pack", name: "Pack", price: 50, qty, image: null, ref: "p1", note,
  parts: [{ sku: "BAG", qty: 1 }, { sku: "PEN", qty: 1 }],
});

describe("cart", () => {
  it("prices a line from today's catalogue, not the stored price", () => {
    expect(unitPrice(pack(1), lookup)).toBe(50);
    expect(unitPrice({ parts: [{ sku: "GONE", qty: 1 }] }, lookup)).toBeNull();
  });

  it("applies bulk discount at 15 and 25 guests only", () => {
    expect(cartTotals([pack(14)]).discount).toBe(0);
    expect(cartTotals([pack(15)]).total).toBeCloseTo(50 * 15 * 0.95);
    expect(cartTotals([pack(25)]).total).toBeCloseTo(50 * 25 * 0.9);
  });

  it("gives no bulk discount to gifts outside return gifts", () => {
    expect(cartTotals([{ ...pack(20), kind: "product", bulk: false }]).discount).toBe(0);
  });

  it("merges identical lines and keeps different name tags apart", () => {
    const a = addLine(addLine([], pack(2)), pack(3));
    expect(a).toHaveLength(1);
    expect(a[0].qty).toBe(5);
    expect(addLine(a, pack(1, "Aarav"))).toHaveLength(2);
  });

  it("adds up what the whole cart needs and flags shortages", () => {
    const lines = [pack(8), { ...pack(4), key: "x", note: "Mia" }];
    expect(needBySku(lines).get("PEN")).toBe(12);
    expect(shortages(lines, lookup)).toEqual([{ sku: "PEN", name: "Pen", need: 12, have: 10 }]);
  });
});

describe("coupon saving", () => {
  const c = { code: "2RFR3Y7M", percent: 10, cap: 250, min_bill: 500 };
  it("follows the admin's rule: percent to the rupee, capped, nothing below the minimum", () => {
    expect(couponSaving(null, 1000)).toBe(0);
    expect(couponSaving(c, 499)).toBe(0);
    expect(couponSaving(c, 500)).toBe(50);
    expect(couponSaving(c, 1235)).toBe(124);
    expect(couponSaving(c, 3289)).toBe(250);
  });
});

describe("mrpGross", () => {
  const cat: Record<string, { price: number; cap: number; name: string; mrp?: number | null }> = {
    A: { price: 339, cap: 9, name: "Bag", mrp: 475 },
    B: { price: 10, cap: 99, name: "Tag", mrp: null },
    C: { price: 50, cap: 9, name: "Odd", mrp: 40 },
  };
  const lookup = (sku: string) => cat[sku];
  const line = (sku: string, qty: number, price = cat[sku].price) => ({ key: sku, kind: "product" as const, name: sku, price, qty, image: null, parts: [{ sku, qty: 1 }] });

  it("prices pieces with a real MRP at MRP, others at today's price", () => {
    expect(mrpGross([line("A", 2), line("B", 3)], lookup)).toBe(475 * 2 + 10 * 3);
  });
  it("ignores an MRP below the price", () => {
    expect(mrpGross([line("C", 1)], lookup)).toBe(50);
  });
  it("adds up a pack's parts at MRP", () => {
    const pack = { key: "p", kind: "pack" as const, name: "Pack", price: 349, qty: 4, image: null, parts: [{ sku: "A", qty: 1 }, { sku: "B", qty: 1 }] };
    expect(mrpGross([pack], lookup)).toBe((475 + 10) * 4);
  });
});
