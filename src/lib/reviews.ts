/*
 * Customer reviews as the website shows them. The admin keeps every review
 * and photo; a review appears only after the shop approves it, and only
 * shoppers with a paid purchase of the product can write one.
 */

export type ReviewPhoto = { id: string; width: number; height: number };
export type PublicReview = {
  id: string;
  rating: number;
  title: string;
  body: string;
  name: string;
  verified: boolean;
  date: string;
  photos: ReviewPhoto[];
  reply: string | null;
};
export type ReviewSummary = { average: number; count: number; stars: Record<"1" | "2" | "3" | "4" | "5", number>; photos: number };
export type ReviewPage = { summary: ReviewSummary; photo_ids: string[]; reviews: PublicReview[]; page: number; more: boolean };

export type MyReview = { id: string; rating: number; title: string; body: string; status: "pending" | "published" | "hidden"; display_name: string; photos: ReviewPhoto[] };
export type Eligibility =
  | { state: "signed_out" | "not_found" }
  | { state: "not_bought"; product: { sku: string; name: string } }
  | { state: "can_review" | "reviewed"; product: { sku: string; name: string }; review: MyReview | null; display_name: string };

export const MAX_PHOTOS = 4;
export const TITLE_MAX = 80;
export const BODY_MIN = 10;
export const BODY_MAX = 1500;
/** The largest original a shopper may pick; it is shrunk on their phone before upload. */
export const PICK_MAX_BYTES = 15 * 1024 * 1024;

export const reviewPhotoUrl = (id: string) => `/img/review/${id}`;
export const EMPTY_SUMMARY: ReviewSummary = { average: 0, count: 0, stars: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }, photos: 0 };

export function reviewDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}
