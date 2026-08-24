"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  GraduationCap,
  Award,
  FileText,
  Search,
  Clock,
  UserPlus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  getScoreColor,
  formatDate,
  cn,
} from "@/lib/utils";
import { ApplicantAvatar } from "@/components/ui/applicant-avatar";
import type { Applicant, Scholar, ScholarStatus } from "@/types";

const SCHOLAR_STATUS: Record<ScholarStatus, { label: string; className: string }> = {
  active:    { label: "Active",    className: "bg-emerald-50 text-emerald-700" },
  completed: { label: "Completed", className: "bg-blue-50 text-blue-700" },
  deferred:  { label: "Deferred",  className: "bg-amber-50 text-amber-700" },
};

const GLASS_CARD =
  "rounded-2xl border-border/50 bg-card/80 backdrop-blur-md shadow-sm hover:shadow-lg transition-all";

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
  top3: Applicant[];
  kpi: KpiData;
  scholarCount: number;
  beneficiaryCount: number;
  formsCount: number;
}

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    const kickoff = setTimeout(() => setNow(new Date()), 0);
    return () => {
      clearInterval(id);
      clearTimeout(kickoff);
    };
  }, []);

  if (!now) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-card/80 backdrop-blur-sm border border-border/60 px-4 py-2 shadow-sm shrink-0">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <div className="text-right leading-tight">
          <p className="text-sm font-semibold text-foreground">&nbsp;</p>
          <p className="text-[11px] text-muted-foreground">&nbsp;</p>
        </div>
      </div>
    );
  }

  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const date = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex items-center gap-2 rounded-full bg-card/80 backdrop-blur-sm border border-border/60 px-4 py-2 shadow-sm shrink-0">
      <Clock className="w-4 h-4 text-primary" />
      <div className="text-right leading-tight">
        <p className="text-sm font-semibold text-foreground tabular-nums">{time}</p>
        <p className="text-[11px] text-muted-foreground">{date}</p>
      </div>
    </div>
  );
}

