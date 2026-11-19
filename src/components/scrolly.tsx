"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icon";

const STEPS = {
  rg: [
    ["Set guests & budget", "Tell us how many little guests and your budget per bag. Split boys and girls if you like."],
    ["Pick a bag", "Paper, heart translucent, themed or jute. Only bags we have enough of show up."],
    ["Fill it from real stock", "Tap to add. The bar shows your per-guest price as you go, and warns before an item runs short."],
    ["Add name tags", "“Thank you for coming to Aarav’s 6th birthday”. Pick a design and see it live."],
    ["Ready in 48 hours", "Pick up at our store, free delivery inside Honer Vivantis, or courier anywhere in India."],
  ],
  hm: [
    ["Pick a budget", "₹499, ₹999, ₹1,499 or your own. Birthdays, Christmas, Secret Santa or a thank-you."],
    ["Choose the box", "A gift box lined with kraft shred."],
    ["Fill it from real stock", "Tap to add from what is in the store. The bar keeps you inside your budget."],
    ["Add a card & wrap", "Write a message for the card. We tie it with ribbon."],
    ["Ready in 48 hours", "Pick up at our store, free delivery inside Honer Vivantis, or courier anywhere in India."],
  ],
} as const;
const IMGS = {
  rg: ["/art/steps/s1.webp", "/art/steps/s2.webp", "/art/steps/s3.webp", "/art/steps/s4.webp", "/art/steps/s5.webp"],
  hm: ["/art/steps/hamper-1.webp", "/art/steps/hamper-2.webp", "/art/steps/hamper-3.webp", "/art/steps/hamper-4.webp", "/art/steps/hamper-5.webp"],
};
const SHAPES: [number, number, number, number, string][] = [
  [8, 0.12, 18, 16, "dot"],
  [86, 0.2, -24, 22, "ring"],
  [14, 0.62, 40, 12, "star"],
  [78, 0.7, 12, 18, "dot"],
  [48, 0.9, -30, 14, "ring"],
  [30, 0.35, 0, 10, "star"],
  [64, 0.48, 22, 12, "dot"],
];

