import { describe, expect, it } from "vitest";
import { ageDays, checkedLabel, compareFor, compareSnippet } from "@/lib/compare";
import type { PriceCheck } from "@/lib/types";

const NOW = new Date("2026-11-25T12:00:00Z");
const A = "https://www.amazon.in/x/dp/B0CXYZ1234";
const F = "https://www.flipkart.com/x/p/itm1a2b3c4d5e6f";
const check = (sites: PriceCheck["sites"], checked_on = "2026-11-24"): PriceCheck => ({ checked_on, sites });

describe("compareFor", () => {
  it("says lowest only when every site was searched and every same item costs at least ours", () => {
    const c = compareFor(349, check([{ site: "amazon", found: true, price: 449, url: A }, { site: "flipkart", found: true, price: 399, url: F }, { site: "meesho", found: false }]), NOW);
    expect(c.state).toBe("lowest");
    if (c.state !== "lowest") return;
    // The saving is against the cheapest listing, never the dearest.
    expect(c.saving).toBe(50);
    expect(c.vs.name).toBe("Flipkart");
    expect(c.listings.map((l) => [l.name, l.more])).toEqual([["Flipkart", 50], ["Amazon", 100]]);
    expect(c.missing).toEqual(["meesho"]);
  });

  it("counts an equal price as lowest, with nothing saved", () => {
    const c = compareFor(399, check([{ site: "amazon", found: true, price: 399, url: A }, { site: "flipkart", found: false }, { site: "meesho", found: false }]), NOW);
    expect(c).toMatchObject({ state: "lowest", saving: 0 });
    expect(compareSnippet(c)).toBeNull();
  });

  it("makes no price claim when any site is cheaper", () => {
    expect(compareFor(349, check([{ site: "amazon", found: true, price: 449, url: A }, { site: "flipkart", found: true, price: 299, url: F }, { site: "meesho", found: false }]), NOW)).toEqual({ state: "why", price: 349 });
  });

  it("says only at Minimo when all three were searched and none had it", () => {
    expect(compareFor(229, check([{ site: "amazon", found: false }, { site: "flipkart", found: false }, { site: "meesho", found: false }]), NOW)).toEqual({ state: "only", checkedOn: "2026-11-24", price: 229 });
  });

  it("claims nothing when a site wasn't searched, the check is stale or in the future, or there is none", () => {
    expect(compareFor(229, check([{ site: "amazon", found: false }, { site: "flipkart", found: false }]), NOW).state).toBe("why");
    expect(compareFor(229, check([{ site: "amazon", found: true, price: 449, url: A }, { site: "flipkart", found: false }]), NOW).state).toBe("why");
    const all = [{ site: "amazon", found: false }, { site: "flipkart", found: false }, { site: "meesho", found: false }] as PriceCheck["sites"];
    expect(compareFor(229, check(all, "2026-10-26"), NOW).state).toBe("only");
    expect(compareFor(229, check(all, "2026-10-25"), NOW).state).toBe("why");
    expect(compareFor(229, check(all, "2026-11-26"), NOW).state).toBe("why");
    expect(compareFor(229, null, NOW).state).toBe("why");
    expect(compareFor(229, undefined, NOW).state).toBe("why");
  });
});

describe("compare copy", () => {
  it("dates and words the search snippet", () => {
    const c = compareFor(349, check([{ site: "amazon", found: true, price: 1449, url: A }, { site: "flipkart", found: false }, { site: "meesho", found: false }]), NOW);
    expect(compareSnippet(c)).toBe("₹349 here, ₹1,449 for the same item on Amazon (checked Nov 2026).");
    expect(compareSnippet({ state: "why", price: 1 })).toBeNull();
    expect(checkedLabel("2026-11-05")).toBe("5 Nov 2026");
    expect(ageDays("2026-11-24", NOW)).toBe(1);
  });
});
