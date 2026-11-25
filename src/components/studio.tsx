"use client";

import { SafeImg } from "./safe-img";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Icon } from "./icon";
import { useShop } from "./shop-provider";
import type { CartPart } from "@/lib/cart";
import { inr, plural } from "@/lib/format";
import { buildName, CAPS, decodeShare, encodeShare, itemStyle, MAX_ITEMS, slots, tabForWho, WHO, type Mode, type SavedBuild } from "@/lib/studio";
import type { StudioBox, StudioData, StudioPiece, StudioStart } from "@/lib/studio-data";

type It = { sku: string; u: number };
type Fly = { x: number; y: number; rot: number; scale: number };
type Filter = "all" | "fav" | "rg" | "hm" | "fit";

const SAVE_KEY = "minimo-builds-v1";
/** Pieces shown per tray tab before "Show more", so the page stays short. */
const TRAY_FIRST = 12;
const BITS = ["#E7B7A8", "#F4D9A1", "#B9DCC9", "#D9C6E8", "#C79A7A"];
const art = (k: string) => `/art/studio/${k}.webp`;
const boxImg = (b: Pick<StudioBox, "art" | "img">) => b.img ?? art(b.art);
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let uid = 0;
const nextU = () => ++uid;
const newKey = () => Date.now().toString(36) + nextU().toString(36);

