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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteApplicant } from "@/lib/actions";
import {
  getStatusConfig,
  getScoreColor,
  formatDate,
} from "@/lib/utils";
import { ApplicantAvatar } from "@/components/ui/applicant-avatar";
import { ACADEMIC_LABELS, CHILD_STATUS_LABELS } from "@/lib/scoring";
import type { Applicant, ApplicantStatus, AcademicMerit } from "@/types";

type SortKey = "firstName" | "institution" | "totalScore" | "appliedDate" | "status";

interface Props {
  initialApplicants: Applicant[];
}

export default function ApplicantsClient({ initialApplicants }: Props) {
  const [applicants, setApplicants] = useState<Applicant[]>(initialApplicants);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicantStatus | "all">("all");
  const [academicFilter, setAcademicFilter] = useState<AcademicMerit | "all">("all");
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
  }, [applicants, search, statusFilter, academicFilter, sort]);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }
    );
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sort.key !== col)
      return <ChevronUp className="w-3 h-3 text-muted-foreground/40 ml-1 inline" />;
    return sort.dir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-primary ml-1 inline" />
    ) : (
      <ChevronDown className="w-3 h-3 text-primary ml-1 inline" />
    );
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
    <main className="flex-1 p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Applicants</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} of {applicants.length} applicants
          </p>
        </div>
        <Button asChild>
          <Link href="/applicants/new" className="flex items-center gap-1.5">
            <UserPlus className="w-4 h-4" />
            New Applicant
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <motion.div
        className="flex flex-wrap gap-3"
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
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ApplicantStatus | "all")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="selected">Selected</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={academicFilter} onValueChange={(v) => setAcademicFilter(v as AcademicMerit | "all")}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="CBC Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All CBC Levels</SelectItem>
            <SelectItem value="ee">Exceeds Expectation</SelectItem>
            <SelectItem value="me">Meets Expectation</SelectItem>
            <SelectItem value="ae">Approaches Expectation</SelectItem>
            <SelectItem value="be">Below Expectation</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="rounded-lg border border-border bg-card overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-10">#</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("firstName")}>
                Applicant <SortIcon col="firstName" />
              </TableHead>
              <TableHead className="cursor-pointer select-none hidden md:table-cell" onClick={() => toggleSort("institution")}>
                School <SortIcon col="institution" />
              </TableHead>
              <TableHead className="hidden lg:table-cell">Child Status</TableHead>
              <TableHead className="hidden lg:table-cell">CBC Level</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("totalScore")}>
                Score <SortIcon col="totalScore" />
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="cursor-pointer select-none hidden xl:table-cell" onClick={() => toggleSort("appliedDate")}>
                Applied <SortIcon col="appliedDate" />
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  No applicants found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((app, i) => {
                const status = getStatusConfig(app.status);
                return (
                  <TableRow key={app.id} className="group">
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <ApplicantAvatar
                          firstName={app.firstName}
                          lastName={app.lastName}
                          photoUrl={app.profilePhotoUrl}
                          size={32}
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/applicants/${app.id}`}
                            className="text-sm font-medium hover:text-primary transition-colors truncate block"
                          >
                            {app.firstName} {app.lastName}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate">{app.location || app.nationality}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p className="text-sm truncate max-w-[180px]">{app.institution}</p>
                      <p className="text-xs text-muted-foreground">Grade {app.yearOfStudy}</p>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary border border-border text-secondary-foreground">
                        {CHILD_STATUS_LABELS[app.childStatus] ?? app.childStatus}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 font-medium uppercase">
                        {app.academicMerit?.toUpperCase() ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-bold ${getScoreColor(app.totalScore)}`}>
                        {app.totalScore.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${status.className}`}>
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                      {formatDate(app.appliedDate)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 h-7 w-7"
                          >
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
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </motion.div>

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
