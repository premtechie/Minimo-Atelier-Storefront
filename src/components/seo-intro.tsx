import Link from "next/link";
import { Icon } from "./icon";
import { BUDGET_BANDS } from "@/lib/merch";
import { faqPage, HOME_FAQ, ldJson } from "@/lib/seo";

/*
 * What the home page says in words, for parents and for search: what we sell,
 * where, at what prices, and the questions people ask before ordering.
 */
export function SeoIntro() {
  return (
    <section className="m-sec m-seo" aria-labelledby="h-seo">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(faqPage(HOME_FAQ)) }} />
      <div className="m-wrap m-seo-wrap">
        <div className="m-seo-copy">
          <p className="m-eyebrow">Hyderabad&apos;s return-gift store</p>
          <h1 className="m-h2" id="h-seo">
            Birthday return gifts in Hyderabad
          </h1>
          <p>
            Minimo Atelier packs return gifts kids actually keep: stationery, toys, bottles, hair accessories and themed bags, from under ₹99 a guest. Pick a ready-made
            return-gift pack, or <Link href="/build">build your own bag</Link> from what is in our store today and see the price per child as you go.
          </p>
          <p>
            Every bag is gift-wrapped and name-tagged, and ready in 48 hours. Pick up free at our store inside Honer Vivantis, Gopanpally, or get it delivered across
            Hyderabad (Nallagandla, Tellapur, Gachibowli, Kondapur, Kokapet, Narsingi) and by courier anywhere in India. For first birthdays, class parties and school
            events, see <Link href="/bulk-orders">bulk return gifts</Link> or our <Link href="/return-gift-ideas">return gift ideas by age and budget</Link>.
          </p>
          <nav className="m-seo-links" aria-label="Return gifts by budget">
            {BUDGET_BANDS.map((b) => (
              <Link key={b.id} className="m-chip" href={`/shop/return-gifts?budget=${b.id}`}>
                Return gifts {b.label.replace("Under", "under")}
              </Link>
            ))}
            <Link className="m-chip" href="/build?mode=hampers">
              Gift hampers
            </Link>
          </nav>
        </div>
        <div className="m-seo-faq">
          <h2 className="m-seo-faq-h">Questions parents ask</h2>
          {HOME_FAQ.map(([q, a]) => (
            <details key={q} className="m-seo-q">
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
