"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "./icon";
import { useShop } from "./shop-provider";
import { useAccount } from "./account-provider";
import { waLink } from "@/lib/whatsapp";
import { FullTour } from "./store-tour";
import { openSearch } from "./search-sheet";

/** `wide`: only in the top bar from 1024px; narrower screens reach it from the menu. */
export const NAV: { href: string; label: string; wide?: boolean }[] = [
  { href: "/shop/return-gifts", label: "Shop" },
  { href: "/build", label: "Build your own" },
  { href: "/for-her", label: "For her" },
  { href: "/jewellery", label: "Jewellery" },
  { href: "/for-him", label: "For him" },
  { href: "/visit-our-store", label: "Visit store", wide: true },
];

const PILLS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "All", icon: "grid" },
  { href: "/shop/return-gifts", label: "Return gifts", icon: "gift" },
  { href: "/build", label: "Build your own", icon: "wand" },
  { href: "/shop/kids", label: "Kids' favourites", icon: "bottle" },
  { href: "/for-her", label: "For her", icon: "earring" },
  { href: "/jewellery", label: "Jewellery", icon: "gem" },
  { href: "/for-him", label: "For him", icon: "watch" },
];

const MENU: { href: string; label: string }[] = [
  { href: "/shop/return-gifts", label: "Shop all" },
  { href: "/build", label: "Build your own" },
  { href: "/shop/kids", label: "Kids' favourites" },
  { href: "/for-her", label: "For her" },
  { href: "/jewellery", label: "Jewellery" },
  { href: "/for-him", label: "For him" },
  { href: "/bulk-orders", label: "Bulk & school orders" },
  { href: "/visit-our-store", label: "Visit our store" },
];

/** Account links sit under the categories in small type, as on Bluebee, so they don't read as more aisles. */
const MENU_SMALL: { href: string; label: string; icon: IconName }[] = [
  { href: "/orders", label: "My orders", icon: "box" },
  { href: "/wishlist", label: "Wishlist", icon: "heart" },
  { href: "/cart", label: "Cart", icon: "bag" },
];

/**
 * The person button, as on Bluebee: signed out it opens the sign-in sheet;
 * signed in it is a filled circle with the first letter and goes to the account.
 */
export function AccountButton({ className = "" }: { className?: string }) {
  const { status, account, required, openSignIn } = useAccount();
  if (status === "signed_in" && account) {
    const letter = (account.first_name || account.name || "").slice(0, 1).toUpperCase();
    return (
      <Link href="/account" className={className} aria-label={account.first_name ? `Account, ${account.name}` : "Account"} title="Your account">
        {letter ? <span className="a-avatar">{letter}</span> : <Icon name="user" size={20} />}
      </Link>
    );
  }
  if (status !== "loading" && !required)
    return (
      <Link href="/orders" className={className} aria-label="My orders" title="My orders">
        <Icon name="user" size={20} />
      </Link>
    );
  return (
    <button type="button" className={className} aria-label="Sign in" title="Sign in" onClick={() => openSignIn({ reason: "account" })}>
      <Icon name="user" size={20} />
    </button>
  );
}

function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`m-logo ${className ?? ""}`} aria-label="Minimo Atelier, home">
      <Image src="/brand/logo.png" alt="" width={240} height={112} priority />
    </Link>
  );
}

function CartButton({ className = "m-iconbtn" }: { className?: string }) {
  const { count, ready } = useShop();
  return (
    <Link href="/cart" className={className} aria-label={`Cart${ready && count ? `, ${count} items` : ""}`}>
      <Icon name="bag" size={20} />
      {ready && count > 0 && (
        <span className="m-dot" key={count}>
          {count}
        </span>
      )}
    </Link>
  );
}
function WishButton({ className = "m-iconbtn" }: { className?: string }) {
  const { wish, ready } = useShop();
  return (
    <Link href="/wishlist" className={className} aria-label={`Wishlist${ready && wish.size ? `, ${wish.size} saved` : ""}`}>
      <Icon name="heart" size={20} />
      {ready && wish.size > 0 && (
        <span className="m-dot" key={wish.size}>
          {wish.size}
        </span>
      )}
    </Link>
  );
}

const noop = () => () => {};

