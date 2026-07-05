"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Calendar,
  BarChart3,
  Building2,
  Download,
  User,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  saveSettings,
  recomputeAllScores,
  exportApplicantsCSV,
  exportScholarsCSV,
  exportBeneficiariesCSV,
} from "@/lib/actions";
import type { AppSettings } from "@/types";

interface Props {
  initialSettings: AppSettings;
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function SettingsClient({ initialSettings }: Props) {
  const [form, setForm] = useState<AppSettings>(initialSettings);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [recomputing, setRecomputing] = useState(false);
  const [recomputeMsg, setRecomputeMsg] = useState("");
  const [exporting, setExporting] = useState<string | null>(null);

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const weightSum =
    form.scoringChildStatus +
    form.scoringAcademic +
    form.scoringCharacter +
    form.scoringHardship;
  const weightsValid = weightSum === 100;

  async function handleSave() {
    setSaveState("saving");
    setSaveError("");
    const result = await saveSettings(form);
    if (result.error) {
      setSaveState("error");
      setSaveError(result.error);
    } else {
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    }
  }

  async function handleRecompute() {
    if (!weightsValid) return;
    setRecomputing(true);
    setRecomputeMsg("");
    const result = await recomputeAllScores({
      scoringChildStatus: form.scoringChildStatus,
      scoringAcademic: form.scoringAcademic,
      scoringCharacter: form.scoringCharacter,
      scoringHardship: form.scoringHardship,
    });
    setRecomputing(false);
    if (result.error) {
      setRecomputeMsg(`Error: ${result.error}`);
    } else {
      setRecomputeMsg(`Updated scores for ${result.updated} applicants.`);
    }
  }

  async function handleExport(type: "applicants" | "scholars" | "beneficiaries") {
    setExporting(type);
    let result: { csv?: string; error?: string };
    if (type === "applicants") result = await exportApplicantsCSV();
    else if (type === "scholars") result = await exportScholarsCSV();
    else result = await exportBeneficiariesCSV();
    setExporting(null);
    if (result.csv) downloadCSV(result.csv, `${type}-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  const SaveButton = (
    <div className="flex items-center gap-3 pt-2">
      <Button onClick={handleSave} disabled={saveState === "saving"} className="flex items-center gap-2">
        {saveState === "saving" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : saveState === "saved" ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved!" : "Save Changes"}
      </Button>
      {saveState === "error" && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" /> {saveError}
        </p>
      )}
    </div>
  );

  return (
    <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Settings className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your programme configuration, scoring weights, and data.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}>
        <Tabs defaultValue="programme">
          <TabsList className="mb-6">
            <TabsTrigger value="programme" className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Programme
            </TabsTrigger>
            <TabsTrigger value="scoring" className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Scoring
            </TabsTrigger>
            <TabsTrigger value="organisation" className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Organisation
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Account
            </TabsTrigger>
          </TabsList>

          {/* ── Programme ── */}
          <TabsContent value="programme">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scholarship Cycle</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Set the active scholarship year, application window, and intake quota.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Scholarship Year</Label>
                    <Input
                      value={form.scholarshipYear}
                      onChange={(e) => set("scholarshipYear", e.target.value)}
                      placeholder="e.g. 2025/2026"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Intake Quota</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.intakeQuota}
                      onChange={(e) => set("intakeQuota", Number(e.target.value))}
                      placeholder="Number of scholarships"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Application Open Date</Label>
                    <Input
                      type="date"
                      value={form.appOpenDate}
                      onChange={(e) => set("appOpenDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Application Close Date</Label>
                    <Input
                      type="date"
                      value={form.appCloseDate}
                      onChange={(e) => set("appCloseDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Selection Deadline</Label>
                    <Input
                      type="date"
                      value={form.selectionDeadline}
                      onChange={(e) => set("selectionDeadline", e.target.value)}
                    />
                  </div>
                </div>
                {SaveButton}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Scoring ── */}
          <TabsContent value="scoring">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scoring Weights</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Adjust how each dimension contributes to the total score. Weights must sum to exactly 100%.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  { key: "scoringChildStatus" as const, label: "Child Status", desc: "Orphan/guardian background" },
                  { key: "scoringAcademic" as const, label: "Academic Merit (CBC)", desc: "EE / ME / AE / BE level" },
                  { key: "scoringCharacter" as const, label: "Character & Leadership", desc: "Excellent → Below Average" },
                  { key: "scoringHardship" as const, label: "Hardship Indicators", desc: "Number of hardship factors" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={form[key]}
                        onChange={(e) => set(key, Number(e.target.value))}
                        className="w-20 text-right"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                ))}

                <div className={`flex items-center justify-between text-sm font-medium px-1 pt-1 border-t border-border ${weightsValid ? "text-emerald-600" : "text-red-500"}`}>
                  <span>Total</span>
                  <span>{weightSum}%{weightsValid ? " ✓" : " (must equal 100%)"}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {SaveButton}
                  <Button
                    variant="outline"
                    disabled={!weightsValid || recomputing}
                    onClick={handleRecompute}
                    className="flex items-center gap-2"
                  >
                    {recomputing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Recompute All Scores
                  </Button>
                </div>
                {recomputeMsg && (
                  <p className="text-sm text-muted-foreground">{recomputeMsg}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Organisation ── */}
          <TabsContent value="organisation">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Organisation Profile</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Foundation details used across the app and in exported reports.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Organisation Name</Label>
                    <Input
                      value={form.orgName}
                      onChange={(e) => set("orgName", e.target.value)}
                      placeholder="Wahome Foundation"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Tagline</Label>
                    <Input
                      value={form.orgTagline}
                      onChange={(e) => set("orgTagline", e.target.value)}
                      placeholder="Inspire & Empower"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contact Email</Label>
                    <Input
                      type="email"
                      value={form.orgEmail}
                      onChange={(e) => set("orgEmail", e.target.value)}
                      placeholder="info@wahomefoundation.org"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contact Phone</Label>
                    <Input
                      value={form.orgPhone}
                      onChange={(e) => set("orgPhone", e.target.value)}
                      placeholder="+254 700 000 000"
                    />
                  </div>
                </div>
                {SaveButton}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Export ── */}
          <TabsContent value="export">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Export</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Download records as CSV files for reporting or offline use.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    key: "applicants" as const,
                    label: "Scholarship Applicants",
                    desc: "Name, school, score, status, applied date, rank",
                  },
                  {
                    key: "scholars" as const,
                    label: "Current Scholars",
                    desc: "Name, school, grade, status, year joined",
                  },
                  {
                    key: "beneficiaries" as const,
                    label: "Past Beneficiaries",
                    desc: "Name, high school, graduation year, current institution",
                  },
                ].map(({ key, label, desc }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={exporting === key}
                      onClick={() => handleExport(key)}
                      className="flex items-center gap-2 shrink-0 ml-4"
                    >
                      {exporting === key ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      Export CSV
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Account ── */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Admin Account</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage your administrator credentials and display name.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Display Name</Label>
                    <Input placeholder="Admin" disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" placeholder="admin@wahomefoundation.org" disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label>New Password</Label>
                    <Input type="password" placeholder="••••••••" disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Confirm Password</Label>
                    <Input type="password" placeholder="••••••••" disabled />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                  Account management requires authentication integration — coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </main>
  );
}
