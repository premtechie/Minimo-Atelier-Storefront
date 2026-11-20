import type { BuilderRole, Pack, Section } from "./types";

/*
 * How the website groups the admin's categories. The admin keeps its own
 * categories (by slug, as GET /public/catalogue sends them); this file only
 * says where each one shows on the site. A category that isn't listed shows
 * under Kids' favourites. Edit these lists to move a category; nothing here
 * changes a price or stock count, which always come from the admin.
 *
 * When the admin gains per-product fields (builder_role, age and theme tags,
 * web_visible: see the plan, section 9.4), they replace these lists.
 */

const FILLERS = [
  "pens", "erasers", "sharpener", "scale", "pencil-pack", "push-pencils", "giraffe-pen", "disney-pencils",
  "stickers", "key-chains", "squishy-toys", "fidget-toys", "spinner", "puzzles", "spring-toy", "ruby",
  "magic-book", "diamond-book", "water-color-book", "crayons", "sketch-pen", "highlighters",
  "pouches", "zip-pouch", "coin-pouch", "hello-kitty-pouch", "small-wallet", "brown-clear-pouch", "metal-zip-pouch",
  "led-toys", "keladio-scope", "uno-cards", "golden-pokemon-card", "cards",
  "stationery-kit", "gift-set", "pencil-box-metal", "book-cover", "pen-box", "boards", "soap", "nail-cutter", "band",
];
const PACKAGING = ["packaging", "brown-themed-bag", "jute-window-bag", "potli-bag", "jewellery-box"];
const TAGS = ["tags"];
const HEROES = [
  "bottle", "glass-bottle", "glass-cup", "lunch-and-kitchen", "lunch-bags", "lcd-panels", "lamp", "photo-frame",
  "diaries-and-planners", "toy-cars", "train-toy", "bike-toy", "art-supplies", "kids-learning", "home-and-living",
  "mini-fan", "kids-suitcase", "backpack-bags", "magnetic-box", "pouch-case", "bubble-gun", "kiddy-bank", "money-bank",
  "binoculars", "goggles", "file-folders", "jelly-bags", "k-pop", "glitter-bag", "bubble-sling-bag", "gift-hampers", "battery",
];
const FOR_HER: Record<string, string> = {
  earrings: "Earrings",
  "hair-claw": "Hair Claws & Clips",
  "hair-pins": "Hair Claws & Clips",
  clutcher: "Hair Claws & Clips",
  combs: "Hair Claws & Clips",
  "hair-ties": "Hair Ties & Scrunchies",
  bracelet: "Bracelets & Rings",
  "finger-rings": "Bracelets & Rings",
  necklace: "Necklaces & Chains",
  chain: "Necklaces & Chains",
  charms: "Charms",
  kajal: "Beauty",
  mirror: "Beauty",
  "korean-bags": "Bags & Wallets",
  "korean-jute-bags": "Bags & Wallets",
  "korean-sling-bag": "Bags & Wallets",
  "bow-sling-bag": "Bags & Wallets",
  "embriodory-sling-bag": "Bags & Wallets",
  "round-sling-bag": "Bags & Wallets",
  "rectange-sling-bag": "Bags & Wallets",
  "sunflower-bag": "Bags & Wallets",
};
/** Girls' hair pieces also work as return-gift fillers (plan, section 4). */
const HER_FILLERS = ["hair-ties", "hair-claw", "hair-pins"];
const FOR_HIM = ["wallet-adult", "photo-frame", "gift-hampers", "home-and-living", "lamp"];
/** Bottles that read as grown-up gifts, matched by name. */
const FOR_HIM_NAMES = /adult|stanley|sports vacuum|classic steel|double vacuum|desk lamp|cycle clock|habit tracker/i;

/** Kids' pieces that sit in a grown-up category (a cartoon toothbrush in Home & living). */
const KIDDY_NAMES = /zootopia|kids|cartoon|unicorn|disney|barbie|doraemon/i;

