import type { Metadata } from "next";
import Link from "next/link";
import { InnerHeader } from "@/components/header";
import { Grievance, HelpTalk, PolicyHead } from "@/components/help-bits";
import { Icon } from "@/components/icon";
import { POLICY } from "@/lib/merch";
import { breadcrumbs, ldJson, pageMeta } from "@/lib/seo";
import { waLink } from "@/lib/whatsapp";

const TITLE = "Returns, refunds and cancellations";
const DESC = `Minimo Atelier's return, refund and cancellation policy: cancel free until your order ships, ${POLICY.returnDays}-day returns on jewellery and single gifts, and refunds back to your UPI account.`;
export const metadata: Metadata = { title: { absolute: `${TITLE} · Minimo Atelier` }, description: DESC, ...pageMeta("/help/returns", TITLE, DESC) };

export default function Returns() {
  const d = POLICY.returnDays;
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
            <strong>{d} days</strong>
            <span>to return jewellery and single gifts</span>
          </div>
          <div>
            <strong>{h} h</strong>
            <span>to tell us about a damaged item</span>
          </div>
        </div>

        <section className="h-sec h-prose" aria-labelledby="h-cancel">
          <h2 className="h-h2" id="h-cancel">
            Cancelling an order
          </h2>
          <p>You can cancel any order free of charge until it is shipped, or until it is ready for pickup at the store. Cancel from your order page or message us on WhatsApp. If you have already paid, we refund the full amount.</p>
          <p>Once an order has shipped it can&apos;t be cancelled, but the return rules below still apply. We never charge a cancellation fee.</p>
        </section>

        <section className="h-sec h-prose" aria-labelledby="h-ret">
          <h2 className="h-h2" id="h-ret">
            Returns
          </h2>
          <h3>Jewellery and single gifts</h3>
          <p>Return them within {d} days of delivery or pickup if they are unused and in their original packaging. Earrings can&apos;t be returned once delivered, for hygiene.</p>
          <h3>Return gifts, packs, hampers and name-tagged orders</h3>
          <p>These are packed to order for your party, so they can&apos;t be returned for a change of mind.</p>
          <h3>Damaged or wrong items</h3>
          <p>If anything arrives damaged, broken or different from what you ordered, tell us within {h} hours of delivery or pickup with a photo, and a short unboxing video if you have one. We replace the item or refund it, whatever you prefer, at no cost to you.</p>
          <h3>How to return</h3>
          <ul>
            <li>Message us on WhatsApp or email with your order number and a photo.</li>
            <li>Bring the item to our store, or we arrange a courier pickup where available.</li>
            <li>For a change-of-mind return by courier, the return shipping is paid by you. For a damaged or wrong item, it is paid by us.</li>
          </ul>
        </section>

        <section className="h-sec h-prose" aria-labelledby="h-ref">
          <h2 className="h-h2" id="h-ref">
            Refunds
          </h2>
          <p>We start your refund within {POLICY.refundStartDays} working days of approving a return or a cancellation, back to the UPI account you paid from. UPI refunds usually arrive in 1–3 working days; some banks take up to 7.</p>
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
