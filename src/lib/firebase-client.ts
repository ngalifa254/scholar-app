"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

function getClientApp() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const required: Array<keyof typeof config> = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "appId",
  ];
  const missing = required.filter((name) => !config[name]);
  if (missing.length) {
    throw new Error(`Missing Firebase web configuration: ${missing.join(", ")}`);
  }

  return getApps().length ? getApp() : initializeApp(config);
}

export function getFirebaseAuth() {
  return getAuth(getClientApp());
}
