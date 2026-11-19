"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "./icon";
import { useShop } from "./shop-provider";

export const NAV: { href: string; label: string }[] = [
  { href: "/shop", label: "Shop" },
  { href: "/build", label: "Build your own" },
  { href: "/for-her", label: "For her" },
  { href: "/for-him", label: "For him" },
  { href: "/visit-our-store", label: "Visit store" },
];

const PILLS: { href: string; label: string; icon: IconName }[] = [
  { href: "/shop", label: "All", icon: "grid" },
  { href: "/shop/return-gifts", label: "Return gifts", icon: "gift" },
  { href: "/build", label: "Build your own", icon: "wand" },
  { href: "/shop/kids", label: "Kids' favourites", icon: "bottle" },
  { href: "/for-her", label: "For her", icon: "earring" },
  { href: "/for-him", label: "For him", icon: "watch" },
];

const MENU: { href: string; label: string }[] = [
  { href: "/shop/return-gifts", label: "Return gifts" },
  { href: "/build", label: "Build your own ✨" },
  { href: "/build?mode=hampers", label: "Hampers" },
  { href: "/shop/kids", label: "Kids' favourites" },
  { href: "/for-her", label: "For her" },
  { href: "/for-him", label: "For him" },
  { href: "/bulk-orders", label: "Bulk & school orders" },
  { href: "/visit-our-store", label: "Visit our store" },
];

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

function Menu({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("m-lock");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("m-lock");
    };
  }, [open, onClose]);
  return (
    <div className={`m-menu ${open ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Menu" hidden={!open}>
      <div className="m-menu-top">
        <Logo />
        <button className="m-iconbtn" onClick={onClose} aria-label="Close menu">
          <Icon name="x" size={20} />
        </button>
      </div>
      <nav className="m-menu-list" aria-label="Shop">
        {MENU.map((m) => (
          <Link key={m.href} href={m.href} onClick={onClose}>
            {m.label}
            <Icon name="chevR" size={18} />
          </Link>
        ))}
      </nav>
      <div className="m-menu-foot">
        <Link href="/cart" onClick={onClose}>Cart</Link>
        <Link href="/wishlist" onClick={onClose}>Wishlist</Link>
        <Link href="/search" onClick={onClose}>Search</Link>
      </div>
    </div>
  );
}

/** Home: store button, centred logo, cart and menu, then the floating pill switcher. */
/** "/" opens search from anywhere, unless the shopper is typing. */
function useSlashSearch() {
  const router = useRouter();
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      router.push("/search");
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [router]);
}

export function HomeHeader() {
  useSlashSearch();
  const [open, setOpen] = useState(false);
  return (
    <header className="m-hhome">
      <div className="m-hhome-row">
        <Link href="/visit-our-store" className="m-iconbtn m-iconbtn--card" aria-label="Visit our store">
          <Icon name="store" size={20} />
        </Link>
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
    </header>
  );
}

/** Inner pages: compact sticky header and the cocoa strip under it. */
export function InnerHeader() {
  useSlashSearch();
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <>
      <header className="m-hin">
        <div className="m-hin-row">
          <Logo className="m-logo--in" />
          <nav className="m-hin-nav" aria-label="Main">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={path === n.href || path.startsWith(n.href + "/") ? "page" : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="m-hin-icons">
            <Link href="/search" aria-label="Search">
              <Icon name="search" size={20} />
            </Link>
            <Link href="/visit-our-store" className="m-md-only" aria-label="Visit our store">
              <Icon name="user" size={20} />
            </Link>
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
