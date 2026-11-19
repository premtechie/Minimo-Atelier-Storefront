import type { Metadata } from "next";
import { InnerHeader } from "@/components/header";
import { OrdersList } from "@/components/orders-view";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };

export default function Orders() {
  return (
    <>
      <InnerHeader />
      <main id="main" className="dz e-od">
        <OrdersList />
      </main>
    </>
  );
}
