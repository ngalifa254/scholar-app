"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  Calendar,
  Wallet,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatCurrency } from "@/lib/utils";
import { createDonation, deleteDonation } from "@/lib/actions";
import type { Donor, DonorStatus, Scholar } from "@/types";

const STATUS_CONFIG: Record<DonorStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  past: { label: "Past", className: "bg-muted text-muted-foreground border border-border" },
};

interface Props {
  donor: Donor;
  scholars: Scholar[];
}

export default function DonorDetailClient({ donor, scholars }: Props) {
  const router = useRouter();
  const cfg = STATUS_CONFIG[donor.status] ?? STATUS_CONFIG.active;

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [contributedOn, setContributedOn] = useState(new Date().toISOString().slice(0, 10));
  const [scholarId, setScholarId] = useState("none");
  const [note, setNote] = useState("");

  async function handleAddContribution() {
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.append("amount", amount);
    fd.append("contributedOn", contributedOn);
    fd.append("scholarId", scholarId === "none" ? "" : scholarId);
    fd.append("note", note);
    const result = await createDonation(donor.id, fd);
    setSaving(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setAmount("");
    setNote("");
    setScholarId("none");
    setShowForm(false);
    router.refresh();
  }

  async function handleDeleteDonation(donationId: string) {
    await deleteDonation(donationId, donor.id);
    router.refresh();
  }

  return (
    <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/donors" className="flex items-center gap-1.5 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Donors
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/donors/${donor.id}/edit`} className="flex items-center gap-1.5">
            <Pencil className="w-4 h-4" /> Edit
          </Link>
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-xl font-semibold">{donor.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
                {cfg.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {donor.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {donor.email}
                </span>
              )}
              {donor.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> {donor.phone}
                </span>
              )}
              {donor.lastContributionDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Last gift {formatDate(donor.lastContributionDate)}
                </span>
              )}
            </div>
            <div className="mt-4 flex items-center gap-2 text-2xl font-bold text-primary">
              <Wallet className="w-5 h-5" /> {formatCurrency(donor.totalContributed)}
            </div>
            <p className="text-xs text-muted-foreground">Cumulative contributions</p>
            {donor.notes && (
              <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap border-t border-border pt-3">
                {donor.notes}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contributions</CardTitle>
            {!showForm && (
              <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="h-7 text-xs gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Contribution
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {showForm && (
              <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
                {error && <p className="text-xs text-destructive">{error}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Amount (KES) *</Label>
                    <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Date *</Label>
                    <Input type="date" value={contributedOn} onChange={(e) => setContributedOn(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Sponsored Scholar (optional)</Label>
                  <Select value={scholarId} onValueChange={setScholarId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General fund</SelectItem>
                      {scholars.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.firstName} {s.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Note</Label>
                  <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Term 1 fees" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowForm(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAddContribution} disabled={saving || !amount || !contributedOn}>
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            )}

            {donor.donations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No contributions recorded yet.</p>
            ) : (
              donor.donations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{formatCurrency(donation.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(donation.contributedOn)}
                      {donation.scholarName && (
                        <>
                          {" · "}
                          <Link href={`/scholars/${donation.scholarId}`} className="text-primary hover:underline">
                            {donation.scholarName}
                          </Link>
                        </>
                      )}
                      {donation.note && ` · ${donation.note}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteDonation(donation.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
