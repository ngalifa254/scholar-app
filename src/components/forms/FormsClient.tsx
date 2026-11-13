"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  FileText,
  Plus,
  MoreHorizontal,
  Edit2,
  Archive,
  Trash2,
  Users,
  Calendar,
  ExternalLink,
  GraduationCap,
  Inbox,
  Wrench,
  BookOpen,
  FolderOpen,
  ArrowLeft,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ApplicantAvatar } from "@/components/ui/applicant-avatar";
import { deleteFormTemplate } from "@/lib/actions";
import { formatDate } from "@/lib/utils";
import type { FormTemplate, FormCategory, Scholar, Applicant } from "@/types";

// ── Folder definitions ────────────────────────────────────────────────────────

type SpecialFolder = "submissions" | "report_cards";
type FolderKey = FormCategory | SpecialFolder;

interface FolderDef {
  key: FolderKey;
  label: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}

const FOLDERS: FolderDef[] = [
  {
    key: "scholarship_docs",
    label: "Scholarship Documents",
    description: "Application forms, award letters, scholarship agreements",
    icon: GraduationCap,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    borderColor: "hover:border-blue-300",
  },
  {
    key: "submissions",
    label: "Submissions",
    description: "Scholar report cards and applicant uploaded documents",
    icon: Inbox,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    borderColor: "hover:border-emerald-300",
  },
  {
    key: "report_cards",
    label: "Report Cards",
    description: "Term 1, 2 and 3 report cards from current scholars",
    icon: ClipboardList,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    borderColor: "hover:border-teal-300",
  },
  {
    key: "tools",
    label: "Tools",
    description: "Scoring sheets, evaluation checklists, calculators",
    icon: Wrench,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    borderColor: "hover:border-violet-300",
  },
  {
    key: "resources",
    label: "Resources",
    description: "Guidelines, FAQs, reference materials",
    icon: BookOpen,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    borderColor: "hover:border-amber-300",
  },
  {
    key: "archives",
    label: "Archives",
    description: "Archived and inactive forms",
    icon: Archive,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-500",
    borderColor: "hover:border-slate-300",
  },
  {
    key: "other",
    label: "Other",
    description: "Miscellaneous documents",
    icon: FolderOpen,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-500",
    borderColor: "hover:border-gray-300",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: FormTemplate["status"] }) {
  const styles = {
    active: "bg-primary/10 text-primary border border-primary/20",
    draft: "bg-amber-50 text-amber-700 border border-amber-200",
    archived: "bg-slate-50 text-slate-600 border border-slate-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function DocLink({ url }: { url?: string }) {
  if (!url) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
    >
      View <ExternalLink className="w-3 h-3" />
    </a>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  initialForms: FormTemplate[];
  scholars: Scholar[];
  applicants: Applicant[];
}

export default function FormsClient({ initialForms, scholars, applicants }: Props) {
  const [forms, setForms] = useState<FormTemplate[]>(initialForms);
  const [view, setView] = useState<FolderKey | "home">("home");
  const [submissionsTab, setSubmissionsTab] = useState<"scholars" | "applicants">("scholars");
  const [folderSearch, setFolderSearch] = useState("");
  const [formStatusFilter, setFormStatusFilter] = useState<FormTemplate["status"] | "all">("all");

  const currentFolder = FOLDERS.find((f) => f.key === view);

  function folderCount(key: FolderKey): string {
    if (key === "submissions") {
      return `${scholars.length} scholars · ${applicants.length} applicants`;
    }
    if (key === "report_cards") {
      return `${scholars.length} scholar${scholars.length !== 1 ? "s" : ""}`;
    }
    const n = forms.filter((f) => f.category === key).length;
    return `${n} form${n !== 1 ? "s" : ""}`;
  }

  async function handleDelete(id: string) {
    const result = await deleteFormTemplate(id);
    if (!result.error) setForms((prev) => prev.filter((f) => f.id !== id));
  }

  // ── HOME VIEW ───────────────────────────────────────────────────────────────
  if (view === "home") {
    return (
      <main className="flex-1 p-6 lg:p-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight">Forms</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Select a folder to view and manage documents.
          </p>
        </div>

        <motion.div
          className="divide-y border-y border-border"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {FOLDERS.map((folder, i) => {
            const Icon = folder.icon;
            return (
              <motion.button
                key={folder.key}
                onClick={() => setView(folder.key)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.06 } }}
                className="group flex w-full items-start gap-4 py-4 text-left transition-colors hover:bg-white/40"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                      {folder.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                      {folder.description}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground mt-2">
                      {folderCount(folder.key)}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </main>
    );
  }

  // ── FOLDER VIEW — shared chrome ──────────────────────────────────────────────
  const isSpecial = view === "submissions" || view === "report_cards";
  const query = folderSearch.trim().toLowerCase();
  const folderForms = isSpecial ? [] : forms.filter((form) =>
    form.category === view &&
    (formStatusFilter === "all" || form.status === formStatusFilter) &&
    (!query || `${form.name} ${form.description}`.toLowerCase().includes(query))
  );
  const filteredScholars = scholars.filter((scholar) =>
    !query || `${scholar.firstName} ${scholar.lastName} ${scholar.school}`.toLowerCase().includes(query)
  );
  const filteredApplicants = applicants.filter((applicant) =>
    !query || `${applicant.firstName} ${applicant.lastName} ${applicant.institution} ${applicant.email}`.toLowerCase().includes(query)
  );

  return (
    <main className="flex-1 p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView("home")} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Forms
          </Button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-lg font-semibold">{currentFolder?.label}</h1>
        </div>
        {view !== "submissions" && (
          <Button variant="ghost" className="flex items-center gap-1.5 text-primary" size="sm">
            <Plus className="w-4 h-4" /> New Form
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground -mt-3">{currentFolder?.description}</p>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={folderSearch}
            onChange={(event) => setFolderSearch(event.target.value)}
            placeholder={view === "submissions" ? "Search people and documents…" : "Search this folder…"}
            className="pl-9"
            aria-label="Search current folder"
          />
        </div>
        {!isSpecial && (
          <Select value={formStatusFilter} onValueChange={(value) => setFormStatusFilter(value as FormTemplate["status"] | "all")}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ── REPORT CARDS FOLDER ─────────────────────────────────────────────── */}
      {view === "report_cards" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="overflow-x-auto border-y border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Scholar</TableHead>
                  <TableHead className="hidden md:table-cell">School</TableHead>
                  <TableHead className="hidden sm:table-cell">Grade</TableHead>
                  <TableHead>Term 1</TableHead>
                  <TableHead>Term 2</TableHead>
                  <TableHead>Term 3</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScholars.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No scholars yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredScholars.map((s, i) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-muted-foreground text-xs font-mono">{i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <ApplicantAvatar firstName={s.firstName} lastName={s.lastName} photoUrl={s.profilePhotoUrl} size={28} />
                          <Link href={`/scholars/${s.id}`} className="text-sm font-medium hover:text-primary transition-colors truncate">
                            {s.firstName} {s.lastName}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-[160px]">{s.school}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border font-medium">G{s.grade}</span>
                      </TableCell>
                      <TableCell><DocLink url={s.term1ReportUrl} /></TableCell>
                      <TableCell><DocLink url={s.term2ReportUrl} /></TableCell>
                      <TableCell><DocLink url={s.term3ReportUrl} /></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                          <Link href={`/scholars/${s.id}`}>Open</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      )}

      {/* ── SUBMISSIONS FOLDER ─────────────────────────────────────────────── */}
      {view === "submissions" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Sub-tabs */}
          <div className="flex gap-2 border-b border-border">
            {(["scholars", "applicants"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSubmissionsTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  submissionsTab === tab
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "scholars" ? "Scholar Report Cards" : "Applicant Documents"}
              </button>
            ))}
          </div>

          {/* Scholar Report Cards */}
          {submissionsTab === "scholars" && (
            <div className="overflow-x-auto border-y border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Scholar</TableHead>
                    <TableHead className="hidden md:table-cell">School</TableHead>
                    <TableHead className="hidden sm:table-cell">Grade</TableHead>
                    <TableHead>Term 1</TableHead>
                    <TableHead>Term 2</TableHead>
                    <TableHead>Term 3</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScholars.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        No scholars yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredScholars.map((s, i) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-muted-foreground text-xs font-mono">{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <ApplicantAvatar firstName={s.firstName} lastName={s.lastName} photoUrl={s.profilePhotoUrl} size={28} />
                            <Link href={`/scholars/${s.id}`} className="text-sm font-medium hover:text-primary transition-colors truncate">
                              {s.firstName} {s.lastName}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-[160px]">{s.school}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border font-medium">G{s.grade}</span>
                        </TableCell>
                        <TableCell><DocLink url={s.term1ReportUrl} /></TableCell>
                        <TableCell><DocLink url={s.term2ReportUrl} /></TableCell>
                        <TableCell><DocLink url={s.term3ReportUrl} /></TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                            <Link href={`/scholars/${s.id}`}>Open</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Applicant Documents */}
          {submissionsTab === "applicants" && (
            <div className="overflow-x-auto border-y border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead className="hidden md:table-cell">School</TableHead>
                    <TableHead>Guardian ID</TableHead>
                    <TableHead className="hidden sm:table-cell">Gr.8 Report</TableHead>
                    <TableHead className="hidden lg:table-cell">Recommendation</TableHead>
                    <TableHead>Other</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplicants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        No applicants yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApplicants.map((a, i) => {
                      const otherCount = a.otherDocs?.length ?? 0;
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="text-muted-foreground text-xs font-mono">{i + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <ApplicantAvatar firstName={a.firstName} lastName={a.lastName} photoUrl={a.profilePhotoUrl} size={28} />
                              <Link href={`/applicants/${a.id}`} className="text-sm font-medium hover:text-primary transition-colors truncate">
                                {a.firstName} {a.lastName}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-[160px]">{a.institution}</TableCell>
                          <TableCell><DocLink url={a.guardianIdUrl} /></TableCell>
                          <TableCell className="hidden sm:table-cell"><DocLink url={a.grade8ReportUrl} /></TableCell>
                          <TableCell className="hidden lg:table-cell"><DocLink url={a.recommendationUrl} /></TableCell>
                          <TableCell>
                            {otherCount > 0 ? (
                              <span className="text-xs font-medium text-primary">{otherCount} file{otherCount !== 1 ? "s" : ""}</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                              <Link href={`/applicants/${a.id}`}>Open</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      )}

      {/* ── FORM-TEMPLATE FOLDERS ──────────────────────────────────────────── */}
      {!isSpecial && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {folderForms.length === 0 ? (
            <div className="border-y border-border py-12 text-center text-sm text-muted-foreground">
              This folder is empty.{" "}
              <button className="text-primary underline hover:no-underline">
                Add a form
              </button>{" "}
              to get started.
            </div>
          ) : (
            <div className="border-y border-border">
              {folderForms.map((form, i) => (
                <motion.div
                  key={form.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.06 } }}
                >
                  <Card className="group">
                    <CardContent className="flex flex-col gap-3 p-0 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={form.status} />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="flex items-center gap-2">
                                <Edit2 className="w-4 h-4" /> Edit Form
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center gap-2">
                                <Archive className="w-4 h-4" /> Archive
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="flex items-center gap-2 text-destructive"
                                onClick={() => handleDelete(form.id)}
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm leading-snug">{form.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{form.description}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {form.submissions.toLocaleString()} submissions
                        </span>
                        <span>{form.fields} fields</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(form.lastModified)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </main>
  );
}
