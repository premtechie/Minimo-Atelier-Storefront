import type { Metadata } from "next";
import Link from "next/link";
import { InnerHeader } from "@/components/header";
import { HelpTalk, HelpTile } from "@/components/help-bits";
import { Icon } from "@/components/icon";
import { faqPage, HOME_FAQ, ldJson, pageMeta } from "@/lib/seo";
import { waLink } from "@/lib/whatsapp";

const TITLE = "Help: delivery, pickup and paying";
const DESC = "Answers about Minimo Atelier orders: free store pickup inside Honer Vivantis, delivery across Hyderabad and India, paying by UPI, name tags and bulk orders.";
export const metadata: Metadata = { title: { absolute: `${TITLE} · Minimo Atelier` }, description: DESC, ...pageMeta("/help", TITLE, DESC) };

export default function Help() {
  return (
    <>
      <InnerHeader />
      <main id="main" className="m-wrap h-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson([faqPage(HOME_FAQ)]) }} />
        <header className="h-head">
          <p className="m-eyebrow">Help</p>
          <h1 className="h-h1">How can we help?</h1>
          <p className="h-lede">Pickup, delivery, paying and name tags, in one place.</p>
        </header>

        <div className="h-tiles">
          <HelpTile href="/help/shipping" icon="truck" title="Delivery & pickup" line="Free store pickup, ready in 48 h" />
          <HelpTile href="/help/shipping#paying" icon="tag" title="Paying" line="UPI once we confirm stock" />
          <HelpTile href="/orders" icon="box" title="Track an order" line="See where your order is" />
          <HelpTile href="/bulk-orders" icon="gift" title="Bulk & school orders" line="5–10% off on 15+ bags" />
        </div>

        <section className="h-sec" aria-labelledby="h-faq">
          <h2 className="h-h2" id="h-faq">
            Questions parents ask
          </h2>
          <div className="h-faq">
            {HOME_FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <Icon name="chevD" size={18} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="h-sec" aria-labelledby="h-pol">
          <h2 className="h-h2" id="h-pol">
            Policies
          </h2>
          <ul className="h-list">
            <li>
              <Link href="/help/shipping">
                Shipping &amp; pickup <Icon name="chevR" size={16} />
              </Link>
            </li>
            <li>
              <Link href="/visit-our-store#contact">
                Contact &amp; store hours <Icon name="chevR" size={16} />
              </Link>
            </li>
          </ul>
        </section>

        <HelpTalk href={waLink("Hi Minimo, I have a question about an order.")} />
      </main>
    </>
  );
}
