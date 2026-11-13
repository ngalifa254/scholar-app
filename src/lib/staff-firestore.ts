import "server-only";

import { getStaffFirestore as createFirestoreClient } from "./firebase-rest";
import { requireStaffSession } from "./staff-auth";

export async function getStaffFirestore() {
  await requireStaffSession();
  return createFirestoreClient();
}
