"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Pencil,
  Mail,
  MapPin,
  BookOpen,
  Calendar,
  GraduationCap,
  Users,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  getStatusConfig,
  getScoreColor,
  getScoreBarColor,
  formatDate,
} from "@/lib/utils";
import { ApplicantAvatar } from "@/components/ui/applicant-avatar";
import {
  CHILD_STATUS_LABELS,
  ACADEMIC_LABELS,
  CHARACTER_LABELS,
  CHILD_STATUS_SCORES,
  ACADEMIC_SCORES,
  CHARACTER_SCORES,
} from "@/lib/scoring";
import DocumentsTab from "@/components/applicants/DocumentsTab";
import { updateApplicantStatus } from "@/lib/actions";
import type { Applicant, ApplicantStatus } from "@/types";

interface Props {
  applicant: Applicant;
}

const STATUS_ACTIONS: Record<
  ApplicantStatus,
  { label: string; value: ApplicantStatus; variant: "default" | "destructive" | "outline" }[]
> = {
  pending: [
    { label: "Mark Reviewed", value: "reviewed", variant: "outline" },
    { label: "Select", value: "selected", variant: "default" },
    { label: "Reject", value: "rejected", variant: "destructive" },
  ],
  reviewed: [
    { label: "Select", value: "selected", variant: "default" },
    { label: "Reject", value: "rejected", variant: "destructive" },
  ],
  selected: [
    { label: "Reject", value: "rejected", variant: "destructive" },
  ],
  rejected: [
    { label: "Restore to Pending", value: "pending", variant: "outline" },
  ],
};

