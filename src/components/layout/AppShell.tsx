"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const isLoginPage = usePathname() === "/login";

  if (isLoginPage) return <>{children}</>;

  return (
    <>
      <Sidebar />
      <div className="min-w-0 flex-1 flex flex-col min-h-screen overflow-auto">{children}</div>
    </>
  );
}