function readSaved(): SavedBuild[] {
  try {
    const v = JSON.parse(localStorage.getItem(SAVE_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function writeSaved(list: SavedBuild[]) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(list));
  } catch {
    /* private mode: builds last for this visit */
  }
}

/** The bag or box with its pieces, drawn in layers so items sit inside it. */
function BoxArt({
  box,
  items,
  pieces,
  state = 0,
  tagName,
  tagged = true,
  className = "",
  boxRef,
  itemsRef,
  ghostsRef,
  onOut,
  hf,
}: {
  box: StudioBox;
  items: It[];
  pieces: Record<string, StudioPiece>;
  state?: 0 | 1 | 2;
  tagName?: string;
  /** False when the shopper turned the name tag off. */
  tagged?: boolean;
  className?: string;
  boxRef?: React.Ref<HTMLDivElement>;
  itemsRef?: React.Ref<HTMLDivElement>;
  ghostsRef?: React.Ref<HTMLDivElement>;
  onOut?: (u: number) => void;
  hf?: number;
}) {
  const s = slots(items.length, box);
  const [aw, ah] = box.aspect;
  const style = { "--ar": `${aw}/${ah}`, "--arw": aw, "--arh": ah, "--w": box.w, "--hf": hf ?? box.hf, "--rim": `${(box.rim * 100).toFixed(2)}%` } as CSSProperties;
  const live = !!onOut;
  return (
    <div ref={boxRef} className={`st-box ${box.hamper ? "is-hamper" : ""} ${box.photo ? "is-photo" : ""} ${state === 1 ? "is-wrapping" : ""} ${state === 2 ? "is-wrapping is-wrapped" : ""} ${className}`} style={style}>
      {/* eslint-disable @next/next/no-img-element */}
      <img className="st-back" src={boxImg(box)} alt="" draggable={false} />
      {box.hamper && <img className="st-shred st-shred--back" src={art("shred")} alt="" draggable={false} />}
      <div className="st-items" ref={itemsRef}>
        {items.map((it, i) => {
          const p = pieces[it.sku];
          if (!p) return null;
          const st = itemStyle(s[i], i, box, p.size);
          const img = <SafeImg src={p.img} alt="" draggable={false} />;
          return live ? (
            <button key={it.u} type="button" className={`st-it ${p.cut ? "" : "is-photo"}`} data-u={it.u} style={st} aria-label={`Take out ${p.name}`} onClick={() => onOut(it.u)}>
              {img}
            </button>
          ) : (
            <span key={it.u} className={`st-it ${p.cut ? "" : "is-photo"}`} style={st}>
              {img}
            </span>
          );
        })}
      </div>
      {live && <div className="st-items st-items--ghosts" ref={ghostsRef} aria-hidden="true" />}
      {box.hamper && <img className="st-shred st-shred--front" src={art("shred")} alt="" draggable={false} />}
      {!box.photo && <img className="st-front" src={art(box.art)} alt="" draggable={false} style={box.see ? { opacity: box.see } : undefined} />}
      {live && (
        <div className="st-wrap" aria-hidden="true">
          {box.hamper ? <img className="st-lid" src={art("c_lid")} alt="" /> : <img className="st-tissue" src={art("tissue")} alt="" />}
          {box.hamper ? (
            <>
              <img className="st-gcard" src={art("card")} alt="" />
              <img className="st-sprig" src={art("sprig")} alt="" />
            </>
          ) : tagged && (
            <span className="st-tagwrap">
              <img className="st-tag" src={art("tag")} alt="" />
              <b className="st-tagname">{tagName || "For you"}</b>
            </span>
          )}
        </div>
      )}
      {/* eslint-enable @next/next/no-img-element */}
    </div>
  );
}

export function Studio({ data, start }: { data: StudioData; start: StudioStart }) {
  const { add, toast } = useShop();
  const pieces = useMemo(() => {
    const m: Record<string, StudioPiece> = {};
    for (const t of [...data.tabs.rg, ...data.tabs.hm]) for (const p of t.items) m[p.sku] = p;
    for (const p of start.extra ?? []) m[p.sku] = p;
    return m;
  }, [data, start.extra]);
  const boxesFor = useCallback((m: Mode) => data.boxes.filter((b) => !!b.hamper === (m === "hm")), [data.boxes]);

  const [mode, setMode] = useState<Mode>(start.mode);
  const [boxKey, setBoxKey] = useState<string | undefined>(start.box);
  const [items, setItems] = useState<It[]>(() => (start.items ?? []).map((sku) => ({ sku, u: nextU() })));
  const [cap, setCapState] = useState<Record<Mode, number>>({ rg: CAPS.rg[1], hm: CAPS.hm[1] });
  const [capCustom, setCapCustom] = useState<Record<Mode, boolean>>({ rg: false, hm: false });
  const [who, setWho] = useState<Record<Mode, string>>({ rg: "", hm: "" });
  const [whoOther, setWhoOther] = useState<Record<Mode, boolean>>({ rg: false, hm: false });
  const [tab, setTab] = useState<string | null>(null);
  const [traySwap, setTraySwap] = useState(0);
  const [wrap, setWrap] = useState<0 | 1 | 2>(0);
  const [name, setName] = useState("");
  const [guests, setGuests] = useState(20);
  const [hinted, setHinted] = useState(false);
  const [boxIn, setBoxIn] = useState(false);
  const [saved, setSaved] = useState<SavedBuild[]>([]);
  const [shared, setShared] = useState<SavedBuild[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [sortPrice, setSortPrice] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | "all" | "fav">(null);
  const [flash, setFlash] = useState(0);
  const [more, setMore] = useState(false);
  const [find, setFind] = useState("");
  /** The ₹10 wish tag on a return-gift bag: on by default, the shopper may drop it. */
  const [withTag, setWithTag] = useState(true);

  const stageRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);
  const ghostsRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const meterRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const optsRef = useRef<HTMLDivElement>(null);
  const savedRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const fly = useRef<{ u: number; from?: Fly } | null>(null);
  const saveFly = useRef<{ k: string; ghost: HTMLElement; from: DOMRect } | null>(null);
  const dropIn = useRef(false);

  const rg = mode === "rg";
  const boxes = boxesFor(mode);
  const box = boxes.find((b) => b.key === boxKey) ?? boxes[0];
  const tabs = data.tabs[mode];
  const curTab = tabs.find((t) => t.name === tab) ?? tabs[0];
  // Search looks through every tab of this mode, so a shopper needn't know where a piece lives.
  const words = find.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const found = words.length
    ? [...new Map(tabs.flatMap((t) => t.items).map((p) => [p.sku, p])).values()].filter((p) => {
        const n = p.name.toLowerCase();
        return words.every((w) => n.includes(w));
      })
    : null;
  const trayList = found ?? (more ? curTab?.items ?? [] : (curTab?.items ?? []).slice(0, TRAY_FIRST));
  const capNow = cap[mode];
  const tag = rg && withTag ? data.tag : null;
  const max = MAX_ITEMS[mode];

  const priceOf = useCallback(
    (b: { m: Mode; box: string; items: string[]; noTag?: boolean }) => {
      const bx = data.boxes.find((x) => x.key === b.box);
      return b.items.reduce((s, k) => s + (pieces[k]?.price ?? 0), 0) + (bx?.price ?? 0) + (b.m === "rg" && data.tag && !b.noTag ? data.tag.price : 0);
    },
    [data, pieces],
  );
  const total = box ? priceOf({ m: mode, box: box.key, items: items.map((i) => i.sku), noTag: !withTag }) : 0;
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const i of items) m[i.sku] = (m[i.sku] ?? 0) + 1;
    return m;
  }, [items]);

  /** One bag or hamper as cart parts: the pieces, the bag and (for return gifts) the wish tag. */
  const parts: CartPart[] = [
    ...Object.entries(counts).map(([sku, qty]) => ({ sku, qty })),
    ...(box ? [{ sku: box.sku, qty: 1 }] : []),
    ...(tag ? [{ sku: tag.sku, qty: 1 }] : []),
  ];
  /** How many of this build the shop can make from today's stock. */
  const canMake = parts.reduce((n, p) => {
    const c = p.sku === box?.sku ? box.cap : p.sku === tag?.sku ? tag.cap : (p.sku in pieces ? pieces[p.sku].cap : 0);
    return c === null ? n : Math.min(n, Math.floor(c / p.qty));
  }, Infinity);
  const maxGuests = Math.min(300, canMake);

  // Saved builds and share links live in this browser only.
  useEffect(() => {
    // Hydrate from the browser once; there is nothing to subscribe to.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(readSaved());
    const m = /^#s=([\w-]+)$/.exec(location.hash);
    if (m) {
      const list = decodeShare(m[1], (s) => !!pieces[s], data.boxes.map((b) => b.key));
      if (list.length) {
        setShared(list);
        setMode(list[0].m);
        setBoxKey(list[0].box);
        setItems([]);
        requestAnimationFrame(() => savedRef.current?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- motion ---------- */
  const wobble = () => {
    if (reduced()) return;
    boxRef.current?.animate([{ transform: "scale(1,1)" }, { transform: "scale(1.035,.965)" }, { transform: "scale(.985,1.02)" }, { transform: "scale(1,1)" }], { duration: 420, easing: "ease-out" });
  };
  const shake = () => {
    if (reduced()) return;
    boxRef.current?.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-7px) rotate(-1deg)" }, { transform: "translateX(6px) rotate(1deg)" }, { transform: "translateX(-3px)" }, { transform: "translateX(0)" }],
      { duration: 380 },
    );
  };
  const burst = (x?: number, y?: number) => {
    const fx = fxRef.current;
    const b = boxRef.current;
    if (!fx || !b || reduced()) return;
    const r = fx.getBoundingClientRect();
    if (x == null || y == null) {
      const br = b.getBoundingClientRect();
      x = br.left + br.width / 2;
      y = br.top + br.height * 0.3;
    }
    for (let i = 0; i < 12; i++) {
      const p = document.createElement("i");
      p.className = "st-bit" + (i % 3 ? "" : " st-bit--strip");
      p.style.left = `${x - r.left}px`;
      p.style.top = `${y - r.top}px`;
      p.style.background = BITS[i % BITS.length];
      fx.appendChild(p);
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const d = 50 + Math.random() * 70;
      p.animate(
        [
          { transform: "translate(-50%,-50%) scale(.4) rotate(0)", opacity: 1 },
          { transform: `translate(calc(-50% + ${Math.cos(ang) * d}px), calc(-50% + ${Math.sin(ang) * d}px)) rotate(${Math.random() * 360}deg) scale(1)`, opacity: 1, offset: 0.55 },
          { transform: `translate(calc(-50% + ${Math.cos(ang) * d * 1.2}px), calc(-50% + ${Math.sin(ang) * d + 60}px)) rotate(${Math.random() * 540}deg) scale(.8)`, opacity: 0 },
        ],
        { duration: 900 + Math.random() * 300, easing: "cubic-bezier(.2,.6,.4,1)" },
      ).onfinish = () => p.remove();
    }
  };
  const shakeMeter = () => {
    if (reduced()) return;
    meterRef.current?.animate([{ translate: "0 0" }, { translate: "-5px 0" }, { translate: "5px 0" }, { translate: "-2px 0" }, { translate: "0 0" }], { duration: 380 });
  };

  // A new piece flies from the tray (or the finger) and lands in its slot.
  useLayoutEffect(() => {
    const f = fly.current;
    if (f) {
      fly.current = null;
      const el = itemsRef.current?.querySelector<HTMLElement>(`[data-u="${f.u}"]`);
      if (!el || reduced()) return burst();
      const to = el.getBoundingClientRect();
      const tx = to.left + to.width / 2;
      const ty = to.top + to.height / 2;
      const fx = f.from ? f.from.x : tx;
      const fy = f.from ? f.from.y : ty - 160;
      const dx = fx - tx;
      const dy = fy - ty;
      const lift = Math.min(-60, dy - 70);
      el.animate(
        [
          { transform: `translate(calc(-50% + ${dx}px), ${dy}px) rotate(${f.from?.rot ?? -8}deg) scale(${f.from?.scale ?? 1.15})`, offset: 0 },
          { transform: `translate(calc(-50% + ${dx * 0.35}px), ${lift}px) rotate(-4deg) scale(1.08)`, offset: 0.42, easing: "cubic-bezier(.5,0,.9,.5)" },
          { transform: "translate(-50%, 6px) rotate(var(--r)) scale(1.04, .9)", offset: 0.82 },
          { transform: "translate(-50%, 0) rotate(var(--r)) scale(1)", offset: 1 },
        ],
        { duration: 640, easing: "cubic-bezier(.3,.7,.4,1)" },
      );
      setTimeout(() => {
        wobble();
        burst(tx, to.bottom - to.height * 0.25);
      }, 520);
    }
    if (dropIn.current) {
      dropIn.current = false;
      if (reduced()) return;
      itemsRef.current?.querySelectorAll<HTMLElement>(".st-it").forEach((el, i) =>
        el.animate([{ transform: "translate(-50%, -120px) rotate(var(--r))", opacity: 0 }, { transform: "translate(-50%, 0) rotate(var(--r))", opacity: 1 }], {
          duration: 520,
          delay: 120 + i * 70,
          easing: "cubic-bezier(.3,1.4,.5,1)",
          fill: "backwards",
        }),
      );
    }
  }, [items]);

  // A saved build shrinks into its card in the list.
  useLayoutEffect(() => {
    const s = saveFly.current;
    if (!s) return;
    saveFly.current = null;
    const card = savedRef.current?.querySelector<HTMLElement>(`[data-k="${s.k}"] .st-sv-prev`);
    if (!card) return s.ghost.remove();
    const to = card.getBoundingClientRect();
    const k = Math.min(to.width / s.from.width, to.height / s.from.height) * 0.8;
    const dx = to.left + to.width / 2 - (s.from.left + s.from.width / 2);
    const dy = to.top + to.height / 2 - (s.from.top + s.from.height / 2);
    s.ghost.animate(
      [
        { transform: "none", opacity: 1 },
        { transform: `translate(${dx * 0.5}px, ${Math.min(dy * 0.5, -120)}px) scale(${(1 + k) / 2}) rotate(-6deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${dx}px, ${dy}px) scale(${k})`, opacity: 0.2 },
      ],
      { duration: 760, easing: "cubic-bezier(.4,0,.2,1)" },
    ).onfinish = () => {
      s.ghost.remove();
      card.parentElement?.animate([{ transform: "scale(.9)" }, { transform: "scale(1.04)" }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.3,1.5,.5,1)" });
    };
  }, [saved]);

  /* ---------- actions ---------- */
  const addPiece = (sku: string, from?: Fly) => {
    if (!box) return;
    if (wrap) return toast("Unwrap it first to change what is inside");
    if (items.length >= max) {
      toast(`That ${box.hamper ? "hamper" : "bag"} is full. Take something out first.`);
      return shake();
    }
    const p = pieces[sku];
    if (!p) return;
    if (p.cap !== null && (counts[sku] ?? 0) >= p.cap) return toast(`We only have ${plural(p.cap, "piece", "pieces")} of ${p.name} today`);
    const u = nextU();
    fly.current = { u, from };
    setItems((prev) => [...prev, { sku, u }]);
    setHinted(true);
    if (total + p.price > capNow) setTimeout(shakeMeter, 300);
  };
  const addRef = useRef(addPiece);
  useEffect(() => {
    addRef.current = addPiece;
  });

  const removePiece = (u: number) => {
    if (wrap) return;
    const it = items.find((x) => x.u === u);
    if (!it) return;
    const el = itemsRef.current?.querySelector<HTMLElement>(`[data-u="${u}"]`);
    const host = ghostsRef.current;
    if (el && host && !reduced()) {
      const ghost = el.cloneNode(true) as HTMLElement;
      ghost.removeAttribute("data-u");
      ghost.setAttribute("tabindex", "-1");
      ghost.style.zIndex = "60";
      host.appendChild(ghost);
      const a = el.getBoundingClientRect();
      const card = trayRef.current?.querySelector(`[data-sku="${it.sku}"]`);
      const b = card ? card.getBoundingClientRect() : { left: a.left, top: a.top + 300, width: a.width, height: a.height };
      const dx = b.left + b.width / 2 - (a.left + a.width / 2);
      const dy = b.top + b.height / 2 - (a.top + a.height / 2);
      ghost.animate(
        [
          { transform: "translate(-50%, 0) rotate(var(--r))" },
          { transform: `translate(calc(-50% + ${dx * 0.3}px), -90px) rotate(10deg) scale(1.08)`, offset: 0.4 },
          { transform: `translate(calc(-50% + ${dx}px), ${dy}px) rotate(0deg) scale(.4)`, opacity: 0 },
        ],
        { duration: 520, easing: "cubic-bezier(.4,0,.2,1)" },
      ).onfinish = () => ghost.remove();
    }
    setItems((prev) => prev.filter((x) => x.u !== u));
  };

  const clearAll = () => {
    [...items].reverse().forEach((it, k) => setTimeout(() => removeRef.current(it.u), k * 70));
  };
  const removeRef = useRef(removePiece);
  useEffect(() => {
    removeRef.current = removePiece;
  });

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    setItems([]);
    setWrap(0);
    setTab(null);
    setEditing(null);
    setBoxKey(undefined);
    setTraySwap((n) => n + 1);
  };
  const pickBox = (k: string, el: HTMLElement) => {
    if (k === box?.key) return;
    setWrap(0);
    setBoxKey(k);
    setBoxIn(true);
    dropIn.current = true;
    const row = el.parentElement;
    row?.scrollTo({ left: el.offsetLeft - row.offsetLeft - (row.clientWidth - el.offsetWidth) / 2, behavior: reduced() ? "auto" : "smooth" });
  };
  const pickTab = (t: string) => {
    setTab(t);
    setMore(false);
    setFind("");
    setTraySwap((n) => n + 1);
  };
  const pickWho = (w: string) => {
    if (w === "__other") {
      setWhoOther((o) => ({ ...o, [mode]: true }));
      setWho((o) => ({ ...o, [mode]: "" }));
      return;
    }
    setWhoOther((o) => ({ ...o, [mode]: false }));
    const next = who[mode] === w ? "" : w;
    setWho((o) => ({ ...o, [mode]: next }));
    const want = tabForWho(mode, next);
    if (want && tabs.some((t) => t.name === want) && curTab?.name !== want) pickTab(want);
  };
  const setCap = (v: number) => setCapState((o) => ({ ...o, [mode]: v }));

  const doWrap = () => {
    if (!items.length) return;
    setWrap(1);
    setTimeout(() => {
      setWrap((w) => (w ? 2 : w));
      burst();
    }, reduced() ? 0 : 650);
    setGuests((g) => Math.max(1, Math.min(g, maxGuests)));
    if (window.innerWidth < 768) setTimeout(() => doneRef.current?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" }), 900);
  };
  const toCart = () => {
    if (!box || !items.length) return;
    const qty = rg ? Math.max(1, Math.min(guests, maxGuests)) : 1;
    if (canMake < 1) return toast("We can't make this one from today's stock. Swap a piece and try again.");
    const label = rg ? "Your return-gift bag" : "Your hamper";
    add({
      key: `build-${newKey()}`,
      kind: "build",
      name: label,
      price: total,
      qty,
      image: boxImg(box),
      parts,
      note: name.trim() || undefined,
      detail: `${box.name}: ${items.map((i) => pieces[i.sku]?.name).join(", ")}`,
      ref: box.key,
      bulk: rg,
    }, `${label} is in your cart`, { href: "/cart", label: "View cart" });
  };

  /* ---------- saved builds ---------- */
  const save = () => {
    if (!box || !items.length) return;
    const body = { m: mode, box: box.key, items: items.map((i) => i.sku), cap: capNow, name: name.trim(), who: who[mode], fav: false, noTag: rg && !withTag ? true : undefined };
    let k = editing;
    let list: SavedBuild[];
    let isNew = false;
    if (k && saved.some((b) => b.k === k)) list = saved.map((b) => (b.k === k ? { ...b, ...body, fav: b.fav } : b));
    else {
      k = newKey();
      isNew = true;
      list = [...saved, { k, ...body, t: Date.now() }];
    }
    const el = boxRef.current;
    if (el && !reduced()) {
      const from = el.getBoundingClientRect();
      const ghost = el.cloneNode(true) as HTMLElement;
      ghost.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
      Object.assign(ghost.style, { position: "fixed", left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`, translate: "none", bottom: "auto", zIndex: "9998", pointerEvents: "none", margin: "0" });
      document.body.appendChild(ghost);
      saveFly.current = { k, ghost, from };
    }
    setSaved(list);
    writeSaved(list);
    setEditing(null);
    setFilter("all");
    const n = list.length;
    toast(isNew ? (n < 5 ? `Build ${n} saved. Try another combo, most families compare 5.` : `Build ${n} saved. Heart the ones you like.`) : "Build updated");
    setItems([]);
    setWrap(0);
    setName("");
  };
  const listNow = shared ?? saved;
  const setList = (next: SavedBuild[]) => {
    if (shared) setShared(next);
    else {
      setSaved(next);
      writeSaved(next);
    }
  };
  const fav = (k: string, btn: HTMLElement) => {
    const b = listNow.find((x) => x.k === k);
    if (!b) return;
    setList(listNow.map((x) => (x.k === k ? { ...x, fav: !x.fav } : x)));
    if (!b.fav && !reduced()) {
      btn.animate([{ transform: "scale(1)" }, { transform: "scale(1.45)" }, { transform: "scale(.9)" }, { transform: "scale(1)" }], { duration: 480, easing: "ease-out" });
      const r = btn.getBoundingClientRect();
      for (let i = 0; i < 7; i++) {
        const h = document.createElement("i");
        h.className = "st-heartbit";
        h.style.left = `${r.left + r.width / 2}px`;
        h.style.top = `${r.top + r.height / 2}px`;
        document.body.appendChild(h);
        const a = (i / 7) * Math.PI * 2;
        h.animate(
          [{ transform: "translate(-50%,-50%) scale(.3)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * 26}px), calc(-50% + ${Math.sin(a) * 26}px)) scale(1)`, opacity: 0 }],
          { duration: 520, easing: "cubic-bezier(.2,.7,.3,1)" },
        ).onfinish = () => h.remove();
      }
    }
  };
  const load = (k: string) => {
    const b = listNow.find((x) => x.k === k);
    if (!b) return;
    setMode(b.m);
    setBoxKey(b.box);
    setWithTag(!b.noTag);
    setItems(b.items.filter((s) => pieces[s]).map((sku) => ({ sku, u: nextU() })));
    setName(b.name || "");
    setWrap(0);
    setWho((o) => ({ ...o, [b.m]: b.who || "" }));
    setWhoOther((o) => ({ ...o, [b.m]: !!b.who && !WHO[b.m].includes(b.who) }));
    setCapCustom((o) => ({ ...o, [b.m]: !CAPS[b.m].includes(b.cap) }));
    setCapState((o) => ({ ...o, [b.m]: b.cap }));
    setEditing(shared ? null : k);
    dropIn.current = true;
    const st = stageRef.current;
    if (st) window.scrollTo({ top: Math.max(0, st.getBoundingClientRect().top + window.scrollY - 90), behavior: reduced() ? "auto" : "smooth" });
  };
  const del = (k: string, card: HTMLElement | null) => {
    const done = () => {
      const next = saved.filter((b) => b.k !== k);
      setSaved(next);
      writeSaved(next);
      if (editing === k) setEditing(null);
    };
    if (card && !reduced()) card.animate([{ transform: "none", opacity: 1 }, { transform: "scale(.85) translateY(10px)", opacity: 0 }], { duration: 260, easing: "ease-in" }).onfinish = done;
    else done();
  };
  const keepShared = () => {
    if (!shared) return;
    const next = [...saved, ...shared.map((b) => ({ ...b, k: newKey(), t: Date.now() }))];
    setSaved(next);
    writeSaved(next);
    toast(`${plural(shared.length, "build", "builds")} added to yours`);
    setShared(null);
    history.replaceState(null, "", location.pathname);
  };
  const newBuild = () => {
    setEditing(null);
    setItems([]);
    setWrap(0);
    setName("");
  };
  const shown = useMemo(() => {
    let l = listNow
      .map((b, i) => ({ b, i }))
      .filter(({ b }) => filter === "all" || (filter === "fav" && b.fav) || (filter === b.m) || (filter === "fit" && priceOf(b) <= b.cap));
    if (sortPrice) l = [...l].sort((x, y) => priceOf(x.b) - priceOf(y.b));
    return l;
  }, [listNow, filter, sortPrice, priceOf]);

  /* ---------- drag from the tray (mouse drag, or press and hold on touch) ---------- */
  useEffect(() => {
    type Drag = { card: HTMLElement; sku: string; g: HTMLImageElement; x: number; y: number; gx: number; gy: number; vx: number; h: number; over: boolean; raf: number };
    type Press = { card: HTMLElement; x: number; y: number; lx?: number; ly?: number; id: number; mouse: boolean; timer?: number };
    let drag: Drag | null = null;
    let press: Press | null = null;
    const stage = () => stageRef.current;

    const move = (x: number, y: number) => {
      if (!drag) return;
      drag.x = x;
      drag.y = y;
      const s = stage()?.getBoundingClientRect();
      const over = !!s && x > s.left && x < s.right && y > s.top && y < s.bottom + 30;
      if (over !== drag.over) {
        drag.over = over;
        stage()?.classList.toggle("is-over", over);
      }
    };
    const begin = (card: HTMLElement, x: number, y: number) => {
      const img = card.querySelector("img");
      if (!img) return;
      const r = img.getBoundingClientRect();
      const g = document.createElement("img");
      g.src = img.src;
      g.className = "st-ghost";
      g.alt = "";
      const h = Math.max(r.height * 1.35, 90);
      g.style.height = `${h}px`;
      document.body.appendChild(g);
      drag = { card, sku: card.dataset.sku!, g, x, y, gx: x, gy: y, vx: 0, h, over: false, raf: 0 };
      card.classList.add("is-lifted");
      stage()?.classList.add("is-dragging");
      document.documentElement.classList.add("st-noselect");
      const loop = () => {
        const d = drag;
        if (!d) return;
        const k = reduced() ? 1 : 0.32;
        const nx = d.gx + (d.x - d.gx) * k;
        const ny = d.gy + (d.y - d.gy) * k;
        d.vx = d.vx * 0.7 + (nx - d.gx) * 0.3;
        d.gx = nx;
        d.gy = ny;
        const tilt = Math.max(-18, Math.min(18, d.vx * 1.4));
        d.g.style.transform = `translate(${nx}px, ${ny}px) translate(-50%, -62%) rotate(${tilt}deg) scale(${d.over ? 1.08 : 1})`;
        const top = (document.querySelector(".m-hin")?.getBoundingClientRect().bottom ?? 0) + 70;
        const bottom = window.innerHeight - 50;
        if (d.y < top) window.scrollBy(0, -Math.ceil((top - d.y) / 6));
        else if (d.y > bottom) window.scrollBy(0, Math.ceil((d.y - bottom) / 6));
        if (d.y < top || d.y > bottom) move(d.x, d.y);
        d.raf = requestAnimationFrame(loop);
      };
      loop();
      move(x, y);
      justDragged.current = true;
    };
    const end = (cancel: boolean) => {
      const d = drag;
      if (!d) return;
      drag = null;
      cancelAnimationFrame(d.raf);
      stage()?.classList.remove("is-over", "is-dragging");
      d.card.classList.remove("is-lifted");
      document.documentElement.classList.remove("st-noselect");
      if (d.over && !cancel) {
        d.g.remove();
        addRef.current(d.sku, { x: d.gx, y: d.gy - d.h * 0.12, rot: Math.max(-18, Math.min(18, d.vx * 1.4)), scale: 1.12 });
      } else {
        const r = d.card.querySelector("img")!.getBoundingClientRect();
        d.g.animate(
          [
            { transform: d.g.style.transform, opacity: 1 },
            { transform: `translate(${r.left + r.width / 2}px, ${r.top + r.height / 2}px) translate(-50%, -50%) scale(.6)`, opacity: 0.2 },
          ],
          { duration: reduced() ? 1 : 360, easing: "cubic-bezier(.3,1.3,.5,1)" },
        ).onfinish = () => d.g.remove();
      }
      setTimeout(() => (justDragged.current = false), 60);
    };
    const pressEnd = () => {
      if (press) {
        clearTimeout(press.timer);
        press.card.classList.remove("is-pressing");
      }
      press = null;
    };

    const down = (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLButtonElement>(".st-tray .st-card");
      if (!card || card.disabled || card.dataset.wrapped === "1") return;
      press = { card, x: e.clientX, y: e.clientY, id: e.pointerId, mouse: e.pointerType === "mouse" };
      if (press.mouse) return e.preventDefault();
      // Touch: hold briefly to pick the gift up; a swipe still scrolls the page or the tray.
      card.classList.add("is-pressing");
      const pr = press;
      pr.timer = window.setTimeout(() => {
        if (press !== pr) return;
        press = null;
        card.classList.remove("is-pressing");
        try {
          navigator.vibrate?.(8);
        } catch {}
        begin(card, pr.lx ?? pr.x, pr.ly ?? pr.y);
      }, 260);
    };
    const pmove = (e: PointerEvent) => {
      if (drag) {
        e.preventDefault();
        return move(e.clientX, e.clientY);
      }
      if (!press || e.pointerId !== press.id) return;
      const dx = e.clientX - press.x;
      const dy = e.clientY - press.y;
      if (press.mouse) {
        if (Math.hypot(dx, dy) > 6) {
          const c = press.card;
          press = null;
          begin(c, e.clientX, e.clientY);
        }
        return;
      }
      press.lx = e.clientX;
      press.ly = e.clientY;
      if (Math.hypot(dx, dy) > 10) pressEnd();
    };
    const up = () => {
      pressEnd();
      end(false);
    };
    const cancel = () => {
      pressEnd();
      end(true);
    };
    const tmove = (e: TouchEvent) => {
      if (drag) e.preventDefault();
    };
    const ctx = (e: Event) => {
      if (drag || (e.target as HTMLElement).closest?.(".st-tray .st-card")) e.preventDefault();
    };
    document.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", pmove, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    document.addEventListener("touchmove", tmove, { passive: false });
    document.addEventListener("contextmenu", ctx);
    return () => {
      document.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", pmove);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      document.removeEventListener("touchmove", tmove);
      document.removeEventListener("contextmenu", ctx);
      if (drag) {
        cancelAnimationFrame(drag.raf);
        drag.g.remove();
      }
    };
  }, []);
  const justDragged = useRef(false);

  if (!box || !tabs.length) {
    return (
      <div className="st-in">
        <p className="m-empty">The gift studio can&apos;t load today&apos;s stock right now. Please try again in a minute, or message us on WhatsApp and we&apos;ll put a bag together for you.</p>
      </div>
    );
  }

  const over = total > capNow;
  const pct = Math.min(total / capNow, 1);
  const whoNow = who[mode];
  const favs = listNow.filter((b) => b.fav).length;
  const shareList = sheet === "fav" ? listNow.filter((b) => b.fav) : listNow;
  const shareUrl = sheet && typeof window !== "undefined" ? `${location.origin}${location.pathname}#s=${encodeShare(shareList)}` : "";
  const shareMsg =
    (sheet === "fav" ? "My picks from Minimo Atelier:\n" : `Which one should we pick? I made ${shareList.length} options at Minimo Atelier:\n`) +
    shareList.map((b, i) => `${i + 1}. ${data.boxes.find((x) => x.key === b.box)?.name}: ${b.items.map((s) => pieces[s]?.name).join(", ")} (${inr(priceOf(b))}${b.m === "hm" ? "" : " a bag"})`).join("\n") +
    `\n\nOpen and heart your favourites: ${shareUrl}`;
  const asMini = (b: SavedBuild) => {
    const bx = data.boxes.find((x) => x.key === b.box);
    return bx ? (
      <div className="st-mini">
        <BoxArt box={bx} items={b.items.map((sku, i) => ({ sku, u: i }))} pieces={pieces} hf={bx.hf * 1.05} />
      </div>
    ) : null;
  };

  return (
    <div className={`st-in ${traySwap ? "" : ""}`} data-mode={mode}>
      <div className="st-head">
        <div>
          <p className="m-eyebrow">Gift studio</p>
          <h1 className="st-title">{rg ? "Fill a return-gift bag" : "Fill a hamper"}</h1>
          <button
            type="button"
            className="st-setup"
            onClick={() => {
              const o = optsRef.current;
              if (!o) return;
              window.scrollTo({ top: o.getBoundingClientRect().top + window.scrollY - 100, behavior: reduced() ? "auto" : "smooth" });
              setFlash((n) => n + 1);
            }}
          >
            {whoNow ? (
              <>
                For <b>{whoNow}</b> ·{" "}
              </>
            ) : (
              "Who is it for? · "
            )}
            <b>{inr(capNow)}</b> {rg ? "a bag" : "budget"} <Icon name="chevR" size={14} />
          </button>
        </div>
        <div className="m-switch st-switch" role="tablist" aria-label="What are you building?">
          <button role="tab" type="button" aria-selected={rg} onClick={() => switchMode("rg")}>
            <Icon name="gift" size={15} /> Return gifts
          </button>
          <button role="tab" type="button" aria-selected={!rg} onClick={() => switchMode("hm")}>
            <Icon name="basket" size={15} /> Hampers
          </button>
          <i className="m-switch-thumb" aria-hidden="true" style={{ translate: rg ? "0 0" : "100% 0" }} />
        </div>
      </div>

      <div className="st-grid" key={mode}>
        <section className="st-stagecol" aria-label={rg ? "Your bag" : "Your hamper"}>
          <div className="st-boxbar">
            <p className="st-optlabel">{rg ? "Pick a bag" : "Pick a base"}</p>
            <div className="st-boxes" role="radiogroup" aria-label={rg ? "Bag" : "Hamper base"}>
              {boxes.map((b) => (
                <button key={b.key} type="button" role="radio" aria-checked={b.key === box.key} onClick={(e) => pickBox(b.key, e.currentTarget)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={boxImg(b)} alt="" />
                  <span>
                    {b.name.replace(/ bag$/, "")}
                    <small>{inr(b.price)}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div ref={stageRef} className={`st-stage ${items.length ? "" : "is-empty"} ${hinted ? "hint-off" : ""}`}>
            <div className="st-halo" aria-hidden="true" />
            <div className="st-floor" aria-hidden="true" />
            <BoxArt
              key={box.key}
              box={box}
              items={items}
              pieces={pieces}
              state={wrap}
              tagName={name.trim()}
              tagged={!!tag}
              className={boxIn ? "is-in" : ""}
              boxRef={boxRef}
              itemsRef={itemsRef}
              ghostsRef={ghostsRef}
              onOut={removePiece}
            />
            <div className="st-hint" aria-hidden="true">
              <span className="st-hint-dot" />
              <span className="st-hint-fine">Drag a gift in, or tap it</span>
              <span className="st-hint-touch">Hold a gift and drag it in, or tap it</span>
            </div>
            <div className="st-fx" ref={fxRef} aria-hidden="true" />
            <div ref={meterRef} className={`st-meter ${over ? "is-over" : ""}`} aria-live="polite">
              <div className="st-meter-top">
                <span className="st-meter-val">
                  <b>{inr(total)}</b> <small>of {inr(capNow)} {rg ? "per bag" : "hamper"}</small>
                </span>
                <span className="st-meter-left">{over ? `${inr(total - capNow)} over` : `${inr(capNow - total)} left`}</span>
              </div>
              <div className="st-meter-bar">
                <i style={{ transform: `scaleX(${pct.toFixed(3)})` }} />
              </div>
              <div className="st-meter-sub">
                <span>
                  {items.length
                    ? `${plural(items.length, "piece", "pieces")} + ${box.name.toLowerCase()}${tag ? " and name tag" : ""}`
                    : `${box.hamper ? box.name : `${box.name.replace(/ bags?$/i, "")} bag`} ${inr(box.price)}`}
                </span>
                {rg && data.tag && (
                  <button type="button" role="switch" aria-checked={withTag} className="st-tagswitch" onClick={() => setWithTag((v) => !v)} disabled={!!wrap}>
                    <i aria-hidden="true" />
                    Name tag +{inr(data.tag.price)}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="st-side" aria-label="Pieces in our store">
          <div ref={optsRef} key={flash} className={`st-opts ${flash ? "is-flash" : ""}`}>
            <p className="st-optlabel">Who is it for?</p>
            <div className="st-who">
              <div className="st-who-chips" role="group" aria-label="Who is it for">
                {WHO[mode].map((w) => (
                  <button key={w} type="button" aria-pressed={!whoOther[mode] && whoNow === w} onClick={() => pickWho(w)}>
                    {w}
                  </button>
                ))}
                <button type="button" aria-pressed={whoOther[mode]} onClick={() => pickWho("__other")}>
                  <Icon name="plus" size={13} /> Someone else
                </button>
              </div>
              {whoOther[mode] && (
                <label className="st-inline">
                  <span>For</span>
                  <input
                    autoFocus
                    maxLength={24}
                    placeholder="e.g. my mentor, Priya, the twins"
                    value={whoNow}
                    autoComplete="off"
                    onChange={(e) => setWho((o) => ({ ...o, [mode]: e.target.value }))}
                  />
                </label>
              )}
            </div>
            <p className="st-optlabel">{rg ? "Budget per bag" : "Hamper budget"}</p>
            <div className="st-budgetwrap">
              <div className="st-budget" role="radiogroup" aria-label={rg ? "Budget per bag" : "Hamper budget"}>
                {CAPS[mode].map((v) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={!capCustom[mode] && capNow === v}
                    onClick={() => {
                      setCapCustom((o) => ({ ...o, [mode]: false }));
                      setCap(v);
                    }}
                  >
                    {inr(v)}
                  </button>
                ))}
                <button type="button" role="radio" aria-checked={capCustom[mode]} onClick={() => setCapCustom((o) => ({ ...o, [mode]: true }))}>
                  Custom
                </button>
              </div>
              {capCustom[mode] && (
                <label className="st-inline st-inline--money">
                  <span>₹</span>
                  <input
                    autoFocus
                    inputMode="numeric"
                    maxLength={6}
                    defaultValue={capNow}
                    aria-label="Your budget in rupees"
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => {
                      const v = Math.round(Number(e.target.value.replace(/\D/g, "")));
                      if (v >= 1) setCap(Math.min(v, 50000));
                    }}
                  />
                  <small>{rg ? "per bag" : "for the hamper"}</small>
                </label>
              )}
            </div>
          </div>

          <div className="st-trayhead">
            <h2>{rg ? "Pick fillers" : "Pick gifts"}</h2>
            <span>Real stock, prices per piece</span>
          </div>
          <label className="st-search">
            <Icon name="search" size={16} />
            <input
              type="search"
              value={find}
              onChange={(e) => setFind(e.target.value)}
              placeholder="Search all products, e.g. marker, eraser, keychain"
              aria-label="Search all products"
              enterKeyHint="search"
              autoComplete="off"
            />
            {find && (
              <button type="button" onClick={() => setFind("")} aria-label="Clear search">
                <Icon name="x" size={14} />
              </button>
            )}
          </label>
          <div className="st-tabs" role="tablist" aria-label="Kinds of gifts">
            {tabs.map((t) => (
              <button key={t.name} type="button" role="tab" aria-selected={!found && t.name === curTab.name} onClick={() => pickTab(t.name)}>
                {t.name}
              </button>
            ))}
          </div>
          <div ref={trayRef} key={`${mode}-${traySwap}`} className={`st-tray ${traySwap ? "is-swap" : ""}`}>
            {found && !found.length && <p className="st-nofind">Nothing matches &ldquo;{find.trim()}&rdquo;. Try a shorter word.</p>}
            {trayList.map((p) => {
              const n = counts[p.sku] ?? 0;
              const full = p.cap !== null && n >= p.cap;
              return (
                <button
                  key={p.sku}
                  type="button"
                  className={`st-card ${full ? "is-out" : ""}`}
                  data-sku={p.sku}
                  data-wrapped={wrap ? "1" : "0"}
                  disabled={full}
                  aria-label={`Add ${p.name}, ${inr(p.price)}`}
                  onClick={(e) => {
                    if (justDragged.current) {
                      justDragged.current = false;
                      return;
                    }
                    const r = e.currentTarget.querySelector("img")!.getBoundingClientRect();
                    addPiece(p.sku, { x: r.left + r.width / 2, y: r.top + r.height / 2, rot: -10, scale: 0.8 });
                  }}
                >
                  <span className={`st-card-img ${p.cut ? "" : "is-photo"}`}>
                    <SafeImg src={p.img} alt="" draggable={false} loading="lazy" />
                  </span>
                  <span className="st-card-name">{p.name}</span>
                  <span className="st-card-price">{inr(p.price)}</span>
                  {p.cap !== null && p.cap <= 5 && <span className="st-card-left">{p.cap} left</span>}
                  {n ? (
                    <span className="st-card-n" key={n}>
                      {n}
                    </span>
                  ) : (
                    <span className="st-card-plus">
                      <Icon name="plus" size={14} />
                    </span>
                  )}
                </button>
              );
            })}
            {!found && !more && curTab.items.length > TRAY_FIRST && (
              <button type="button" className="st-more" onClick={() => setMore(true)}>
                <Icon name="plus" size={16} />
                Show {curTab.items.length - TRAY_FIRST} more
              </button>
            )}
          </div>
          <div className="st-actions">
            <button type="button" className="st-btn st-btn--ghost st-btn--icon" disabled={!items.length || !!wrap} onClick={clearAll} aria-label="Empty it" title="Empty it">
              <Icon name="x" size={18} />
            </button>
            <button type="button" className="st-btn st-btn--ghost st-savebtn" disabled={!items.length} onClick={save}>
              <Icon name="heart" size={16} /> {editing ? "Update build" : "Save build"}
            </button>
            <button type="button" className="st-btn st-btn--primary st-wrapbtn" disabled={!items.length || !!wrap} onClick={doWrap}>
              <Icon name="gift" size={16} /> Wrap it
            </button>
          </div>

          {wrap > 0 && (
            <div className="st-done" ref={doneRef}>
              <p className="st-done-eyebrow">
                <Icon name="check" size={14} /> Wrapped and ready
              </p>
              <h3>{rg ? "Your return-gift bag" : "Your hamper"}</h3>
              <label className="st-field">
                <span>{rg ? "Name on the tags" : "Message on the card"}</span>
                <input maxLength={rg ? 14 : 60} placeholder={rg ? "e.g. Aarav turns 6" : "Happy birthday, love!"} value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              {rg && (
                <div className="st-guests">
                  <span>Guests</span>
                  <div className="m-qty">
                    <button type="button" aria-label="5 fewer" disabled={guests <= 5} onClick={() => setGuests((g) => Math.max(5, g - 5))}>
                      <Icon name="minus" size={15} />
                    </button>
                    <output aria-live="polite">{guests}</output>
                    <button type="button" aria-label="5 more" disabled={guests + 5 > maxGuests} onClick={() => setGuests((g) => Math.min(maxGuests, g + 5))}>
                      <Icon name="plus" size={15} />
                    </button>
                  </div>
                </div>
              )}
              {rg && Number.isFinite(canMake) && canMake < 300 && (
                <p className={`st-done-stock ${canMake < guests ? "is-short" : ""}`}>
                  {canMake < 1
                    ? "One of these pieces just sold out. Unwrap and swap it."
                    : canMake < guests
                      ? `We can make ${plural(canMake, "bag", "bags")} like this from today's stock. Swap a piece for more, or message us.`
                      : `We can make up to ${plural(canMake, "bag", "bags")} like this today.`}
                </p>
              )}
              <div className="st-done-total">
                <span>
                  {rg ? (
                    <>
                      {inr(total)} × <b>{Math.min(guests, maxGuests)}</b> bags
                    </>
                  ) : (
                    "1 hamper"
                  )}
                </span>
                <b>{inr(rg ? total * Math.min(guests, maxGuests) : total)}</b>
              </div>
              <div className="st-done-btns">
                <button type="button" className="st-btn st-btn--ghost" onClick={() => setWrap(0)}>
                  Unwrap and edit
                </button>
                <button type="button" className="st-btn st-btn--primary" onClick={toCart} disabled={canMake < 1}>
                  <Icon name="bag" size={16} /> Add to cart
                </button>
              </div>
              <p className="st-done-note">
                Ready in 48 hours. Every {rg ? "bag is packed the same way" : "hamper is packed by hand"} from what is in our store today. Bulk savings show in your cart.
              </p>
            </div>
          )}
        </section>
      </div>

      <section ref={savedRef} className={`st-saved ${shared ? "is-shared" : ""}`} aria-labelledby="h-saved">
        <div className="st-sv-head">
          <div>
            <p className="m-eyebrow">{shared ? "Shared with you" : "Compare"}</p>
            <h2 id="h-saved">{shared ? "Pick your favourites" : "Your builds"}</h2>
            <p className="st-sv-sub">{shared ? "Tap the heart on the ones you like, then send your picks back." : "Save each combo, heart the ones you like, and share them for a second opinion."}</p>
          </div>
          <div className="st-sv-cta">
            {shared ? (
              <>
                <button type="button" className="st-btn st-btn--ghost" onClick={keepShared}>
                  Save to my builds
                </button>
                <button type="button" className="st-btn st-btn--primary" disabled={!favs} onClick={() => setSheet("fav")}>
                  <Icon name="wa" size={16} /> Send my picks
                </button>
              </>
            ) : (
              <>
                <button type="button" className="st-btn st-btn--ghost" onClick={newBuild}>
                  <Icon name="plus" size={16} /> New build
                </button>
                <button type="button" className="st-btn st-btn--primary" disabled={!listNow.length} onClick={() => setSheet("all")}>
                  <Icon name="wa" size={16} /> Share builds
                </button>
              </>
            )}
          </div>
        </div>
        <div className="st-sv-tools">
          <div className="st-sv-chips" role="group" aria-label="Filter builds">
            {(
              [
                ["all", `All ${listNow.length}`],
                ["fav", `Shortlist ${favs}`],
                ["rg", "Return gifts"],
                ["hm", "Hampers"],
                ["fit", "Within budget"],
              ] as [Filter, string][]
            ).map(([k, l]) => (
              <button key={k} type="button" data-f={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>
                {k === "fav" && <Icon name="heart" size={13} />} {l}
              </button>
            ))}
          </div>
          <button type="button" className="st-sv-sort" aria-pressed={sortPrice} onClick={() => setSortPrice((s) => !s)}>
            {sortPrice ? "Lowest price first" : "Newest first"}
          </button>
        </div>
        <div className="st-sv-grid">
          {!shown.length ? (
            <div className="st-sv-empty">
              {listNow.length ? (
                "No builds match this filter."
              ) : (
                <>
                  <b>Make a few versions, then compare.</b>
                  <span>Most families save around 5 combos before picking one. Tap Save build after filling the {rg ? "bag" : "hamper"}.</span>
                  <span className="st-sv-dots">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <i key={i} className={i < saved.length ? "on" : ""} />
                    ))}
                  </span>
                </>
              )}
            </div>
          ) : (
            shown.map(({ b, i }) => {
              const t = priceOf(b);
              const isOver = t > b.cap;
              const nm = buildName(b, i);
              return (
                <article key={b.k} className={`st-sv ${b.fav ? "is-fav" : ""} ${editing === b.k ? "is-editing" : ""}`} data-k={b.k}>
                  <button type="button" className="st-sv-fav" aria-pressed={b.fav} aria-label={`${b.fav ? "Remove from" : "Add to"} shortlist`} onClick={(e) => fav(b.k, e.currentTarget)}>
                    <Icon name="heart" size={18} />
                  </button>
                  {!shared && (
                    <button type="button" className="st-sv-del" aria-label={`Delete ${nm}`} onClick={(e) => del(b.k, e.currentTarget.closest("article"))}>
                      <Icon name="x" size={14} />
                    </button>
                  )}
                  {b.sharedFav && (
                    <span className="st-sv-picked">
                      <Icon name="heart" size={12} /> Their pick
                    </span>
                  )}
                  <button type="button" className="st-sv-prev" aria-label={`Open ${nm}`} onClick={() => load(b.k)}>
                    {asMini(b)}
                  </button>
                  <div className="st-sv-body">
                    <div className="st-sv-row">
                      <b>{nm}</b>
                      <span className={`st-sv-price ${isOver ? "is-over" : ""}`}>
                        {inr(t)}
                        <small>{b.m === "hm" ? "" : "/bag"}</small>
                      </span>
                    </div>
                    <p>
                      {data.boxes.find((x) => x.key === b.box)?.name} · {plural(b.items.length, "piece", "pieces")}
                      {isOver && (
                        <>
                          {" "}
                          · <em>{inr(t - b.cap)} over {inr(b.cap)}</em>
                        </>
                      )}
                    </p>
                    <p className="st-sv-items">{b.items.map((s) => pieces[s]?.name).filter(Boolean).join(", ")}</p>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {sheet && shareList.length > 0 && (
        <ShareSheet
          title={sheet === "fav" ? `Send your ${plural(shareList.length, "pick", "picks")}` : `Share ${plural(shareList.length, "build", "builds")}`}
          eyebrow={sheet === "fav" ? "Send back" : "Get a second opinion"}
          url={shareUrl}
          msg={shareMsg}
          thumbs={shareList.slice(0, 5).map((b) => (
            <div key={b.k}>{asMini(b)}</div>
          ))}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}

function ShareSheet({ title, eyebrow, url, msg, thumbs, onClose }: { title: string; eyebrow: string; url: string; msg: string; thumbs: React.ReactNode; onClose: () => void }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const close = useCallback(() => {
    setShown(false);
    setTimeout(onClose, 300);
  }, [onClose]);
  useEffect(() => {
    const r = requestAnimationFrame(() => setShown(true));
    const key = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", key);
    document.documentElement.classList.add("m-lock");
    return () => {
      cancelAnimationFrame(r);
      document.removeEventListener("keydown", key);
      document.documentElement.classList.remove("m-lock");
    };
  }, [close]);
  const copy = () => {
    const ok = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    };
    try {
      navigator.clipboard.writeText(url).then(ok, () => {
        input.current?.select();
        ok();
      });
    } catch {
      input.current?.select();
      ok();
    }
  };
  return (
    <div className={`st-share ${shown ? "is-in" : ""}`} role="dialog" aria-modal="true" aria-labelledby="h-share" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="st-share-card">
        <button type="button" className="st-share-x" aria-label="Close" onClick={close} autoFocus>
          <Icon name="x" size={18} />
        </button>
        <p className="m-eyebrow">{eyebrow}</p>
        <h3 id="h-share">{title}</h3>
        <div className="st-share-thumbs">{thumbs}</div>
        <p className="st-share-hint">They open the same builds, heart the ones they like and send them back to you.</p>
        <div className="st-share-link">
          <input ref={input} readOnly value={url} aria-label="Share link" onFocus={(e) => e.currentTarget.select()} />
          <button type="button" className="st-btn st-btn--ghost" onClick={copy}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <a className="st-btn st-btn--primary st-share-wa" data-wa-source="Studio: share with a friend" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer">
          <Icon name="wa" size={18} /> Share on WhatsApp
        </a>
        <p className="st-share-note">If WhatsApp does not open, copy the link and paste it in your chat.</p>
      </div>
    </div>
  );
}
