import Link from "next/link";
import { SafeImg } from "./safe-img";
import type { ReactNode } from "react";
import { waLink } from "@/lib/whatsapp";
import { Icon, type IconName } from "./icon";

/*
 * The product page's static sections, in the approved design's markup
 * (its mm- classes are d- here; rules in styles/design/pdp.css).
 */

export function Crumbs({ trail, back }: { trail: [string, string | null][]; back: string }) {
  return (
    <div className="d-pdp-header">
      <Link className="d-pdp-back" href={back}>
        <Icon name="arrowL" size={16} /> Back
      </Link>
      <nav className="d-pdp-breadcrumb" aria-label="Breadcrumb">
        {trail.map(([label, href], i) => (
          <span key={label} style={{ display: "contents" }}>
            {i > 0 && <span>/</span>}
            {href ? <Link href={href}>{label}</Link> : <span aria-current="page">{label}</span>}
          </span>
        ))}
      </nav>
    </div>
  );
}

export function Story({ name, lede, body, specs }: { name: string; lede: string; body: string; specs: [IconName, string, string][] }) {
  return (
    <section className="d-story" aria-labelledby="h-about">
      <div className="d-story-inner">
        <div className="d-story-text">
          <p className="d-eyebrow">About {name}</p>
          <p className="d-story-lede" id="h-about">
            {lede}
          </p>
          <p className="d-story-body">{body}</p>
          <ul className="d-story-points">
            {["Gift-wrapped and name-tagged by hand", "Everything comes from stock in our store", "Ready in 48 hours, 24 h rush when stock allows"].map((t) => (
              <li key={t}>
                <span className="d-story-tick">
                  <Icon name="check" size={12} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <dl className="d-specs">
          {specs.map(([i, k, v]) => (
            <div key={k} className="d-spec">
              <dt>
                <span className="d-spec-icon">
                  <Icon name={i} size={20} />
                </span>
                {k}
              </dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export type CareItem = { label: string; icon?: IconName; img?: string; href?: string };

export function Care({ id, eyebrow, title, items }: { id: string; eyebrow: string; title: string; items: CareItem[] }) {
  return (
    <section className="d-care" aria-labelledby={id}>
      <div className="d-care-inner">
        <p className="d-eyebrow d-center">{eyebrow}</p>
        <h2 className="d-section-title d-center" id={id}>
          {title}
        </h2>
        <ul className="d-care-list">
          {items.map((it, i) => {
            const inner = (
              <>
                {it.img ? (
                  <span className="d-care-icon d-care-img">
                    <SafeImg src={it.img} alt="" loading="lazy" />
                  </span>
                ) : (
                  <span className="d-care-icon">
                    <Icon name={it.icon ?? "gift"} size={22} />
                  </span>
                )}
                <span className="d-care-label">{it.label}</span>
              </>
            );
            return <li key={it.label + i}>{it.href ? <Link href={it.href} style={{ display: "contents" }}>{inner}</Link> : inner}</li>;
          })}
        </ul>
      </div>
    </section>
  );
}

const FAQ: [string, string][] = [
  ["Can I change what is inside?", "Yes. Tap “Customise this pack” and swap anything for what is in stock."],
  ["Is it ready in time?", "48 hours as standard. Ask on WhatsApp for a 24 h rush when stock allows."],
  ["Delivery and pickup", "Free pickup at our store inside Honer Vivantis, free delivery to flats in Honer Vivantis, and courier across Hyderabad and India."],
  ["Can I see it first?", "Visit the store inside Honer Vivantis, or ask on WhatsApp for photos."],
];

export function Faq() {
  return (
    <section className="d-faq" aria-labelledby="h-faq">
      <div className="d-care-inner">
        <p className="d-eyebrow">Questions</p>
        <h2 className="d-section-title" id="h-faq">
          Good to know
        </h2>
        <div className="d-faq-list">
          {FAQ.map(([q, a]) => (
            <details key={q} className="d-faq-item">
              <summary>
                {q}
                <Icon name="chevD" size={18} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/** No reviews are shown until real orders bring them; nothing here is made up. */
export function Reviews({ name }: { name: string }) {
  return (
    <section className="d-reviews" aria-labelledby="h-rev">
      <div className="d-reviews-inner">
        <div className="d-reviews-empty">
          <p className="d-eyebrow">Reviews</p>
          <h2 className="d-reviews-empty-title" id="h-rev">
            Be the first to review {name}
          </h2>
          <p className="d-rev-note">Reviews appear here only from real orders.</p>
          <a className="d-reviews-write" data-wa-source="Write a review" href={waLink(`Hi Minimo, a review for ${name}: `)} target="_blank" rel="noopener">
            <Icon name="pen" size={16} /> Write a review
          </a>
        </div>
      </div>
    </section>
  );
}

export function Related({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="d-related" aria-labelledby="h-more">
      <div className="d-related-inner">
        <div className="d-sec-head">
          <div>
            <p className="d-eyebrow">Keep exploring</p>
            <h2 id="h-more">{title}</h2>
          </div>
        </div>
        <div className="d-grid-4">{children}</div>
      </div>
    </section>
  );
}
