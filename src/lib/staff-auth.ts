import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getFirebaseAdminAuth } from "./firebase-admin";

export const STAFF_SESSION_COOKIE = "__session";

function allowedStaffEmails() {
  return new Set(
    (process.env.FIREBASE_STAFF_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAllowedStaffEmail(email: string | undefined) {
  if (!email) return false;
  return allowedStaffEmails().has(email.toLowerCase());
}

export async function getStaffSession(): Promise<DecodedIdToken | null> {
  const cookie = (await cookies()).get(STAFF_SESSION_COOKIE)?.value;
  if (!cookie) return null;

  try {
    const decoded = await getFirebaseAdminAuth().verifySessionCookie(cookie, true);
    return isAllowedStaffEmail(decoded.email) ? decoded : null;
  } catch {
    return null;
  }
}

export async function requireStaffSession(): Promise<DecodedIdToken> {
  const session = await getStaffSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireStaffApiSession(): Promise<DecodedIdToken | null> {
  const cookie = (await cookies()).get(STAFF_SESSION_COOKIE)?.value;
  if (!cookie) return null;

  try {
    const decoded = await getFirebaseAdminAuth().verifySessionCookie(cookie, true);
    return isAllowedStaffEmail(decoded.email) ? decoded : null;
  } catch {
    return null;
  }
}
