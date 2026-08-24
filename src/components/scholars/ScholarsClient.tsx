"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  UserPlus,
  Sparkles,
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
import { ApplicantAvatar } from "@/components/ui/applicant-avatar";
import { cn } from "@/lib/utils";
import { deleteScholar } from "@/lib/actions";
import type { Scholar, ScholarStatus } from "@/types";

const STATUS_CONFIG: Record<ScholarStatus, { label: string; className: string }> = {
  active:    { label: "Active",    className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  completed: { label: "Completed", className: "bg-blue-50 text-blue-700 border border-blue-200" },
  deferred:  { label: "Deferred",  className: "bg-amber-50 text-amber-700 border border-amber-200" },
};

const STATUS_TABS: { key: ScholarStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "deferred", label: "Deferred" },
];

type SortKey = "firstName" | "yearJoined" | "grade";

interface Props {
  initialScholars: Scholar[];
}

export default function ScholarsClient({ initialScholars }: Props) {
  const [scholars, setScholars] = useState<Scholar[]>(initialScholars);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ScholarStatus | "all">("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [yearJoinedFilter, setYearJoinedFilter] = useState<string>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "firstName",
    dir: "asc",
  });
  const [deleteTarget, setDeleteTarget] = useState<Scholar | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...scholars];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
          s.school.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter((s) => s.status === statusFilter);
    if (gradeFilter !== "all") list = list.filter((s) => String(s.grade) === gradeFilter);
    if (schoolFilter !== "all") list = list.filter((s) => s.school === schoolFilter);
    if (yearJoinedFilter !== "all")
      list = list.filter((s) => String(s.yearJoined) === yearJoinedFilter);

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
  }, [scholars, search, statusFilter, gradeFilter, schoolFilter, yearJoinedFilter, sort]);

  const schoolOptions = useMemo(
    () => Array.from(new Set(scholars.map((s) => s.school).filter(Boolean))).sort(),
    [scholars]
  );
  const yearJoinedOptions = useMemo(
    () =>
      Array.from(new Set(scholars.map((s) => s.yearJoined).filter((y) => y > 0))).sort(
        (a, b) => b - a
      ),
    [scholars]
  );

  function toggleSortDir() {
    setSort((prev) => ({ ...prev, dir: prev.dir === "asc" ? "desc" : "asc" }));
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setGradeFilter("all");
    setSchoolFilter("all");
    setYearJoinedFilter("all");
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteScholar(deleteTarget.id);
    setDeleting(false);
    if (result?.error) {
      setDeleteError(result.error);
      return;
    }
    setScholars((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <main className="flex-1 px-6 lg:px-8 pb-6 lg:pb-8 space-y-6">
      {/* Section heading */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">Current Scholars</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild size="sm">
            <Link href="/scholars/showcase" className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Showcase
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/scholars/new" className="flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" /> Add Scholar
            </Link>
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground -mt-4">
        {filtered.length} of {scholars.length}
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
                placeholder="Search by name or school…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="10">Grade 10</SelectItem>
                <SelectItem value="11">Grade 11</SelectItem>
                <SelectItem value="12">Grade 12</SelectItem>
              </SelectContent>
            </Select>
            <Select value={schoolFilter} onValueChange={setSchoolFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="School" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {schoolOptions.map((school) => (
                  <SelectItem key={school} value={school}>
                    {school}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearJoinedFilter} onValueChange={setYearJoinedFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Year Joined" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {yearJoinedOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1.5">
              <Select value={sort.key} onValueChange={(v) => setSort((s) => ({ key: v as SortKey, dir: s.dir }))}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="firstName">Name</SelectItem>
                  <SelectItem value="yearJoined">Year Joined</SelectItem>
                  <SelectItem value="grade">Grade</SelectItem>
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
                No scholars found.{" "}
                <Link href="/scholars/new" className="text-primary underline">
                  Add the first one.
                </Link>
              </div>
            ) : (
              filtered.map((scholar) => {
                const cfg = STATUS_CONFIG[scholar.status] ?? STATUS_CONFIG.active;
                return (
                  <Card key={scholar.id} className="p-5 flex flex-col items-center text-center relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/scholars/${scholar.id}`} className="flex items-center gap-2">
                            <Eye className="w-4 h-4" /> View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/scholars/${scholar.id}/edit`} className="flex items-center gap-2">
                            <Pencil className="w-4 h-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive flex items-center gap-2"
                          onClick={() => setDeleteTarget(scholar)}
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <ApplicantAvatar
                      firstName={scholar.firstName}
                      lastName={scholar.lastName}
                      photoUrl={scholar.profilePhotoUrl}
                      size={88}
                      className="mb-3"
                    />

                    <Link
                      href={`/scholars/${scholar.id}`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {scholar.firstName} {scholar.lastName}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-0.5 italic">{scholar.school}</p>
                    <p className="text-xs text-muted-foreground">
                      Grade {scholar.grade} · {scholar.location}
                    </p>
                    {scholar.yearJoined > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">Joined {scholar.yearJoined}</p>
                    )}
                    <span
                      className={cn(
                        "mt-3 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap",
                        cfg.className
                      )}
                    >
                      {cfg.label}
                    </span>
                  </Card>
                );
              })
            )}
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Scholar</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-foreground">
              {deleteTarget?.firstName} {deleteTarget?.lastName}
            </span>{" "}
            from the scholars list? This action cannot be undone.
          </p>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteError(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Removing…" : "Remove"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