export default function ApplicantDetailClient({ applicant: app }: Props) {
  const [currentStatus, setCurrentStatus] = useState<ApplicantStatus>(app.status);
  const [updating, setUpdating] = useState(false);

  async function handleStatusChange(newStatus: ApplicantStatus) {
    setUpdating(true);
    const result = await updateApplicantStatus(app.id, newStatus);
    if (!result.error) setCurrentStatus(newStatus);
    setUpdating(false);
  }

  const hardshipCount = [
    app.hardshipChronicallyIll,
    app.hardshipDistanceToSchool,
    app.hardshipHeavyChores,
    app.hardshipNoCleanWater,
  ].filter(Boolean).length;
  const hardshipScore = Math.min(100, hardshipCount * 25);

  const scoreDimensions = [
    {
      label: "Child Status",
      weight: "40%",
      score: CHILD_STATUS_SCORES[app.childStatus] ?? 0,
    },
    {
      label: "Academic Merit (CBC)",
      weight: "30%",
      score: ACADEMIC_SCORES[app.academicMerit] ?? 0,
    },
    {
      label: "Character & Leadership",
      weight: "20%",
      score: CHARACTER_SCORES[app.characterLeadership] ?? 0,
    },
    {
      label: "Hardship Indicators",
      weight: "10%",
      score: hardshipScore,
    },
  ];

  return (
    <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-5xl">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/applicants" className="flex items-center gap-1.5 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
            All Applicants
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/applicants/${app.id}/edit`} className="flex items-center gap-1.5">
            <Pencil className="w-4 h-4" />
            Edit
          </Link>
        </Button>
      </div>

      {/* Hero Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <ApplicantAvatar
                firstName={app.firstName}
                lastName={app.lastName}
                photoUrl={app.profilePhotoUrl}
                size={64}
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-xl font-semibold">
                    {app.firstName} {app.lastName}
                  </h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusConfig(currentStatus).className}`}>
                    {getStatusConfig(currentStatus).label}
                  </span>
                  {app.rank && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      Rank #{app.rank}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {STATUS_ACTIONS[currentStatus].map((action) => (
                    <Button
                      key={action.value}
                      variant={action.variant}
                      size="sm"
                      disabled={updating}
                      onClick={() => handleStatusChange(action.value)}
                      className="h-6 px-3 text-xs"
                    >
                      {action.label}
                    </Button>
                  ))}
                  {updating && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                </div>
                <p className="text-sm text-muted-foreground">
                  {app.institution} · Grade {app.yearOfStudy}
                  {app.location ? ` · ${app.location}` : ""}
                </p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {app.email || "—"}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {app.nationality}
                  </span>
                  {app.age > 0 && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Age {app.age}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Applied {formatDate(app.appliedDate)}
                  </span>
                </div>
              </div>
              <div className="text-center shrink-0">
                <div className={`text-3xl font-bold ${getScoreColor(app.totalScore)}`}>
                  {app.totalScore.toFixed(0)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Total Score</p>
                <p className="text-xs font-medium mt-1 uppercase tracking-wide text-muted-foreground">
                  {app.academicMerit?.toUpperCase() ?? "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
      >
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scores">Score Breakdown</TabsTrigger>
            {app.notes && <TabsTrigger value="notes">Notes</TabsTrigger>}
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Academic */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <GraduationCap className="w-4 h-4" /> Academic
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CBC Level</span>
                    <span className="font-semibold text-foreground uppercase">{app.academicMerit?.toUpperCase() ?? "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Performance</span>
                    <span className="font-semibold text-right max-w-[150px] text-xs">{ACADEMIC_LABELS[app.academicMerit] ?? "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Character</span>
                    <span className="font-semibold">{CHARACTER_LABELS[app.characterLeadership] ?? "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Programme</span>
                    <span className="font-semibold text-right max-w-[150px] truncate">{app.program || "—"}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Family */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Users className="w-4 h-4" /> Family
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Child Status</span>
                    <span className="font-semibold text-right max-w-[150px] text-xs leading-tight">{CHILD_STATUS_LABELS[app.childStatus] ?? "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Guardian</span>
                    <span className="font-semibold">{app.guardianName || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Contact</span>
                    <span className="font-semibold">{app.guardianContact || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date of Birth</span>
                    <span className="font-semibold">{app.dateOfBirth ? formatDate(app.dateOfBirth) : "—"}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Hardship */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <BookOpen className="w-4 h-4" /> Hardship
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {app.hardshipChronicallyIll && (
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">Ill family member</span>
                    )}
                    {app.hardshipDistanceToSchool && (
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">Far from school</span>
                    )}
                    {app.hardshipHeavyChores && (
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">Heavy chores</span>
                    )}
                    {app.hardshipNoCleanWater && (
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">No water/power</span>
                    )}
                    {hardshipCount === 0 && (
                      <span className="text-xs text-muted-foreground">None recorded</span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm pt-1">
                    <span className="text-muted-foreground">Indicators</span>
                    <span className="font-semibold">{hardshipCount} / 4</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hardship Score</span>
                    <span className={`font-semibold ${getScoreColor(hardshipScore)}`}>{hardshipScore}/100</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scores" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Score Breakdown</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Weighted composite total:{" "}
                  <span className={`font-bold ${getScoreColor(app.totalScore)}`}>
                    {app.totalScore.toFixed(0)}
                  </span>
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                {scoreDimensions.map((d) => (
                  <div key={d.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{d.label}</span>
                        <span className="text-xs text-muted-foreground">({d.weight} weight)</span>
                      </div>
                      <span className={`text-sm font-bold ${getScoreColor(d.score)}`}>
                        {d.score}/100
                      </span>
                    </div>
                    <Progress
                      value={d.score}
                      className="h-2"
                      indicatorClassName={getScoreBarColor(d.score)}
                    />
                  </div>
                ))}
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Weighted Total</span>
                  <span className={`text-lg font-bold ${getScoreColor(app.totalScore)}`}>
                    {app.totalScore.toFixed(0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {app.notes && (
            <TabsContent value="notes" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{app.notes}</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="documents" className="mt-4">
            <DocumentsTab applicant={app} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </main>
  );
}
