import "server-only";

import { createRemoteJWKSet, jwtVerify } from "jose";

export const FIREBASE_PROJECT_ID = "wahome-foundation";

const firebaseSigningKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

export async function verifyFirebaseIdToken(idToken: string) {
  const { payload, protectedHeader } = await jwtVerify(idToken, firebaseSigningKeys, {
    algorithms: ["RS256"],
    audience: FIREBASE_PROJECT_ID,
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    requiredClaims: ["sub", "auth_time"],
  });

  if (typeof payload.sub !== "string" || !payload.sub) {
    throw new Error("Firebase ID token is missing its subject.");
  }

  return { payload, protectedHeader, uid: payload.sub };
}
