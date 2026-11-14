"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApplicantAvatar } from "@/components/ui/applicant-avatar";
import { formatDate } from "@/lib/utils";
import type { Applicant, Scholar, ScholarStatus } from "@/types";

type KpiData = {
  totalApplicants: number;
  selected: number;
  pending: number;
  reviewed: number;
  rejected: number;
  averageScore: number;
  lastApplicationDate: string;
};

interface Props {
  scholars: Scholar[];
  selectedApplicants: Applicant[];
  kpi: KpiData;
  scholarCount: number;
  beneficiaryCount: number;
  formsCount: number;
}

const SCHOLAR_STATUS: Record<Exclude<ScholarStatus, "active">, { label: string; className: string }> = {
  completed: { label: "Graduated", className: "border-border text-muted-foreground" },
  deferred: { label: "On hold", className: "border-amber-300 text-amber-800" },
  archived: { label: "Archived", className: "border-border text-muted-foreground" },
  withdrawn: { label: "Removed", className: "border-rose-200 text-rose-800" },
};

const SELECTION_STATUSES = [
  { key: "selected", label: "Selected", color: "bg-primary", text: "text-primary" },
  { key: "reviewed", label: "Reviewed", color: "bg-stone-400", text: "text-muted-foreground" },
  { key: "pending", label: "Pending", color: "bg-amber-600", text: "text-amber-800" },
  { key: "rejected", label: "Rejected", color: "bg-rose-400", text: "text-rose-800" },
] as const;

