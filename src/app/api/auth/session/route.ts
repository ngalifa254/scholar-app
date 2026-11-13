import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";
import { isAllowedStaffEmail, STAFF_SESSION_COOKIE } from "@/lib/staff-auth";

export const runtime = "nodejs";

const expiresIn = 5 * 24 * 60 * 60 * 1000;

function isSameOrigin(request: NextRequest) {
  return request.headers.get("origin") === new URL(request.url).origin;
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ code: "INVALID_REQUEST_ORIGIN", error: "Invalid request origin." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.idToken !== "string" || body.idToken.length > 10_000) {
    return NextResponse.json({ code: "MISSING_SIGN_IN_TOKEN", error: "Sign-in token is missing." }, { status: 400 });
  }

  try {
    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifyIdToken(body.idToken, true);
    const authTime = Number(decoded.auth_time ?? 0);
    if (Date.now() / 1000 - authTime > 5 * 60) {
      return NextResponse.json({ code: "AUTHENTICATION_TOO_OLD", error: "Please sign in again." }, { status: 401 });
    }
    if (!isAllowedStaffEmail(decoded.email)) {
      return NextResponse.json({
        code: "STAFF_ACCESS_DENIED",
        error: "This account is not authorized for Student Center.",
      }, { status: 403 });
    }

    const sessionCookie = await auth.createSessionCookie(body.idToken, { expiresIn });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(STAFF_SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn / 1000,
    });
    return response;
  } catch (cause) {
    const detail = cause && typeof cause === "object"
      ? cause as { code?: unknown; message?: unknown }
      : null;
    return NextResponse.json({
      code: typeof detail?.code === "string" ? detail.code : "SESSION_CREATION_FAILED",
      error: typeof detail?.message === "string" ? detail.message : "Unable to create a staff session.",
    }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ code: "INVALID_REQUEST_ORIGIN", error: "Invalid request origin." }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(STAFF_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
