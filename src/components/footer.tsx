import Image from "next/image";
import Link from "next/link";
import { SHOP } from "@/lib/merch";
import { waLink } from "@/lib/whatsapp";
import { Icon } from "./icon";

const COLS: { title: string; links: [string, string][] }[] = [
  { title: "Shop", links: [["Return gifts", "/shop/return-gifts"], ["Build your own", "/build"], ["Hampers", "/build?mode=hampers"], ["For her", "/for-her"], ["For him", "/for-him"]] },
  { title: "Help", links: [["Delivery & pickup", "/visit-our-store#delivery"], ["Bulk orders", "/bulk-orders"], ["Contact", "/visit-our-store#contact"]] },
  { title: "About", links: [["Visit our store", "/visit-our-store"], ["Wishlist", "/wishlist"]] },
];

export function Footer() {
  return (
    <footer className="m-foot">
      <div className="m-foot-in">
        <div className="m-foot-brand">
          <Image src="/brand/logo-light.png" alt="Minimo Atelier" width={180} height={84} className="m-foot-logo" />
          <p>Return gifts and hampers kids actually keep. Packed by hand in our store inside Honer Vivantis, Hyderabad.</p>
          <div className="m-foot-social">
            <a href={SHOP.instagram} target="_blank" rel="noopener" aria-label="Instagram">
              <Icon name="instagram" size={20} />
            </a>
            <a href={waLink()} target="_blank" rel="noopener" aria-label="WhatsApp">
              <Icon name="wa" size={20} />
            </a>
          </div>
        </div>
        {COLS.map((c) => (
          <nav key={c.title} className="m-foot-col" aria-label={c.title}>
            <h2>{c.title}</h2>
            {c.links.map(([l, h]) => (
              <Link key={h} href={h}>
                {l}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className="m-foot-base">
        <span>© {new Date().getFullYear()} Minimo Atelier. All rights reserved.</span>
      </div>
    </footer>
  );
}

