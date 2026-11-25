import "server-only";
import { adminFetch } from "./catalogue";
import type { ReviewPage } from "./reviews";

/** How long the site keeps a product's reviews before asking the admin again (seconds). */
export const REVIEWS_REVALIDATE = 300;

/** A product's published reviews (first page), or null when the admin can't be reached. */
export async function fetchReviews(sku: string, q: { page?: number; photos?: boolean; sort?: string } = {}): Promise<ReviewPage | null> {
  try {
    const qs = new URLSearchParams();
    if (q.page && q.page > 1) qs.set("page", String(q.page));
    if (q.photos) qs.set("photos", "1");
    if (q.sort && q.sort !== "newest") qs.set("sort", q.sort);
    const res = await adminFetch(`/reviews/product/${encodeURIComponent(sku)}${qs.size ? `?${qs}` : ""}`, {
      next: { revalidate: REVIEWS_REVALIDATE, tags: ["reviews", `reviews:${sku}`] },
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as ReviewPage;
  } catch (err) {
    console.error("[minimo] reviews unavailable:", err instanceof Error ? err.message : err);
    return null;
  }
}
