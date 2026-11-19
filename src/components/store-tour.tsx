"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SHOP } from "@/lib/merch";
import { waLink } from "@/lib/whatsapp";
import { Icon } from "./icon";

/*
 * The store walk-through in the approved design's markup (its sv- classes are
 * e-sv- here; rules in styles/design/visit.css): the video grows from a card to
 * full width as you scroll, and "Watch full screen" opens a stories-style tour.
 */

const CHAPTERS: [number, string][] = [
  [0, "Walk in, everything is on open shelves"],
  [4, "Toys, bags and kids' favourites"],
  [7.3, "Jewellery, hair accessories and gift boxes"],
  [11.1, "Bags, boxes and fillers to pick by hand"],
  [17.2, "Inside Honer Vivantis, Hyderabad"],
  [20.7, "Come say hello"],
];
const SRC = "/video/store-tour.mp4";
const POSTER = "/video/store-tour-poster.webp";
const chapterAt = (t: number) => CHAPTERS.reduce((i, [s], k) => (t >= s ? k : i), 0);
const nn = (i: number) => String(i + 1).padStart(2, "0");

/** Caption that replays its rise animation each time the chapter changes. */
function Caption({ i, className }: { i: number; className: string }) {
  return (
    <div className={`${className} is-in`} key={i} aria-live="polite">
      <span className="e-sv-cap-n">{nn(i)}</span>
      <span className="e-sv-cap-t">{CHAPTERS[i][1]}</span>
    </div>
  );
}

export function StoreTour() {
  const ref = useRef<HTMLElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLElement>(null);
  const [ch, setCh] = useState(0);
  const [open, setOpen] = useState(false);
  const [tour, setTour] = useState(false);

  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const span = Math.max(1, r.height - vh);
        const p = Math.min(1, Math.max(0, -r.top / (span * 0.7)));
        el.style.setProperty("--p", p.toFixed(3));
        el.style.setProperty("--svh", `${vh}px`);
        el.style.setProperty("--hdr-h", `${document.querySelector("header")?.getBoundingClientRect().height ?? 64}px`);
        setOpen(p > 0.92);
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, []);

  const onTime = () => {
    const v = vid.current;
    if (!v) return;
    if (bar.current) bar.current.style.transform = `scaleX(${v.currentTime / (v.duration || 24.2)})`;
    setCh(chapterAt(v.currentTime));
  };

  return (
    <section ref={ref} className={`e-sv-scroll ${open ? "is-open" : ""}`} aria-label="Walk through our store">
      <div className="e-sv-sticky">
        <div className="e-sv-bg" style={{ backgroundImage: `url(${POSTER})` }} aria-hidden="true" />
        <div className="e-sv-head">
          <span className="d-eyebrow">Visit our store</span>
          <h1>
            See it before <em>you buy</em>.
          </h1>
          <p>Scroll to step inside</p>
          <span className="e-sv-cue" aria-hidden="true">
            <Icon name="chevR" size={16} />
          </span>
        </div>
        <div className="e-sv-media">
          <video ref={vid} src={SRC} poster={POSTER} muted loop playsInline autoPlay preload="auto" onTimeUpdate={onTime} aria-label="Video walk-through of the Minimo Atelier store" />
          <div className="e-sv-shade" aria-hidden="true" />
          <Caption i={ch} className="e-sv-cap" />
          <div className="e-sv-bar" aria-hidden="true">
            <i ref={bar} />
          </div>
          <button className="e-sv-full" onClick={() => setTour(true)} tabIndex={open ? 0 : -1}>
            <Icon name="play" size={14} />
            Watch full screen
          </button>
        </div>
      </div>
      {tour && <FullTour onClose={() => setTour(false)} />}
    </section>
  );
}

