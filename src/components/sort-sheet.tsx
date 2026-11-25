"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icon";

export type SortOption = { key: string; label: string; href: string };

/**
 * The shop page's Sort control: a pill that opens a bottom sheet on phones and a
 * small card under the pill on wider screens. Each option is a plain link, so
 * sorting works without JavaScript too (the server sorts from ?sort=).
 */
export function SortSheet({ options, current }: { options: SortOption[]; current: string }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const on = options.find((o) => o.key === current) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    panel.current?.querySelector<HTMLElement>('[aria-current="true"]')?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="m-sort">
      <button ref={btn} type="button" className="m-sort-btn" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Icon name="sort" size={15} />
        <span>
          Sort<span className="m-sort-cur">: {on.label}</span>
        </span>
      </button>
      {open && (
        <>
          <div className="m-sort-shade" aria-hidden="true" onClick={() => setOpen(false)} />
          <div ref={panel} className="m-sort-sheet" role="dialog" aria-label="Sort gifts">
            <span className="m-sort-grab" aria-hidden="true" />
            <div className="m-sort-head">
              <span className="m-sort-title">Sort by</span>
              <button type="button" className="m-sort-x" aria-label="Close" onClick={() => setOpen(false)}>
                <Icon name="x" size={14} />
              </button>
            </div>
            <ul>
              {options.map((o) => (
                <li key={o.key}>
                  <Link href={o.href} scroll={false} aria-current={o.key === on.key ? "true" : undefined} onClick={() => setOpen(false)}>
                    {o.label}
                    <span className="m-sort-radio" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
