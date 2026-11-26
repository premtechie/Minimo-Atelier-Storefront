"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  BODY_MAX,
  BODY_MIN,
  EMPTY_SUMMARY,
  MAX_PHOTOS,
  PICK_MAX_BYTES,
  reviewDate,
  reviewPhotoUrl,
  TITLE_MAX,
  type Eligibility,
  type MyReview,
  type PublicReview,
  type ReviewPage,
} from "@/lib/reviews";
import { accountPost, useAccount } from "./account-provider";
import { EIcon, Icon } from "./icon";
import { STAR_PATH, Stars } from "./stars";

/*
 * The product page's reviews (design approved by Minimo, 26 Nov 2026): the
 * summary, buyers' photos and reviews, and the Write a review sheet. Only
 * shoppers with a paid purchase can write one, and nothing shows until the
 * shop approves it.
 */

const WORDS = ["", "Poor", "Fair", "Good", "Very good", "Loved it"];

/** "★ 4.6 · 12 reviews" under the product's name, linking down to the reviews. */
export function RatingLink({ average, count }: { average: number; count: number }) {
  return (
    <a className="rv-mini" href="#reviews">
      <Stars value={average} size={15} />
      <span>
        {average.toFixed(1)} · {count} {count === 1 ? "review" : "reviews"}
      </span>
    </a>
  );
}

type Sort = "newest" | "highest" | "lowest";

