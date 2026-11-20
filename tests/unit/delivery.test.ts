import { describe, expect, it } from "vitest";
import { daysUntil, etaText, isPin, shortDate } from "@/lib/delivery";

describe("delivery helpers", () => {
  it("accepts only real 6-digit pincodes", () => {
    expect(isPin("500019")).toBe(true);
    expect(isPin("050001")).toBe(false);
    expect(isPin("50001")).toBe(false);
  });
  it("writes a promised date the short way, in India time", () => {
    expect(shortDate("2026-11-25")).toBe("Wed, 25 Nov");
    expect(shortDate(null)).toBeNull();
    expect(shortDate("soon")).toBeNull();
  });
});

describe("delivery time", () => {
  const now = new Date("2026-11-20T12:00:00+05:30");
  it("counts days to the courier's date in IST", () => {
    expect(daysUntil("2026-11-25", now)).toBe(5);
    expect(daysUntil("2026-11-20", now)).toBe(1);
    expect(daysUntil(null, now)).toBeNull();
    expect(etaText({ speed: "standard", by: "2026-11-23" }, "110001", now)).toBe("3 days");
    expect(etaText({ speed: "express", by: "2026-11-21" }, "110001", now)).toBe("1 day");
  });
  it("falls back to a usual range without a date", () => {
    expect(etaText({ speed: "standard", by: null }, "500081", now)).toBe("2–3 days");
    expect(etaText({ speed: "standard", by: null }, "110001", now)).toBe("4–7 days");
    expect(etaText({ speed: "express", by: null }, "110001", now)).toBe("3–5 days");
  });
});
