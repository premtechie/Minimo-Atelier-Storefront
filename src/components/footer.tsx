import Image from "next/image";
import Link from "next/link";
import { SHOP } from "@/lib/merch";
import { waLink } from "@/lib/whatsapp";
import { Icon } from "./icon";

/* The approved design's footer (mm-footer, d- here; rules in styles/design/footer.css). */
const COLS: { title: string; links: [string, string][] }[] = [
  { title: "Shop", links: [["Return gifts", "/shop/return-gifts"], ["Build your own", "/build"], ["Return gift ideas", "/return-gift-ideas"], ["For her", "/for-her"], ["Jewellery", "/jewellery"], ["For him", "/for-him"]] },
  { title: "Help", links: [["Help centre", "/help"], ["Shipping & pickup", "/help/shipping"], ["Track order", "/orders"], ["Bulk orders", "/bulk-orders"], ["Contact", "/visit-our-store#contact"]] },
  { title: "About", links: [["Visit our store", "/visit-our-store"]] },
];

export function Footer() {
  return (
    <footer className="d-footer dz">
      <div className="d-footer-grid">
        <div className="d-footer-brand">
          <Link href="/">
            <Image src="/brand/logo-light.png" alt="Minimo Atelier" width={480} height={265} className="d-footer-logo" />
          </Link>
          <p>Return gifts and hampers kids actually keep. Packed by hand in our store inside Honer Vivantis, Hyderabad.</p>
          <div className="d-footer-social">
            <a href={SHOP.instagram} target="_blank" rel="noopener" aria-label="Instagram">
              <Icon name="instagram" size={20} />
            </a>
            <a href={waLink()} data-wa-source="Footer WhatsApp icon" target="_blank" rel="noopener" aria-label="WhatsApp">
              <Icon name="wa" size={20} />
            </a>
          </div>
        </div>
        {COLS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2>{c.title}</h2>
            <ul>
              {c.links.map(([l, h]) => (
                <li key={l}>
                  <Link href={h}>{l}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="d-footer-bottom">
        <span>© {new Date().getFullYear()} Minimo Atelier. All rights reserved.</span>
        <span className="d-footer-legal">
          <Link href="/help">Help</Link>
          <Link href="/help/shipping">Shipping</Link>
          <Link href="/visit-our-store#contact">Contact</Link>
        </span>
      </div>
    </footer>
  );
}
