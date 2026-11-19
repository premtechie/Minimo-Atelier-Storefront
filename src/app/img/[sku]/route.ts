import { adminFetch } from "@/lib/catalogue";

// GET /img/{sku}?v=… → the shop's photo of that product, fetched from the admin
// with the server key. The ?v= stamp changes when the photo does, so browsers
// and the CDN can keep each version for a year.
export async function GET(req: Request, ctx: { params: Promise<{ sku: string }> }) {
  const sku = decodeURIComponent((await ctx.params).sku).toUpperCase();
  if (!/^[A-Z0-9-]{1,40}$/.test(sku)) return new Response("Not found", { status: 404 });
  try {
    const v = (new URL(req.url).searchParams.get("v") ?? "").replace(/\D/g, "").slice(0, 12);
    // The version is part of the cached URL, so a new photo is fetched straight away.
    const res = await adminFetch(`/photos/${encodeURIComponent(sku)}?v=${v}`, { next: { revalidate: 86400 } });
    if (!res.ok) return new Response("Not found", { status: 404 });
    const type = res.headers.get("content-type") ?? "";
    if (!/^image\/(jpeg|png|webp)$/.test(type)) return new Response("Not found", { status: 404 });
    return new Response(await res.arrayBuffer(), {
      headers: { "content-type": type, "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
