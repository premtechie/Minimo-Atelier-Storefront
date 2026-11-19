import Link from "next/link";
import { InnerHeader } from "@/components/header";
import { Icon } from "@/components/icon";

export default function NotFound() {
  return (
    <>
      <InnerHeader />
      <main id="main" className="m-wrap m-empty m-404">
        <span className="m-empty-icon">
          <Icon name="gift" size={24} />
        </span>
        <h1 className="m-h2">We couldn&apos;t find that page</h1>
        <p>It may have sold out or moved. Try the shop, or search for it.</p>
        <div className="m-empty-btns">
          <Link className="m-btn m-btn--primary" href="/shop/return-gifts">
            Shop return gifts
          </Link>
          <Link className="m-btn m-btn--ghost" href="/search">
            Search
          </Link>
        </div>
      </main>
    </>
  );
}
