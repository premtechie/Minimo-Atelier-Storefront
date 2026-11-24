/*
 * Microsoft Clarity (session recordings, heatmaps, funnels). It loads only when
 * NEXT_PUBLIC_CLARITY_ID is set, so local runs record nothing unless that
 * setting is given to them too. Previews tag every session site_env=preview so
 * test visits can be filtered out of the live numbers.
 */

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

const ID = (process.env.NEXT_PUBLIC_CLARITY_ID || "").trim();
/** The project ID from clarity.microsoft.com (Settings → Overview), or "" when off. */
export const CLARITY_ID = /^[a-z0-9]{6,20}$/i.test(ID) ? ID : "";

/** "production", "preview" or "development", from Vercel; "" when unknown. */
export const SITE_ENV = (process.env.NEXT_PUBLIC_VERCEL_ENV || "").trim();

/** Clarity tag values are short strings; keep them tidy. */
const clip = (v: string) => v.replace(/\s+/g, " ").trim().slice(0, 80);

/**
 * Clarity's own queue stub, so calls made before its script has loaded (the
 * first page's effects run before afterInteractive scripts) are kept, not lost.
 * The loader in components/clarity.tsx reuses it.
 */
function clarity(): ((...args: unknown[]) => void) | null {
  if (typeof window === "undefined" || !CLARITY_ID) return null;
  if (!window.clarity) {
    const q: unknown[][] = [];
    const stub = (...args: unknown[]) => void q.push(args);
    (stub as unknown as { q: unknown[][] }).q = q;
    window.clarity = stub;
  }
  return window.clarity;
}

/** Names a step in Clarity (e.g. "order_placed") so it can be filtered and used in funnels. */
export function track(event: string, tags?: Record<string, string>) {
  try {
    const c = clarity();
    if (!c) return;
    c("event", event);
    for (const [k, v] of Object.entries(tags ?? {})) if (v) c("set", k, clip(v));
  } catch {
    // Analytics never gets in the way of shopping.
  }
}

/** Keeps this session's recording even on a busy day (Clarity samples otherwise). */
export function keepRecording(reason: string) {
  try {
    clarity()?.("upgrade", reason);
  } catch {
    /* never in the way */
  }
}

/* ------------------------------------------------------------------------ */
/* Where a visitor came from                                                 */
/* ------------------------------------------------------------------------ */

const SOURCES: [RegExp, string][] = [
  [/(^|\.)google\./, "Google"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)duckduckgo\.com$/, "DuckDuckGo"],
  [/(^|\.)yahoo\./, "Yahoo"],
  [/(^|\.)(instagram\.com|l\.instagram\.com)$/, "Instagram"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, "Facebook"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "WhatsApp"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "YouTube"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, "X / Twitter"],
  [/(^|\.)linkedin\.com$/, "LinkedIn"],
  [/(^|\.)pinterest\./, "Pinterest"],
  [/(^|\.)(chatgpt\.com|openai\.com)$/, "ChatGPT"],
  [/(^|\.)(justdial\.com)$/, "Justdial"],
];

const pretty = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Names how a visit started: a campaign tag (?utm_source=, ?src=, ?ref=)
 * wins, then a Google/Meta ad click id, then the referring site, else
 * "Direct" (typed, bookmarked, or an app that hides where it came from).
 */
export function landingSource(search: string, referrer: string, ownHost: string): string {
  const p = new URLSearchParams(search);
  const tag = (p.get("utm_source") || p.get("src") || p.get("ref") || "").trim().slice(0, 40);
  if (tag) {
    const medium = (p.get("utm_medium") || "").trim().slice(0, 20);
    const named = SOURCES.find(([re]) => re.test(tag.toLowerCase() + ".com"))?.[1] ?? pretty(tag);
    return medium ? `${named} (${medium})` : named;
  }
  if (p.has("gclid") || p.has("gbraid") || p.has("wbraid")) return "Google Ads";
  if (p.has("fbclid")) return "Facebook / Instagram";
  let host = "";
  try {
    host = referrer ? new URL(referrer).hostname.toLowerCase() : "";
  } catch {
    host = "";
  }
  if (!host || host === ownHost.toLowerCase() || host.endsWith("minimoatelier.in")) return "Direct";
  return SOURCES.find(([re]) => re.test(host))?.[1] ?? host.replace(/^www\./, "");
}

