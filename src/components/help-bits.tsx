import Link from "next/link";
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
