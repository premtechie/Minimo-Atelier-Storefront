import { describe, expect, it } from "vitest";
import { steps, type Order } from "@/lib/orders";

const shipped: Order = {
  number: "MA-0007",
  placed_at: "2026-11-22T18:02:00.000Z",
  status: "shipped",
  confirmed_at: null,
  paid_at: "2026-11-22T18:15:00.000Z",
  packed_at: "2026-11-22T18:16:00.000Z",
  shipped_at: "2026-11-22T18:16:30.000Z",
  cancelled_at: null,
  delivery: "india",
  address: { line: "Gudiyattam", pin: "632602" },
  phone: "9000000001",
  courier: "DTDC",
  tracking_number: "11999762",
  lines: [],
  gift_note: null,
  items_total: 795,
  shipping: 59,
  total: 854,
  refunded: 0,
  can_cancel: false,
};
const last = (o: Order) => steps(o).at(-1)!;

describe("shipped step", () => {
  it("names the courier and leaves the tracking ID to its own row", () => {
    expect(last(shipped).done).toBe("Handed to DTDC.");
  });

  it("adds Velocity's live status when there is one", () => {
    expect(last({ ...shipped, tracking: { url: "https://x.test/t", status: "Out for delivery", events: [] } }).done).toBe("Handed to DTDC. Out for delivery.");
  });

  it("still reads well without a courier name", () => {
    expect(last({ ...shipped, courier: null }).done).toBe("Handed to the courier.");
  });
});
