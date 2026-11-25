"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isShopChat, isWhatsApp, keepRecording, landingSource, newRef, pageLabel, SITE_ENV, slug, track, withFooter, type WaContext } from "@/lib/analytics";

const KEY = "minimo-visit-v1";
type Visit = { source: string; landing: string; ref: string };

/** This visit's source and WhatsApp ref, worked out once on the first page and kept for the tab. */
export function visit(): Visit {
  let v: Visit | null = null;
  try {
    v = JSON.parse(sessionStorage.getItem(KEY) || "null") as Visit | null;
  } catch {
    v = null;
  }
  if (v?.ref && v.source) return v;
  v = {
    source: landingSource(location.search, document.referrer, location.hostname),
    landing: pageLabel(location.pathname),
    ref: newRef(),
  };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* private mode: a new ref per page is fine */
  }
  return v;
}

/** What to call a WhatsApp button: its data-wa-source, else its label or text. */
function buttonName(a: HTMLAnchorElement | null, fallback = "WhatsApp link") {
  const named = a?.dataset.waSource || a?.getAttribute("aria-label") || a?.textContent || "";
  return named.replace(/\s+/g, " ").trim().slice(0, 50) || fallback;
}

/** Records a WhatsApp tap and returns the link with "where from" lines added (for shop chats). */
export function waTap(href: string, button: string): string {
  const v = visit();
  const ctx: WaContext = { button, page: pageLabel(location.pathname), source: v.source, ref: v.ref };
  if (!isShopChat(href)) {
    track("whatsapp_share", { wa_share_from: ctx.page });
    return href;
  }
  track("whatsapp_click", { wa_ref: v.ref, wa_button: button, wa_page: ctx.page });
  track(`whatsapp_${slug(button)}`);
  keepRecording("whatsapp_click");
  return withFooter(href, ctx);
}

/** Opens a chat with the shop from code (forms), with the same tracking as a link. */
export function openWhatsApp(href: string, button: string) {
  window.open(waTap(href, button), "_blank", "noopener");
}

/**
 * Site-wide tracking, mounted once in the layout:
 * - tags each session with how it arrived (Google, Instagram, Direct…) and its WhatsApp ref;
 * - names the page type on every navigation (product_view, cart_view…);
 * - catches every tap on a WhatsApp link, anywhere, and adds where it came from to the message.
 */
export function SiteTracking() {
  const path = usePathname();

  useEffect(() => {
    const v = visit();
    // Clarity's script may still be loading: its stub queues these until it is ready.
    track("visit", { traffic_source: v.source, landing_page: v.landing, wa_ref: v.ref, site_env: SITE_ENV || "unknown" });

    const onTap = (e: MouseEvent) => {
      if (e.type === "click" && e.button !== 0) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || !isWhatsApp(a.href)) return;
      // Set before the browser follows the link, so the new tab opens with the message.
      a.href = waTap(a.href, buttonName(a));
    };
    document.addEventListener("click", onTap, true);
    document.addEventListener("auxclick", onTap, true);
    return () => {
      document.removeEventListener("click", onTap, true);
      document.removeEventListener("auxclick", onTap, true);
    };
  }, []);

  useEffect(() => {
    const [, a = "", b = ""] = path.split("/");
    const views: Record<string, string> = {
      "": "home_view",
      product: "product_view",
      packs: "pack_view",
      shop: "category_view",
      cart: "cart_view",
      build: "studio_view",
      wishlist: "wishlist_view",
      orders: b ? "order_view" : "orders_view",
      account: "account_view",
      "bulk-orders": "bulk_orders_view",
      "visit-our-store": "store_visit_view",
      "for-her": "for_her_view",
      "for-him": "for_him_view",
      jewellery: "jewellery_view",
      "return-gift-ideas": "ideas_view",
    };
    const name = views[a];
    if (name) track(name, a === "product" || a === "packs" || a === "shop" ? { [`viewed_${a}`]: decodeURIComponent(b) } : undefined);
    if (a === "search") {
      const q = new URLSearchParams(location.search).get("q")?.trim();
      if (q) track("search", { search_term: q.slice(0, 40) });
    }
  }, [path]);

  return null;
}
