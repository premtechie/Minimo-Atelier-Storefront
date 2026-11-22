import { describe, expect, it } from "vitest";
import { buildName, decodeShare, encodeShare, MAX_ITEMS, topStyles, type SavedBuild } from "@/lib/studio";
import { TOP, TOP_H, TOP_W } from "@/lib/merch";

const b = (o: Partial<SavedBuild> = {}): SavedBuild => ({
  k: "a", m: "rg", box: "paper", cap: 149, items: ["PEN", "ERAS"], name: "", who: "Aarav", fav: true, t: 0, ...o,
});
const known = (s: string) => s !== "GONE";

describe("studio share links", () => {
  it("round-trips a build", () => {
    const [back] = decodeShare(encodeShare([b()]), known, ["paper"]);
    expect(back).toMatchObject({ m: "rg", box: "paper", cap: 149, items: ["PEN", "ERAS"], who: "Aarav", sharedFav: true });
  });

  it("drops items that are no longer sold and boxes that don't exist", () => {
    expect(decodeShare(encodeShare([b({ items: ["GONE", "PEN"] })]), known, ["paper"])[0].items).toEqual(["PEN"]);
    expect(decodeShare(encodeShare([b({ box: "crate" })]), known, ["paper"])).toEqual([]);
  });

  it("caps items per bag and ignores junk", () => {
    const many = Array.from({ length: 20 }, (_, i) => "S" + i);
    expect(decodeShare(encodeShare([b({ items: many })]), known, ["paper"])[0].items).toHaveLength(MAX_ITEMS.rg);
    expect(decodeShare("not-a-code!!", known, ["paper"])).toEqual([]);
  });

  it("names builds", () => {
    expect(buildName({ m: "hm", who: "" }, 0)).toBe("Hamper 1");
    expect(buildName({ m: "rg", who: "Mia" }, 2)).toBe("Bag 3 for Mia");
  });
});

describe("topStyles (overhead view)", () => {
  const pct = (v: unknown) => parseFloat(String(v));
  for (const set of ["bag", "box", "potli"] as const) {
    it(`keeps every gift centre inside the ${set} opening`, () => {
      const t = TOP[set];
      for (let n = 1; n <= 9; n++) {
        const st = topStyles(n, t);
        expect(st).toHaveLength(n);
        for (const s of st) {
          const cx = (pct(s.left) / 100) * TOP_W;
          const cy = TOP_H - ((pct(s.bottom) + pct(s.height) / 2) / 100) * TOP_H;
          expect(cx).toBeGreaterThanOrEqual(t.area.x - 1);
          expect(cx).toBeLessThanOrEqual(t.area.x + t.area.w + 1);
          expect(cy).toBeGreaterThanOrEqual(t.area.y - 1);
          expect(cy).toBeLessThanOrEqual(t.area.y + t.area.h + 1);
        }
      }
    });
  }
  it("shrinks gifts as the pack fills", () => {
    const one = pct(topStyles(1, TOP.box)[0].width);
    const nine = pct(topStyles(9, TOP.box)[0].width);
    expect(nine).toBeLessThan(one);
  });
});
