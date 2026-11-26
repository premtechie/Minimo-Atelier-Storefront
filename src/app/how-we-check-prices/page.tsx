import type { Metadata } from "next";
import Link from "next/link";
import { InnerHeader } from "@/components/header";
import { breadcrumbs, faqPage, ldJson, pageMeta } from "@/lib/seo";
import { MAX_AGE_DAYS } from "@/lib/compare";

/*
 * Linked from every "Compare prices" sheet: how the comparison is made, so a
 * shopper (and ASCI's rule that comparisons be clear and provable) can check it.
 */

const TITLE = "How we check prices against Amazon, Flipkart and Meesho";
const DESCRIPTION =
  "How Minimo Atelier compares its gift prices with Amazon, Flipkart and Meesho: the same item only, checked by hand, dated, linked, and hidden after 30 days.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} · Minimo Atelier` },
  description: DESCRIPTION,
  ...pageMeta("/how-we-check-prices", TITLE, DESCRIPTION),
};

const FAQ: [string, string][] = [
  ["Which listings do you compare with?", "Only the same item: the same design, size and pack count, on its own product page on Amazon, Flipkart or Meesho. We don't compare with a similar product or a different pack."],
  ["Who checks the prices?", "We do, by hand, and we note the date of every check. Each comparison links to the listing so you can see it yourself."],
  ["How old can a price be?", `We show a comparison for ${MAX_AGE_DAYS} days after it was checked. After that it disappears until we check again, because prices online change often.`],
  ["Does it include delivery?", "No. We compare the item price only. Other sites may add delivery or offer coupons, so tap the link to see their price today."],
  ["When do you say “Lowest price we found”?", "Only when we searched all three sites and every same-item listing we found cost the same or more than ours. If any was cheaper, we don't show a comparison at all."],
  ["What does “Only at Minimo” mean?", "We searched Amazon, Flipkart and Meesho for that exact piece on the date shown and didn't find it."],
];

export default function HowWeCheckPrices() {
  return (
    <>
      <InnerHeader />
      <main id="main" className="m-wrap m-guide">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson([faqPage(FAQ), breadcrumbs([["Home", "/"], ["How we check prices", null]])]) }} />
        <p className="m-eyebrow">Price check</p>
        <h1 className="m-h2">How we check prices</h1>
        <p className="m-guide-lede">
          Some product pages show a <b>Compare prices</b> button. It tells you what we found when we looked for the same item on Amazon, Flipkart and Meesho, so you
          don&apos;t have to open three apps to know you&apos;re paying a fair price.
        </p>
        <ul className="m-guide-list">
          {FAQ.map(([q, a]) => (
            <li key={q}>
              <b>{q}</b> {a}
            </li>
          ))}
        </ul>
        <p className="m-guide-lede">
          Found a mistake, or seen something cheaper? Tell us on WhatsApp and we&apos;ll check again. <Link href="/shop/all">Back to the shop</Link>
        </p>
      </main>
    </>
  );
}
