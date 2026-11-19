/** wa.me link to the shop, with an optional pre-filled message. */
export function waLink(text?: string) {
  const num = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${num}${q}`;
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.minimoatelier.in").replace(/\/+$/, "");
