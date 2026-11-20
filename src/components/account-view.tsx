"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { accountPost, SignInFlow, useAccount, type Account } from "./account-provider";
import { Icon, type IconName } from "./icon";
import { OrderCard, useOrders } from "./orders-view";
import { SafeImg } from "./safe-img";
import { useShop } from "./shop-provider";
import { inr } from "@/lib/format";
import type { LiteItem } from "@/lib/lite";

/*
 * The account page, laid out like Bluebee's: "Hello, name" and the mobile,
 * a menu of Orders, Wishlist, Addresses and Profile with Sign out under it,
 * and the chosen tab beside it (?tab=). Signed out, it is the sign-in page.
 */

export type Address = { id: string; first_name: string; last_name: string; phone: string | null; line1: string; line2: string; city: string; pin: string; state: string; is_default: boolean };

export const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

type Tab = "orders" | "wishlist" | "addresses" | "profile";
const TABS: [Tab, string, IconName][] = [
  ["orders", "Orders", "box"],
  ["wishlist", "Wishlist", "heart"],
  ["addresses", "Addresses", "pin"],
  ["profile", "Profile", "user"],
];

export function AccountView({ items }: { items: LiteItem[] }) {
  const { status, account, config, signOut, setAccount } = useAccount();
  const params = useSearchParams();
  const router = useRouter();
  const raw = params.get("tab");
  const tab: Tab = TABS.some(([t]) => t === raw) ? (raw as Tab) : "orders";

  if (status === "loading" || !config) return <div className="a-skel" aria-label="Loading your account" />;

  if (status !== "signed_in" || !account) {
    if (!config.available)
      return (
        <div className="a-welcome">
          <p className="a-eyebrow">Account</p>
          <h1 className="a-hello">Welcome</h1>
          <p className="a-fine">Sign-in is coming soon. Your orders on this phone are under My orders.</p>
          <Link className="a-btn" href="/orders">
            My orders
          </Link>
        </div>
      );
    return (
      <div className="a-welcome">
        <p className="a-eyebrow">Account</p>
        <h1 className="a-hello">Welcome</h1>
        <p className="a-fine">Sign in or create an account.</p>
        <SignInFlow config={config} onDone={(a) => setAccount(a)} idPrefix="ap" autoFocus={false} />
        <p className="a-divider">New to Minimo?</p>
        <p className="a-fine">No sign-up needed — an account is created automatically on your first login.</p>
        <p className="a-fine" style={{ marginTop: 14 }}>
          <Link className="a-link" href="/shop/return-gifts">
            Continue browsing
          </Link>
        </p>
      </div>
    );
  }

  const go = (t: Tab) => router.replace(t === "orders" ? "/account" : `/account?tab=${t}`, { scroll: false });
  return (
    <>
      <p className="a-eyebrow">Account</p>
      <h1 className="a-hello">Hello{account.first_name ? `, ${account.first_name}` : ""}</h1>
      <p className="a-mobile">+91{account.phone}</p>
      <div className="a-layout">
        <nav className="a-menu" aria-label="Account">
          {TABS.map(([t, label, icon]) => (
            <button key={t} type="button" className="a-tab" aria-current={tab === t ? "page" : undefined} onClick={() => go(t)}>
              <Icon name={icon} size={17} /> {label}
            </button>
          ))}
          <button
            type="button"
            className="a-tab a-tab--out"
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
          >
            <Icon name="logout" size={17} /> Sign out
          </button>
        </nav>
        <section aria-label={TABS.find(([t]) => t === tab)![1]}>
          {tab === "orders" && <OrdersTab />}
          {tab === "wishlist" && <WishlistTab items={items} />}
          {tab === "addresses" && <AddressesTab />}
          {tab === "profile" && <ProfileTab account={account} onSaved={setAccount} />}
        </section>
      </div>
    </>
  );
}

function OrdersTab() {
  const { saved, mounted, state } = useOrders();
  const list = saved.filter((s) => s.order);
  return (
    <>
      <h2 className="a-h2">Orders</h2>
      {!mounted || (state !== "ok" && state !== "error" && !list.length) ? (
        <div className="a-skel" aria-label="Loading your orders" />
      ) : list.length ? (
        <div className="a-orders dz e-od">
          {list.map((s) => (
            <OrderCard key={s.number} s={s} />
          ))}
        </div>
      ) : (
        <div className="a-empty">
          <p>No orders yet.</p>
          <Link href="/shop/return-gifts">Browse the shop →</Link>
        </div>
      )}
    </>
  );
}

