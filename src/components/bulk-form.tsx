"use client";

import { useState } from "react";
import { waLink } from "@/lib/whatsapp";
import { Icon } from "./icon";

/** Bulk and school order request, sent to the shop on WhatsApp. The design's quote panel (styles/design/visit.css). */
export function BulkForm() {
  const [msg, setMsg] = useState("");
  const [min] = useState(() => new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10));
  const [def] = useState(() => new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10));
  return (
    <form
      className="e-panel"
      noValidate
      aria-labelledby="h-quote"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const v = (k: string) => String(f.get(k) ?? "").trim();
        const n = Number(v("count"));
        if (!v("name")) return setMsg("Add your name.");
        if (!Number.isFinite(n) || n < 15) return setMsg("Bulk orders start at 15 pieces.");
        setMsg("WhatsApp is opening with your request.");
        const lines = [
          "Hi Minimo, a bulk order request:",
          `Name: ${v("name")}`,
          v("occasion") && `For: ${v("occasion")}`,
          `How many: ${n}`,
          v("budget") && `Budget each: ₹${v("budget")}`,
          v("date") && `Needed by: ${new Date(v("date")).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
          v("notes") && `Notes: ${v("notes")}`,
        ].filter(Boolean);
        window.open(waLink(lines.join("\n")), "_blank", "noopener");
      }}
    >
      <h3 id="h-quote">Get a quote</h3>
      <div className="e-field">
        <label htmlFor="bk-name">Your name</label>
        <input className="e-input" id="bk-name" name="name" autoComplete="name" maxLength={60} required />
      </div>
      <div className="e-field">
        <label htmlFor="bk-org">School or occasion</label>
        <input className="e-input" id="bk-org" name="occasion" placeholder="e.g. Class 2B Children's Day" maxLength={80} />
      </div>
      <div className="e-row" style={{ gap: 10 }}>
        <div className="e-field" style={{ flex: 1 }}>
          <label htmlFor="bk-qty">How many?</label>
          <input className="e-input" id="bk-qty" name="count" inputMode="numeric" defaultValue={30} />
        </div>
        <div className="e-field" style={{ flex: 1 }}>
          <label htmlFor="bk-bud">Budget each (₹)</label>
          <input className="e-input" id="bk-bud" name="budget" inputMode="numeric" defaultValue={99} />
        </div>
      </div>
      <div className="e-field">
        <label htmlFor="bk-date">Needed by</label>
        <input className="e-input" id="bk-date" name="date" type="date" min={min} defaultValue={def} />
      </div>
      <div className="e-field">
        <label htmlFor="bk-note">Anything else?</label>
        <textarea className="e-input" id="bk-note" name="notes" maxLength={400} placeholder="Theme, boys/girls split, name tags…" />
      </div>
      <button className="e-btn e-btn-wa e-btn-block" type="submit">
        <Icon name="wa" size={18} /> Send on WhatsApp
      </button>
      <span className="small muted" role="status">
        {msg}
      </span>
    </form>
  );
}
