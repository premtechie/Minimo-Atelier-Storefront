import type { Metadata } from "next";
import Link from "next/link";
import { InnerHeader } from "@/components/header";
import { packHref } from "@/lib/format";
import { abs, breadcrumbs, ldJson, pageMeta } from "@/lib/seo";

/*
 * A plain guide parents search for ("return gift ideas", "return gifts for
 * 1st birthday", "how many return gifts"), linking into the shop.
 */

const TITLE = "Return gift ideas for kids' birthday parties, by age and budget";
const DESCRIPTION =
  "Return gift ideas that kids actually use, sorted by budget (under ₹99 to ₹300+), by age (1st birthday to 12 years) and by party theme, with a planning checklist for birthdays in Hyderabad.";
const UPDATED = "2026-11-20";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} · Minimo Atelier` },
  description: DESCRIPTION,
  ...pageMeta("/return-gift-ideas", TITLE, DESCRIPTION),
};

const BUDGETS: { band: string; id: string; ideas: string }[] = [
  { band: "Under ₹99", id: "under-99", ideas: "Erasers, push pencils, sharpeners, hair clips, keychains and small fidget toys. One or two pieces in a small bag still looks generous." },
  { band: "₹99 to ₹149", id: "99-149", ideas: "Pencil pouches, sketch pens, mini puzzles, scrunchie sets and kaleidoscopes. Enough for a filled bag with a name tag." },
  { band: "₹150 to ₹199", id: "150-199", ideas: "A themed return-gift bag with three or four pieces, or one bigger piece such as an LCD writing pad or a diary." },
  { band: "₹200 to ₹299", id: "200-299", ideas: "Lunch boxes, water bottles, night lamps and kids' backpacks: gifts parents notice because they get used every day." },
  { band: "₹300 and up", id: "300-plus", ideas: "Hampers for close family, teachers and first birthdays, built from what is in stock and wrapped by hand." },
];

const AGES: { age: string; text: string }[] = [
  {
    age: "First birthday and toddlers (1 to 3 years)",
    text: "Guests at a first birthday are often toddlers with older siblings. Pick large pieces with no small parts, such as crayon sets, lunch boxes and squishy toys, and add a few bags for the older children.",
  },
  {
    age: "Pre-school and early school (4 to 7 years)",
    text: "Stationery wins here: push pencils, erasers, sketch pens and writing pads, plus small toys like fidget spinners and mini puzzles. Themed bags (unicorn, space, cars) make each child feel the gift was picked for them.",
  },
  {
    age: "Older kids (8 to 12 years)",
    text: "Older children prefer things that feel grown-up: card games like UNO, diaries, keychains, hair accessories and trading cards. One good piece beats a bag of small ones.",
  },
];

const THEMES: { name: string; id: string; note: string }[] = [
  { name: "Unicorn", id: "unicorn-dreams", note: "pastel stationery and hair accessories" },
  { name: "Space", id: "little-astronaut", note: "space pouch, push pencils, ruler and a mini puzzle" },
  { name: "Mermaid", id: "mermaid-magic", note: "for under-the-sea parties" },
  { name: "Art and craft", id: "little-artist", note: "for kids who love to draw" },
  { name: "Fidget toys", id: "fidget-fun", note: "works for any theme and any age" },
  { name: "Christmas", id: "christmas-cheer", note: "for December parties and class celebrations" },
];

const STEPS = [
  "Count the children who said yes, then add about 10% for siblings and late guests.",
  "Set a budget per child first; it decides everything else.",
  "Match the bag to the party theme, and keep the pieces the same for every child so no one compares.",
  "Add a name tag or thank-you note with the birthday child's name.",
  "Order at least 3 to 5 days before the party. We pack in 48 hours, and a 24-hour rush is possible when stock allows.",
  "Keep return gifts by the door so every guest gets one on the way out.",
];

export default function ReturnGiftIdeas() {
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: TITLE,
      description: DESCRIPTION,
      dateModified: UPDATED,
      image: abs("/og.jpg"),
      mainEntityOfPage: abs("/return-gift-ideas"),
      author: { "@type": "Organization", name: "Minimo Atelier", url: abs("/") },
      publisher: { "@type": "Organization", name: "Minimo Atelier", logo: { "@type": "ImageObject", url: abs("/brand/logo.png") } },
    },
    breadcrumbs([["Home", "/"], ["Return gift ideas", null]]),
  ];
  return (
    <>
      <InnerHeader />
      <main id="main" className="m-wrap m-guide">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
        <p className="m-eyebrow">Guide</p>
        <h1 className="m-h2">Return gift ideas for kids&apos; birthday parties</h1>
        <p className="m-guide-lede">
          The best return gifts are the ones kids still use a week later. Here is what we pack most at our Hyderabad store, sorted by budget, by age and by party theme,
          with a checklist so nothing is left to the last day.
        </p>

        <h2>Return gift ideas by budget</h2>
        <ul className="m-guide-list">
          {BUDGETS.map((b) => (
            <li key={b.id}>
              <Link href={`/shop/return-gifts?budget=${b.id}`}>
                <b>Return gifts {b.band.toLowerCase()}</b>
              </Link>
              <span>{b.ideas}</span>
            </li>
          ))}
        </ul>

        <h2>Return gift ideas by age</h2>
        {AGES.map((a) => (
          <section key={a.age} className="m-guide-age">
            <h3>{a.age}</h3>
            <p>{a.text}</p>
          </section>
        ))}

        <h2>Return gifts by party theme</h2>
        <ul className="m-guide-list">
          {THEMES.map((t) => (
            <li key={t.id}>
              <Link href={packHref(t.id)}>
                <b>{t.name} return gifts</b>
              </Link>
              <span>A ready-made pack: {t.note}.</span>
            </li>
          ))}
        </ul>
        <p>
          No pack fits your theme? <Link href="/build">Build your own return-gift bag</Link> from what is in the store today and see the price per child as you go.
        </p>

        <h2>Return gift checklist</h2>
        <ol className="m-guide-steps">
          {STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>

        <h2>Ordering return gifts in Hyderabad</h2>
        <p>
          Minimo Atelier is a return gift and hamper store inside Honer Vivantis, Gopanpally. Pick up free from the store, get delivery across Hyderabad, or courier
          anywhere in India. Ordering for a school or 15 or more guests? See <Link href="/bulk-orders">bulk return gifts</Link> for 5% to 10% off.
        </p>
        <div className="m-empty-btns">
          <Link className="m-btn m-btn--primary" href="/shop/return-gifts">
            Shop return gifts
          </Link>
          <Link className="m-btn m-btn--ghost" href="/visit-our-store">
            Visit our store
          </Link>
        </div>
      </main>
    </>
  );
}
