import { describe, expect, it } from "vitest";
import { isPin, shortDate } from "@/lib/delivery";

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
