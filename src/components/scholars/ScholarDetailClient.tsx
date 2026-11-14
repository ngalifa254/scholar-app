"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Pencil,
  MapPin,
  Users,
  Calendar,
  GraduationCap,
  Upload,
  FileText,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicantAvatar } from "@/components/ui/applicant-avatar";
import ScholarDocuments from "@/components/scholars/ScholarDocuments";
import ScholarProgramActions from "@/components/scholars/ScholarProgramActions";
import { formatDate } from "@/lib/utils";
import { uploadScholarReportCard } from "@/lib/actions";
import type { Scholar, ScholarStatus } from "@/types";

const STATUS_CONFIG: Record<ScholarStatus, { label: string; className: string }> = {
  active:    { label: "Active",    className: "bg-primary/10 text-primary border border-primary/20" },
  completed: { label: "Graduated", className: "bg-muted text-muted-foreground border border-border" },
  deferred:  { label: "On hold",  className: "bg-amber-50 text-amber-800 border border-amber-200" },
  archived:  { label: "Archived", className: "bg-muted text-muted-foreground border border-border" },
  withdrawn: { label: "Removed from program", className: "bg-rose-50 text-rose-800 border border-rose-200" },
};

interface Props { scholar: Scholar }

export default function ScholarDetailClient({ scholar }: Props) {
  const cfg = STATUS_CONFIG[scholar.status] ?? STATUS_CONFIG.active;

  const [reportUrls, setReportUrls] = useState<Record<1 | 2 | 3, string | undefined>>({
    1: scholar.term1ReportUrl,
    2: scholar.term2ReportUrl,
    3: scholar.term3ReportUrl,
  });
  const [uploadingTerm, setUploadingTerm] = useState<1 | 2 | 3 | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingTermRef = useRef<1 | 2 | 3 | null>(null);

  function triggerUpload(term: 1 | 2 | 3) {
    pendingTermRef.current = term;
    setUploadError(null);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const term = pendingTermRef.current;
    if (!file || !term) return;

    e.target.value = "";
    setUploadingTerm(term);
    setUploadError(null);

    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadScholarReportCard(scholar.id, term, fd);

    setUploadingTerm(null);
    if (result.error) {
      setUploadError(result.error);
    } else if (result.url) {
      setReportUrls((prev) => ({ ...prev, [term]: result.url }));
    }
  }

  return (
    <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/scholars" className="flex items-center gap-1.5 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Scholars
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ScholarProgramActions scholar={scholar} compact />
          <Button asChild>
            <Link href={`/scholars/${scholar.id}/edit`} className="flex items-center gap-1.5">
              <Pencil className="w-4 h-4" /> Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <ApplicantAvatar
                firstName={scholar.firstName}
                lastName={scholar.lastName}
                photoUrl={scholar.profilePhotoUrl}
                size={112}
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-xl font-semibold">{scholar.firstName} {scholar.lastName}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
                    {cfg.label}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                    Grade {scholar.grade}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{scholar.school}</p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                  {scholar.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {scholar.location}
                    </span>
                  )}
                  {scholar.yearJoined > 0 && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Joined {scholar.yearJoined}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" /> Added {formatDate(scholar.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <GraduationCap className="w-4 h-4" /> School
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">School</span>
              <span className="font-semibold text-right max-w-[160px] truncate">{scholar.school}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Grade</span>
              <span className="font-semibold">Grade {scholar.grade}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Year Joined</span>
              <span className="font-semibold">{scholar.yearJoined > 0 ? scholar.yearJoined : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location</span>
              <span className="font-semibold">{scholar.location || "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="w-4 h-4" /> Guardian
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-semibold">{scholar.guardianName || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contact</span>
              <span className="font-semibold">{scholar.guardianContact || "—"}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <ScholarDocuments scholar={scholar} />

      {/* Report Cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.18 } }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="w-4 h-4" /> Report Cards
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploadError && (
              <p className="text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-md">
                {uploadError}
              </p>
            )}

            {([1, 2, 3] as const).map((term) => {
              const url = reportUrls[term];
              const isUploading = uploadingTerm === term;
              return (
                <div key={term} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${url ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                      {term}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Term {term}</p>
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary flex items-center gap-0.5 hover:underline"
                        >
                          View report card <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not uploaded</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => triggerUpload(term)}
                    className="h-7 text-xs gap-1.5"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3" />
                    )}
                    {url ? "Replace" : "Upload"}
                  </Button>
                </div>
              );
            })}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-[11px] text-muted-foreground pt-1">
              Accepted: PDF, JPG, PNG. Files are saved automatically on selection.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {scholar.notes && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.26 } }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{scholar.notes}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </main>
  );
}