export function sectionsFor(slug: string, name: string): Section[] {
  const out: Section[] = [];
  if (FILLERS.includes(slug) || PACKAGING.includes(slug) || HER_FILLERS.includes(slug)) out.push("return-gifts");
  if (slug in FOR_HER) out.push("for-her");
  if ((FOR_HIM.includes(slug) || FOR_HIM_NAMES.test(name)) && !KIDDY_NAMES.test(name)) out.push("for-him");
  if (HEROES.includes(slug) || out.length === 0) out.push("kids");
  return out;
}

export function roleFor(slug: string): BuilderRole {
  if (PACKAGING.includes(slug)) return "packaging";
  if (TAGS.includes(slug)) return "tag";
  if (FILLERS.includes(slug) || HER_FILLERS.includes(slug)) return "filler";
  if (HEROES.includes(slug) || slug in FOR_HER) return "hero";
  return "none";
}

export const herGroupFor = (slug: string) => FOR_HER[slug] ?? null;
export const HER_GROUPS = [...new Set(Object.values(FOR_HER))];

/** Studio tray tabs (return gifts), by category. */
const TABS: Record<string, string> = {
  pens: "Stationery", erasers: "Stationery", sharpener: "Stationery", scale: "Stationery", "pencil-pack": "Stationery",
  "push-pencils": "Stationery", "giraffe-pen": "Stationery", "disney-pencils": "Stationery", stickers: "Stationery",
  "magic-book": "Stationery", "diamond-book": "Stationery", "water-color-book": "Stationery", crayons: "Stationery",
  "sketch-pen": "Stationery", highlighters: "Stationery", "stationery-kit": "Stationery", "gift-set": "Stationery",
  "pencil-box-metal": "Stationery", "book-cover": "Stationery", "pen-box": "Stationery", boards: "Stationery",
  "squishy-toys": "Toys", "fidget-toys": "Toys", spinner: "Toys", puzzles: "Toys", "spring-toy": "Toys", ruby: "Toys",
  "led-toys": "Toys", "keladio-scope": "Toys", "uno-cards": "Toys", "golden-pokemon-card": "Toys", cards: "Toys", band: "Toys",
  "key-chains": "Accessories", pouches: "Accessories", "zip-pouch": "Accessories", "coin-pouch": "Accessories",
  "hello-kitty-pouch": "Accessories", "small-wallet": "Accessories", "brown-clear-pouch": "Accessories",
  "metal-zip-pouch": "Accessories", "hair-ties": "Accessories", "hair-claw": "Accessories", "hair-pins": "Accessories",
  soap: "Accessories", "nail-cutter": "Accessories",
};
export const tabFor = (slug: string) => TABS[slug] ?? null;
export const RG_TABS = ["Stationery", "Toys", "Accessories"];

/*
 * Placeholder pictures, used only until the shop photographs a product in the
 * admin (a real photo always wins). They are illustrations, so the card says
 * "Sample picture" over them. Files live in public/art.
 */
