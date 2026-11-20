import type { Metadata } from "next";
import { InnerHeader } from "@/components/header";
import { OrderDetail } from "@/components/orders-view";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  return (
    <>
      <InnerHeader />
      <main id="main" className="dz e-od" data-clarity-mask="true">
        <OrderDetail number={decodeURIComponent(number).toUpperCase().slice(0, 30)} />
      </main>
    </>
  );
}
