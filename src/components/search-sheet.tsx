"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { inr } from "@/lib/format";
import { EIcon, Icon } from "./icon";

type Hit = { name: string; price: number; href: string; img: string | null };

/** Ask the search sheet to open, from any button. */
export const openSearch = () => window.dispatchEvent(new Event("mm:search"));

/** The design's search sheet: a bottom sheet on phones, a centred card on wide screens. */
export function SearchSheet() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
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
        .then((d: { hits: Hit[] }) => setHits(d.hits))
        .catch(() => {});
    }, 120);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q]);

  const close = () => setOpen(false);
  const term = q.trim();
  return (
    <>
      <div className={`e-overlay ${open ? "open" : ""}`} onClick={close} aria-hidden="true" />
      <div className={`e-sheet e-sheet-center ${open ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="Search" inert={!open}>
        <div className="e-grab" />
        <div className="e-sh-head">
          <h3>Search</h3>
          <button className="e-icon-btn" onClick={close} aria-label="Close">
            <Icon name="x" size={22} />
          </button>
        </div>
        <div className="e-sh-body">
          <form
            className="e-searchbox"
            role="search"
            action="/search"
            onSubmit={() => close()}
          >
            <EIcon name="search" sm />
            <input ref={input} name="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search gifts, themes, budgets…" enterKeyHint="search" autoComplete="off" aria-label="Search gifts" />
          </form>
          <div className="e-stack" style={{ marginTop: 12 }} aria-live="polite">
            {!term || hits === null ? (
              <span className="e-small e-muted">Try &quot;unicorn&quot;, &quot;bottle&quot; or &quot;99&quot;</span>
            ) : hits.length ? (
              hits.map((h) => (
                <Link key={h.href} className="e-pair" href={h.href} onClick={close} style={{ textDecoration: "none" }}>
                  <span className={`e-photo ${h.img ? "has-img" : ""}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {h.img && <img src={h.img} alt="" loading="lazy" onError={(e) => void (e.currentTarget.hidden = true)} />}
                  </span>
                  <span className="e-nm">{h.name}</span>
                  <span className="e-price e-num">{inr(h.price)}</span>
                </Link>
              ))
            ) : (
              <div className="e-empty" style={{ padding: 20 }}>
                <p>No match for &quot;{q}&quot;. Try a theme or a budget.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
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
