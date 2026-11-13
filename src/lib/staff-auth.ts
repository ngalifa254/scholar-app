import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";

export const STAFF_SESSION_COOKIE = "__session";
export const STAFF_SESSION_MAX_AGE_SECONDS = 5 * 24 * 60 * 60;

export type StaffSession = {
  uid: string;
  email: string;
  auth_time: number;
  iat: number;
  exp: number;
};

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

function sessionSigningKey() {
  const secret = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!secret) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured.");
  return new TextEncoder().encode(secret);
}

export async function createStaffSessionToken(claims: {
  uid: string;
  email: string;
  auth_time: number;
}) {
  return new SignJWT({ email: claims.email, auth_time: claims.auth_time })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer("wahome-foundation-student-center")
    .setAudience("wahome-foundation-staff")
    .setSubject(claims.uid)
    .setIssuedAt()
    .setExpirationTime(`${STAFF_SESSION_MAX_AGE_SECONDS}s`)
    .sign(sessionSigningKey());
}

export async function getStaffSession(): Promise<StaffSession | null> {
  const token = (await cookies()).get(STAFF_SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionSigningKey(), {
      algorithms: ["HS256"],
      issuer: "wahome-foundation-student-center",
      audience: "wahome-foundation-staff",
      requiredClaims: ["sub", "email", "auth_time", "iat", "exp"],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.auth_time !== "number" ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number" ||
      !isAllowedStaffEmail(payload.email)
    ) {
      return null;
    }

    return {
      uid: payload.sub,
      email: payload.email,
      auth_time: payload.auth_time,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export async function requireStaffSession(): Promise<StaffSession> {
  const session = await getStaffSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireStaffApiSession(): Promise<StaffSession | null> {
  return getStaffSession();
}
