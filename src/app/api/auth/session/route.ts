import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseIdToken } from "@/lib/firebase-token";
import {
  createStaffSessionToken,
  isAllowedStaffEmail,
  STAFF_SESSION_COOKIE,
  STAFF_SESSION_MAX_AGE_SECONDS,
} from "@/lib/staff-auth";

export const runtime = "nodejs";

function isSameOrigin(request: NextRequest) {
  return request.headers.get("origin") === new URL(request.url).origin;
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ code: "INVALID_REQUEST_ORIGIN", error: "Invalid request origin." }, { status: 403 });
    }

    const body = await request.json();
    if (typeof body?.idToken !== "string" || body.idToken.length > 10_000) {
      return NextResponse.json({ code: "MISSING_SIGN_IN_TOKEN", error: "Sign-in token is missing." }, { status: 400 });
    }

    const { payload, uid } = await verifyFirebaseIdToken(body.idToken);
    const authTime = Number(payload.auth_time ?? 0);
    if (!Number.isFinite(authTime) || Date.now() / 1000 - authTime > 5 * 60 || authTime > Date.now() / 1000 + 60) {
      return NextResponse.json({ code: "AUTHENTICATION_TOO_OLD", error: "Please sign in again." }, { status: 401 });
    }
    const email = typeof payload.email === "string" ? payload.email : undefined;
    if (!email || !isAllowedStaffEmail(email)) {
      return NextResponse.json({
        code: "STAFF_ACCESS_DENIED",
        error: "This account is not authorized for Student Center.",
      }, { status: 403 });
    }

    const sessionCookie = await createStaffSessionToken({
      uid,
      email,
      auth_time: authTime,
    });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(STAFF_SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: STAFF_SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
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
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
