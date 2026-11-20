import type { Metadata } from "next";
import { Suspense } from "react";
import { InnerHeader } from "@/components/header";
import { AccountView } from "@/components/account-view";
import { getStore } from "@/lib/catalogue";
import { liteCatalogue } from "@/lib/lite";

export const metadata: Metadata = { title: "Account", robots: { index: false } };
export const revalidate = 60;

export default async function AccountPage() {
  const store = await getStore();
  return (
    <>
      <InnerHeader />
      <main id="main" className="a-page">
        {/* Reads ?tab=orders|wishlist|addresses|profile, like Bluebee. */}
        <Suspense>
          <AccountView items={liteCatalogue(store)} />
        </Suspense>
      </main>
    </>
  );
}