/** A plain name for the page a visitor is on. */
export function pageLabel(path: string): string {
  const p = path.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const [, a = "", b = ""] = p.split("/");
  const named: Record<string, string> = {
    "": "Home page",
    account: "Account page",
    build: "Gift studio",
    "bulk-orders": "Bulk orders page",
    cart: "Cart",
    "for-her": "For Her page",
    "for-him": "For Him page",
    "return-gift-ideas": "Return gift ideas page",
    search: "Search page",
    "visit-our-store": "Visit our store page",
    wishlist: "Wishlist",
  };
  if (a === "product" && b) return `Product page (${decodeURIComponent(b)})`;
  if (a === "packs" && b) return `Pack page (${decodeURIComponent(b)})`;
  if (a === "shop") return b ? `Shop: ${decodeURIComponent(b).replace(/-/g, " ")}` : "Shop page";
  if (a === "orders") return b ? "Order page" : "My orders page";
  return named[a] ?? p;
}

/* ------------------------------------------------------------------------ */
/* WhatsApp: say where the message was started                               */
/* ------------------------------------------------------------------------ */

export type WaContext = {
  /** Which button, e.g. "Floating chat button". */
  button: string;
  /** pageLabel() of the page the button was on. */
  page: string;
  /** landingSource() of this visit. */
  source: string;
  /** Short code that is also tagged on the Clarity recording. */
  ref: string;
};

/** The lines added under the shopper's message, so the chat itself says where it came from. */
export function waFooter(c: WaContext): string {
  return [`—`, `Sent from minimoatelier.in`, `Page: ${c.page}`, `Button: ${c.button}`, `Came via: ${c.source}`, `Ref: ${c.ref}`].join("\n");
}

/** Is this link a chat with the shop (wa.me/<number> or api.whatsapp.com/send?phone=)? A share link to a friend has no number. */
export function isShopChat(href: string): boolean {
  try {
    const u = new URL(href);
    if (u.hostname === "wa.me") return /^\/\d{8,15}\/?$/.test(u.pathname);
    if (/(^|\.)whatsapp\.com$/.test(u.hostname)) return /^\d{8,15}$/.test(u.searchParams.get("phone") ?? "");
    return false;
  } catch {
    return false;
  }
}

export function isWhatsApp(href: string): boolean {
  try {
    const h = new URL(href).hostname;
    return h === "wa.me" || /(^|\.)whatsapp\.com$/.test(h);
  } catch {
    return false;
  }
}

/** The same WhatsApp link with the footer added under any message already in it (once). */
export function withFooter(href: string, c: WaContext): string {
  try {
    const u = new URL(href);
    const text = (u.searchParams.get("text") ?? "").replace(/\n*—\nSent from minimoatelier\.in[\s\S]*$/, "").trimEnd();
    u.searchParams.set("text", `${text || "Hi Minimo Atelier!"}\n\n${waFooter(c)}`);
    // URLSearchParams writes spaces as "+", which WhatsApp shows as "+"; use %20.
    return u.toString().replace(/\+/g, "%20");
  } catch {
    return href;
  }
}

/** A short, readable code (no 0/O/1/I) to match a chat with its recording. */
export function newRef(rand: () => number = Math.random): string {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += abc[Math.floor(rand() * abc.length)];
  return `MA-${s}`;
}

/** Event-name-safe slug: "Floating chat button" → "floating_chat_button". */
export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
