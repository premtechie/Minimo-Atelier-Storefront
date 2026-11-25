import { adminFetch } from "@/lib/catalogue";

// GET /img/review/{id} → a customer's review photo, fetched from the admin with
// the server key. The admin answers only while the review and the photo are
// published, so a photo the shop hides stops showing within the hour.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = decodeURIComponent((await ctx.params).id).toLowerCase();
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("Not found", { status: 404 });
  try {
    const res = await adminFetch(`/review-photos/${id}`, { next: { revalidate: 3600 } });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/^image\/(webp|jpeg)$/.test(type)) return new Response("Not found", { status: 404, headers: { "cache-control": "public, max-age=300" } });
    return new Response(await res.arrayBuffer(), {
      headers: { "content-type": type, "cache-control": "public, max-age=3600, s-maxage=3600", "x-content-type-options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