const CARD_ART: Record<string, string> = {
  bottle: "kids-glass-bottle", "glass-bottle": "kids-glass-bottle", "glass-cup": "kids-glass-bottle",
  "lcd-panels": "lcd-writing-pad", boards: "lcd-writing-pad", "lunch-and-kitchen": "lunch-box", "lunch-bags": "lunch-box",
  lamp: "night-lamp", "home-and-living": "night-lamp", "toy-cars": "toy-car", "train-toy": "toy-car", "bike-toy": "toy-car",
  "diaries-and-planners": "kids-diary", "mini-fan": "mini-fan", "backpack-bags": "kids-backpack", "kids-suitcase": "kids-backpack",
  "pencil-pack": "unicorn-pencil-pack", "disney-pencils": "unicorn-pencil-pack", "push-pencils": "space-push-pencils",
  sharpener: "cat-sharpener", erasers: "christmas-tin-eraser-set", stickers: "sticker-sheet", "sketch-pen": "sketch-pens-12",
  highlighters: "sketch-pens-12", "water-color-book": "water-colour-book", "magic-book": "magic-book", "diamond-book": "magic-book",
  crayons: "mini-crayons", pens: "erasable-pen", "giraffe-pen": "giraffe-pen", "key-chains": "keychain-mix", puzzles: "mini-puzzle",
  "squishy-toys": "squishy-toy", "fidget-toys": "fidget-spinner", spinner: "fidget-spinner", "keladio-scope": "kaleidoscope",
  "led-toys": "led-light-up-toy", "uno-cards": "uno-cards", "golden-pokemon-card": "golden-pokemon-card", cards: "golden-pokemon-card",
  "stationery-kit": "stationery-kit", "gift-set": "stationery-kit", "pencil-box-metal": "stationery-kit", "magnetic-box": "magnetic-box",
  "zip-pouch": "zip-pouch", pouches: "zip-pouch", "pouch-case": "zip-pouch", "metal-zip-pouch": "zip-pouch",
  "coin-pouch": "coin-pouch", "brown-clear-pouch": "coin-pouch", "small-wallet": "coin-pouch", "hello-kitty-pouch": "hello-kitty-pouch",
  packaging: "paper-bag", "brown-themed-bag": "brown-themed-bag", "jute-window-bag": "jute-window-bag", "korean-jute-bags": "jute-window-bag",
  "sunflower-bag": "jute-window-bag", "potli-bag": "potli-bag", earrings: "drop-earrings", "hair-claw": "butterfly-hair-claw",
  "hair-pins": "hair-pins-set", "hair-ties": "scrunchie-set-3", clutcher: "large-hair-claw", bracelet: "charm-bracelet",
  "finger-rings": "charm-bracelet", charms: "bag-charm", necklace: "layered-chain-necklace", chain: "layered-chain-necklace",
  mirror: "compact-mirror", kajal: "compact-mirror", combs: "compact-mirror", "korean-bags": "korean-mini-bag",
  "korean-sling-bag": "sling-bag", "bow-sling-bag": "sling-bag", "embriodory-sling-bag": "sling-bag", "round-sling-bag": "sling-bag",
  "rectange-sling-bag": "sling-bag", "bubble-sling-bag": "sling-bag", "jelly-bags": "korean-mini-bag", "glitter-bag": "korean-mini-bag",
  "k-pop": "korean-mini-bag",
};
export function cardArtFor(slug: string, name: string) {
  if (/heart/i.test(name) && slug === "packaging") return "/art/cards/heart-translucent-bag.webp";
  const key = CARD_ART[slug];
  return key ? `/art/cards/${key}.webp` : null;
}

/** Transparent cut-outs for the studio bag, with their aspect ratio. */
export const CUTOUT_META: Record<string, [number, number]> = {
  f2: [120, 399], f3: [193, 302], f4: [242, 239], f5: [284, 258], f6: [171, 287], f7: [281, 296], f8: [284, 299],
  f9: [270, 257], f11: [212, 222], t1: [235, 215], t2: [355, 336], t3: [149, 392], t4: [221, 391], t5: [345, 309],
  k1: [363, 355], p1: [389, 273], h1: [335, 339], h2: [334, 273], x1: [221, 393], x2: [301, 381], x3: [394, 344],
  x4: [317, 366], x5: [409, 318], x6: [295, 386], x7: [237, 404], e1: [297, 385], e4: [412, 311], e6: [360, 372],
  e7: [355, 334], e8: [331, 390], e12: [331, 357], m1: [336, 350], m8: [334, 311],
};
const CUTOUTS: Record<string, string> = {
  "pencil-pack": "f3", "disney-pencils": "f3", "push-pencils": "f6", sharpener: "f4", erasers: "f5", stickers: "f7",
  "sketch-pen": "f8", highlighters: "f8", "water-color-book": "f9", "magic-book": "f9", "diamond-book": "f9", crayons: "f11",
  pens: "f2", "giraffe-pen": "f2", "fidget-toys": "t1", spinner: "t1", "squishy-toys": "t2", "keladio-scope": "t3",
  "led-toys": "t4", puzzles: "t5", "key-chains": "k1", pouches: "p1", "zip-pouch": "p1", "coin-pouch": "p1",
  "hello-kitty-pouch": "p1", "small-wallet": "p1", "brown-clear-pouch": "p1", "metal-zip-pouch": "p1", "pouch-case": "p1",
  "hair-ties": "h1", "hair-claw": "h2", "hair-pins": "h1", bottle: "x1", "glass-bottle": "x1", "lcd-panels": "x2", boards: "x2",
  "lunch-and-kitchen": "x3", "lunch-bags": "x3", lamp: "x4", "home-and-living": "x4", "toy-cars": "x5", "train-toy": "x5",
  "bike-toy": "x5", "diaries-and-planners": "x6", "mini-fan": "x7", earrings: "e1", clutcher: "e4", necklace: "e8", chain: "e8",
  bracelet: "e7", charms: "e7", "finger-rings": "e7", mirror: "e12", kajal: "e12", "wallet-adult": "m1", "glass-cup": "m8",
};
export const cutoutFor = (slug: string) => CUTOUTS[slug] ?? null;

