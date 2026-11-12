import "server-only";

import { getFirebaseAdminBucket } from "./firebase-admin";
import { requireStaffSession } from "./staff-auth";

export function privateFileUrl(path: string) {
  return `/api/files?path=${encodeURIComponent(path)}`;
}

export async function uploadStaffFile(file: File, folder: "photos" | "docs" | "reports") {
  await requireStaffSession();
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const objectPath = `applicant-photos/${folder}/${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await getFirebaseAdminBucket().file(objectPath).save(buffer, {
    resumable: false,
    metadata: {
      contentType: file.type || "application/octet-stream",
      cacheControl: "private, no-store",
    },
  });
  return objectPath;
}

export async function deleteStaffFile(path: string) {
  await requireStaffSession();
  if (!path.startsWith("applicant-photos/")) return;
  await getFirebaseAdminBucket().file(path).delete({ ignoreNotFound: true });
}
