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
  /** A shop photo stands in for drawn art: pieces sit in front of the bag. */
  photo?: boolean;
  /** Overhead photos: the pack is shown from above as it fills, and closes for real. */
  top?: TopView;
};

/**
 * An overhead view of a pack. Three photos from one camera position: open,
 * half closed and closed. Gifts sit inside the opening (measured in pixels of
 * the 1368 x 772 photos).
 */
export type TopView = {
  /** Photo files: /art/studio/top/<set>-<0|1|2>.webp */
  set: string;
  /** How it closes: tissue then handles (bag), tissue then lid (box), or drawn up and tied (potli). */
  kind: "bag" | "box" | "potli" | "zip" | "flap";
  /** The opening, as a CSS clip-path in % of the photo. */
  clip: string;
  /** Where gifts may sit, in photo pixels. */
  area: { x: number; y: number; w: number; h: number };
  /** Size of one gift, in photo pixels. */
  size: number;
  /** Shadow cast by the walls of the pack onto the gifts. */
  shade: string;
  /** How long closing it takes, in ms. */
  ms: number;
  /** Where the paper tag lies in the closed photo (% of the photo), for the name. */
  tag?: { x: number; y: number; r: number; w: number };
};
export const TOP_W = 1368;
export const TOP_H = 772;
const OVERHEAD_SHADE = "radial-gradient(60% 75% at 50% 50%, transparent 55%, rgba(60,35,15,.25) 100%)";
/** A paper bag seen from the front and above: gifts stand in it and show above the front panel. */
const upright = (set: string, tag: TopView["tag"], clip = "polygon(31% 0, 67.4% 0, 67.6% 50.3%, 30.8% 50.3%)"): TopView => ({
  set, kind: "bag", clip, area: { x: 470, y: 250, w: 420, h: 100 }, size: 165, ms: 1850,
  shade: "linear-gradient(to bottom, transparent 38%, rgba(40,20,10,.2) 50.3%)", tag,
});
/** A tote seen from straight above, its opening at the middle of the photo. */
const tote = (set: string, clip: string, area: TopView["area"], tag: TopView["tag"]): TopView => ({
  set, kind: "bag", clip, area, size: 165, ms: 1850, shade: OVERHEAD_SHADE, tag,
});
/**
 * A zip or flap bag seen from the front and above, opened wide: gifts sit in the
 * opening and show above its front edge. `rim` is the front edge in % of height.
 */