/** "From idea to party bag": the stage stays pinned while scrolling steps through five pictures. */
export function Scrolly() {
  const [mode, setMode] = useState<"rg" | "hm">("rg");
  const [prog, setProg] = useState(0);
  const [narrow, setNarrow] = useState(true);
  const ref = useRef<HTMLElement>(null);
  const steps = STEPS[mode];
  const n = steps.length;

  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const range = el.offsetHeight - window.innerHeight;
        setNarrow(window.innerWidth < 768);
        setProg(Math.min(Math.max(-r.top / Math.max(range, 1), 0), 0.999));
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

  const f = prog * n;
  const i = Math.min(n - 1, Math.floor(f));

  // The step that just left fades out in a blur while the new one condenses in.
  const shown = `${mode}${i}`;
  const last = useRef(shown);
  const [out, setOut] = useState<{ key: string; step: readonly [string, string] } | null>(null);
  useEffect(() => {
    if (last.current === shown) return;
    const [m, k] = [last.current.slice(0, 2) as "rg" | "hm", Number(last.current.slice(2))];
    last.current = shown;
    // Keeps the outgoing caption on screen just long enough to animate away.
    setOut({ key: `${m}${k}-out`, step: STEPS[m][k] });
    const t = setTimeout(() => setOut(null), 650);
    return () => clearTimeout(t);
  }, [shown]);

  const [swap, setSwap] = useState(false);
  const pick = (m: "rg" | "hm") => {
    if (m === mode) return;
    setMode(m);
    setSwap(true);
    setTimeout(() => setSwap(false), 600);
  };
  const short = (d: string) => `${d.split(". ")[0].replace(/\.$/, "")}.`;
  const copy = (st: readonly [string, string], vapour: boolean) => (
    <>
      <p className="m-sc-step">
        {vapour
          ? st[0].split(" ").map((w, j) => (
              <span key={j}>
                <span className="m-vapour" style={{ animationDelay: `${j * 45}ms` }}>
                  {w}
                </span>{" "}
              </span>
            ))
          : st[0]}
      </p>
      <p className="m-sc-desc is-short">{short(st[1])}</p>
      <p className="m-sc-desc is-long">{st[1]}</p>
    </>
  );

  return (
    <section
      ref={ref}
      className={`m-sc${mode === "hm" ? " is-hamper" : ""}${swap ? " is-swap" : ""}`}
      style={{ ["--sc-r" as string]: prog * 4 }}
      aria-labelledby="h-how"
    >
      <div className="m-sc-stage">
        <div className="m-sc-text">
          <div className="m-sc-head">
            <p className="m-eyebrow">Build your own</p>
            <h2 className="m-sc-title" id="h-how">
              {mode === "hm" ? "From idea to hamper" : "From idea to party bag"}
            </h2>
          </div>
          <p className="m-eyebrow m-sc-eyebrow">Build your own · 5 steps</p>
          <div className="m-switch" role="tablist" aria-label="What are you building?">
            <button role="tab" aria-selected={mode === "rg"} onClick={() => pick("rg")}>
              <Icon name="gift" size={15} /> Return gifts
            </button>
            <button role="tab" aria-selected={mode === "hm"} onClick={() => pick("hm")}>
              <Icon name="basket" size={15} /> Hampers
            </button>
            <i className="m-switch-thumb" aria-hidden="true" style={{ translate: mode === "hm" ? "100% 0" : "0 0" }} />
          </div>
          <Link className="m-sc-go" href={mode === "hm" ? "/build?mode=hampers" : "/build"}>
            <Icon name="wand" size={16} /> {mode === "hm" ? "Build a hamper" : "Start building"}
          </Link>
          <div className="m-sc-caption">
            <div className="m-sc-words">
              {out && (
                <div className="m-sc-copy is-out" key={out.key} aria-hidden="true">
                  {copy(out.step, false)}
                </div>
              )}
              <div className="m-sc-copy is-in" key={shown}>
                {copy(steps[i], true)}
              </div>
            </div>
            <div className="m-sc-ring" aria-hidden="true">
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle className="m-sc-ring-track" cx="26" cy="26" r="24" />
                <circle className="m-sc-ring-fill" cx="26" cy="26" r="24" strokeDasharray="150.8" strokeDashoffset={150.8 * (1 - (i + 1) / n)} />
              </svg>
              <span className="m-sc-num" key={shown}>
                0{i + 1}
              </span>
            </div>
          </div>
          <ol className="m-sr">
            {steps.map((st) => (
              <li key={st[0]}>
                {st[0]}: {st[1]}
              </li>
            ))}
          </ol>
        </div>
        <div className="m-sc-bg" aria-hidden="true">
          {SHAPES.map(([x, y, r, sz, k], j) => (
            <span
              key={j}
              className={`m-sc-shape is-${k}`}
              style={{
                left: `${x}%`,
                width: sz,
                height: sz,
                transform: `translate3d(-50%, calc(${(y - prog * ((j % 3) + 1) * 0.35).toFixed(3)} * (100svh + 80px) - 40px), 0) rotate(${r}deg)`,
              }}
            />
          ))}
        </div>
        <div className="m-sc-frame" aria-hidden="true">
          {IMGS[mode].map((src, j) => {
            let d = f - (j + 0.5);
            if (j === 0 && d < 0) d = 0;
            if (j === n - 1 && d > 0) d = 0;
            const a = Math.abs(d);
            return (
              <figure
                key={src}
                className="m-sc-fig"
                style={{
                  opacity: Math.max(0, Math.min(1, 1.35 - a * 1.7)),
                  transform: `translate3d(${(-d * 6).toFixed(2)}%, ${(-d * (narrow ? 6 : 14)).toFixed(2)}%, 0) scale(${(1 - a * 0.14).toFixed(3)}) rotate(${(-d * 5).toFixed(2)}deg)`,
                  filter: a > 0.35 ? `blur(${((a - 0.35) * 10).toFixed(1)}px)` : "none",
                  zIndex: 10 - Math.round(a * 4),
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" decoding="async" loading="lazy" draggable={false} />
              </figure>
            );
          })}
          <span className="m-sc-glow" />
        </div>
      </div>
    </section>
  );
}
