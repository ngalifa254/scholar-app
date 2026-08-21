"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  Settings,
  GraduationCap,
  BookOpen,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "Applications",
    items: [
      { label: "Applicants", href: "/applicants", icon: Users },
      { label: "Add Applicant", href: "/applicants/new", icon: UserPlus },
    ],
  },
  {
    label: "Beneficiaries",
    items: [
      { label: "Scholars", href: "/scholars", icon: GraduationCap },
      { label: "Past Beneficiaries", href: "/past-beneficiaries", icon: Award },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Forms", href: "/forms", icon: FileText },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      className="w-60 min-h-screen flex flex-col shrink-0"
      style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--sidebar-border)" }}
    >
      {/* Logo */}
      <div
        className="flex flex-col items-start gap-1.5 px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <Image
          src="/wahome-logo.png"
          alt="Wahome Foundation"
          width={155}
          height={45}
          priority
          className="object-contain"
        />
        <span className="font-semibold text-sm tracking-tight" style={{ color: "var(--sidebar-fg)" }}>
          Student Center
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p
              className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--sidebar-muted)" }}
            >
              {group.label}
            </p>
            <ul className="space-y-px">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-all duration-100",
                        active
                          ? "font-medium"
                          : "hover:opacity-100"
                      )}
                      style={
                        active
                          ? {
                              background: "var(--sidebar-active)",
                              color: "var(--sidebar-fg)",
                            }
                          : {
                              color: "var(--sidebar-muted)",
                            }
                      }
                      onMouseEnter={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background =
                            "var(--sidebar-hover)";
                          (e.currentTarget as HTMLElement).style.color =
                            "var(--sidebar-fg)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background =
                            "transparent";
                          (e.currentTarget as HTMLElement).style.color =
                            "var(--sidebar-muted)";
                        }
                      }}
                    >
                      <item.icon
                        className="w-4 h-4 shrink-0"
                        style={active ? { color: "var(--sidebar-accent)" } : {}}
                      />
                      <span>{item.label}</span>
                      {active && (
                        <span
                          className="ml-auto w-1.5 h-1.5 rounded-full"
                          style={{ background: "var(--sidebar-accent)" }}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div
        className="p-2 shrink-0"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        <div
          className="flex items-center gap-2.5 px-2 py-2 rounded-md cursor-pointer transition-all"
          style={{ color: "var(--sidebar-muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover)";
            (e.currentTarget as HTMLElement).style.color = "var(--sidebar-fg)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--sidebar-muted)";
          }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "var(--sidebar-accent)", color: "#fff" }}
          >
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: "var(--sidebar-fg)" }}>
              Admin User
            </p>
            <p className="text-[10px] truncate">admin@wahomefoundation.org</p>
          </div>
          <Settings className="w-3.5 h-3.5 shrink-0" />
        </div>
      </div>
    </aside>
  );
}
