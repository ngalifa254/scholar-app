import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminBucket } from "@/lib/firebase-admin";
import { requireStaffApiSession } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const staff = await requireStaffApiSession();
  if (!staff) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const path = request.nextUrl.searchParams.get("path");
  if (!path || path.length > 1024 || !path.startsWith("applicant-photos/")) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  try {
    const file = getFirebaseAdminBucket().file(path);
    const [[buffer], [metadata]] = await Promise.all([file.download(), file.getMetadata()]);
    const type = metadata.contentType || "application/octet-stream";
    const safeType = /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/.test(type)
      ? type
      : "application/octet-stream";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": safeType,
        "Content-Disposition": safeType === "application/octet-stream" ? "attachment" : "inline",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
