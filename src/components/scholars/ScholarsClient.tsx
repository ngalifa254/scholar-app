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
import { deleteScholar } from "@/lib/actions";
import type { Scholar, ScholarStatus } from "@/types";

const STATUS_CONFIG: Record<ScholarStatus, { label: string; className: string }> = {
  active:    { label: "Active",    className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  completed: { label: "Completed", className: "bg-blue-50 text-blue-700 border border-blue-200" },
  deferred:  { label: "Deferred",  className: "bg-amber-50 text-amber-700 border border-amber-200" },
};

type SortKey = "firstName" | "school" | "yearJoined" | "status";

interface Props {
  initialScholars: Scholar[];
}

export default function ScholarsClient({ initialScholars }: Props) {
  const [scholars, setScholars] = useState<Scholar[]>(initialScholars);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ScholarStatus | "all">("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
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
  }, [scholars, search, statusFilter, gradeFilter, sort]);

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
    <main className="flex-1 p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Scholars</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} of {scholars.length} — current beneficiaries (Grades 10–12)
          </p>
        </div>
        <Button asChild>
          <Link href="/scholars/new" className="flex items-center gap-1.5">
            <UserPlus className="w-4 h-4" /> Add Scholar
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
            placeholder="Search by name or school…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ScholarStatus | "all")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="deferred">Deferred</SelectItem>
          </SelectContent>
        </Select>
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
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("firstName")}
              >
                Scholar <SortIcon col="firstName" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hidden md:table-cell"
                onClick={() => toggleSort("school")}
              >
                School <SortIcon col="school" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hidden lg:table-cell"
                onClick={() => toggleSort("yearJoined")}
              >
                Year Joined <SortIcon col="yearJoined" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("status")}
              >
                Status <SortIcon col="status" />
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No scholars found.{" "}
                  <Link href="/scholars/new" className="text-primary underline">
                    Add the first one.
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((scholar, i) => {
                const cfg = STATUS_CONFIG[scholar.status] ?? STATUS_CONFIG.active;
                return (
                  <TableRow key={scholar.id} className="group">
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <ApplicantAvatar
                          firstName={scholar.firstName}
                          lastName={scholar.lastName}
                          photoUrl={scholar.profilePhotoUrl}
                          size={32}
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/scholars/${scholar.id}`}
                            className="text-sm font-medium hover:text-primary transition-colors truncate block"
                          >
                            {scholar.firstName} {scholar.lastName}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate">
                            {scholar.location}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p className="text-sm truncate max-w-[180px]">{scholar.school}</p>
                      <p className="text-xs text-muted-foreground">Grade {scholar.grade}</p>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {scholar.yearJoined > 0 ? scholar.yearJoined : "—"}
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
                              href={`/scholars/${scholar.id}`}
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" /> View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/scholars/${scholar.id}/edit`}
                              className="flex items-center gap-2"
                            >
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
