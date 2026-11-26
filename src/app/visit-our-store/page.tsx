import type { Metadata } from "next";
import { InnerHeader } from "@/components/header";
import { EIcon } from "@/components/icon";
import { StoreTour } from "@/components/store-tour";
import { SHOP } from "@/lib/merch";
import { waLink } from "@/lib/whatsapp";

import { pageMeta } from "@/lib/seo";
export const metadata: Metadata = {
  title: { absolute: "Return gift shop in Gopanpally, Hyderabad: visit our store · Minimo Atelier" },
  description: "Visit Minimo Atelier, a return gift and hamper store inside Honer Vivantis, Gopanpally, near Nallagandla, Tellapur and Gachibowli. See the packs, feel the bags and pick up your order free.",
  ...pageMeta("/visit-our-store", "Return gift shop in Gopanpally, Hyderabad: visit our store", "Visit Minimo Atelier, a return gift and hamper store inside Honer Vivantis, Gopanpally, near Nallagandla, Tellapur and Gachibowli. See the packs, feel the bags and pick up your order free."),
};

/* In the approved design's markup: its plain classes are e- here, rules in styles/design/visit.css. */
export default function VisitStore() {
  return (
    <>
      <InnerHeader />
      <main id="main" className="dy e-sv">
        <StoreTour />
        <div className="e-wrap e-sv-info" id="store-info">
          <div className="e-page-hero" style={{ paddingTop: 8 }}>
            <p className="muted" style={{ maxWidth: "52ch" }}>
              Our return gift store is inside Honer Vivantis, Gopanpally, Hyderabad, a short drive from Nallagandla, Tellapur, Gachibowli and Kondapur. Come see the packs, feel the bags, and pick up your order.
            </p>
          </div>
          <div className="e-info-grid">
            <div className="e-info">
              <EIcon name="pin" />
              <h3>Where</h3>
              <p>{SHOP.where}</p>
              <p className="small muted">
                Call{" "}
                {SHOP.phones.map((n, i) => (
                  <span key={n}>
                    {i ? " or " : ""}
                    <a className="e-link" href={`tel:${n.replace(/\s/g, "")}`}>
                      {n}
                    </a>
                  </span>
                ))}
              </p>
              <a className="e-link" href={SHOP.mapsUrl} target="_blank" rel="noopener">
                Open in Maps →
              </a>
            </div>
            <div className="e-info">
              <EIcon name="clock" />
              <h3>Hours</h3>
              <p className="muted">{SHOP.hours || "Message us on WhatsApp for hours"}</p>
            </div>
            <div className="e-info">
              <EIcon name="bag" />
              <h3>Pickup</h3>
              <p>Free. Orders are ready in 48 h. We&apos;ll message you on WhatsApp when it&apos;s packed.</p>
            </div>
          </div>
          <section className="e-section">
            <div className="e-two-col">
              <div className="e-stack">
                <span className="e-eyebrow">Living in Honer Vivantis?</span>
                <h2>Free delivery to your flat</h2>
                <p className="muted">Pick &ldquo;To your flat&rdquo; at checkout and add your tower and flat number.</p>
              </div>
              <div className="e-stack" id="contact">
                <span className="e-eyebrow">Talk to us</span>
                <h2>WhatsApp is fastest</h2>
                <p className="muted">Send a photo of your party theme and we&apos;ll suggest a mix.</p>
                <a className="e-btn e-btn-wa" data-wa-source="Visit page: plan a visit" href={waLink("Hi Minimo, I'd like to visit the store.")} target="_blank" rel="noopener">
                  <EIcon name="wa" sm /> WhatsApp us
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
