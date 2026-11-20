"use client";

import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";

/*
 * Sign-in codes through Google Firebase, used when the admin says the
 * provider is "firebase". Firebase sends the SMS on its own registration (no
 * DLT needed for Minimo), checks the code in the browser, and gives us a
 * signed ID token that the admin verifies against Google's public keys.
 * We only borrow Firebase for the check: the shopper's real session is ours,
 * so Firebase is signed out again straight away.
 *
 * The web config is public by design (it identifies the project, it grants
 * nothing); it is loaded only when a shopper asks for a code.
 */
const CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = () => !!(CONFIG.apiKey && CONFIG.authDomain && CONFIG.projectId);

let verifier: RecaptchaVerifier | null = null;

async function auth() {
  const [{ getApps, initializeApp }, mod] = await Promise.all([import("firebase/app"), import("firebase/auth")]);
  const app = getApps()[0] ?? initializeApp(CONFIG);
  const a = mod.getAuth(app);
  a.languageCode = "en";
  return { a, mod };
}

/** Asks Firebase to text the code to +91 {phone}. The invisible reCAPTCHA lives in `holder`. */
export async function sendFirebaseCode(phone: string, holder: HTMLElement): Promise<ConfirmationResult> {
  const { a, mod } = await auth();
  try {
    verifier?.clear();
  } catch {
    /* its old box left with the previous step */
  }
  holder.replaceChildren();
  const box = document.createElement("div");
  holder.append(box);
  verifier = new mod.RecaptchaVerifier(a, box, { size: "invisible" });
  return mod.signInWithPhoneNumber(a, `+91${phone}`, verifier);
}

/** Checks the typed code with Firebase and returns its ID token for our admin to verify. */
export async function confirmFirebaseCode(sent: ConfirmationResult, code: string): Promise<string> {
  const cred = await sent.confirm(code);
  const token = await cred.user.getIdToken();
  const { a, mod } = await auth();
  await mod.signOut(a).catch(() => {});
  return token;
}

/** Firebase's error codes in the sheet's words. */
export function firebaseMessage(e: unknown): string {
  const code = typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : "";
  if (code === "auth/invalid-verification-code") return "That code isn't right. Check the SMS and try again.";
  if (code === "auth/code-expired") return "This code has expired. Ask for a new one.";
  if (code === "auth/too-many-requests" || code === "auth/quota-exceeded") return "Too many codes for now. Please try again in a little while.";
  if (code === "auth/invalid-phone-number") return "Enter a valid 10-digit mobile number.";
  if (code === "auth/network-request-failed") return "No connection. Check your internet and try again.";
  return "We couldn't send the code just now. Please try again in a minute.";
}
