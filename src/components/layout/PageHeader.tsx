"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DIRECTORY_NAV = [
  { label: "Scholars", href: "/scholars" },
  { label: "Applicants", href: "/applicants" },
  { label: "Past Beneficiaries", href: "/past-beneficiaries" },
];

interface PageHeaderProps {
  breadcrumbs: { label: string; href?: string }[];
  title: string;
  subtitle?: string;
}

export function PageHeader({ breadcrumbs, title, subtitle }: PageHeaderProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="px-6 lg:px-8 pt-6 pb-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        {breadcrumbs.map((crumb) => (
          <span key={crumb.label} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3" />
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Banner */}
      <div className="bg-primary rounded-xl px-8 py-10">
        <h1 className="font-serif text-4xl md:text-5xl text-primary-foreground tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-primary-foreground/80 text-sm md:text-base">{subtitle}</p>
        )}
      </div>

      {/* Cross-page directory nav */}
      <div className="flex flex-wrap gap-2 mt-4">
        {DIRECTORY_NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