function MiniCalendar() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayDate = today.getDate();

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Card className={GLASS_CARD}>
      <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{monthLabel}</h2>
        <div className="flex gap-1 rounded-full bg-muted/60 p-0.5">
          {["Month", "Week", "Planner"].map((view) => (
            <span
              key={view}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium",
                view === "Month" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              {view}
            </span>
          ))}
        </div>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => (
            <div
              key={i}
              className={cn(
                "aspect-square flex items-center justify-center text-xs rounded-full",
                day === null && "invisible",
                day === todayDate
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-foreground hover:bg-muted/60"
              )}
            >
              {day ?? 0}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardClient({ scholars, top3, kpi }: Props) {
  const selectionRate = kpi.totalApplicants
    ? Math.round((kpi.selected / kpi.totalApplicants) * 100)
    : 0;

  const thankYouScholars = scholars.filter((s) => s.thankYouNote && s.thankYouNote.trim());

  const recentActivity = [...scholars]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const QUICK_ACTIONS = [
    { label: "Add Applicant", href: "/applicants/new", icon: UserPlus },
    { label: "Add Scholar", href: "/scholars/new", icon: GraduationCap },
    { label: "Add Beneficiary", href: "/past-beneficiaries/new", icon: Award },
    { label: "New Form", href: "/forms", icon: FileText },
  ];

  const SELECTION_SUMMARY_ROWS: { label: string; count: number; textClassName: string; borderClassName: string }[] = [
    { label: "Selected", count: kpi.selected, textClassName: "text-emerald-600", borderClassName: "border-emerald-500" },
    { label: "Reviewed", count: kpi.reviewed, textClassName: "text-blue-600", borderClassName: "border-blue-500" },
    { label: "Pending", count: kpi.pending, textClassName: "text-amber-600", borderClassName: "border-amber-500" },
    { label: "Rejected", count: kpi.rejected, textClassName: "text-red-500", borderClassName: "border-red-500" },
  ];

  return (
    <main className="relative flex-1 p-6 lg:p-8 space-y-8">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-accent-blue/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* Top utility row */}
      <motion.div
        className="flex items-center justify-between gap-4"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search applicants, scholars, forms…"
            className="rounded-full bg-card/80 backdrop-blur-sm border-border/60 pl-10 pr-4 shadow-sm"
          />
        </div>
        <LiveClock />
      </motion.div>

      {/* Greeting */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Hi Admin, welcome back!
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {selectionRate}% selection rate across {kpi.totalApplicants} applicants
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0, transition: { delay: 0.15 } }}
        >
          <Button asChild>
            <Link href="/applicants/new" className="flex items-center gap-1.5">
              Add Applicant
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Thank-You Notes wall */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}>
        <Card className={GLASS_CARD}>
          <div className="px-5 py-4 border-b border-border/60">
            <h2 className="text-sm font-semibold">Thank-You Notes</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Messages from our scholars to their donors</p>
            {recentActivity.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Recently added: {recentActivity.map((s) => `${s.firstName} ${s.lastName}`).join(", ")}
              </p>
            )}
          </div>
          <CardContent className="p-4">
            {thankYouScholars.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No thank-you notes yet.{" "}
                <Link href="/scholars" className="text-primary underline">
                  Add one from a scholar&apos;s profile.
                </Link>
              </p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-1">
                {thankYouScholars.map((s) => (
                  <Link
                    key={s.id}
                    href={`/scholars/${s.id}`}
                    className="shrink-0 w-56 rounded-xl border border-border/50 bg-card/60 overflow-hidden hover:border-primary/40 transition-colors"
                  >
                    <div className="relative w-full aspect-square bg-primary/10">
                      {s.profilePhotoUrl ? (
                        <Image
                          src={s.profilePhotoUrl}
                          alt={`${s.firstName} ${s.lastName}`}
                          fill
                          className="object-cover"
                          sizes="224px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary/40">
                          <GraduationCap className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold truncate">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground italic mt-1 line-clamp-3">
                        &ldquo;{s.thankYouNote}&rdquo;
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions — compact nav bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.25 } }}
      >
        <nav
          aria-label="Quick actions"
          className="flex items-center gap-1 rounded-full bg-card/80 backdrop-blur-md border border-border/50 shadow-sm px-2 py-1.5 w-fit max-w-full overflow-x-auto divide-x divide-border/40"
        >
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors whitespace-nowrap"
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </Link>
          ))}
        </nav>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scholars List */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.35 } }}
        >
          <Card className={GLASS_CARD}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
              <h2 className="text-sm font-semibold">Scholars</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/scholars" className="flex items-center gap-1 text-xs">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
            <CardContent className="p-0">
              {scholars.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">No scholars yet.</p>
              ) : (
                <ul>
                  {scholars.slice(0, 6).map((s, i) => {
                    const st = SCHOLAR_STATUS[s.status] ?? SCHOLAR_STATUS.active;
                    return (
                      <li key={s.id}>
                        <Link
                          href={`/scholars/${s.id}`}
                          className="flex items-center gap-3 px-6 py-3.5 hover:bg-muted/40 transition-colors"
                        >
                          <ApplicantAvatar
                            firstName={s.firstName}
                            lastName={s.lastName}
                            photoUrl={s.profilePhotoUrl}
                            size={32}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {s.firstName} {s.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {s.school} · Grade {s.grade}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0 mr-3">
                            {s.yearJoined}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${st.className}`}>
                            {st.label}
                          </span>
                        </Link>
                        {i < Math.min(scholars.length, 6) - 1 && <div className="h-px bg-border/60 mx-6" />}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right column */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.45 } }}
        >
          {/* Top 3 */}
          <Card className={GLASS_CARD}>
            <div className="px-5 py-4 border-b border-border/60">
              <h2 className="text-sm font-semibold">Top Candidates</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Highest scoring applicants</p>
            </div>
            <CardContent className="p-4 space-y-3">
              {top3.map((app) => (
                <Link
                  key={app.id}
                  href={`/applicants/${app.id}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0">
                    {app.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {app.firstName} {app.lastName}
                    </p>
                    <Progress
                      value={app.totalScore}
                      className="h-1 mt-1"
                      indicatorClassName="bg-emerald-500"
                    />
                  </div>
                  <span className={`text-sm font-bold ${getScoreColor(app.totalScore)} shrink-0`}>
                    {app.totalScore.toFixed(0)}
                  </span>
                </Link>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-1" asChild>
                <Link href="/leaderboard">View Leaderboard</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Selection Summary */}
          <Card className={GLASS_CARD}>
            <div className="px-5 py-4 border-b border-border/60">
              <h2 className="text-sm font-semibold">Selection Summary</h2>
            </div>
            <CardContent className="p-5 space-y-2 text-sm">
              {SELECTION_SUMMARY_ROWS.map((s) => (
                <div
                  key={s.label}
                  className={`flex justify-between items-center border-l-4 ${s.borderClassName} bg-muted/30 rounded-r-lg pl-3 pr-3 py-2`}
                >
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className={`font-semibold ${s.textClassName}`}>{s.count}</span>
                </div>
              ))}
              {kpi.lastApplicationDate && (
                <>
                  <div className="h-px bg-border/60 !mt-3" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last application</span>
                    <span className="font-medium">{formatDate(kpi.lastApplicationDate)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Mini Calendar */}
          <MiniCalendar />
        </motion.div>
      </div>

      {/* Status Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.55 } }}
      >
        <Card className={GLASS_CARD}>
          <div className="px-6 py-4 border-b border-border/60">
            <h2 className="text-sm font-semibold">Application Status Distribution</h2>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Selected", count: kpi.selected, color: "bg-emerald-500", light: "bg-emerald-50 text-emerald-700" },
                { label: "Pending", count: kpi.pending, color: "bg-amber-500", light: "bg-amber-50 text-amber-700" },
                { label: "Reviewed", count: kpi.reviewed, color: "bg-blue-500", light: "bg-blue-50 text-blue-700" },
                { label: "Rejected", count: kpi.rejected, color: "bg-red-400", light: "bg-red-50 text-red-700" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${s.light} text-lg font-bold mb-2`}>
                    {s.count}
                  </div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${s.color} rounded-full`}
                      style={{ width: kpi.totalApplicants ? `${(s.count / kpi.totalApplicants) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
