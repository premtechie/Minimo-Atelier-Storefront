"use client";

/*
 * "Delivery details" on product pages, in the same flow as the approved
 * design: a pill field with Check inside, then "Delivering to 500032 ✓ Change"
 * and one row per courier speed with its date and price. Prices are Velocity
 * Shipping's, from the shop's location, for this many pieces.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { etaText, fetchQuote, isPin, savePin, savedPin, shortDate, type Piece, type Quote } from "@/lib/delivery";
import { inr } from "@/lib/format";
import { Icon } from "./icon";
import { waLink } from "@/lib/whatsapp";

function dayName(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

/** Today's wording, used until Velocity prices are switched on (or when it can't be reached). */
function Fallback({ pin }: { pin: string }) {
  return pin.startsWith("500") ? (
    <p className="d-pin-date">
      <Icon name="truck" size={16} />
      <span>
        Hyderabad delivery by <strong>{dayName(3)}</strong>
      </span>
    </p>
  ) : (
    <p className="d-pin-date">
      <Icon name="truck" size={16} />
      <span>
        Courier across India in <strong>4–7 days</strong>
      </span>
    </p>
  );
}

export function DeliveryCheck({ pieces }: { pieces: Piece[] }) {
  const [pin, setPin] = useState("");
  const [shown, setShown] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const key = pieces.map((p) => `${p.sku}x${p.qty}`).join(",");

  const check = useCallback(
    async (p: string) => {
      setBusy(true);
      setShown(p);
      const q = await fetchQuote(p, pieces);
      setQuote(q);
      setBusy(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  // A pincode checked before (here or at checkout) is shown straight away,
  // and re-priced when the quantity changes.
  const [auto, setAuto] = useState<string | null>(null);
  useEffect(() => {
    const p = shown ?? (auto === null ? savedPin() : null);
    if (!p || busy) return;
    let live = true;
    void fetchQuote(p, pieces).then((q) => {
      if (!live) return;
      setAuto(p);
      setPin((cur) => cur || p);
      setShown(p);
      setQuote(q);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const submit = () => {
    if (!isPin(pin)) {
      setErr("Enter a 6-digit pincode");
      input.current?.focus();
      return;
    }
    setErr("");
    savePin(pin);
    void check(pin);
  };

  const live = quote?.available ? quote : null;
  const rows = live ? [live.express, live.standard].filter((o) => o !== null) : [];

  return (
    <div className="d-pin" aria-live="polite" aria-busy={busy}>
      {shown === null ? (
        <>
          <form
            className="d-pin-field"
            data-invalid={err ? "" : undefined}
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Icon name="pin" size={18} />
            <input
              ref={input}
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter pincode"
              aria-label="Pincode"
              autoComplete="postal-code"
              aria-invalid={!!err}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
                setErr("");
              }}
            />
            <button className="d-pin-btn">Check</button>
          </form>
          {err ? (
            <p className="d-pin-err">{err}</p>
          ) : (
            <p className="d-pin-row">
              <span className="d-pin-date">
                <Icon name="store" size={16} /> Free pickup or Honer Vivantis delivery
              </span>
            </p>
          )}
        </>
      ) : (
        <>
          <div className="d-pin-row d-pin-enter">
            <p className="d-pin-where">
              <Icon name="pin" size={16} />
              <span>
                Delivering to <strong>{shown}</strong>
              </span>
              {!busy && quote && quote.available && <Icon name="check" size={14} />}
            </p>
            <button
              type="button"
              className="d-pin-link"
              aria-label={`Change pincode ${shown}`}
              onClick={() => {
                setShown(null);
                setQuote(null);
                setTimeout(() => input.current?.select(), 0);
              }}
            >
              Change
            </button>
          </div>
          {busy ? (
            <>
              <div className="d-pin-row">
                <span className="d-pin-skel" />
              </div>
              <div className="d-pin-row">
                <span className="d-pin-skel d-pin-skel--short" />
              </div>
            </>
          ) : quote && !quote.available && quote.reason === "not_serviceable" ? (
            <div className="d-pin-row d-pin-enter d-pin-enter--2">
              <p className="d-pin-date">
                <Icon name="info" size={16} />
                <span>Couriers don&apos;t reach this pincode yet.</span>
              </p>
              <a className="d-pin-link" data-wa-source="Delivery check: ask about PIN" href={waLink(`Hi Minimo, can you deliver to ${shown}?`)} target="_blank" rel="noopener">
                Ask us
              </a>
            </div>
          ) : rows.length ? (
            rows.map((o, i) => (
              <div className={`d-pin-row d-pin-enter ${i ? "d-pin-enter--3" : "d-pin-enter--2"}`} key={o.speed}>
                <p className="d-pin-date">
                  <Icon name={o.speed === "express" ? "sparkle" : "truck"} size={16} />
                  <span>
                    <strong>{o.speed === "express" ? "Express" : "Standard"}</strong> · {etaText(o, shown)}
                    {shortDate(o.by) ? <span className="d-pin-by"> · by {shortDate(o.by)}</span> : null}
                  </span>
                </p>
                <span className="d-pin-pill">{inr(o.price)}</span>
              </div>
            ))
          ) : (
            <div className="d-pin-row d-pin-enter d-pin-enter--2">
              <Fallback pin={shown} />
            </div>
          )}
          {!busy && (
            <p className="d-pin-row d-pin-note d-pin-enter d-pin-enter--3">
              <span className="d-pin-date">
                <Icon name="store" size={16} /> Or free pickup at our store in Honer Vivantis
              </span>
            </p>
          )}
        </>
      )}
    </div>
  );
}
