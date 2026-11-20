/*
 * Microsoft Clarity (session recordings, heatmaps, funnels). It loads only when
 * NEXT_PUBLIC_CLARITY_ID is set, so previews and local runs record nothing
 * unless that setting is given to them too.
 */

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

const ID = (process.env.NEXT_PUBLIC_CLARITY_ID || "").trim();
/** The project ID from clarity.microsoft.com (Settings → Overview), or "" when off. */
export const CLARITY_ID = /^[a-z0-9]{6,20}$/i.test(ID) ? ID : "";

/** Names a step in Clarity (e.g. "order_placed") so it can be filtered and used in funnels. */
export function track(event: string, tags?: Record<string, string>) {
  try {
    if (typeof window === "undefined" || !window.clarity) return;
    window.clarity("event", event);
    for (const [k, v] of Object.entries(tags ?? {})) window.clarity("set", k, v);
  } catch {
    // Analytics never gets in the way of shopping.
  }
}