function WishlistTab({ items }: { items: LiteItem[] }) {
  const { wish, toggleWish, ready } = useShop();
  const saved = items.filter((x) => wish.has(x.id));
  return (
    <>
      <h2 className="a-h2">Wishlist</h2>
      {!ready ? (
        <div className="a-skel" />
      ) : !saved.length ? (
        <div className="a-empty">
          <p>Nothing saved yet.</p>
          <Link href="/shop/return-gifts">Browse the shop →</Link>
        </div>
      ) : (
        <div className="a-grid">
          {saved.map((x) => (
            <article key={x.id} className="a-wcard">
              <div className="a-wcard-img">{x.image && <SafeImg src={x.image} alt="" loading="lazy" />}</div>
              <div className="a-wcard-body">
                <b>{x.name}</b>
                <span>
                  {inr(x.price)}
                  {x.unit ? ` ${x.unit}` : ""}
                </span>
                <div className="a-wcard-acts">
                  <Link href={x.href}>View</Link>
                  <button type="button" aria-label={`Remove ${x.name}`} onClick={() => toggleWish(x.id, x.name)}>
                    <Icon name="x" size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

const EMPTY_ADDR = { first_name: "", last_name: "", phone: "", line1: "", line2: "", city: "Hyderabad", pin: "", state: "Telangana", is_default: false };

/** The shopper's saved addresses (also offered at checkout). */
export function useAddresses(enabled = true) {
  const [list, setList] = useState<Address[] | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    void accountPost<{ addresses: Address[] }>("/api/account/overview").then((res) => live && setList(res.ok ? res.data.addresses : []));
    return () => {
      live = false;
    };
  }, [version, enabled]);
  return { list, setList, reload: () => setVersion((v) => v + 1) };
}

function AddressesTab() {
  const { list, setList } = useAddresses();
  const [editing, setEditing] = useState<(typeof EMPTY_ADDR & { id?: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    setErr("");
    const res = await accountPost<{ addresses: Address[] }>("/api/account/address-save", editing);
    setBusy(false);
    if (!res.ok) return setErr(res.message);
    setList(res.data.addresses);
    setEditing(null);
  };
  const remove = async (id: string) => {
    const res = await accountPost<{ addresses: Address[] }>("/api/account/address-remove", { id });
    if (res.ok) setList(res.data.addresses);
  };
  const set = (k: keyof typeof EMPTY_ADDR, v: string | boolean) => setEditing((e) => (e ? { ...e, [k]: v } : e));

  return (
    <>
      <h2 className="a-h2">Addresses</h2>
      {editing ? (
        <form
          className="a-form"
          style={{ maxWidth: 560 }}
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <div className="a-row2">
            <label className="a-field">
              <span className="a-label">First name *</span>
              <input className="a-input" value={editing.first_name} onChange={(e) => set("first_name", e.target.value.slice(0, 40))} placeholder="First name" autoComplete="given-name" />
            </label>
            <label className="a-field">
              <span className="a-label">Last name</span>
              <input className="a-input" value={editing.last_name} onChange={(e) => set("last_name", e.target.value.slice(0, 40))} placeholder="Last name" autoComplete="family-name" />
            </label>
          </div>
          <label className="a-field">
            <span className="a-label">Phone (for delivery)</span>
            <input className="a-input" value={editing.phone} onChange={(e) => set("phone", e.target.value.replace(/[^\d+ ]/g, "").slice(0, 14))} placeholder="+91 98765 43210" inputMode="tel" autoComplete="tel" />
          </label>
          <label className="a-field">
            <span className="a-label">Address line 1 *</span>
            <input className="a-input" value={editing.line1} onChange={(e) => set("line1", e.target.value.slice(0, 120))} placeholder="Street, building, flat no." autoComplete="address-line1" />
          </label>
          <label className="a-field">
            <span className="a-label">Address line 2</span>
            <input className="a-input" value={editing.line2} onChange={(e) => set("line2", e.target.value.slice(0, 120))} placeholder="Landmark (optional)" autoComplete="address-line2" />
          </label>
          <div className="a-row2" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
            <label className="a-field">
              <span className="a-label">City *</span>
              <input className="a-input" value={editing.city} onChange={(e) => set("city", e.target.value.slice(0, 60))} placeholder="City" autoComplete="address-level2" />
            </label>
            <label className="a-field">
              <span className="a-label">PIN code *</span>
              <input className="a-input" value={editing.pin} onChange={(e) => set("pin", e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit PIN" inputMode="numeric" autoComplete="postal-code" />
            </label>
          </div>
          <label className="a-field">
            <span className="a-label">State *</span>
            <select className="a-select" value={editing.state} onChange={(e) => set("state", e.target.value)} autoComplete="address-level1">
              <option value="">Select state</option>
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="a-check">
            <input type="checkbox" checked={editing.is_default} onChange={(e) => set("is_default", e.target.checked)} /> Set as default address
          </label>
          <p className="a-err" aria-live="polite">
            {err}
          </p>
          <div className="a-actions">
            <button className="a-pill a-pill--dark" disabled={busy}>
              <Icon name="check" size={14} /> {busy ? "Saving…" : "Save address"}
            </button>
            <button type="button" className="a-pill" onClick={() => (setEditing(null), setErr(""))}>
              Cancel
            </button>
          </div>
        </form>
      ) : list === null ? (
        <div className="a-skel" />
      ) : (
        <>
          {list.length > 0 ? (
            <div className="a-addrs">
              {list.map((a) => (
                <div key={a.id} className={`a-addr ${a.is_default ? "is-default" : ""}`}>
                  {a.is_default && <span className="a-addr-tag">Default</span>}
                  <b>{[a.first_name, a.last_name].filter(Boolean).join(" ")}</b>
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                  <br />
                  {a.city} — {a.pin}
                  <br />
                  {a.state}, IN
                  {a.phone && (
                    <>
                      <br />
                      <span className="a-addr-phone">+91{a.phone}</span>
                    </>
                  )}
                  <div className="a-actions">
                    <button type="button" className="a-pill" onClick={() => setEditing({ ...a, phone: a.phone ?? "" })}>
                      <Icon name="pen" size={12} /> Edit
                    </button>
                    <button type="button" className="a-pill a-pill--danger" onClick={() => void remove(a.id)}>
                      <Icon name="trash" size={12} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="a-fine" style={{ textAlign: "left" }}>
              No saved addresses yet.
            </p>
          )}
          <button type="button" className="a-pill a-add" onClick={() => setEditing({ ...EMPTY_ADDR, is_default: list.length === 0 })}>
            <Icon name="plus" size={14} /> Add new address
          </button>
        </>
      )}
    </>
  );
}

function ProfileTab({ account, onSaved }: { account: Account; onSaved: (a: Account) => void }) {
  const [editing, setEditing] = useState(false);
  const [first, setFirst] = useState(account.first_name);
  const [last, setLast] = useState(account.last_name);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const save = async () => {
    setBusy(true);
    setErr("");
    const res = await accountPost<{ account: Account }>("/api/account/profile", { first_name: first, last_name: last });
    setBusy(false);
    if (!res.ok) return setErr(res.message);
    onSaved(res.data.account);
    setEditing(false);
  };
  return (
    <>
      <h2 className="a-h2">Profile</h2>
      <div className="a-prof">
        <div className="a-prof-row">
          <span className="a-label">Name</span>
          {editing ? (
            <form
              className="a-form"
              style={{ marginTop: 10 }}
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              <div className="a-row2">
                <label className="a-field">
                  <span className="a-label">First *</span>
                  <input className="a-input" value={first} onChange={(e) => setFirst(e.target.value.slice(0, 40))} autoFocus autoComplete="given-name" />
                </label>
                <label className="a-field">
                  <span className="a-label">Last</span>
                  <input className="a-input" value={last} onChange={(e) => setLast(e.target.value.slice(0, 40))} autoComplete="family-name" />
                </label>
              </div>
              {err && <p className="a-err">{err}</p>}
              <div className="a-actions">
                <button className="a-pill a-pill--dark" disabled={busy}>
                  <Icon name="check" size={14} /> {busy ? "Saving…" : "Save"}
                </button>
                <button type="button" className="a-pill" onClick={() => (setEditing(false), setFirst(account.first_name), setLast(account.last_name), setErr(""))}>
                  <Icon name="x" size={14} /> Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <p>{account.name || "Add your name"}</p>
              <button type="button" className="a-prof-edit" aria-label="Edit name" onClick={() => setEditing(true)}>
                <Icon name="pen" size={15} />
              </button>
            </>
          )}
        </div>
        <div className="a-prof-row">
          <span className="a-label">Mobile</span>
          <p>+91{account.phone}</p>
        </div>
      </div>
    </>
  );
}