export function ReviewsSection({ sku, name, initial }: { sku: string; name: string; initial: ReviewPage | null }) {
  const [data, setData] = useState<ReviewPage | null>(initial);
  const [list, setList] = useState<PublicReview[]>(initial?.reviews ?? []);
  const [more, setMore] = useState(initial?.more ?? false);
  const [page, setPage] = useState(1);
  const [photosOnly, setPhotosOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("newest");
  const [loading, setLoading] = useState(false);
  const [viewer, setViewer] = useState<{ ids: string[]; at: number } | null>(null);
  const [sheet, setSheet] = useState(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  const params = useSearchParams();
  const { status: auth } = useAccount();
  const [mine, setMine] = useState<MyReview | null>(null);

  // A signed-in buyer sees where their own review stands, since it isn't shown until approved.
  const checkMine = useCallback(async () => {
    const out = await accountPost<Eligibility>("/api/reviews/eligibility", { sku });
    setMine(out.ok && "review" in out.data ? out.data.review : null);
  }, [sku]);
  useEffect(() => {
    if (auth !== "signed_in") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the shopper's own review from the server
    void checkMine();
  }, [auth, checkMine]);
  const mineNote =
    auth === "signed_in" && mine && mine.status !== "published" ? (
      <p className={`rv-mine${mine.status === "hidden" ? " is-hidden" : ""}`} role="status">
        <Icon name="clock" size={15} />
        {mine.status === "pending" ? "Thanks! Your review is waiting for our check and will appear here once approved, usually within a day." : "Your review isn't shown. You can edit it and send it again."}
      </p>
    ) : null;

  const load = useCallback(
    async (p: number, onlyPhotos: boolean, s: Sort) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ sku, page: String(p), sort: s });
        if (onlyPhotos) qs.set("photos", "1");
        const res = await fetch(`/api/reviews/list?${qs}`);
        if (!res.ok) return;
        const out = (await res.json()) as ReviewPage;
        setData(out);
        setList((prev) => (p === 1 ? out.reviews : [...prev, ...out.reviews]));
        setMore(out.more);
        setPage(p);
      } finally {
        setLoading(false);
      }
    },
    [sku],
  );

  // Opened from "Review" on My orders: /product/<sku>?review=1.
  useEffect(() => {
    if (params.get("review") === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- opening the form a link asked for
      setSheet(true);
      document.getElementById("reviews")?.scrollIntoView({ block: "start" });
    }
  }, [params]);

  const s = data?.summary ?? EMPTY_SUMMARY;
  const has = s.count > 0;
  const write = (
    <button
      type="button"
      className="d-reviews-write"
      onClick={(e) => {
        opener.current = e.currentTarget;
        setSheet(true);
      }}
    >
      <Icon name="pen" size={16} /> {auth === "signed_in" && mine ? "Edit your review" : "Write a review"}
    </button>
  );

  return (
    <section className="d-reviews" id="reviews" aria-labelledby="h-rev">
      <div className="d-reviews-inner">
        {!has ? (
          <div className="d-reviews-empty">
            <p className="d-eyebrow">Reviews</p>
            <h2 className="d-reviews-empty-title" id="h-rev">
              Be the first to review {name}
            </h2>
            <p className="d-rev-note">Reviews appear here only from real orders.</p>
            {mineNote}
            {write}
          </div>
        ) : (
          <div className="rv-wrap">
            <div className="rv-head">
              <p className="d-eyebrow">Reviews</p>
              <h2 className="rv-title" id="h-rev">
                What buyers say <span className="rv-title-name">about {name}</span>
              </h2>
            </div>
            <div className="rv-grid">
              <aside className="rv-side">
                <div className="rv-score">
                  <b>{s.average.toFixed(1)}</b>
                  <div>
                    <Stars value={s.average} size={18} label={`${s.average.toFixed(1)} out of 5 stars`} />
                    <span>
                      Based on {s.count} verified {s.count === 1 ? "review" : "reviews"}
                    </span>
                  </div>
                </div>
                <ul className="rv-bars" aria-label="Reviews by stars">
                  {(["5", "4", "3", "2", "1"] as const).map((n) => (
                    <li key={n}>
                      <span>{n} star</span>
                      <span className="rv-bar" aria-hidden="true">
                        <span style={{ width: `${s.count ? Math.round((s.stars[n] / s.count) * 100) : 0}%` }} />
                      </span>
                      <span className="rv-bar-n">{s.stars[n]}</span>
                    </li>
                  ))}
                </ul>
                {mineNote}
                {write}
                <p className="d-rev-note">Reviews appear here only from real orders.</p>
                {data && data.photo_ids.length > 0 && (
                  <div className="rv-strip-wrap">
                    <p className="rv-strip-title">Photos from buyers</p>
                    <div className="rv-strip">
                      {data.photo_ids.slice(0, 8).map((id, i) => (
                        <button key={id} type="button" className="rv-thumb" aria-label={`Open buyer photo ${i + 1} of ${data.photo_ids.length}`} onClick={() => setViewer({ ids: data.photo_ids, at: i })}>
                          {/* eslint-disable-next-line @next/next/no-img-element -- served from /img/review */}
                          <img src={reviewPhotoUrl(id)} alt="" loading="lazy" decoding="async" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </aside>

              <div className="rv-main">
                <div className="rv-tools">
                  <button
                    type="button"
                    className={`rv-chip${photosOnly ? "" : " is-on"}`}
                    aria-pressed={!photosOnly}
                    onClick={() => {
                      setPhotosOnly(false);
                      void load(1, false, sort);
                    }}
                  >
                    All {s.count}
                  </button>
                  {s.photos > 0 && (
                    <button
                      type="button"
                      className={`rv-chip${photosOnly ? " is-on" : ""}`}
                      aria-pressed={photosOnly}
                      onClick={() => {
                        setPhotosOnly(true);
                        void load(1, true, sort);
                      }}
                    >
                      With photos
                    </button>
                  )}
                  <label className="rv-sort">
                    <span className="rv-sr">Sort reviews</span>
                    <select
                      value={sort}
                      onChange={(e) => {
                        const v = e.target.value as Sort;
                        setSort(v);
                        void load(1, photosOnly, v);
                      }}
                    >
                      <option value="newest">Newest</option>
                      <option value="highest">Highest rated</option>
                      <option value="lowest">Lowest rated</option>
                    </select>
                  </label>
                </div>
                <div className="rv-list" aria-busy={loading}>
                  {list.map((r) => (
                    <ReviewCard key={r.id} r={r} onPhoto={(at) => setViewer({ ids: r.photos.map((p) => p.id), at })} />
                  ))}
                </div>
                {more && (
                  <button type="button" className="rv-more" disabled={loading} onClick={() => load(page + 1, photosOnly, sort)}>
                    {loading ? "Loading…" : "Show more reviews"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {viewer && <PhotoViewer ids={viewer.ids} start={viewer.at} onClose={() => setViewer(null)} />}
      {sheet && (
        <ReviewSheet
          sku={sku}
          name={name}
          onClose={() => {
            setSheet(false);
            opener.current?.focus();
            if (auth === "signed_in") void checkMine();
          }}
        />
      )}
    </section>
  );
}

function ReviewCard({ r, onPhoto }: { r: PublicReview; onPhoto: (at: number) => void }) {
  const [open, setOpen] = useState(false);
  const long = r.body.length > 320;
  return (
    <article className="rv-card">
      <div className="rv-who">
        <b>{r.name}</b>
        <span className="rv-verified">
          <Icon name="check" size={12} /> Verified buyer
        </span>
        <time dateTime={r.date}>{reviewDate(r.date)}</time>
      </div>
      <div className="rv-body">
        <Stars value={r.rating} />
        {r.title && <h3>{r.title}</h3>}
        <p>{long && !open ? `${r.body.slice(0, 300).trimEnd()}…` : r.body}</p>
        {long && (
          <button type="button" className="rv-link" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? "Show less" : "Read more"}
          </button>
        )}
        {r.photos.length > 0 && (
          <div className="rv-photos">
            {r.photos.map((p, i) => (
              <button key={p.id} type="button" className="rv-thumb" aria-label={`Open photo ${i + 1} from ${r.name}`} onClick={() => onPhoto(i)}>
                {/* eslint-disable-next-line @next/next/no-img-element -- served from /img/review */}
                <img src={reviewPhotoUrl(p.id)} alt="" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        )}
        {r.reply && (
          <div className="rv-reply">
            <b>Reply from Minimo Atelier</b>
            <p>{r.reply}</p>
          </div>
        )}
      </div>
    </article>
  );
}

/** Keeps Tab inside an open dialog and closes it on Escape. */
function useDialog(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const el = ref.current;
    const prev = document.activeElement as HTMLElement | null;
    const first = el?.querySelector<HTMLElement>("[data-autofocus]") ?? el?.querySelector<HTMLElement>("button, [href], input, textarea, select");
    first?.focus();
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !el) return;
      const items = [...el.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')];
      if (!items.length) return;
      const [a, b] = [items[0], items[items.length - 1]];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        b.focus();
      } else if (!e.shiftKey && document.activeElement === b) {
        e.preventDefault();
        a.focus();
      }
    };
    el?.addEventListener("keydown", key);
    return () => {
      el?.removeEventListener("keydown", key);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [ref, onClose]);
}

function PhotoViewer({ ids, start, onClose }: { ids: string[]; start: number; onClose: () => void }) {
  const [at, setAt] = useState(start);
  const box = useRef<HTMLDivElement>(null);
  useDialog(box, onClose);
  const go = (d: number) => setAt((x) => (x + d + ids.length) % ids.length);
  return (
    <div className="rv-viewer" role="dialog" aria-modal="true" aria-label="Buyer photos" ref={box} onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* eslint-disable-next-line @next/next/no-img-element -- served from /img/review */}
      <img src={reviewPhotoUrl(ids[at])} alt={`Buyer photo ${at + 1} of ${ids.length}`} />
      <button type="button" className="rv-viewer-close" aria-label="Close" onClick={onClose} data-autofocus>
        <Icon name="x" size={20} />
      </button>
      {ids.length > 1 && (
        <>
          <button type="button" className="rv-viewer-nav is-prev" aria-label="Previous photo" onClick={() => go(-1)}>
            <Icon name="chevL" size={22} />
          </button>
          <button type="button" className="rv-viewer-nav is-next" aria-label="Next photo" onClick={() => go(1)}>
            <Icon name="chevR" size={22} />
          </button>
          <span className="rv-viewer-count">
            {at + 1} / {ids.length}
          </span>
        </>
      )}
    </div>
  );
}

// ── Write a review ────────────────────────────────────────────────────────────

type NewPhoto = { key: string; data: string; preview: string; state: "ready" | "sending" | "sent" | "failed"; error?: string };

/** Shrinks a picked photo on the phone: upright, 1,600 px on its long side, WebP (or JPEG where WebP can't be made). */
async function shrink(file: File): Promise<{ data: string; preview: string }> {
  if (file.size > PICK_MAX_BYTES) throw new Error("That photo is over 15 MB. Pick a smaller one.");
  let src: ImageBitmap | HTMLImageElement;
  try {
    src = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    src = await new Promise<HTMLImageElement>((ok, no) => {
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = () => no(new Error("This photo can't be opened here. Try a JPG or PNG."));
      img.src = URL.createObjectURL(file);
    });
  }
  const w = "naturalWidth" in src ? src.naturalWidth : src.width;
  const h = "naturalHeight" in src ? src.naturalHeight : src.height;
  if (!w || !h) throw new Error("This photo can't be opened here. Try a JPG or PNG.");
  const scale = Math.min(1, 1600 / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext("2d")?.drawImage(src, 0, 0, canvas.width, canvas.height);
  if ("close" in src) src.close();
  const encode = (type: string, q: number) => new Promise<Blob | null>((ok) => canvas.toBlob(ok, type, q));
  let blob = await encode("image/webp", 0.8);
  if (!blob || blob.type !== "image/webp") blob = await encode("image/jpeg", 0.82);
  if (blob && blob.size > 1024 * 1024) blob = await encode(blob.type, 0.65);
  if (!blob) throw new Error("This photo can't be opened here. Try a JPG or PNG.");
  const data = await new Promise<string>((ok, no) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => no(new Error("This photo can't be read."));
    r.readAsDataURL(blob);
  });
  return { data, preview: URL.createObjectURL(blob) };
}

function ReviewSheet({ sku, name, onClose }: { sku: string; name: string; onClose: () => void }) {
  const { status: auth, openSignIn } = useAccount();
  const [elig, setElig] = useState<Eligibility | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [done, setDone] = useState<{ first: string; photos: number; edited: boolean } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  useDialog(box, onClose);

  const check = useCallback(async () => {
    setFailed(null);
    const out = await accountPost<Eligibility>("/api/reviews/eligibility", { sku });
    if (out.ok) setElig(out.data);
    else setFailed(out.message);
  }, [sku]);

  useEffect(() => {
    if (auth === "loading") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- asking the server what this shopper may do
    void check();
  }, [auth, check]);

  let content: ReactNode = null;
  if (done) {
    content = (
      <div className="rv-state">
        <span className="rv-state-ok" aria-hidden="true">
          <Icon name="check" size={28} />
        </span>
        <h2 id="rv-sheet-title">Thanks{done.first ? `, ${done.first}` : ""}!</h2>
        <p>
          Your {done.edited ? "changes" : "review"}
          {done.photos ? ` and ${done.photos} ${done.photos === 1 ? "photo" : "photos"}` : ""} will appear once we&apos;ve checked {done.photos || done.edited ? "them" : "it"}, usually within a day. You can edit it from this page any time.
        </p>
        <button type="button" className="rv-primary" onClick={onClose} data-autofocus>
          Done
        </button>
      </div>
    );
  } else if (failed) {
    content = (
      <div className="rv-state">
        <h2 id="rv-sheet-title">Reviews couldn&apos;t load</h2>
        <p>{failed}</p>
        <button type="button" className="rv-primary" onClick={check}>
          Try again
        </button>
      </div>
    );
  } else if (!elig) {
    content = (
      <div className="rv-state" aria-busy="true">
        <h2 id="rv-sheet-title">Write a review</h2>
        <p>One moment…</p>
      </div>
    );
  } else if (elig.state === "signed_out") {
    content = (
      <div className="rv-state">
        <Icon name="user" size={36} />
        <h2 id="rv-sheet-title">Sign in to write a review</h2>
        <p>Use the number you ordered with, so we can show your review as a verified buyer.</p>
        <button type="button" className="rv-primary" data-autofocus onClick={() => openSignIn({ reason: "review", then: () => void check() })}>
          Sign in
        </button>
      </div>
    );
  } else if (elig.state === "not_bought" || elig.state === "not_found") {
    content = (
      <div className="rv-state">
        <Icon name="bag" size={36} />
        <h2 id="rv-sheet-title">Reviews come from orders</h2>
        <p>Once your order of {name} is paid, you can review it here or from My orders.</p>
        <div className="rv-state-row">
          <Link className="rv-secondary" href="/orders">
            My orders
          </Link>
          <a className="rv-secondary is-wa" href={`https://wa.me/?text=${encodeURIComponent(`Hi Minimo, about ${name}`)}`} target="_blank" rel="noopener">
            Ask on WhatsApp
          </a>
        </div>
      </div>
    );
  } else if (elig.state === "can_review" || elig.state === "reviewed") {
    content = <ReviewForm sku={sku} name={name} mine={elig.review} displayName={elig.display_name} onDone={setDone} />;
  }

  return (
    <div className="rv-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rv-sheet" role="dialog" aria-modal="true" aria-labelledby="rv-sheet-title" ref={box}>
        <span className="rv-grab" aria-hidden="true" />
        <div className="rv-sheet-head">
          <SheetThumb sku={sku} />
          <div>
            <p className="rv-sheet-kicker">{elig && "review" in elig && elig.review ? "Edit your review" : "Write a review"}</p>
            <p className="rv-sheet-name">{name}</p>
          </div>
          <button type="button" className="rv-x" aria-label="Close" onClick={onClose}>
            <Icon name="x" size={20} />
          </button>
        </div>
        {content}
      </div>
    </div>
  );
}

function SheetThumb({ sku }: { sku: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  // eslint-disable-next-line @next/next/no-img-element -- the product's own photo
  return <img className="rv-sheet-img" src={`/img/${sku}`} alt="" onError={() => setOk(false)} />;
}

function ReviewForm({
  sku,
  name,
  mine,
  displayName,
  onDone,
}: {
  sku: string;
  name: string;
  mine: MyReview | null;
  displayName: string;
  onDone: (d: { first: string; photos: number; edited: boolean }) => void;
}) {
  const draftKey = `mm-review-draft:${sku}`;
  const [rating, setRating] = useState(mine?.rating ?? 0);
  const [title, setTitle] = useState(mine?.title ?? "");
  const [body, setBody] = useState(mine?.body ?? "");
  const [kept, setKept] = useState(mine?.photos ?? []);
  const [added, setAdded] = useState<NewPhoto[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const ids = useId();
  const loaded = useRef(false);

  // A draft typed earlier on this phone comes back (a new review only).
  useEffect(() => {
    if (loaded.current || mine) return;
    loaded.current = true;
    try {
      const d = JSON.parse(localStorage.getItem(draftKey) || "null");
      if (d && typeof d === "object") {
        /* eslint-disable react-hooks/set-state-in-effect -- restoring a saved draft once */
        if (typeof d.rating === "number") setRating(d.rating);
        if (typeof d.title === "string") setTitle(d.title);
        if (typeof d.body === "string") setBody(d.body);
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    } catch {
      /* blocked storage */
    }
  }, [draftKey, mine]);
  useEffect(() => {
    if (mine) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ rating, title, body }));
    } catch {
      /* blocked storage */
    }
  }, [draftKey, mine, rating, title, body]);

  const [preparing, setPreparing] = useState(0);
  const [dragging, setDragging] = useState(false);
  const count = kept.length + added.length;
  const room = MAX_PHOTOS - count - preparing;
  const input = (
    <input
      ref={file}
      type="file"
      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
      multiple
      aria-label={`Add photos, up to ${MAX_PHOTOS}`}
      onChange={(e) => pick(e.target.files)}
    />
  );

  async function pick(files: FileList | null) {
    if (!files?.length) return;
    setMessage(null);
    const list = [...files].filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name)).slice(0, room);
    if (files.length > room) setMessage(`You can add up to ${MAX_PHOTOS} photos.`);
    for (const f of list) {
      setPreparing((n) => n + 1);
      try {
        const out = await shrink(f);
        setAdded((a) => [...a, { key: `${Date.now()}-${Math.random()}`, ...out, state: "ready" }]);
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "That photo can't be used.");
      } finally {
        setPreparing((n) => n - 1);
      }
    }
    if (file.current) file.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (rating < 1) errs.rating = "Pick from 1 to 5 stars.";
    if (body.trim().length < BODY_MIN) errs.body = `Write at least ${BODY_MIN} characters.`;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSending(true);
    setMessage(null);
    const saved = await accountPost<{ review: MyReview }>("/api/reviews/save", { sku, rating, title, body, keep_photos: kept.map((p) => p.id) });
    if (!saved.ok) {
      setSending(false);
      setMessage(saved.message);
      return;
    }
    let sent = 0;
    let failedOne = false;
    for (const ph of added) {
      if (ph.state === "sent") continue;
      setAdded((a) => a.map((x) => (x.key === ph.key ? { ...x, state: "sending" } : x)));
      const out = await accountPost("/api/reviews/photo", { sku, data: ph.data });
      if (out.ok) sent += 1;
      else failedOne = true;
      setAdded((a) => a.map((x) => (x.key === ph.key ? { ...x, state: out.ok ? "sent" : "failed", error: out.ok ? undefined : out.message } : x)));
    }
    setSending(false);
    if (failedOne) {
      setMessage("Your review is saved, but a photo didn't upload. Tap Send again to retry, or remove it.");
      return;
    }
    try {
      localStorage.removeItem(draftKey);
    } catch {
      /* blocked storage */
    }
    onDone({ first: displayName.split(" ")[0] === "Verified" ? "" : displayName.split(" ")[0], photos: sent, edited: !!mine });
  }

  return (
    <form className="rv-form" onSubmit={submit} noValidate>
      <div className="rv-scroll">
        {mine && (
          <p className="rv-note">
            {mine.status === "published" ? "Your review is live. Changes go back for a quick check before they show." : mine.status === "pending" ? "Your review is waiting for our check." : "Your review isn't shown. You can edit it and send it again."}
          </p>
        )}
        <fieldset className="rv-field">
          <legend>
            Your rating <span className="rv-req">*</span>
          </legend>
          <div className="rv-rate" role="radiogroup" aria-label="Rating" aria-describedby={errors.rating ? `${ids}-r` : undefined}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
                data-autofocus={n === 1 ? true : undefined}
                onClick={() => setRating(n)}
                className="rv-rate-star"
              >
                <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
                  <path d={STAR_PATH} className={n <= rating ? "rv-on" : "rv-empty"} />
                </svg>
              </button>
            ))}
            <span className="rv-rate-word">{WORDS[rating]}</span>
          </div>
          {errors.rating && (
            <p className="rv-err" id={`${ids}-r`}>
              {errors.rating}
            </p>
          )}
        </fieldset>
        <div className="rv-field">
          <label htmlFor={`${ids}-t`}>
            Title <span className="rv-opt">(optional)</span>
          </label>
          <input id={`${ids}-t`} value={title} maxLength={TITLE_MAX} onChange={(e) => setTitle(e.target.value)} autoComplete="off" />
        </div>
        <div className="rv-field">
          <label htmlFor={`${ids}-b`}>
            Your review <span className="rv-req">*</span>
          </label>
          <textarea
            id={`${ids}-b`}
            rows={4}
            value={body}
            maxLength={BODY_MAX}
            onChange={(e) => setBody(e.target.value)}
            aria-invalid={!!errors.body}
            aria-describedby={`${ids}-bc${errors.body ? ` ${ids}-be` : ""}`}
            placeholder={`What did you like about ${name}? How was the packing and delivery?`}
          />
          <div className="rv-count" id={`${ids}-bc`}>
            <span>At least {BODY_MIN} characters</span>
            <span>
              {body.length} / {BODY_MAX}
            </span>
          </div>
          {errors.body && (
            <p className="rv-err" id={`${ids}-be`}>
              {errors.body}
            </p>
          )}
        </div>
        <div className="rv-field">
          <p className="rv-label">
            Photos <span className="rv-opt">(optional, up to {MAX_PHOTOS})</span>
          </p>
          <div className="rv-pics" hidden={count === 0 && preparing === 0}>
            {kept.map((p, i) => (
              <div className="rv-pic" key={p.id}>
                {/* eslint-disable-next-line @next/next/no-img-element -- the shopper's own photo */}
                <img src={`/api/reviews/my-photo?id=${p.id}`} alt={`Your photo ${i + 1}`} />
                <button type="button" className="rv-pic-x" aria-label={`Remove photo ${i + 1}`} onClick={() => setKept((k) => k.filter((x) => x.id !== p.id))}>
                  <Icon name="x" size={14} />
                </button>
              </div>
            ))}
            {added.map((p, i) => (
              <div className={`rv-pic is-${p.state}`} key={p.key}>
                {/* eslint-disable-next-line @next/next/no-img-element -- a local preview */}
                <img src={p.preview} alt={`New photo ${i + 1}${p.state === "failed" ? ", didn't upload" : ""}`} />
                {p.state === "sending" && <span className="rv-pic-spin" aria-label="Uploading" />}
                {p.state !== "sending" && p.state !== "sent" && (
                  <button type="button" className="rv-pic-x" aria-label={`Remove new photo ${i + 1}`} onClick={() => setAdded((a) => a.filter((x) => x.key !== p.key))}>
                    <Icon name="x" size={14} />
                  </button>
                )}
              </div>
            ))}
            {preparing > 0 && <div className="rv-pic is-sending" aria-label="Preparing photo"><span className="rv-pic-spin" /></div>}
            {room > 0 && count > 0 && (
              <label className="rv-add">
                <EIcon name="plus" size={22} />
                <span>Add</span>
                <small>
                  {count} of {MAX_PHOTOS}
                </small>
                {input}
              </label>
            )}
          </div>
          {room > 0 && count === 0 && (
            <label
              className={`rv-drop${dragging ? " is-over" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void pick(e.dataTransfer.files);
              }}
            >
              <span className="rv-drop-icon" aria-hidden="true">
                <EIcon name="camera" size={24} />
              </span>
              <span className="rv-drop-text">
                <b>Add photos</b>
                <small>Show the gift, the wrapping or how it was used. Up to {MAX_PHOTOS}.</small>
              </span>
              <span className="rv-drop-btn" aria-hidden="true">
                Choose
              </span>
              {input}
            </label>
          )}
          <p className="rv-hint">
            <Icon name="shield" size={13} /> JPG, PNG, WebP or iPhone photos. We shrink them and remove location data.
          </p>
        </div>
        <p className="rv-who-note">
          <Icon name="shield" size={16} /> Shown as <b>{displayName}</b> with a Verified buyer tick
        </p>
        {message && (
          <p className="rv-err" role="alert">
            {message}
          </p>
        )}
      </div>
      <div className="rv-foot">
        <button type="submit" className="rv-primary" disabled={sending}>
          {sending ? "Sending…" : mine ? "Send changes" : "Submit review"}
        </button>
        <p>We check every review before it appears, usually within a day.</p>
      </div>
    </form>
  );
}
