"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  UserPlus,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FilterRail } from "@/components/ui/filter-rail";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteApplicant } from "@/lib/actions";
import { getStatusConfig, getScoreColor, cn } from "@/lib/utils";
import { ApplicantAvatar } from "@/components/ui/applicant-avatar";
import { ACADEMIC_LABELS, CHILD_STATUS_LABELS } from "@/lib/scoring";
import type { Applicant, ApplicantStatus, AcademicMerit, ChildStatus } from "@/types";

const STATUS_TABS: { key: ApplicantStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "reviewed", label: "Reviewed" },
  { key: "selected", label: "Selected" },
  { key: "rejected", label: "Rejected" },
];

type SortKey = "firstName" | "institution" | "totalScore" | "appliedDate" | "status";

interface Props {
  initialApplicants: Applicant[];
}

export default function ApplicantsClient({ initialApplicants }: Props) {
  const [applicants, setApplicants] = useState<Applicant[]>(initialApplicants);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicantStatus | "all">("all");
  const [academicFilter, setAcademicFilter] = useState<AcademicMerit | "all">("all");
  const [childStatusFilter, setChildStatusFilter] = useState<ChildStatus | "all">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "totalScore",
    dir: "desc",
  });
  const [deleteTarget, setDeleteTarget] = useState<Applicant | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...applicants];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
          a.institution.toLowerCase().includes(q) ||
          a.program.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter((a) => a.status === statusFilter);
    if (academicFilter !== "all") list = list.filter((a) => a.academicMerit === academicFilter);
    if (childStatusFilter !== "all")
      list = list.filter((a) => a.childStatus === childStatusFilter);

    list.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === "number" && typeof bv === "number")
        return sort.dir === "asc" ? av - bv : bv - av;
      return sort.dir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

    return list;
  }, [applicants, search, statusFilter, academicFilter, childStatusFilter, sort]);

  function toggleSortDir() {
    setSort((prev) => ({ ...prev, dir: prev.dir === "asc" ? "desc" : "asc" }));
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setAcademicFilter("all");
    setChildStatusFilter("all");
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteApplicant(deleteTarget.id);
    setDeleting(false);
    if (result.error) {
      setDeleteError(result.error);
      return;
    }
    setApplicants((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <main className="flex-1 px-6 lg:px-8 pb-6 lg:pb-8 space-y-6">
      {/* Section heading */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">Applicants</h2>
        <Button asChild size="sm">
          <Link href="/applicants/new" className="flex items-center gap-1.5">
            <UserPlus className="w-4 h-4" />
            New Applicant
          </Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground -mt-4">
        {filtered.length} of {applicants.length} applicants
      </p>

      {/* Rail + content */}
      <div className="flex flex-col sm:flex-row gap-6">
        <FilterRail
          label="Filter by status"
          options={STATUS_TABS}
          value={statusFilter}
          onChange={setStatusFilter}
        />

        <div className="flex-1 min-w-0 space-y-6">
          {/* Filters */}
          <motion.div
            className="flex flex-wrap gap-3 items-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search applicants..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={academicFilter} onValueChange={(v) => setAcademicFilter(v as AcademicMerit | "all")}>
              <SelectTrigger className="w-[210px]">
                <SelectValue placeholder="Academic Merit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Academic Merit</SelectItem>
                {(Object.keys(ACADEMIC_LABELS) as AcademicMerit[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {ACADEMIC_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={childStatusFilter}
              onValueChange={(v) => setChildStatusFilter(v as ChildStatus | "all")}
            >
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Child Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Child Statuses</SelectItem>
                {(Object.keys(CHILD_STATUS_LABELS) as ChildStatus[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {CHILD_STATUS_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1.5">
              <Select value={sort.key} onValueChange={(v) => setSort((s) => ({ key: v as SortKey, dir: s.dir }))}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="firstName">Name</SelectItem>
                  <SelectItem value="institution">School</SelectItem>
                  <SelectItem value="totalScore">Score</SelectItem>
                  <SelectItem value="appliedDate">Applied Date</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={toggleSortDir} title="Toggle sort direction">
                {sort.dir === "asc" ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={clearFilters}
              className="text-primary border-primary hover:bg-primary/5 sm:ml-auto"
            >
              <X className="w-4 h-4" /> Clear filters
            </Button>
          </motion.div>

          {/* Card grid */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filtered.length === 0 ? (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                No applicants found.
              </div>
            ) : (
              filtered.map((app) => {
                const status = getStatusConfig(app.status);
                return (
                  <Card key={app.id} className="p-5 flex flex-col items-center text-center relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/applicants/${app.id}`} className="flex items-center gap-2">
                            <Eye className="w-4 h-4" /> View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/applicants/${app.id}/edit`} className="flex items-center gap-2">
                            <Pencil className="w-4 h-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive flex items-center gap-2"
                          onClick={() => setDeleteTarget(app)}
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <ApplicantAvatar
                      firstName={app.firstName}
                      lastName={app.lastName}
                      photoUrl={app.profilePhotoUrl}
                      size={88}
                      className="mb-3"
                    />

                    <Link
                      href={`/applicants/${app.id}`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {app.firstName} {app.lastName}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-0.5 italic">{app.institution}</p>
                    <p className="text-xs text-muted-foreground">
                      Grade {app.yearOfStudy} · {app.location || app.nationality}
                    </p>
                    <p className={cn("text-xs font-semibold mt-0.5", getScoreColor(app.totalScore))}>
                      Score {app.totalScore.toFixed(1)}
                    </p>
                    <span
                      className={cn(
                        "mt-3 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap",
                        status.className
                      )}
                    >
                      {status.label}
                    </span>
                  </Card>
                );
              })
            )}
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteError(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Applicant</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              {deleteTarget?.firstName} {deleteTarget?.lastName}
            </span>
            ? This action cannot be undone.
          </p>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteError(null); }} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
