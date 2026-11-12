import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAuthRoute = pathname === "/login" || pathname.startsWith("/api/auth/");
  if (isAuthRoute) return NextResponse.next();

  if (!request.cookies.has("__session")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|wahome-logo.png).*)"],
};
