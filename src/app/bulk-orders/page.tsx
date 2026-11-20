import type { Metadata } from "next";
import { BulkForm } from "@/components/bulk-form";
import { InnerHeader } from "@/components/header";
import { BULK_RULES } from "@/lib/merch";

import { pageMeta } from "@/lib/seo";
export const metadata: Metadata = {
  title: { absolute: "Bulk return gifts in Hyderabad for schools and class parties · Minimo Atelier" },
  description: "Bulk return gifts in Hyderabad for class parties, Children's Day, teacher gifts and school events. 5% off from 15 pieces, 10% off from 25, name-tagged and ready in 48 hours.",
  ...pageMeta("/bulk-orders", "Bulk return gifts in Hyderabad for schools and class parties", "Bulk return gifts in Hyderabad for class parties, Children's Day, teacher gifts and school events. 5% off from 15 pieces, 10% off from 25, name-tagged and ready in 48 hours."),
};

const STEPS = ["Send the count, budget and date", "We share 2–3 options with photos", "Approve, pay, and we pack", "Pick up or we deliver to the school"];

/* In the approved design's markup: its plain classes are e- here, rules in styles/design/visit.css. */
export default function BulkOrders() {
  const tiers = [...BULK_RULES].reverse();
  return (
    <>
      <InnerHeader />
      <main id="main" className="dy e-wrap">
        <div className="e-page-hero">
          <span className="e-eyebrow">Bulk return gifts &amp; school orders, Hyderabad</span>
          <h1>
            Ordering {tiers[1]?.[0] ?? 25}+? <em>Bulk pricing.</em>
          </h1>
          <p className="muted" style={{ maxWidth: "52ch" }}>
            Class parties, Children&apos;s Day, teacher gifts and school events. Tell us the count and the date, we&apos;ll put together options from what&apos;s in stock.
          </p>
        </div>
        <div className="e-price-tiers num">
          {tiers.map(([n, r]) => (
            <div key={n}>
              <b>{Math.round(r * 100)}%</b>
              <span className="small">{n}+ pieces</span>
            </div>
          ))}
          <div>
            <b>Ask</b>
            <span className="small">100+ pieces</span>
          </div>
        </div>
        <p className="small muted" style={{ marginTop: 8 }}>
          The discount applies by itself in your cart. For 100 or more, ask us for a price.
        </p>
        <section className="e-section">
          <div className="e-two-col">
            <div className="e-stack">
              <h2>How it works</h2>
              <ol className="e-steps3" style={{ color: "var(--e-ink)" }}>
                {STEPS.map((s) => (
                  <li key={s} style={{ background: "var(--e-surface)", border: "1px solid var(--line)" }}>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
            <BulkForm />
          </div>
        </section>
      </main>
    </>
  );
}