/** Bags and boxes in the studio: which art draws them, and how items sit in them. */
export type Container = {
  key: string;
  art: string;
  name: string;
  /** The admin product that is sold as this bag. */
  match: RegExp;
  hamper?: boolean;
  /** Where the front panel starts (fraction of the image height). */
  rim: number;
  aspect: [number, number];
  w: number;
  hf: number;
  ox: [number, number];
  sink: number;
  ih: number;
  see?: number;
};
export const CONTAINERS: Container[] = [
  { key: "paper", art: "c_paper", name: "Kraft paper bag", match: /^Brown Bags/i, rim: 0.282, aspect: [368, 599], w: 0.7, hf: 0.62, ox: [0.14, 0.86], sink: 0.3, ih: 0.52 },
  { key: "heart", art: "c_heart", name: "Heart translucent bag", match: /^Heart Shape/i, rim: 0.305, aspect: [360, 596], w: 0.7, hf: 0.62, ox: [0.14, 0.86], sink: 0.3, ih: 0.52, see: 0.62 },
  { key: "brown", art: "c_brown", name: "Themed bag", match: /Theme Bag$/i, rim: 0.12, aspect: [442, 496], w: 0.7, hf: 0.5, ox: [0.12, 0.88], sink: 0.3, ih: 0.52 },
  { key: "jute", art: "c_jute", name: "Jute window bag", match: /Jute Bag/i, rim: 0.249, aspect: [448, 590], w: 0.72, hf: 0.6, ox: [0.12, 0.88], sink: 0.3, ih: 0.52 },
  { key: "box", art: "c_box", name: "Gift box", match: /2 IN 1 Empty Box/i, hamper: true, rim: 0.56, aspect: [580, 433], w: 0.86, hf: 0.62, ox: [0.1, 0.9], sink: 0.11, ih: 0.78 },
  { key: "jewel", art: "c_box", name: "Jewellery box", match: /^Jewellery Box/i, hamper: true, rim: 0.56, aspect: [580, 433], w: 0.86, hf: 0.62, ox: [0.1, 0.9], sink: 0.11, ih: 0.78 },
];

/*
 * Ready-made packs: real SKUs from the admin, priced from today's admin prices
 * (never a typed-in price). The owner checks the contents before launch.
 */
