import { redirect } from "next/navigation";

/** /shop on its own goes to the main collection, as the design's "Shop" link does. */
export default function Shop() {
  redirect("/shop/return-gifts");
}
