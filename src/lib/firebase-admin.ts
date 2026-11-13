import "server-only";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function getAdminApp() {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawJson) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured.");

  let json = rawJson.trim();
  const firstCharacter = json[0];
  const lastCharacter = json[json.length - 1];
  const hasWrappingQuotes =
    (firstCharacter === '"' && lastCharacter === '"') ||
    (firstCharacter === "'" && lastCharacter === "'");

  if (hasWrappingQuotes) {
    if (firstCharacter === '"') {
      try {
        const unwrapped = JSON.parse(json) as unknown;
        json = typeof unwrapped === "string" ? unwrapped : json.slice(1, -1);
      } catch {
        json = json.slice(1, -1);
      }
    } else {
      json = json.slice(1, -1);
    }
  }

  let serviceAccount: {
    project_id?: string;
    client_email?: string;
    private_key?: string;
  };
  try {
    serviceAccount = JSON.parse(json);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must contain valid service account JSON.");
  }

  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error("Firebase service account JSON is missing required fields.");
  }

  const existing = getApps().find((app) => app.name === "student-center-admin");
  if (existing) return existing;

  return initializeApp(
    {
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
      }),
      projectId: serviceAccount.project_id,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    },
    "student-center-admin"
  );
}

export function getFirebaseAdminAuth() {
  return getAuth(getAdminApp());
}

export function getFirebaseAdminDb() {
  return getFirestore(getAdminApp());
}

export function getFirebaseAdminBucket() {
  return getStorage(getAdminApp()).bucket();
}
