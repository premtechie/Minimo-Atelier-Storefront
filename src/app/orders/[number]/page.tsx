import type { Metadata } from "next";
import { InnerHeader } from "@/components/header";
import { OrderDetail } from "@/components/orders-view";
import { getStore } from "@/lib/catalogue";
import { orderLinks } from "@/lib/lite";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export const revalidate = 60;

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const [{ number }, store] = await Promise.all([params, getStore()]);
  return (
    <>
      <InnerHeader />
      <main id="main" className="dz e-od" data-clarity-mask="true">
        <OrderDetail number={decodeURIComponent(number).toUpperCase().slice(0, 30)} links={orderLinks(store)} />
      </main>
    </>
  );
}
