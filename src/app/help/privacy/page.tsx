import type { Metadata } from "next";
import Link from "next/link";
import { InnerHeader } from "@/components/header";
import { Grievance, PolicyHead } from "@/components/help-bits";
import { Icon } from "@/components/icon";
import { POLICY, SHOP } from "@/lib/merch";
import { breadcrumbs, ldJson, pageMeta } from "@/lib/seo";

const TITLE = "Privacy policy";
const DESC = "What Minimo Atelier collects when you shop with us, why, who it is shared with, and how to see, correct or delete it.";
export const metadata: Metadata = { title: { absolute: `${TITLE} · Minimo Atelier` }, description: DESC, ...pageMeta("/help/privacy", TITLE, DESC) };

export default function Privacy() {
  return (
    <>
      <InnerHeader />
      <main id="main" className="m-wrap h-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson([breadcrumbs([["Home", "/"], ["Help", "/help"], [TITLE, null]])]) }} />
        <Link className="h-back" href="/help">
          <Icon name="chevL" size={16} /> Help
        </Link>
        <PolicyHead title="Privacy policy" updated={POLICY.updated} />

        <section className="h-sec h-prose" aria-labelledby="h-what">
          <h2 className="h-h2" id="h-what">
            What we collect
          </h2>
          <ul>
            <li>Your mobile number, when you sign in or place an order.</li>
            <li>Your name, delivery address and PIN code, when you choose delivery.</li>
            <li>What you order, name tags and gift notes, and your order history.</li>
            <li>Reviews and photos you choose to post.</li>
            <li>How the site is used, through Microsoft Clarity. What you type, and your phone, address and order screens, are masked and never recorded.</li>
          </ul>
          <p>Your cart, wishlist and last PIN code are kept only in your own browser. We never see or store card or bank details: you pay by UPI in your own app.</p>
        </section>

        <section className="h-sec h-prose" aria-labelledby="h-why">
          <h2 className="h-h2" id="h-why">
            Why we use it
          </h2>
          <p>To confirm, pack and deliver your order, to message you about it on WhatsApp, to answer your questions and to keep the site working well. If you tick &ldquo;Order updates on WhatsApp&rdquo;, we message you as your order moves; you can stop that any time. We don&apos;t send marketing messages.</p>
        </section>

        <section className="h-sec h-prose" aria-labelledby="h-who">
          <h2 className="h-h2" id="h-who">
            Who we share it with
          </h2>
          <p>Only the services that help us run the shop, and only what each one needs:</p>
          <ul>
            <li>Courier partners, who get your name, address and phone to deliver.</li>
            <li>Google Firebase, for signing in with your mobile number.</li>
            <li>Vercel and Supabase, who host the website and our order records.</li>
            <li>Microsoft Clarity, for anonymous usage of the site.</li>
          </ul>
          <p>We never sell your details, and we share them with authorities only when the law requires it.</p>
        </section>

        <section className="h-sec h-prose" aria-labelledby="h-keep">
          <h2 className="h-h2" id="h-keep">
            How long we keep it
          </h2>
          <p>Order records are kept as long as tax and accounting rules require. Everything else is deleted when you ask, or when it is no longer needed.</p>
        </section>

        <section className="h-sec h-prose" aria-labelledby="h-rights">
          <h2 className="h-h2" id="h-rights">
            Your choices
          </h2>
          <p>
            Under India&apos;s Digital Personal Data Protection Act, 2023, you can ask to see the details we hold about you, correct them, or have them deleted, and you can stop order updates. Email <a href={`mailto:${SHOP.email}`}>{SHOP.email}</a> or message us on WhatsApp.
          </p>
        </section>

        <section className="h-sec h-prose" aria-labelledby="h-griev">
          <h2 className="h-h2" id="h-griev">
            Questions or complaints
          </h2>
          <Grievance />
        </section>
      </main>
    </>
  );
}
