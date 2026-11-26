import type { Metadata } from "next";
import Link from "next/link";
import { InnerHeader } from "@/components/header";
import { Grievance, PolicyHead } from "@/components/help-bits";
import { Icon } from "@/components/icon";
import { POLICY, SHOP } from "@/lib/merch";
import { breadcrumbs, ldJson, pageMeta } from "@/lib/seo";

const TITLE = "Terms of use";
const DESC = "The terms for shopping on minimoatelier.in: orders, prices in rupees, paying by UPI, delivery, returns and how to reach us.";
export const metadata: Metadata = { title: { absolute: `${TITLE} · Minimo Atelier` }, description: DESC, ...pageMeta("/help/terms", TITLE, DESC) };

export default function Terms() {
  return (
    <>
      <InnerHeader />
      <main id="main" className="m-wrap h-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson([breadcrumbs([["Home", "/"], ["Help", "/help"], [TITLE, null]])]) }} />
        <Link className="h-back" href="/help">
          <Icon name="chevL" size={16} /> Help
        </Link>
        <PolicyHead title="Terms of use" updated={POLICY.updated} />

        <section className="h-sec h-prose" aria-labelledby="h-who">
          <h2 className="h-h2" id="h-who">
            Who we are
          </h2>
          <p>
            minimoatelier.in is run by {SHOP.name}, a gift store at {SHOP.street}, {SHOP.locality} {SHOP.pin}. By using the site or placing an order you agree to these terms.
          </p>
        </section>

        <section className="h-sec h-prose" aria-labelledby="h-orders">
          <h2 className="h-h2" id="h-orders">
            Orders and prices
          </h2>
          <ul>
            <li>All prices are in Indian rupees. No website price is above the product&apos;s MRP.</li>
            <li>Placing an order is a request. It is confirmed once we have checked stock and sent you a UPI payment link on WhatsApp.</li>
            <li>Bulk discounts, free delivery and coupons are shown in your cart and checked again when the order is placed.</li>
            <li>Photos marked &ldquo;Sample picture&rdquo; show a typical pack; colours and pieces can vary with stock, and we tell you before packing if anything changes.</li>
            <li>If we can&apos;t fulfil an order, or a price is shown in error, we tell you and refund anything you have paid in full.</li>
          </ul>
        </section>

        <section className="h-sec h-prose" aria-labelledby="h-pay">
          <h2 className="h-h2" id="h-pay">
            Paying, delivery and returns
          </h2>
          <p>
            You pay by UPI after we confirm. Delivery options, charges and timings are on <Link href="/help/shipping">Shipping &amp; pickup</Link>. Cancellations, returns and refunds follow our <Link href="/help/returns">Returns &amp; refunds policy</Link>.
          </p>
        </section>

        <section className="h-sec h-prose" aria-labelledby="h-use">
          <h2 className="h-h2" id="h-use">
            Using the site
          </h2>
          <ul>
            <li>Small parts in return gifts are meant for children aged 3 and up. Please check age guidance before gifting.</li>
            <li>Reviews and photos you post must be your own and honest. We may remove anything abusive, false or unrelated.</li>
            <li>The site&apos;s designs, photos and text belong to {SHOP.name} and may not be copied for commercial use.</li>
            <li>How we handle your details is set out in our <Link href="/help/privacy">Privacy policy</Link>.</li>
          </ul>
        </section>

        <section className="h-sec h-prose" aria-labelledby="h-law">
          <h2 className="h-h2" id="h-law">
            Disputes
          </h2>
          <p>These terms follow Indian law, and the courts in Hyderabad, Telangana have jurisdiction. Nothing here limits your rights under the Consumer Protection Act, 2019.</p>
        </section>

        <section className="h-sec h-prose" aria-labelledby="h-griev">
          <h2 className="h-h2" id="h-griev">
            Complaints
          </h2>
          <Grievance />
        </section>
      </main>
    </>
  );
}
