import type { Metadata } from "next";
import Link from "next/link";
import { InnerHeader } from "@/components/header";
import { HelpTalk } from "@/components/help-bits";
import { Icon } from "@/components/icon";
import { SHOP } from "@/lib/merch";
import { breadcrumbs, ldJson, pageMeta } from "@/lib/seo";
import { waLink } from "@/lib/whatsapp";

const TITLE = "Shipping, pickup and paying";
const DESC = "How Minimo Atelier orders reach you: free pickup inside Honer Vivantis, free delivery to Honer Vivantis flats, delivery across Hyderabad and courier across India. Ready in 48 hours; pay by UPI once we confirm.";
export const metadata: Metadata = { title: { absolute: `${TITLE} · Minimo Atelier` }, description: DESC, ...pageMeta("/help/shipping", TITLE, DESC) };

const WAYS: { title: string; cost: string; body: string }[] = [
  { title: "Store pickup", cost: "Free", body: `Collect from our store ${SHOP.where.replace(/^Inside/, "inside")}. We message you on WhatsApp when it's packed.` },
  { title: "To your flat in Honer Vivantis", cost: "Free", body: "Pick “To your flat” at checkout and add your tower and flat number." },
  { title: "Across Hyderabad", cost: "Shown at checkout", body: "Nallagandla, Tellapur, Gachibowli, Kondapur, Kokapet, Narsingi and the rest of the city. Enter your PIN code to see the price and date." },
  { title: "Anywhere in India", cost: "Shown at checkout", body: "By courier. Enter your PIN code at checkout for the price and expected date." },
];

export default function Shipping() {
  return (
    <>
      <InnerHeader />
      <main id="main" className="m-wrap h-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson([breadcrumbs([["Home", "/"], ["Help", "/help"], [TITLE, null]])]) }} />
        <Link className="h-back" href="/help">
          <Icon name="chevL" size={16} /> Help
        </Link>
        <header className="h-head">
          <p className="m-eyebrow">Policies</p>
          <h1 className="h-h1">Shipping &amp; pickup</h1>
        </header>

        <div className="h-facts">
          <div>
            <strong>48 h</strong>
            <span>to get your order ready</span>
          </div>
          <div>
            <strong>Free</strong>
            <span>pickup in Honer Vivantis</span>
          </div>
          <div>
            <strong>UPI</strong>
            <span>after we confirm stock</span>
          </div>
        </div>

        <section className="h-sec" aria-labelledby="h-ways">
          <h2 className="h-h2" id="h-ways">
            Ways to get your order
          </h2>
          <div className="h-ways">
            {WAYS.map((w) => (
              <div key={w.title} className="h-way">
                <div className="h-way-top">
                  <h3>{w.title}</h3>
                  <span className={w.cost === "Free" ? "h-chip is-free" : "h-chip"}>{w.cost}</span>
                </div>
                <p>{w.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="h-sec h-prose" aria-labelledby="h-when">
          <h2 className="h-h2" id="h-when">
            When it&apos;s ready
          </h2>
          <p>Every order is packed by hand in our store and is ready 48 hours after we confirm it. Need it sooner? Ask on WhatsApp for a 24-hour rush when the pieces are in stock.</p>
        </section>

        <section className="h-sec h-prose" id="paying" aria-labelledby="h-pay">
          <h2 className="h-h2" id="h-pay">
            Paying
          </h2>
          <p>Nothing is charged on the website. Once we&apos;ve checked stock and confirmed your order, we send a UPI payment link on WhatsApp. Packing starts once it&apos;s paid.</p>
        </section>

        <HelpTalk href={waLink("Hi Minimo, I have a question about delivery.")} />
      </main>
    </>
  );
}