export default function DashboardClient({ scholars, selectedApplicants, kpi, scholarCount }: Props) {
  const router = useRouter();
  const total = SELECTION_STATUSES.reduce((sum, status) => sum + kpi[status.key], 0);

  async function handleSignOut() {
    await fetch("/api/auth/session", { method: "DELETE" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="min-w-0 flex-1 space-y-8 px-5 py-6 sm:px-7 lg:px-10">
      <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Wahome Foundation · Student Center
          </p>
          <h1 className="mt-1 font-editorial text-3xl font-normal tracking-tight sm:text-4xl">Dashboard</h1>
        </div>
        <Button type="button" variant="outline" className="shrink-0 gap-2" onClick={handleSignOut}>
          Sign out <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <section aria-label="Center summary" className="border-b border-border pb-6">
        <div className="grid grid-cols-2 gap-[2px] overflow-hidden rounded-md border-2 border-primary/40 bg-primary/40 sm:grid-cols-3 xl:grid-cols-5">
          {[
            { href: "/scholars", value: scholarCount, label: "scholars", numberClass: "text-foreground" },
            { href: "/applicants", value: kpi.totalApplicants, label: "applicants", numberClass: "text-foreground" },
            { href: "/applicants", value: kpi.pending, label: "pending review", numberClass: "text-amber-700" },
            { href: "/applicants", value: kpi.selected, label: "selected", numberClass: "text-primary" },
            { href: "/applicants", value: kpi.rejected, label: "rejected", numberClass: "text-rose-700" },
          ].map((metric) => (
            <Link
              key={metric.label}
              href={metric.href}
              className="flex min-h-14 flex-col justify-center bg-background px-3 py-2 transition-colors hover:bg-primary/[0.07] focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-start sm:gap-2 sm:px-3"
            >
              <span className={`font-editorial text-2xl leading-none tabular-nums sm:text-3xl ${metric.numberClass}`}>
                {metric.value}
              </span>
              <span className="text-xs leading-tight text-muted-foreground">{metric.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.85fr)] xl:gap-10">
        <section className="min-w-0">
          <div className="mb-2 flex items-baseline justify-between gap-4 border-b border-border pb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Beneficiaries</p>
              <h2 className="mt-1 font-editorial text-2xl font-normal">Scholars</h2>
            </div>
            <Link href="/scholars" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              All scholars <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {scholars.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">No scholars yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    <th scope="col" className="py-2 font-medium">Scholar</th>
                    <th scope="col" className="w-24 py-2 text-right font-medium">Year</th>
                    <th scope="col" className="w-28 py-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scholars.slice(0, 6).map((scholar) => {
                    const status = scholar.status === "active" ? null : SCHOLAR_STATUS[scholar.status];
                    return (
                      <tr key={scholar.id} className="border-b border-border/80 transition-colors hover:bg-white/45 last:border-b-0">
                        <td className="py-3 pr-3">
                          <Link href={`/scholars/${scholar.id}`} className="flex min-w-0 items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <ApplicantAvatar
                              firstName={scholar.firstName}
                              lastName={scholar.lastName}
                              photoUrl={scholar.profilePhotoUrl}
                              size={42}
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-foreground">
                                {scholar.firstName} {scholar.lastName}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                {scholar.school} <span aria-hidden="true">·</span> Grade {scholar.grade}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 text-right text-sm tabular-nums text-muted-foreground">
                          {scholar.yearJoined || "—"}
                        </td>
                        <td className="py-3 text-right">
                          {status && (
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${status.className}`}>
                              {status.label}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="min-w-0">
          <div className="mb-2 flex items-baseline justify-between gap-4 border-b border-border pb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Selection status</p>
              <h2 className="mt-1 font-editorial text-2xl font-normal">Selected Applicants</h2>
            </div>
            <span className="hidden text-xs text-muted-foreground sm:inline">Score</span>
          </div>

          <ol className="divide-y divide-border">
            {selectedApplicants.slice(0, 5).map((applicant) => {
              const score = Math.max(0, Math.min(100, applicant.totalScore));
              return (
                <li key={applicant.id}>
                  <Link href={`/applicants/${applicant.id}`} className="group flex items-center gap-3 py-3">
                    <ApplicantAvatar firstName={applicant.firstName} lastName={applicant.lastName} photoUrl={applicant.profilePhotoUrl} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold group-hover:text-primary">
                        {applicant.firstName} {applicant.lastName}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {applicant.institution || applicant.location || applicant.nationality}
                      </span>
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-right tabular-nums">
                      <span className="font-editorial text-xl">{score.toFixed(0)}</span>
                      <span className="text-xs text-muted-foreground"> / 100</span>
                    </span>
                  </Link>
                </li>
              );
            })}
            {selectedApplicants.length === 0 && <li className="py-6 text-sm text-muted-foreground">No applicants selected yet.</li>}
          </ol>
          <Link href="/applicants" className="mt-2 inline-block text-sm text-primary hover:underline">
            View all applicants <span aria-hidden="true">→</span>
          </Link>
        </section>
      </div>

      <section className="border-y border-border py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Application pipeline</p>
            <h2 className="mt-1 font-editorial text-2xl font-normal">Selection Summary</h2>
          </div>
          {kpi.lastApplicationDate && (
            <p className="text-xs text-muted-foreground">
              Latest application <span className="ml-1 font-medium text-foreground">{formatDate(kpi.lastApplicationDate)}</span>
            </p>
          )}
        </div>
        <div
          className="mt-5 flex h-2.5 w-full overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={SELECTION_STATUSES.map((status) => `${status.label}: ${kpi[status.key]}`).join(", ")}
        >
          {SELECTION_STATUSES.map((status) => (
            <span
              key={status.key}
              className={`${status.color} h-full`}
              style={{ width: total ? `${(kpi[status.key] / total) * 100}%` : "0%" }}
            />
          ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          {SELECTION_STATUSES.map((status) => (
            <li key={status.key} className="flex items-center gap-2 text-xs">
              <span className={`h-2 w-2 rounded-full ${status.color}`} aria-hidden="true" />
              <span className="text-muted-foreground">{status.label}</span>
              <span className={`font-medium tabular-nums ${status.text}`}>{kpi[status.key]}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
