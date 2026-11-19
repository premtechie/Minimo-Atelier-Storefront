import { describe, expect, it } from "vitest";
import { buildName, decodeShare, encodeShare, MAX_ITEMS, type SavedBuild } from "@/lib/studio";

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
