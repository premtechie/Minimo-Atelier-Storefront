"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { inr } from "@/lib/format";
import { Icon } from "./icon";

type Hit = { name: string; cat: string; price: number; mrp: number | null; href: string; img: string | null };

/** Ask the search sheet to open, from any button. */
export const openSearch = () => window.dispatchEvent(new Event("mm:search"));

/** Bluebee's "Popular" chips, in Minimo's words. A chip with a link opens that page; the rest search. */
const POPULAR: { label: string; href?: string }[] = [
  { label: "Unicorn" },
  { label: "Hair clip" },
  { label: "Bottle" },
  { label: "Keychain" },
  { label: "Gifts under ₹99", href: "/shop/return-gifts?budget=under-99" },
];

/**
 * Search, as Bluebee does it: a full-screen panel on phones and a 640px card
 * near the top on wide screens, over the blurred page. The bar holds the
 * field, a clear button and Cancel; under it sit Popular chips, then, once
 * you type, matching categories and products. Arrow keys move through the
 * products and Enter opens the highlighted one.
 */
export function SearchSheet() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [res, setRes] = useState<{ term: string; hits: Hit[]; cats: string[] } | null>(null);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const on = () => {
      setOpen(true);
      setTimeout(() => input.current?.focus({ preventScroll: true }), 50);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      on();
    };
    window.addEventListener("mm:search", on);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("mm:search", on);
      window.removeEventListener("keydown", key);
    };
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (!term) return;
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctl.signal })
        .then((r) => r.json())
        .then((d: { hits: Hit[]; cats?: string[] }) => {
          setRes({ term, hits: d.hits, cats: d.cats ?? [] });
          setActive(0);
        })
        .catch(() => {});
    }, 120);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q]);

  const close = () => setOpen(false);
  const term = q.trim();
  const shown = term && res ? res : null;
  const hits = shown?.hits ?? [];
  const go = (href: string) => {
    close();
    router.push(href);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (!hits.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i + (e.key === "ArrowDown" ? 1 : hits.length - 1)) % hits.length);
    }
  };

  return (
    <div className={`s-root ${open ? "open" : ""}`} inert={!open}>
      <div className="s-backdrop" onClick={close} aria-hidden="true" />
      <div className="s-panel" role="dialog" aria-modal="true" aria-label="Search">
        <form
          className="s-bar"
          role="search"
          action="/search"
          onSubmit={(e) => {
            const h = hits[active];
            if (h && shown?.term === term) {
              e.preventDefault();
              go(h.href);
            } else close();
          }}
        >
          <Icon name="search" size={20} />
          <input
            ref={input}
            type="search"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search unicorns, bottles, hair clips…"
            enterKeyHint="search"
            autoComplete="off"
            aria-label="Search products, categories or keywords"
          />
          {q && (
            <button
              type="button"
              className="s-clear"
              aria-label="Clear search"
              onClick={() => {
                setQ("");
                input.current?.focus();
              }}
            >
              <Icon name="x" size={16} />
            </button>
          )}
          <button type="button" className="s-cancel" onClick={close}>
            Cancel
          </button>
        </form>
        <div className="s-body" aria-live="polite">
          {!term ? (
            <section className="s-section">
              <p className="s-eyebrow">Popular</p>
              <div className="s-chips">
                {POPULAR.map((c) =>
                  c.href ? (
                    <Link key={c.label} className="s-chip" href={c.href} onClick={close}>
                      {c.label}
                    </Link>
                  ) : (
                    <button
                      key={c.label}
                      type="button"
                      className="s-chip"
                      onClick={() => {
                        setQ(c.label);
                        input.current?.focus();
                      }}
                    >
                      {c.label}
                    </button>
                  ),
                )}
              </div>
            </section>
          ) : shown ? (
            <>
              {shown.cats.length > 0 && (
                <section className="s-section">
                  <p className="s-eyebrow">Categories</p>
                  <div className="s-chips">
                    {shown.cats.map((c) => (
                      <Link key={c} className="s-chip s-chip--link" href={`/search?q=${encodeURIComponent(c)}`} onClick={close}>
                        <Icon name="search" size={14} />
                        {c}
                      </Link>
                    ))}
                  </div>
                </section>
              )}
              {hits.length ? (
                <section className="s-section">
                  <p className="s-eyebrow">Products</p>
                  <ul className="s-list">
                    {hits.map((h, i) => (
                      <li key={h.href}>
                        <Link className={`s-item ${i === active ? "is-active" : ""}`} href={h.href} onClick={close} onMouseEnter={() => setActive(i)}>
                          <span className="s-thumb">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {h.img && <img src={h.img} alt="" loading="lazy" onError={(e) => void (e.currentTarget.hidden = true)} />}
                          </span>
                          <span className="s-item-text">
                            <span className="s-item-name">{h.name}</span>
                            <span className="s-item-cat">{h.cat}</span>
                          </span>
                          <span className="s-item-price">
                            <span>{inr(h.price)}</span>
                            {h.mrp && <s>{inr(h.mrp)}</s>}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link className="s-all" href={`/search?q=${encodeURIComponent(term)}`} onClick={close}>
                    See all results for &ldquo;{term}&rdquo;
                  </Link>
                </section>
              ) : (
                <section className="s-section">
                  <p className="s-note">No match for &ldquo;{term}&rdquo;. Try a theme or a budget.</p>
                  <div className="s-chips">
                    {POPULAR.filter((c) => c.href).map((c) => (
                      <Link key={c.label} className="s-chip" href={c.href!} onClick={close}>
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** The collection's "Search gifts /" button: opens the sheet, or the search page without script. */
export function SearchButton() {
  return (
    <Link
      className="m-searchbtn"
      href="/search"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        openSearch();
      }}
    >
      <Icon name="search" size={16} />
      <span>Search gifts</span>
      <kbd aria-hidden="true">/</kbd>
    </Link>
  );
}