export const PACKS: Pack[] = [
  {
    id: "unicorn-dreams", name: "Unicorn Dreams", theme: "Unicorn theme", art: "/art/cards/unicorn-dreams.webp",
    blurb: "Pencil pack, cat sharpener, hair ties and a sticker sheet in a heart translucent bag.",
    bag: "PACK-007", tag: "TAGS-001",
    items: [{ sku: "PENCI-003", qty: 1 }, { sku: "SHAR-003", qty: 1 }, { sku: "HAIRT-001", qty: 1 }, { sku: "STIC-001", qty: 1 }],
  },
  {
    id: "little-astronaut", name: "Little Astronaut", theme: "Space theme", art: "/art/cards/little-astronaut.webp",
    blurb: "Space pouch, push pencils, a ruler and a mini puzzle in a space-theme bag.",
    bag: "BROW-001", tag: "TAGS-001",
    items: [{ sku: "POUCH-001", qty: 1 }, { sku: "PUSH-001", qty: 1 }, { sku: "SCAL-001", qty: 1 }, { sku: "PUZZ-001", qty: 1 }],
  },
  {
    id: "fidget-fun", name: "Fidget Fun", theme: "Any theme", art: "/art/cards/fidget-fun.webp",
    blurb: "Fidget spinner, a squishy and a pop-it keychain in a kraft bag.",
    bag: "PACK-003", tag: "TAGS-001",
    items: [{ sku: "FIDG-002", qty: 1 }, { sku: "SQUI-001", qty: 1 }, { sku: "KEYC-009", qty: 1 }],
  },
  {
    id: "little-artist", name: "Little Artist", theme: "Any theme", art: "/art/cards/little-artist.webp",
    blurb: "Stationery set, sketch pens, stickers and a zip pouch.",
    bag: "PACK-004", tag: "TAGS-001",
    items: [{ sku: "STAT-002", qty: 1 }, { sku: "SKET-001", qty: 1 }, { sku: "STIC-001", qty: 1 }, { sku: "ZIPP-003", qty: 1 }],
  },
  {
    id: "christmas-cheer", name: "Christmas Cheer", theme: "Christmas", art: "/art/cards/christmas-cheer.webp",
    blurb: "Christmas tin eraser set, an erasable pen and a pop-it keychain.",
    bag: "PACK-006", tag: "TAGS-001",
    items: [{ sku: "ERAS-008", qty: 1 }, { sku: "PENS-001", qty: 1 }, { sku: "KEYC-009", qty: 1 }],
  },
  {
    id: "mermaid-magic", name: "Mermaid Magic", theme: "Mermaid theme", art: "/art/cards/brown-themed-bag.webp",
    blurb: "Magic book, lollipop erasers, a giraffe pen and hair clips in a mermaid bag.",
    bag: "BROW-002", tag: "TAGS-001",
    items: [{ sku: "MAGI-001", qty: 1 }, { sku: "ERAS-004", qty: 1 }, { sku: "GPEN-001", qty: 1 }, { sku: "CLAW-015", qty: 1 }],
  },
];

export const BUDGET_BANDS: { id: string; label: string; min: number; max: number; art: string }[] = [
  { id: "under-99", label: "Under ₹99", min: 0, max: 98.99, art: "/art/cards/tile-under-rs99.webp" },
  { id: "99-149", label: "₹99–149", min: 99, max: 149, art: "/art/cards/tile-rs99-149.webp" },
  { id: "150-199", label: "₹150–199", min: 150, max: 199, art: "/art/cards/tile-rs150-199.webp" },
  { id: "200-299", label: "₹200–299", min: 200, max: 299, art: "/art/cards/tile-rs200-299.webp" },
  { id: "300-plus", label: "₹300+", min: 300, max: Infinity, art: "/art/cards/tile-hampers.webp" },
];
export const HER_BANDS = [
  { id: "under-49", label: "Under ₹49", min: 0, max: 49 },
  { id: "50-149", label: "₹50–149", min: 50, max: 149 },
  { id: "150-299", label: "₹150–299", min: 150, max: 299 },
  { id: "300-plus", label: "₹300+", min: 300, max: Infinity },
];

/** Bulk discount for return gifts (plan 9.3; owner to confirm). */
export const BULK_RULES: [number, number][] = [
  [25, 0.1],
  [15, 0.05],
];
export function bulkRate(qty: number) {
  for (const [n, r] of BULK_RULES) if (qty >= n) return r;
  return 0;
}

/** Shop facts shown across the site. The owner fills in the blanks. */
export const SHOP = {
  name: "Minimo Atelier",
  where: "Inside Honer Vivantis, Hyderabad",
  hours: "Mon–Fri 4 pm – 9:30 pm · Sat–Sun 10 am – 9:30 pm",
  // For Google (search results, Maps and the shop card). Blanks are left out.
  street: "D Block, G1, Honer Vivantis, Tellapur Road, Gopanpally",
  locality: "Hyderabad",
  pin: "500019",
  phone: "+91 80157 71790",
  phones: ["+91 80157 71790", "+91 73964 63639"],
  geo: null as [number, number] | null, // [latitude, longitude] from Google Maps
  openingHours: ["Mo-Fr 16:00-21:30", "Sa-Su 10:00-21:30"],
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Honer+Vivantis+Hyderabad",
  instagram: "https://www.instagram.com/minimo.atelier_/",
};
