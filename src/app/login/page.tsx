import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Staff sign in — Student Center" };

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-6">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading sign in…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
