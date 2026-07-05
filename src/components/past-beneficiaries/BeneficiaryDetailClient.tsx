"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Pencil, MapPin, GraduationCap, Building2, Briefcase, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicantAvatar } from "@/components/ui/applicant-avatar";
import { formatDate } from "@/lib/utils";
import type { PastBeneficiary, BeneficiaryStatus } from "@/types";

const STATUS_CONFIG: Record<BeneficiaryStatus, { label: string; className: string }> = {
  university: { label: "In University", className: "bg-blue-50 text-blue-700 border border-blue-200" },
  career:     { label: "In Career",     className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  other:      { label: "Other",         className: "bg-muted text-muted-foreground border border-border" },
};

interface Props { beneficiary: PastBeneficiary }

export default function BeneficiaryDetailClient({ beneficiary: b }: Props) {
  const cfg = STATUS_CONFIG[b.currentStatus] ?? STATUS_CONFIG.other;

  return (
    <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/past-beneficiaries" className="flex items-center gap-1.5 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Past Beneficiaries
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/past-beneficiaries/${b.id}/edit`} className="flex items-center gap-1.5">
            <Pencil className="w-4 h-4" /> Edit
          </Link>
        </Button>
      </div>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <ApplicantAvatar
                firstName={b.firstName}
                lastName={b.lastName}
                photoUrl={b.profilePhotoUrl}
                size={72}
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-xl font-semibold">{b.firstName} {b.lastName}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{b.highSchool}</p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                  {b.yearGraduated > 0 && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" /> Class of {b.yearGraduated}
                    </span>
                  )}
                  {b.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {b.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Added {formatDate(b.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <GraduationCap className="w-4 h-4" /> High School
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">School</span>
              <span className="font-semibold text-right max-w-[160px] truncate">{b.highSchool}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Year Graduated</span>
              <span className="font-semibold">{b.yearGraduated > 0 ? b.yearGraduated : "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              {b.currentStatus === "career" ? <Briefcase className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
              {b.currentStatus === "career" ? "Current Career" : "University"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{b.currentStatus === "career" ? "Employer" : "Institution"}</span>
              <span className="font-semibold text-right max-w-[160px] truncate">{b.institution || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{b.currentStatus === "career" ? "Role / Field" : "Programme"}</span>
              <span className="font-semibold text-right max-w-[160px] truncate">{b.fieldOfStudy || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location</span>
              <span className="font-semibold">{b.location || "—"}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {b.notes && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{b.notes}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </main>
  );
}
