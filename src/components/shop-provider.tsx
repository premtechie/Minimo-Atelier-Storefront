"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { addLine, cartTotals, type CartLine } from "@/lib/cart";
import { Icon } from "./icon";

type Toast = { id: number; text: string; href?: string; action?: string; out?: boolean };

type Shop = {
  ready: boolean;
  cart: CartLine[];
  add: (line: CartLine, message?: string, link?: { href: string; label: string }) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  replace: (lines: CartLine[]) => void;
  clear: () => void;
  count: number;
  wish: Set<string>;
  toggleWish: (id: string, name?: string) => void;
  /** Replaces the saved list (signing in merges the account's list in). */
  setWishAll: (ids: string[]) => void;
  toast: (text: string, link?: { href: string; label: string }) => void;
};

const Ctx = createContext<Shop | null>(null);
const CART_KEY = "minimo-cart-v1";
const WISH_KEY = "minimo-wish-v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode: the cart lasts for this visit */
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wish, setWish] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const tid = useRef(0);

  useEffect(() => {
    // Read once after hydration, so the server page and the first paint agree.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCart(read<CartLine[]>(CART_KEY, []).filter((l) => l && Array.isArray(l.parts)));
    setWish(new Set(read<string[]>(WISH_KEY, [])));
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) setCart(read<CartLine[]>(CART_KEY, []));
      if (e.key === WISH_KEY) setWish(new Set(read<string[]>(WISH_KEY, [])));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const save = useCallback((next: CartLine[]) => {
    setCart(next);
    write(CART_KEY, next);
  }, []);

  const toast = useCallback((text: string, link?: { href: string; label: string }) => {
    const id = ++tid.current;
    // One toast at a time, like the design: it fades after 3.6 s.
    setToasts([{ id, text, href: link?.href, action: link?.label }]);
    setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, out: true } : x))), 3600);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3820);
  }, []);

  const value = useMemo<Shop>(
    () => ({
      ready,
      cart,
      add: (line, message, link) => {
        save(addLine(cart, line));
        toast(message ?? "Added to cart", link ?? { href: "/cart", label: "Checkout" });
      },
      setQty: (key, qty) => save(cart.map((l) => (l.key === key ? { ...l, qty: Math.max(1, qty) } : l))),
      remove: (key) => save(cart.filter((l) => l.key !== key)),
      replace: (lines) => save(lines),
      clear: () => save([]),
      count: cartTotals(cart).count,
      wish,
      toggleWish: (id, name) => {
        const next = new Set(wish);
        const on = !next.has(id);
        if (on) next.add(id);
        else next.delete(id);
        setWish(next);
        write(WISH_KEY, [...next]);
        // A signed-in shopper's account keeps the list too (account-provider.tsx).
        window.dispatchEvent(new CustomEvent("mm:wish", { detail: { id, on } }));
        if (name) toast(on ? `Saved ${name}` : "Removed from saved");
      },
      setWishAll: (ids) => {
        const next = new Set(ids);
        setWish(next);
        write(WISH_KEY, [...next]);
      },
      toast,
    }),
    [ready, cart, wish, save, toast],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {toasts.map((t) => (
        <div key={t.id} className={`dz d-toastbox ${t.out ? "is-out" : ""}`}>
          <Link className="d-toast d-toast--mobile" href="/cart" role="status">
            <Icon name="check" size={15} />
            <span>{t.text}</span>
            {t.href && <span className="d-toast-arrow">→</span>}
          </Link>
          <div className="d-toast d-toast--desktop" role="status">
            <span>{t.text}</span>
            {t.href && (
              <Link className="d-toast-link" href={t.href}>
                {t.action} →
              </Link>
            )}
            <button className="d-toast-x" onClick={() => setToasts([])} aria-label="Dismiss">
              <Icon name="x" size={15} />
            </button>
          </div>
        </div>
      ))}
    </Ctx.Provider>
  );
}

export function useShop() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useShop outside ShopProvider");
  return v;
}
