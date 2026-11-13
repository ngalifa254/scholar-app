"use client";

import { FormEvent, useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatError(cause: unknown) {
  if (cause && typeof cause === "object") {
    const detail = cause as { code?: unknown; name?: unknown; message?: unknown };
    const code = typeof detail.code === "string"
      ? detail.code
      : typeof detail.name === "string"
        ? detail.name
        : "UNKNOWN_ERROR";
    const message = typeof detail.message === "string" ? detail.message : String(cause);
    return `${code}: ${message}`;
  }

  return `UNKNOWN_ERROR: ${String(cause)}`;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(
        auth,
        String(formData.get("email") ?? "").trim(),
        String(formData.get("password") ?? "")
      );
      const idToken = await credential.user.getIdToken(true);
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const code = typeof result?.code === "string" ? result.code : `HTTP_${response.status}`;
        const message = typeof result?.error === "string" ? result.error : response.statusText;
        setError(`${code}: ${message}`);
        try {
          await signOut(auth);
        } catch {
          // Keep the session creation failure visible to the user.
        }
        return;
      }

      await signOut(auth);
      const next = searchParams.get("next");
      router.replace(next?.startsWith("/") && !next.startsWith("//") ? next : "/");
      router.refresh();
    } catch (cause) {
      setError(formatError(cause));
      try {
        await signOut(getFirebaseAuth());
      } catch {
        // Firebase configuration may be missing during initial setup.
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-xl border bg-card p-7 shadow-sm">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Staff sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to the Wahome Foundation Student Center.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="username" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
