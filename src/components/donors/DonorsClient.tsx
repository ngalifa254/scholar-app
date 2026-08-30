"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, UserPlus, MoreHorizontal, Eye, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
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
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { deleteDonor } from "@/lib/actions";
import type { Donor, DonorStatus } from "@/types";

const STATUS_CONFIG: Record<DonorStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  past: { label: "Past", className: "bg-muted text-muted-foreground border border-border" },
};

type SortKey = "name" | "status" | "total" | "count" | "lastGift";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "status", label: "Active first" },
  { key: "total", label: "Highest contribution" },
  { key: "count", label: "Most contributing" },
  { key: "lastGift", label: "Most recent gift" },
];

function sortValue(donor: Donor, key: SortKey): number | string {
  switch (key) {
    case "name":
      return donor.name.toLowerCase();
    case "status":
      return donor.status === "active" ? 0 : 1;
    case "total":
      return donor.totalContributed;
    case "count":
      return donor.donations.length;
    case "lastGift":
      return donor.lastContributionDate ? new Date(donor.lastContributionDate).getTime() : 0;
  }
}

interface Props {
  initialDonors: Donor[];
}

export default function DonorsClient({ initialDonors }: Props) {
  const [donors, setDonors] = useState<Donor[]>(initialDonors);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "total", dir: "desc" });
  const [deleteTarget, setDeleteTarget] = useState<Donor | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function toggleSortDir() {
    setSort((prev) => ({ ...prev, dir: prev.dir === "asc" ? "desc" : "asc" }));
  }

  const filtered = useMemo(() => {
    let list = [...donors];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) => d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const av = sortValue(a, sort.key);
      const bv = sortValue(b, sort.key);
      if (typeof av === "number" && typeof bv === "number")
        return sort.dir === "asc" ? av - bv : bv - av;
      return sort.dir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return list;
  }, [donors, search, sort]);

  const totalRaised = useMemo(
    () => donors.reduce((sum, d) => sum + d.totalContributed, 0),
    [donors]
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteDonor(deleteTarget.id);
    setDeleting(false);
    if (result?.error) {
      setDeleteError(result.error);
      return;
    }
    setDonors((prev) => prev.filter((d) => d.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <main className="flex-1 px-6 lg:px-8 pb-6 lg:pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">Donors</h2>
        <Button asChild size="sm">
          <Link href="/donors/new" className="flex items-center gap-1.5">
            <UserPlus className="w-4 h-4" /> Add Donor
          </Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground -mt-4">
        {filtered.length} of {donors.length} · Total raised: {formatCurrency(totalRaised)}
      </p>
      <p className="text-xs text-muted-foreground -mt-4">
        Active = contributed in the last 12 months
      </p>

      <div className="space-y-6">
        <motion.div
          className="flex flex-wrap items-center justify-between gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5">
            <Select value={sort.key} onValueChange={(v) => setSort((s) => ({ key: v as SortKey, dir: s.dir }))}>
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.key} value={opt.key}>
                    {opt.label}
                  </SelectItem>
                ))}
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.06 } }}
        >
          {filtered.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No donors found.{" "}
                <Link href="/donors/new" className="text-primary underline">
                  Add the first one.
                </Link>
              </div>
            ) : (
              <Card className="p-0 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Cumulative Total</TableHead>
                      <TableHead>Last Gift</TableHead>
                      <TableHead className="text-right">Last Amount</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((donor) => {
                      const cfg = STATUS_CONFIG[donor.status] ?? STATUS_CONFIG.active;
                      return (
                        <TableRow key={donor.id}>
                          <TableCell>
                            <Link
                              href={`/donors/${donor.id}`}
                              className="font-medium hover:text-primary transition-colors whitespace-nowrap"
                            >
                              {donor.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">{donor.email || "—"}</TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">{donor.phone || "—"}</TableCell>
                          <TableCell>
                            <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap", cfg.className)}>
                              {cfg.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold whitespace-nowrap">
                            {formatCurrency(donor.totalContributed)}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {donor.lastContributionDate ? formatDate(donor.lastContributionDate) : "—"}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            {donor.lastContributionAmount != null ? formatCurrency(donor.lastContributionAmount) : "—"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/donors/${donor.id}`} className="flex items-center gap-2">
                                    <Eye className="w-4 h-4" /> View
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/donors/${donor.id}/edit`} className="flex items-center gap-2">
                                    <Pencil className="w-4 h-4" /> Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive flex items-center gap-2"
                                  onClick={() => setDeleteTarget(donor)}
                                >
                                  <Trash2 className="w-4 h-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
          )}
        </motion.div>
      </div>

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
            <DialogTitle>Delete donor?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete {deleteTarget?.name} and all of their contribution history.
          </p>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
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
