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
import { ApplicantAvatar } from "@/components/ui/applicant-avatar";
import { cn } from "@/lib/utils";
import { deletePastBeneficiary } from "@/lib/actions";
import type { PastBeneficiary, BeneficiaryStatus } from "@/types";

const STATUS_CONFIG: Record<BeneficiaryStatus, { label: string; className: string }> = {
  university: { label: "University", className: "bg-blue-50 text-blue-700 border border-blue-200" },
  career:     { label: "Career",     className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  other:      { label: "Other",      className: "bg-muted text-muted-foreground border border-border" },
};

const STATUS_TABS: { key: BeneficiaryStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "university", label: "University" },
  { key: "career", label: "Career" },
  { key: "other", label: "Other" },
];

type SortKey = "firstName" | "highSchool" | "yearGraduated" | "currentStatus";

interface Props {
  initialBeneficiaries: PastBeneficiary[];
}

export default function BeneficiariesClient({ initialBeneficiaries }: Props) {
  const [beneficiaries, setBeneficiaries] = useState<PastBeneficiary[]>(initialBeneficiaries);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BeneficiaryStatus | "all">("all");
  const [yearGraduatedFilter, setYearGraduatedFilter] = useState<string>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "firstName",
    dir: "asc",
  });
  const [deleteTarget, setDeleteTarget] = useState<PastBeneficiary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...beneficiaries];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          `${b.firstName} ${b.lastName}`.toLowerCase().includes(q) ||
          b.highSchool.toLowerCase().includes(q) ||
          b.institution.toLowerCase().includes(q) ||
          b.fieldOfStudy.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter((b) => b.currentStatus === statusFilter);
    if (yearGraduatedFilter !== "all")
      list = list.filter((b) => String(b.yearGraduated) === yearGraduatedFilter);

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
  }, [beneficiaries, search, statusFilter, yearGraduatedFilter, sort]);

  const yearGraduatedOptions = useMemo(
    () =>
      Array.from(new Set(beneficiaries.map((b) => b.yearGraduated).filter((y) => y > 0))).sort(
        (a, b) => b - a
      ),
    [beneficiaries]
  );

  function toggleSortDir() {
    setSort((prev) => ({ ...prev, dir: prev.dir === "asc" ? "desc" : "asc" }));
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setYearGraduatedFilter("all");
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deletePastBeneficiary(deleteTarget.id);
    setDeleting(false);
    if (result?.error) {
      setDeleteError(result.error);
      return;
    }
    setBeneficiaries((prev) => prev.filter((b) => b.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <main className="flex-1 px-6 lg:px-8 pb-6 lg:pb-8 space-y-6">
      {/* Section heading */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">Past Beneficiaries</h2>
        <Button asChild size="sm">
          <Link href="/past-beneficiaries/new" className="flex items-center gap-1.5">
            <UserPlus className="w-4 h-4" /> Add Beneficiary
          </Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground -mt-4">
        {filtered.length} of {beneficiaries.length}
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
                placeholder="Search by name, school, or institution…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={yearGraduatedFilter} onValueChange={setYearGraduatedFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Year Graduated" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {yearGraduatedOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
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
                  <SelectItem value="highSchool">High School</SelectItem>
                  <SelectItem value="yearGraduated">Year Graduated</SelectItem>
                  <SelectItem value="currentStatus">Status</SelectItem>
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
                No records found.{" "}
                <Link href="/past-beneficiaries/new" className="text-primary underline">
                  Add the first one.
                </Link>
              </div>
            ) : (
              filtered.map((b) => {
                const cfg = STATUS_CONFIG[b.currentStatus] ?? STATUS_CONFIG.other;
                return (
                  <Card key={b.id} className="p-5 flex flex-col items-center text-center relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/past-beneficiaries/${b.id}`} className="flex items-center gap-2">
                            <Eye className="w-4 h-4" /> View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/past-beneficiaries/${b.id}/edit`} className="flex items-center gap-2">
                            <Pencil className="w-4 h-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive flex items-center gap-2"
                          onClick={() => setDeleteTarget(b)}
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <ApplicantAvatar
                      firstName={b.firstName}
                      lastName={b.lastName}
                      photoUrl={b.profilePhotoUrl}
                      size={88}
                      className="mb-3"
                    />

                    <Link
                      href={`/past-beneficiaries/${b.id}`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {b.firstName} {b.lastName}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-0.5 italic">{b.highSchool}</p>
                    {(b.yearGraduated > 0 || b.location) && (
                      <p className="text-xs text-muted-foreground">
                        {b.yearGraduated > 0 && `Class of ${b.yearGraduated}`}
                        {b.yearGraduated > 0 && b.location && " · "}
                        {b.location}
                      </p>
                    )}
                    {(b.institution || b.fieldOfStudy) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {b.institution}
                        {b.institution && b.fieldOfStudy && " · "}
                        {b.fieldOfStudy}
                      </p>
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
            <DialogTitle>Remove Beneficiary</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-foreground">
              {deleteTarget?.firstName} {deleteTarget?.lastName}
            </span>{" "}
            from the past beneficiaries list? This action cannot be undone.
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
