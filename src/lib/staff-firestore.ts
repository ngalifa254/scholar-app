import "server-only";

import { getFirebaseAdminDb } from "./firebase-admin";
import { requireStaffSession } from "./staff-auth";

export async function getStaffFirestore() {
  await requireStaffSession();
  return getFirebaseAdminDb();
}
