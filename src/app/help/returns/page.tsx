import type { Metadata } from "next";
import Link from "next/link";
import { InnerHeader } from "@/components/header";
import { Grievance, HelpTalk, PolicyHead } from "@/components/help-bits";
import { Icon } from "@/components/icon";
import { POLICY } from "@/lib/merch";
import { breadcrumbs, ldJson, pageMeta } from "@/lib/seo";
import { waLink } from "@/lib/whatsapp";

const TITLE = "Returns, refunds and cancellations";
const DESC = "Minimo Atelier's return, refund and cancellation policy: cancel free until your order ships, and damaged or wrong items replaced or refunded."
export const metadata: Metadata = { title: { absolute: `${TITLE} · Minimo Atelier` }, description: DESC, ...pageMeta("/help/returns", TITLE, DESC) };

export default function Returns() {
  const h = POLICY.reportHours;
  return (
    <>
      <InnerHeader />
      <main id="main" className="m-wrap h-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson([breadcrumbs([["Home", "/"], ["Help", "/help"], [TITLE, null]])]) }} />
        <Link className="h-back" href="/help">
          <Icon name="chevL" size={16} /> Help
        </Link>
        <PolicyHead title="Returns & refunds" updated={POLICY.updated} />

        <div className="h-facts">
          <div>
            <strong>Free</strong>
            <span>to cancel until it ships</span>
          </div>
          <div>
            <strong>{h} h</strong>
            <span>to tell us about a damaged item</span>
          </div>
          <div>
            <strong>{POLICY.refundDays} days</strong>
            <span>for your refund after pickup</span>
          </div>
        </div>

        <section className="h-sec h-prose" aria-labelledby="h-cancel">
          <h2 className="h-h2" id="h-cancel">
            Cancelling an order
          </h2>
          <p>You can cancel any order free of charge until it is shipped, or until it is ready for pickup at the store. Cancel from your order page or message us on WhatsApp. If you have already paid, we refund the full amount. We never charge a cancellation fee.</p>
          <p>Once an order has shipped it can&apos;t be cancelled or sent back.</p>
        </section>

        <section className="h-sec h-prose" aria-labelledby="h-ret">
          <h2 className="h-h2" id="h-ret">
            Damaged or wrong items
          </h2>
          <p>Every order is checked and packed by hand, so we only take back items that arrive damaged, broken or different from what you ordered. We don&apos;t accept returns for a change of mind, on any item.</p>
          <ul>
            <li>Tell us within {h} hours of delivery or pickup, on WhatsApp or by email, with your order number and a photo. A short unboxing video helps.</li>
            <li>We arrange the pickup of the item, or you can bring it to our store. You pay nothing for this.</li>
            <li>We replace the item, or refund it if you prefer or if it is out of stock.</li>
          </ul>
        </section>

        <section className="h-sec h-prose" aria-labelledby="h-ref">
          <h2 className="h-h2" id="h-ref">
            Refunds
          </h2>
          <p>Once the item has been picked up and checked, we process your refund and send it within {POLICY.refundDays} days, back to the UPI account you paid from. For a cancelled order that was already paid, we send the refund within {POLICY.refundDays} days of the cancellation.</p>
        </section>

        <section className="h-sec h-prose" aria-labelledby="h-griev">
          <h2 className="h-h2" id="h-griev">
            Not happy with how we handled it?
          </h2>
          <p>Write to our grievance officer.</p>
          <Grievance />
        </section>

        <HelpTalk href={waLink("Hi Minimo, I'd like help with a return or refund.")} />
      </main>
    </>
  );
}
