import { SHOP } from "./merch";
import { SITE_URL } from "./whatsapp";

/*
 * Search and sharing facts in one place: the words people search with, the
 * shop as Google should know it, and small helpers for structured data
 * (schema.org JSON-LD) that every page reuses.
 */

/** The picture shown when a page is shared on WhatsApp, Instagram or Google. */
export const OG_IMAGE = { url: "/og.jpg", width: 1200, height: 630, alt: "Minimo Atelier return gifts and hampers, Hyderabad" };

/** Neighbourhoods the store serves in person (store pickup and local delivery). */
export const AREAS = ["Gopanpally", "Nallagandla", "Tellapur", "Gachibowli", "Kokapet", "Narsingi", "Lingampally", "Kondapur"];

export const abs = (path: string) => (/^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`);

/** The shop's own id in structured data, so pages can point at it. */
export const STORE_ID = `${SITE_URL}/#store`;
const ORG_ID = `${SITE_URL}/#org`;
const SITE_ID = `${SITE_URL}/#website`;

/** Shop, brand and site, sent once from the layout on every page. */
export function siteGraph() {
  const sameAs = [SHOP.instagram].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: SHOP.name,
        url: SITE_URL,
        logo: abs("/brand/logo.png"),
        sameAs,
      },
      {
        "@type": ["Store", "LocalBusiness"],
        "@id": STORE_ID,
        name: SHOP.name,
        description: "Return gifts for kids' birthday parties, return-gift bags, hampers and small gifts, packed by hand in our store in Hyderabad.",
        url: SITE_URL,
        image: abs(OG_IMAGE.url),
        logo: abs("/brand/logo.png"),
        parentOrganization: { "@id": ORG_ID },
        priceRange: "₹",
        currenciesAccepted: "INR",
        paymentAccepted: "UPI",
        address: {
          "@type": "PostalAddress",
          ...(SHOP.street ? { streetAddress: SHOP.street } : {}),
          addressLocality: SHOP.locality,
          addressRegion: "Telangana",
          ...(SHOP.pin ? { postalCode: SHOP.pin } : {}),
          addressCountry: "IN",
        },
        ...(SHOP.phone ? { telephone: SHOP.phone } : {}),
        ...(SHOP.geo ? { geo: { "@type": "GeoCoordinates", latitude: SHOP.geo[0], longitude: SHOP.geo[1] } } : {}),
        ...(SHOP.openingHours.length ? { openingHours: SHOP.openingHours } : {}),
        hasMap: SHOP.mapsUrl,
        areaServed: [{ "@type": "City", name: "Hyderabad" }, ...AREAS.map((name) => ({ "@type": "Place", name: `${name}, Hyderabad` })), { "@type": "Country", name: "India" }],
        sameAs,
      },
      {
        "@type": "WebSite",
        "@id": SITE_ID,
        name: SHOP.name,
        url: SITE_URL,
        inLanguage: "en-IN",
        publisher: { "@id": ORG_ID },
      },
    ],
  };
}

/** Home › … › page, for Google's breadcrumb trail. A null href is the page itself. */
export function breadcrumbs(trail: [string, string | null][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map(([name, href], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      ...(href ? { item: abs(href) } : {}),
    })),
  };
}

/** Questions and answers shown on the page, for search engines and AI answers. */
export function faqPage(faq: [string, string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

/** A list of product or pack pages, in the order shown. */
export function itemList(name: string, urls: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: urls.slice(0, 30).map((u, i) => ({ "@type": "ListItem", position: i + 1, url: abs(u) })),
  };
}

/** Safe JSON for a <script type="application/ld+json">: no "<" can close the tag. */
export const ldJson = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

/** Open Graph and canonical for a page, so shares and search point at one address. */
export function pageMeta(path: string, title: string, description: string) {
  return {
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: SHOP.name, type: "website" as const, locale: "en_IN", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image" as const, title, description, images: [OG_IMAGE.url] },
  };
}

/** Questions parents ask before ordering return gifts, shown on the home page. */
export const HOME_FAQ: [string, string][] = [
  [
    "How much should I spend on return gifts per child?",
    "Most parties we pack for spend ₹99 to ₹199 a guest. Under ₹99 gets one or two useful pieces in a bag; ₹150 to ₹199 gets a full themed bag; ₹300 and up is hamper territory for close family and teachers.",
  ],
  ["How many return gifts should I order?", "Count the children who have said yes, then add about 10% for siblings and last-minute guests. Extra bags keep well for the next party."],
  ["How soon can I get return gifts in Hyderabad?", "Orders are ready in 48 hours as standard. Ask on WhatsApp for a 24-hour rush when the pieces are in stock."],
  [
    "Do you deliver return gifts in Hyderabad?",
    "Pickup at our store inside Honer Vivantis, Gopanpally is free, and so is delivery to flats in Honer Vivantis. We also deliver across Hyderabad, including Nallagandla, Tellapur, Gachibowli, Kondapur, Kokapet and Narsingi, and courier across India.",
  ],
  ["Can you add the child's name on each bag?", "Yes. Every return-gift bag can carry a name tag with the birthday child's name or a thank-you note."],
  ["Is there a discount on bulk return gifts?", "Yes. 15 or more of the same bag take 5% off, and 25 or more take 10% off. Schools and class parties can ask for a quote on the bulk orders page."],
  ["Can I see the return gifts before ordering?", "Visit our store inside Honer Vivantis to see the packs and bags, or ask on WhatsApp for photos of anything on the site."],
  ["How do I pay?", "Nothing is charged on the website. We confirm your order and stock first, then send a UPI payment link on WhatsApp."],
];

/** Search copy for each return-gift price band (the ?budget= pages). */
export const BUDGET_COPY: Record<string, { title: string; description: string }> = {
  "under-99": {
    title: "Return gifts under ₹99 in Hyderabad",
    description: "Birthday return gifts under ₹99 a child: stationery, erasers, hair clips, keychains and small toys kids actually use. Gift-wrapped, name-tagged, ready in 48 hours in Hyderabad.",
  },
  "99-149": {
    title: "Return gifts under ₹150 in Hyderabad",
    description: "Return gifts from ₹99 to ₹149 for kids' birthday parties: pouches, pencil sets, bottles and toys, packed in themed bags with name tags. Ready in 48 hours, Hyderabad.",
  },
  "150-199": {
    title: "Return gifts under ₹200 in Hyderabad",
    description: "Return gifts from ₹150 to ₹199: full themed return-gift bags and bigger single pieces for kids' birthdays. Name-tagged and ready in 48 hours in Hyderabad.",
  },
  "200-299": {
    title: "Return gifts under ₹300 in Hyderabad",
    description: "Premium return gifts from ₹200 to ₹299 for birthdays and first birthdays: lunch boxes, bottles, backpacks and filled bags. Gift-wrapped in Hyderabad, ready in 48 hours.",
  },
  "300-plus": {
    title: "Premium return gifts and hampers above ₹300",
    description: "Premium return gifts and gift hampers from ₹300 for close family, teachers and first birthdays. Built from real stock, wrapped by hand in Hyderabad.",
  },
};
