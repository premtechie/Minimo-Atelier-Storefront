import type { Metadata } from "next";
import Link from "next/link";
import { InnerHeader } from "@/components/header";
import { Grievance } from "@/components/help-bits";
import { Icon, type IconName } from "@/components/icon";
import { SHOP } from "@/lib/merch";
import { breadcrumbs, ldJson, pageMeta } from "@/lib/seo";
import { waLink } from "@/lib/whatsapp";

const TITLE = "Contact Minimo Atelier";
const DESC = `WhatsApp, call or email Minimo Atelier, or visit our store ${SHOP.where.replace(/^Inside/, "inside")}. ${SHOP.hours}.`;
export const metadata: Metadata = { title: { absolute: `${TITLE} · Minimo Atelier` }, description: DESC, ...pageMeta("/help/contact", TITLE, DESC) };

const tel = (p: string) => `tel:${p.replace(/\s/g, "")}`;

export default function Contact() {
  const ways: { href: string; icon: IconName; title: string; line: string; main?: boolean; ext?: boolean }[] = [
    { href: waLink("Hi Minimo!"), icon: "wa", title: "WhatsApp", line: `${SHOP.phones[1]} · fastest`, main: true, ext: true },
    { href: tel(SHOP.phones[0]), icon: "phone", title: "Call the store", line: SHOP.phones[0] },
    { href: `mailto:${SHOP.email}`, icon: "mail", title: "Email", line: SHOP.email },
    { href: SHOP.mapsUrl, icon: "pin", title: "Visit the store", line: SHOP.street, ext: true },
  ];
  return (
    <>
      <InnerHeader />
      <main id="main" className="m-wrap h-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson([breadcrumbs([["Home", "/"], ["Help", "/help"], ["Contact", null]])]) }} />
        <Link className="h-back" href="/help">
          <Icon name="chevL" size={16} /> Help
        </Link>
        <header className="h-head">
          <p className="m-eyebrow">Contact</p>
          <h1 className="h-h1">Say hello</h1>
          <p className="h-lede">A party coming up, an order question, or just browsing ideas. We&apos;re a small team in the store and reply the same day.</p>
        </header>

        <div className="h-contact">
          {ways.map((w) => (
            <a key={w.title} className={w.main ? "h-way-link is-main" : "h-way-link"} href={w.href} {...(w.ext ? { target: "_blank", rel: "noopener" } : {})} {...(w.icon === "wa" ? { "data-wa-source": "Contact page" } : {})}>
              <Icon name={w.icon} size={22} />
              <span className="h-way-txt">
                <span>{w.title}</span>
                <small>{w.line}</small>
              </span>
              <Icon name="chevR" size={18} />
            </a>
          ))}
        </div>

        <div className="h-hours">
          <span className="m-eyebrow">Store hours</span>
          <span>{SHOP.hours}</span>
        </div>

        <section className="h-sec h-prose" aria-labelledby="h-griev">
          <h2 className="h-h2" id="h-griev">
            Grievance officer
          </h2>
          <p>If a complaint isn&apos;t sorted out to your satisfaction, write to our grievance officer.</p>
          <Grievance />
        </section>
      </main>
    </>
  );
}
