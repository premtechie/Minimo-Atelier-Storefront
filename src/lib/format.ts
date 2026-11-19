export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
export const productHref = (sku: string) => `/product/${sku.toLowerCase()}`;
export const packHref = (id: string) => `/packs/${id}`;
