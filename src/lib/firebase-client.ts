"use client";

import type { Auth } from "firebase/auth";

/*
 * Website sign-in through Google Firebase, used when the admin's provider is
 * "firebase": "Continue with Google" or a sign-in link by email. Both are free
 * on Firebase's Spark plan (no card, no DLT). Firebase only proves who the
 * shopper is; the session is ours, so once our server has the ID token,
 * Firebase is signed out again.
 *
 * The web config is public by design (it names the project and grants
 * nothing). The SDK loads only when a shopper starts signing in.
 */
const CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
/** Where the typed email waits while the shopper opens the link (Firebase's own pattern). */
const EMAIL_KEY = "mm_signin_email";

export const firebaseConfigured = () => !!(CONFIG.apiKey && CONFIG.authDomain && CONFIG.projectId);

async function load() {
  const [{ getApps, initializeApp }, mod] = await Promise.all([import("firebase/app"), import("firebase/auth")]);
  const app = getApps()[0] ?? initializeApp(CONFIG);
  const auth: Auth = mod.getAuth(app);
  auth.languageCode = "en";
  return { auth, mod };
}

/** "Continue with Google" in a popup. Returns Firebase's ID token. */
export async function googleToken(): Promise<string> {
  const { auth, mod } = await load();
  const provider = new mod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await mod.signInWithPopup(auth, provider);
  return cred.user.getIdToken();
}

/** Emails a sign-in link that brings the shopper back to this page. */
export async function sendEmailLink(email: string): Promise<void> {
  const { auth, mod } = await load();
  const back = new URL(window.location.href);
  back.search = "";
  back.hash = "";
  await mod.sendSignInLinkToEmail(auth, email, { url: back.toString(), handleCodeInApp: true });
  try {
    localStorage.setItem(EMAIL_KEY, email);
  } catch {
    /* blocked storage: the shopper types the email again when the link opens */
  }
}

/** Whether this page was opened from a sign-in link (checked without loading the SDK). */
export function isEmailLink(href = typeof window === "undefined" ? "" : window.location.href) {
  try {
    const u = new URL(href);
    return u.searchParams.get("mode") === "signIn" && !!u.searchParams.get("oobCode") && !!u.searchParams.get("apiKey");
  } catch {
    return false;
  }
}

export function rememberedEmail() {
  try {
    return localStorage.getItem(EMAIL_KEY) || "";
  } catch {
    return "";
  }
}

/** Finishes a sign-in link for `email` and returns Firebase's ID token. Clears the link from the address bar. */
export async function finishEmailLink(email: string): Promise<string> {
  const { auth, mod } = await load();
  const href = window.location.href;
  const cred = await mod.signInWithEmailLink(auth, email, href);
  try {
    localStorage.removeItem(EMAIL_KEY);
  } catch {
    /* ignore */
  }
  const clean = new URL(href);
  for (const k of ["mode", "oobCode", "apiKey", "lang", "continueUrl", "tenantId"]) clean.searchParams.delete(k);
  window.history.replaceState(null, "", clean.pathname + (clean.search || "") + clean.hash);
  return cred.user.getIdToken();
}

/** A fresh ID token for the shopper still signed in to Firebase (for the second call, after name and mobile). */
export async function currentToken(): Promise<string | null> {
  const { auth } = await load();
  return auth.currentUser ? auth.currentUser.getIdToken(true) : null;
}

export async function firebaseSignOut() {
  const { auth, mod } = await load();
  await mod.signOut(auth).catch(() => {});
}

/** Firebase's error codes in the sheet's words. */
export function firebaseMessage(e: unknown): string {
  const code = typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : "";
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request" || code === "auth/user-cancelled") return "";
  if (code === "auth/popup-blocked") return "Your browser blocked the Google window. Allow pop-ups for this site, or use your email instead.";
  if (code === "auth/invalid-email") return "Enter a valid email address.";
  if (code === "auth/invalid-action-code" || code === "auth/expired-action-code") return "This sign-in link has expired or was already used. Ask for a new one.";
  if (code === "auth/too-many-requests" || code === "auth/quota-exceeded") return "Too many tries for now. Please try again in a little while.";
  if (code === "auth/network-request-failed") return "No connection. Check your internet and try again.";
  if (code === "auth/unauthorized-domain" || code === "auth/operation-not-allowed") return "Sign-in isn't set up on this site yet. Please message us on WhatsApp.";
  return "Something went wrong. Please try again.";
}
