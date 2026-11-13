import "server-only";

import { deleteStaffObject, uploadStaffObject } from "./firebase-rest";
import { requireStaffSession } from "./staff-auth";

export function privateFileUrl(path: string) {
  return `/api/files?path=${encodeURIComponent(path)}`;
}

export async function uploadStaffFile(file: File, folder: "photos" | "docs" | "reports") {
  await requireStaffSession();
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const objectPath = `applicant-photos/${folder}/${crypto.randomUUID()}.${extension}`;
  const data = new Uint8Array(await file.arrayBuffer());
  await uploadStaffObject(objectPath, data, file.type || "application/octet-stream");
  return objectPath;
}

export async function deleteStaffFile(path: string) {
  await requireStaffSession();
  if (!path.startsWith("applicant-photos/")) return;
  await deleteStaffObject(path);
}