const front = (set: string, kind: "zip" | "flap", x: [number, number], top: number, rim: number, tag: TopView["tag"], size = 130): TopView => ({
  set, kind, clip: `polygon(${x[0]}% ${top}%, ${x[1]}% ${top}%, ${x[1]}% ${rim}%, ${x[0]}% ${rim}%)`,
  area: { x: Math.round((x[0] + 2) / 100 * TOP_W), y: Math.round((rim - 13) / 100 * TOP_H), w: Math.round((x[1] - x[0] - 4) / 100 * TOP_W), h: Math.round(0.1 * TOP_H) },
  size, ms: 1950, shade: `linear-gradient(to bottom, transparent ${rim - 10}%, rgba(40,20,10,.2) ${rim}%)`, tag,
});
export const TOP = {
  bag: {
    set: "bag", kind: "bag", clip: "polygon(23.8% 25.9%, 75.1% 25.9%, 74.7% 73.6%, 23.4% 73.6%)", area: { x: 420, y: 262, w: 525, h: 268 }, size: 175, ms: 1850,
    shade: OVERHEAD_SHADE, tag: { x: 52.4, y: 60.5, r: 13, w: 7.4 },
  },
  box: {
    set: "box", kind: "box", clip: "polygon(22% 17.5%, 77.9% 17.5%, 77.9% 81.6%, 22% 81.6%)", area: { x: 345, y: 170, w: 680, h: 430 }, size: 185, ms: 2350,
    shade: "linear-gradient(to bottom, rgba(40,20,10,.16), transparent 10%), linear-gradient(to right, rgba(40,20,10,.1), transparent 7%, transparent 93%, rgba(40,20,10,.1))",
  },
  potli: {
    set: "potli", kind: "potli", clip: "ellipse(14.6% 23.5% at 49.1% 46%)", area: { x: 545, y: 238, w: 255, h: 228 }, size: 135, ms: 2200,
    shade: "radial-gradient(15% 24% at 49.1% 46%, transparent 62%, rgba(110,40,50,.3) 100%)",
  },
  heart: tote("heart", "polygon(29.2% 29.1%, 70.9% 29.1%, 70.9% 69.3%, 29.2% 69.3%)", { x: 440, y: 262, w: 490, h: 240 }, { x: 52, y: 57, r: -22, w: 4.6 }),
  brown: tote("brown", "polygon(29.2% 28.5%, 71.2% 28.5%, 71.2% 68.8%, 29.2% 68.8%)", { x: 440, y: 258, w: 494, h: 240 }, { x: 52, y: 57.5, r: -12, w: 5 }),
  jute: tote("jute", "polygon(28.3% 28.2%, 71.8% 28.2%, 71.8% 63.4%, 28.3% 63.4%)", { x: 430, y: 245, w: 510, h: 220 }, { x: 51, y: 56.5, r: -5, w: 5 }),
  jutebow: tote("jutebow", "polygon(29.1% 30.4%, 70.4% 30.4%, 70.4% 58.2%, 29.1% 58.2%)", { x: 440, y: 262, w: 490, h: 170 }, { x: 51, y: 43.5, r: -8, w: 5.2 }),
  thanks: upright("thanks", { x: 49.5, y: 27.5, r: -3, w: 5.6 }),
  paisley: upright("paisley", { x: 49.5, y: 27.5, r: -3, w: 5.6 }),
  jungle: upright("jungle", { x: 49.5, y: 25.5, r: -4, w: 5.2 }),
  bday: upright("bday", { x: 49.9, y: 27, r: -3, w: 5.8 }, "polygon(31% 0, 67.6% 0, 67.8% 48.6%, 30.8% 48.6%)"),
  jround: front("jround", "flap", [35, 65.5], 14, 61, { x: 22.2, y: 76.8, r: 25, w: 7 }),
  sling: front("sling", "flap", [34.5, 64.5], 18, 57, { x: 21, y: 77.5, r: 25, w: 7 }),
} satisfies Record<string, TopView>;
export const topFrame = (t: Pick<TopView, "set">, i: 0 | 1 | 2) => `/art/studio/top/${t.set}-${i}.webp`;
export const CONTAINERS: Container[] = [
  { key: "paper", art: "c_paper", name: "Kraft paper bag", match: /^Brown Bags/i, rim: 0.282, aspect: [368, 599], w: 0.7, hf: 0.62, ox: [0.14, 0.86], sink: 0.3, ih: 0.52, top: TOP.bag },
  { key: "heart", art: "c_heart", name: "Heart translucent bag", match: /^Heart Shape/i, rim: 0.305, aspect: [360, 596], w: 0.7, hf: 0.62, ox: [0.14, 0.86], sink: 0.3, ih: 0.52, see: 0.62, top: TOP.heart },
  { key: "brown", art: "c_brown", name: "Themed bag", match: /Theme Bag$/i, rim: 0.12, aspect: [442, 496], w: 0.7, hf: 0.5, ox: [0.12, 0.88], sink: 0.3, ih: 0.52, top: TOP.brown },
  { key: "jute", art: "c_jute", name: "Jute window bag", match: /Jute Bag/i, rim: 0.249, aspect: [448, 590], w: 0.72, hf: 0.6, ox: [0.12, 0.88], sink: 0.3, ih: 0.52, top: TOP.jute },
  { key: "box", art: "c_box", name: "Gift box", match: /2 IN 1 Empty Box/i, hamper: true, rim: 0.56, aspect: [580, 433], w: 0.86, hf: 0.62, ox: [0.1, 0.9], sink: 0.11, ih: 0.78, top: TOP.box },
  { key: "jewel", art: "c_box", name: "Jewellery box", match: /^Jewellery Box/i, hamper: true, rim: 0.56, aspect: [580, 433], w: 0.86, hf: 0.62, ox: [0.1, 0.9], sink: 0.11, ih: 0.78, top: TOP.box },
];

/**
 * Every bag the admin sells can hold a return gift. Bags without drawn art in
 * CONTAINERS show in the studio with their shop photo (or sample picture).
 */
export const BAG_SLUGS = [
  ...PACKAGING.filter((s) => s !== "jewellery-box"),
  "korean-bags", "korean-jute-bags", "korean-sling-bag", "bow-sling-bag", "embriodory-sling-bag", "round-sling-bag",
  "rectange-sling-bag", "sunflower-bag", "bubble-sling-bag", "jelly-bags", "glitter-bag", "k-pop", "backpack-bags", "lunch-bags",
];
/** How pieces sit in front of a photographed bag. */
export const PHOTO_BAG: Omit<Container, "key" | "art" | "name" | "match"> = {
  photo: true, rim: 0.82, aspect: [1, 1], w: 0.78, hf: 0.66, ox: [0.12, 0.88], sink: 0.1, ih: 0.42,
};

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
