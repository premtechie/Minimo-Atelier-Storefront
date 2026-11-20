import { adminFetch } from "@/lib/catalogue";

// GET /img/{sku}/{id}?v=… → one of the shop's further photos of that product,
// fetched from the admin with the server key. Like /img/{sku}, the ?v= stamp
// changes with the photo, so browsers and the CDN can keep each one for a year.
export async function GET(req: Request, ctx: { params: Promise<{ sku: string; id: string }> }) {
  const { sku: rawSku, id: rawId } = await ctx.params;
  const sku = decodeURIComponent(rawSku).toUpperCase();
  const id = decodeURIComponent(rawId).toLowerCase();
  if (!/^[A-Z0-9-]{1,40}$/.test(sku) || !/^[0-9a-f-]{36}$/.test(id)) return new Response("Not found", { status: 404 });
  try {
    const v = (new URL(req.url).searchParams.get("v") ?? "").replace(/\D/g, "").slice(0, 12);
    const res = await adminFetch(`/photos/${encodeURIComponent(sku)}/${id}?v=${v}`, { next: { revalidate: 86400 } });
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
