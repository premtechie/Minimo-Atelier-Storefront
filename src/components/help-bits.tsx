import Link from "next/link";
import { SHOP } from "@/lib/merch";
import { Icon, type IconName } from "./icon";

/** A topic tile on the Help centre: icon, title and one line. */
export function HelpTile({ href, icon, title, line }: { href: string; icon: IconName; title: string; line: string }) {
  return (
    <Link className="h-tile" href={href}>
      <span className="h-tile-ic" aria-hidden="true">
        <Icon name={icon} size={18} />
      </span>
      <span className="h-tile-t">{title}</span>
      <span className="h-tile-l">{line}</span>
    </Link>
  );
}

/** The cocoa "Talk to us" card that closes every help page. */
export function HelpTalk({ href }: { href: string }) {
  return (
    <a className="h-talk" href={href} data-wa-source="Help page: talk to us" target="_blank" rel="noopener">
      <span className="h-talk-ic" aria-hidden="true">
        <Icon name="wa" size={20} />
      </span>
      <span className="h-talk-txt">
        <span>Still stuck? Talk to us</span>
        <small>WhatsApp replies the same day</small>
      </span>
      <Icon name="chevR" size={18} />
    </a>
  );
}

/** The grievance officer the 2020 e-commerce rules ask every shop to name. */
export function Grievance() {
  const g = SHOP.grievance;
  const tel = g.phone.replace(/\s/g, "");
  return (
    <div className="h-officer">
      <strong>{g.name ? `${g.name}${g.role ? `, ${g.role}` : ""}` : "Grievance officer"}</strong>
      <span>
        <a href={`mailto:${g.email}`}>{g.email}</a> · <a href={`tel:${tel}`}>{g.phone}</a>
      </span>
      <span>We acknowledge every complaint within 48 hours and resolve it within one month.</span>
    </div>
  );
}

/** "Policies" eyebrow, title and last-updated line shared by the policy pages. */
export function PolicyHead({ title, updated }: { title: string; updated: string }) {
  return (
    <header className="h-head">
      <p className="m-eyebrow">Policies</p>
      <h1 className="h-h1">{title}</h1>
      <p className="h-updated">Last updated {updated}</p>
    </header>
  );
}
