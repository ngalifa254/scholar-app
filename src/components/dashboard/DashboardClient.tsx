"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  ArrowRight,
  ChevronRight,
  GraduationCap,
  Award,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  getScoreColor,
  formatDate,
} from "@/lib/utils";
import { ApplicantAvatar } from "@/components/ui/applicant-avatar";
import type { Applicant, Scholar, ScholarStatus } from "@/types";

const SCHOLAR_STATUS: Record<ScholarStatus, { label: string; className: string }> = {
  active:    { label: "Active",    className: "bg-emerald-50 text-emerald-700" },
  completed: { label: "Completed", className: "bg-blue-50 text-blue-700" },
  deferred:  { label: "Deferred",  className: "bg-amber-50 text-amber-700" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4 },
  }),
};

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

export default function DashboardClient({ scholars, top3, kpi, scholarCount, beneficiaryCount, formsCount }: Props) {
  const selectionRate = kpi.totalApplicants
    ? Math.round((kpi.selected / kpi.totalApplicants) * 100)
    : 0;

  const OVERVIEW_CARDS = [
    {
      label: "Scholars",
      value: scholarCount,
      icon: GraduationCap,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
      sub: "Current beneficiaries",
      href: "/scholars",
    },
    {
      label: "Past Beneficiaries",
      value: beneficiaryCount,
      icon: Award,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      sub: "University & career",
      href: "/past-beneficiaries",
    },
    {
      label: "Forms",
      value: formsCount,
      icon: FileText,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      sub: "Templates & documents",
      href: "/forms",
    },
    {
      label: "Scholarship Applicants",
      value: kpi.totalApplicants,
      icon: Users,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      sub: `${selectionRate}% selection rate`,
      href: "/applicants",
    },
  ];

  return (
    <main className="flex-1 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="grid grid-cols-3 items-center">
        <div />
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Image
            src="/wahome-logo.png"
            alt="Wahome Foundation"
            width={210}
            height={120}
            priority
            className="object-contain"
          />
        </motion.div>
        <motion.div
          className="flex justify-end"
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

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {OVERVIEW_CARDS.map((card, i) => (
          <motion.div key={card.label} custom={i} variants={fadeUp} initial="hidden" animate="show">
            <Link href={card.href} className="block">
              <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                      <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground tracking-tight">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">{card.sub}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scholars List */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.35 } }}
        >
          <Card>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
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
                        {i < Math.min(scholars.length, 6) - 1 && <div className="h-px bg-border mx-6" />}
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
          <Card>
            <div className="px-5 py-4 border-b border-border">
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
          <Card>
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold">Selection Summary</h2>
            </div>
            <CardContent className="p-5 space-y-3 text-sm">
              {[
                { label: "Selected", count: kpi.selected, color: "text-emerald-600" },
                { label: "Reviewed", count: kpi.reviewed, color: "text-blue-600" },
                { label: "Pending", count: kpi.pending, color: "text-amber-600" },
                { label: "Rejected", count: kpi.rejected, color: "text-red-500" },
              ].map((s) => (
                <div key={s.label} className="flex justify-between items-center">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className={`font-semibold ${s.color}`}>{s.count}</span>
                </div>
              ))}
              {kpi.lastApplicationDate && (
                <>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last application</span>
                    <span className="font-medium">{formatDate(kpi.lastApplicationDate)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Status Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.55 } }}
      >
        <Card>
          <div className="px-6 py-4 border-b border-border">
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