/** Full-screen, stories-style tour: a bar per chapter, tap sides to skip, hold to pause. */
function FullTour({ onClose }: { onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const bars = useRef<(HTMLElement | null)[]>([]);
  const [ch, setCh] = useState(0);
  const [inn, setIn] = useState(false);
  const [end, setEnd] = useState(false);
  const hold = useRef<{ t?: ReturnType<typeof setTimeout>; held: boolean; skip: boolean }>({ held: false, skip: false });

  const close = useCallback(() => {
    setIn(false);
    vid.current?.pause();
    setTimeout(onClose, 380);
  }, [onClose]);

  const seek = useCallback((d: number) => {
    const v = vid.current;
    if (!v) return;
    const i = chapterAt(v.currentTime);
    if (d > 0 && i === CHAPTERS.length - 1) {
      v.pause();
      setEnd(true);
      return;
    }
    const j = Math.max(0, Math.min(CHAPTERS.length - 1, i + d));
    setEnd(false);
    v.currentTime = d < 0 && v.currentTime - CHAPTERS[i][0] > 1.2 ? CHAPTERS[i][0] : CHAPTERS[j][0] + 0.01;
    v.play().catch(() => {});
  }, []);

  useEffect(() => {
    const r = requestAnimationFrame(() => setIn(true));
    vid.current?.play().catch(() => {});
    box.current?.querySelector<HTMLElement>(".e-sv-tour-x")?.focus({ preventScroll: true });
    document.body.style.overflow = "hidden";
    let raf = 0;
    const tick = () => {
      const v = vid.current;
      if (v) {
        const t = v.currentTime;
        const i = chapterAt(t);
        bars.current.forEach((b, k) => {
          if (!b) return;
          const s = CHAPTERS[k][0];
          const e = CHAPTERS[k + 1]?.[0] ?? (v.duration || 24.2);
          b.style.transform = `scaleX(${k < i ? 1 : k > i ? 0 : Math.min(1, (t - s) / (e - s))})`;
        });
        setCh(i);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") seek(1);
      if (e.key === "ArrowLeft") seek(-1);
    };
    document.addEventListener("keydown", key);
    return () => {
      cancelAnimationFrame(r);
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", key);
      document.body.style.overflow = "";
    };
  }, [close, seek]);

  const onDown = () => {
    hold.current.t = setTimeout(() => {
      vid.current?.pause();
      hold.current.held = true;
    }, 220);
  };
  const onUp = () => {
    clearTimeout(hold.current.t);
    if (hold.current.held) {
      hold.current.held = false;
      hold.current.skip = true;
      vid.current?.play().catch(() => {});
    }
  };
  const onTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (hold.current.skip) {
      hold.current.skip = false;
      return;
    }
    seek(Number(e.currentTarget.dataset.d));
  };

  return createPortal(
    <div ref={box} className={`e-sv-tour ${inn ? "is-in" : ""} ${end ? "is-end" : ""}`} role="dialog" aria-modal="true" aria-label="Store tour">
      <div className="e-sv-tour-bg" style={{ backgroundImage: `url(${POSTER})` }} />
      <video ref={vid} className="e-sv-tour-vid" src={SRC} poster={POSTER} muted playsInline autoPlay preload="auto" onEnded={() => setEnd(true)} />
      <div className="e-sv-tour-shade" />
      <div className="e-sv-tour-top">
        <div className="e-sv-tour-bars">
          {CHAPTERS.map(([s], k) => (
            <span key={s}>
              <i ref={(el) => void (bars.current[k] = el)} />
            </span>
          ))}
        </div>
        <div className="e-sv-tour-who">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.png" alt="" />
          <span>
            <b>{SHOP.name}</b>
            <small>Inside Honer Vivantis</small>
          </span>
          <button className="e-sv-tour-x" onClick={close} aria-label="Close tour">
            <Icon name="x" size={20} />
          </button>
        </div>
      </div>
      <button className="e-sv-tap e-sv-tap-l" aria-label="Previous" data-d={-1} onPointerDown={onDown} onPointerUp={onUp} onClick={onTap} />
      <button className="e-sv-tap e-sv-tap-r" aria-label="Next" data-d={1} onPointerDown={onDown} onPointerUp={onUp} onClick={onTap} />
      <Caption i={ch} className="e-sv-tour-cap" />
      <div className="e-sv-tour-cta">
        <a className="e-sv-btn" href={SHOP.mapsUrl} target="_blank" rel="noopener">
          <Icon name="pin" size={18} /> Get directions
        </a>
        <a className="e-sv-btn e-sv-btn--wa" href={waLink("Hi Minimo, I'd like to visit the store.")} target="_blank" rel="noopener">
          <Icon name="wa" size={18} /> Plan a visit
        </a>
      </div>
      <button
        className="e-sv-tour-more"
        onClick={() => {
          close();
          setTimeout(() => document.getElementById("store-info")?.scrollIntoView({ behavior: "smooth" }), 400);
        }}
      >
        Store details and hours <Icon name="chevR" size={16} />
      </button>
    </div>,
    document.body,
  );
}
