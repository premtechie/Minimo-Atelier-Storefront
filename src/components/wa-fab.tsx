"use client";

import { usePathname } from "next/navigation";
import { waLink } from "@/lib/whatsapp";
import { EIcon } from "./icon";

/** Pages where the design shows the floating WhatsApp button. */
const SHOW_ON = ["/for-her", "/for-him", "/visit-our-store"];

export function WaFab() {
  const path = usePathname();
  if (!SHOW_ON.some((p) => path === p || path.startsWith(p + "/"))) return null;
  return (
    <a className="m-wafab" href={waLink("Hi Minimo Atelier! I have a question.")} target="_blank" rel="noopener" aria-label="Chat on WhatsApp">
      <EIcon name="wa" size={26} />
    </a>
  );
}
