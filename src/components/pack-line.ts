import type { CartLine } from "@/lib/cart";
import type { ResolvedPack } from "@/lib/types";

/** A ready-made pack as a cart line: one unit is one bag, made of its real SKUs. */
export function packLine(k: ResolvedPack, qty: number, note?: string): CartLine {
  const parts = [
    ...k.parts.map((x) => ({ sku: x.product.sku, qty: x.qty })),
    { sku: k.bagProduct.sku, qty: 1 },
    ...(k.tagProduct ? [{ sku: k.tagProduct.sku, qty: 1 }] : []),
  ];
  return {
    key: `pack:${k.id}:${Date.now().toString(36)}`,
    kind: "pack",
    ref: k.id,
    name: k.name,
    price: k.price,
    qty,
    image: k.art,
    parts,
    note: note || undefined,
    detail: [...k.parts.map((x) => x.product.name), k.bagProduct.name, k.tagProduct?.name].filter(Boolean).join(", "),
  };
}
