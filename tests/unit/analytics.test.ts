import { describe, expect, it } from "vitest";
import { isShopChat, landingSource, newRef, pageLabel, slug, withFooter } from "@/lib/analytics";

const HOST = "www.minimoatelier.in";

describe("landingSource", () => {
  it("prefers a campaign tag", () => {
    expect(landingSource("?utm_source=instagram&utm_medium=bio", "", HOST)).toBe("Instagram (bio)");
    expect(landingSource("?src=flyer", "https://www.google.com/", HOST)).toBe("Flyer");
  });
  it("reads ad click ids", () => {
    expect(landingSource("?gclid=abc", "", HOST)).toBe("Google Ads");
    expect(landingSource("?fbclid=abc", "", HOST)).toBe("Facebook / Instagram");
  });
  it("names common referrers", () => {
    expect(landingSource("", "https://www.google.co.in/", HOST)).toBe("Google");
    expect(landingSource("", "https://l.instagram.com/?u=x", HOST)).toBe("Instagram");
    expect(landingSource("", "https://m.facebook.com/", HOST)).toBe("Facebook");
    expect(landingSource("", "https://some-blog.example/post", HOST)).toBe("some-blog.example");
  });
  it("calls own-site and empty referrers Direct", () => {
    expect(landingSource("", "", HOST)).toBe("Direct");
    expect(landingSource("", "https://preview.minimoatelier.in/cart", "preview.minimoatelier.in")).toBe("Direct");
  });
});

describe("pageLabel", () => {
  it("names pages", () => {
    expect(pageLabel("/")).toBe("Home page");
    expect(pageLabel("/product/ARTS-002")).toBe("Product page (ARTS-002)");
    expect(pageLabel("/shop/return-gifts?budget=under-99")).toBe("Shop: return gifts");
    expect(pageLabel("/orders/MA-1234")).toBe("Order page");
    expect(pageLabel("/visit-our-store/")).toBe("Visit our store page");
  });
});

describe("WhatsApp links", () => {
  const ctx = { button: "Floating chat button", page: "Home page", source: "Instagram", ref: "MA-ABCDE" };

  it("tells shop chats from share links", () => {
    expect(isShopChat("https://wa.me/917396463639?text=hi")).toBe(true);
    expect(isShopChat("https://api.whatsapp.com/send?phone=917396463639")).toBe(true);
    expect(isShopChat("https://wa.me/?text=look")).toBe(false);
  });

  it("adds where the chat started under the message", () => {
    const out = withFooter("https://wa.me/917396463639?text=Hi%20Minimo%2C%20I%27d%20like%202%20%C3%97%20Bag%2B", ctx);
    expect(out).not.toContain("+");
    const text = new URL(out).searchParams.get("text")!;
    expect(text).toBe("Hi Minimo, I'd like 2 × Bag+\n\n—\nSent from minimoatelier.in\nPage: Home page\nButton: Floating chat button\nCame via: Instagram\nRef: MA-ABCDE");
  });

  it("greets when there was no message and never doubles the footer", () => {
    const once = withFooter("https://wa.me/917396463639", ctx);
    const twice = withFooter(once, { ...ctx, page: "Cart" });
    const text = new URL(twice).searchParams.get("text")!;
    expect(text.startsWith("Hi Minimo Atelier!\n\n—")).toBe(true);
    expect(text.match(/Sent from/g)).toHaveLength(1);
    expect(text).toContain("Page: Cart");
  });

  it("makes readable refs and slugs", () => {
    expect(newRef(() => 0)).toBe("MA-AAAAA");
    expect(newRef()).toMatch(/^MA-[A-HJ-NP-Z2-9]{5}$/);
    expect(slug("Product: ask on WhatsApp")).toBe("product_ask_on_whatsapp");
  });
});
