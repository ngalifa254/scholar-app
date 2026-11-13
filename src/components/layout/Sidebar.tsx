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
      className="sticky top-0 flex h-screen w-16 shrink-0 flex-col transition-[width] duration-200 lg:w-52"
      style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--sidebar-border)" }}
    >
      {/* Logo */}
      <div
        className="flex shrink-0 flex-col items-center gap-1.5 px-2 py-3 lg:items-start lg:px-4"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <Image
          src="/wahome-logo.png"
          alt="Wahome Foundation"
          width={40}
          height={40}
          priority
          className="h-9 w-9 object-cover object-left lg:hidden"
        />
        <Image
          src="/wahome-logo.png"
          alt="Wahome Foundation"
          width={120}
          height={35}
          priority
          className="hidden h-auto w-[120px] object-contain lg:block"
        />
        <span className="hidden text-xs tracking-wide text-muted-foreground lg:block">Student Center</span>
      </div>

      {/* Nav */}
      <nav className="space-y-5 overflow-y-auto px-1 py-4 lg:px-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p
              className="mb-1 hidden px-2 text-[10px] font-semibold uppercase tracking-widest lg:block"
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
                      title={item.label}
                      aria-label={item.label}
                      className={cn(
                        "flex items-center justify-center gap-2.5 border-l-2 border-transparent px-0 py-2 text-sm transition-all duration-100 lg:justify-start lg:px-2",
                        active
                          ? "border-l-primary font-medium text-primary"
                          : "hover:text-foreground"
                      )}
                      style={
                        active
                          ? {
                              color: "var(--sidebar-accent)",
                            }
                          : {
                              color: "var(--sidebar-muted)",
                            }
                      }
                      onMouseEnter={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.color =
                            "var(--sidebar-fg)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.color =
                            "var(--sidebar-muted)";
                        }
                      }}
                    >
                      <item.icon
                        className="w-4 h-4 shrink-0"
                        style={active ? { color: "var(--sidebar-accent)" } : {}}
                      />
                      <span className="hidden lg:inline">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

    </aside>
  );
}