/** The design's slide-in menu (fullmenu mm-mnav), portalled so no header layer clips it. */
function Menu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("m-lock");
    box.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("m-lock");
    };
  }, [open, onClose]);
  if (!mounted) return null;
  return createPortal(
    <div ref={box} className={`e-fullmenu d-mnav ${open ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="Menu" inert={!open}>
      <div className="d-mnav-top">
        <Link className="d-hdr-logo" href="/" onClick={onClose} aria-label="Minimo Atelier, home">
          <Image src="/brand/logo.png" alt="Minimo Atelier" width={480} height={265} />
        </Link>
        <button className="d-sheet-close" onClick={onClose} aria-label="Close menu">
          <Icon name="x" size={18} />
        </button>
      </div>
      <nav className="d-mnav-links" aria-label="Menu">
        {MENU.map((m) => (
          <Link key={m.href} href={m.href} onClick={onClose}>
            {m.label}
            <Icon name="chevR" size={18} />
          </Link>
        ))}
      </nav>
      <nav className="d-mnav-small" aria-label="Your account">
        <MenuAccount onClose={onClose} />
        {MENU_SMALL.map((m) => (
          <Link key={m.href} href={m.href} onClick={onClose}>
            <Icon name={m.icon} size={16} />
            {m.label}
          </Link>
        ))}
      </nav>
      <div className="d-mnav-foot">
        <a className="d-mnav-wa" data-wa-source="Menu: WhatsApp" href={waLink()} target="_blank" rel="noopener">
          <Icon name="wa" size={18} /> WhatsApp us
        </a>
        <span>Inside Honer Vivantis, Hyderabad</span>
      </div>
    </div>,
    document.body,
  );
}

function MenuAccount({ onClose }: { onClose: () => void }) {
  const { status, account, required, openSignIn } = useAccount();
  if (status === "signed_in" && account)
    return (
      <Link href="/account" onClick={onClose}>
        <Icon name="user" size={16} />
        {account.first_name ? `Hi, ${account.first_name}` : "My account"}
      </Link>
    );
  if (!required) return null;
  return (
    <button type="button" className="d-mnav-signin" onClick={() => (onClose(), openSignIn({ reason: "account" }))}>
      <Icon name="user" size={16} />
      Sign in
    </button>
  );
}

/** Home: store and account on the left, centred logo, cart and menu on the right, then the floating pill switcher. */
export function HomeHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tour, setTour] = useState(false);
  return (
    <header className="m-hhome">
      <div className="m-hhome-row">
        <div className="m-hhome-left">
          <Link
            href="/visit-our-store"
            className="m-iconbtn m-iconbtn--card"
            aria-label="Visit our store"
            title="Take a tour of our store"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey) return;
              e.preventDefault();
              setTour(true);
            }}
          >
            <Icon name="store" size={20} />
          </Link>
          <AccountButton className="m-iconbtn m-iconbtn--card" />
        </div>
        <Logo className="m-logo--home" />
        <div className="m-hhome-right">
          <WishButton className="m-iconbtn m-iconbtn--card m-only-desk" />
          <CartButton className="m-iconbtn m-iconbtn--card" />
          <button className="m-iconbtn m-iconbtn--card m-only-phone" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
            <Icon name="menu" size={20} />
          </button>
        </div>
      </div>
      <nav className="m-pills" aria-label="Categories">
        {PILLS.map((p, i) => (
          <Link key={p.href} href={p.href} className={`m-pill ${i === 0 ? "is-on" : ""}`} aria-label={p.label} title={p.label}>
            <Icon name={p.icon} size={18} />
            {i === 0 && <span>{p.label}</span>}
          </Link>
        ))}
      </nav>
      <Menu open={open} onClose={() => setOpen(false)} />
      {tour && <FullTour onClose={() => setTour(false)} onDetails={() => router.push("/visit-our-store")} />}
    </header>
  );
}

/** Inner pages: compact sticky header and the cocoa strip under it. */
export function InnerHeader() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <>
      <header className="m-hin">
        <div className="m-hin-row">
          <Logo className="m-logo--in" />
          <nav className="m-hin-nav" aria-label="Main">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={n.wide ? "m-nav-wide" : undefined} aria-current={path === n.href || path.startsWith(n.href + "/") || (n.label === "Shop" && path.startsWith("/shop/")) ? "page" : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="m-hin-icons">
            <Link
              href="/search"
              aria-label="Search"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                e.preventDefault();
                openSearch();
              }}
            >
              <Icon name="search" size={20} />
            </Link>
            <AccountButton className="m-hin-acct" />
            <WishButton className="" />
            <CartButton className="" />
            <button className="m-hin-menu" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
              <Icon name="menu" size={22} />
            </button>
          </div>
        </div>
        <p className="m-strip">
          <span className="m-strip-dot" aria-hidden="true" />
          <b>Ready in 48 h</b>
          <span className="m-strip-sep" aria-hidden="true">·</span>
          <span className="m-strip-sub">Free pickup inside Honer Vivantis</span>
        </p>
        <Menu open={open} onClose={() => setOpen(false)} />
      </header>
    </>
  );
}
