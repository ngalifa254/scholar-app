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
import { ApplicantAvatar } from "@/components/ui/applicant-avatar";
import { deletePastBeneficiary } from "@/lib/actions";
import type { PastBeneficiary, BeneficiaryStatus } from "@/types";

const STATUS_CONFIG: Record<BeneficiaryStatus, { label: string; className: string }> = {
  university: { label: "University", className: "bg-muted text-muted-foreground border border-border" },
  career:     { label: "Career",     className: "bg-muted text-muted-foreground border border-border" },
  other:      { label: "Other",      className: "bg-muted text-muted-foreground border border-border" },
};

type SortKey = "firstName" | "highSchool" | "yearGraduated" | "currentStatus";

interface Props {
  initialBeneficiaries: PastBeneficiary[];
}

export default function BeneficiariesClient({ initialBeneficiaries }: Props) {
  const [beneficiaries, setBeneficiaries] = useState<PastBeneficiary[]>(initialBeneficiaries);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BeneficiaryStatus | "all">("all");
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
  }, [beneficiaries, search, statusFilter, sort]);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
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
    <main className="flex-1 p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Past Beneficiaries</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} of {beneficiaries.length} — scholarship graduates in university or career
          </p>
        </div>
        <Button asChild>
          <Link href="/past-beneficiaries/new" className="flex items-center gap-1.5">
            <UserPlus className="w-4 h-4" /> Add Beneficiary
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
            placeholder="Search by name, school, or institution…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as BeneficiaryStatus | "all")}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="university">University</SelectItem>
            <SelectItem value="career">Career</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="overflow-x-auto border-y border-border"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-10">#</TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("firstName")}
              >
                Name <SortIcon col="firstName" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hidden md:table-cell"
                onClick={() => toggleSort("highSchool")}
              >
                High School <SortIcon col="highSchool" />
              </TableHead>
              <TableHead className="hidden lg:table-cell">Institution</TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("currentStatus")}
              >
                Status <SortIcon col="currentStatus" />
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No records found.{" "}
                  <Link href="/past-beneficiaries/new" className="text-primary underline">
                    Add the first one.
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((b, i) => {
                const cfg = STATUS_CONFIG[b.currentStatus] ?? STATUS_CONFIG.other;
                return (
                  <TableRow key={b.id} className="group">
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <ApplicantAvatar
                          firstName={b.firstName}
                          lastName={b.lastName}
                          photoUrl={b.profilePhotoUrl}
                          size={32}
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/past-beneficiaries/${b.id}`}
                            className="text-sm font-medium hover:text-primary transition-colors truncate block"
                          >
                            {b.firstName} {b.lastName}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate">{b.location}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p className="text-sm truncate max-w-[180px]">{b.highSchool}</p>
                      {b.yearGraduated > 0 && (
                        <p className="text-xs text-muted-foreground">Class of {b.yearGraduated}</p>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {b.institution && (
                        <p className="text-sm truncate max-w-[200px]">{b.institution}</p>
                      )}
                      {b.fieldOfStudy && (
                        <p className="text-xs text-muted-foreground truncate">{b.fieldOfStudy}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${cfg.className}`}
                      >
                        {cfg.label}
                      </span>
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
                            <Link
                              href={`/past-beneficiaries/${b.id}`}
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" /> View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/past-beneficiaries/${b.id}/edit`}
                              className="flex items-center gap-2"
                            >
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
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </motion.div>

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
