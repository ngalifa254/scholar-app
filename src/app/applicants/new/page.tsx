"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createApplicant } from "@/lib/actions";
import {
  computeScore,
  CHILD_STATUS_LABELS,
  ACADEMIC_LABELS,
  CHARACTER_LABELS,
} from "@/lib/scoring";
import { getScoreColor } from "@/lib/utils";
import type { ChildStatus, AcademicMerit, CharacterLeadership } from "@/types";

const STEPS = [
  { id: 1, label: "Personal", desc: "Basic information" },
  { id: 2, label: "Family", desc: "Guardian & status" },
  { id: 3, label: "Assessment", desc: "CBC & hardship" },
  { id: 4, label: "Review", desc: "Confirm & submit" },
];

interface WizardFormData {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  nationality: string;
  institution: string;
  program: string;
  yearOfStudy: string;
  location: string;
  age: string;
  childStatus: string;
  guardianName: string;
  guardianContact: string;
  academicMerit: string;
  characterLeadership: string;
  hardshipChronicallyIll: boolean;
  hardshipDistanceToSchool: boolean;
  hardshipHeavyChores: boolean;
  hardshipNoCleanWater: boolean;
  notes: string;
}

const INITIAL: WizardFormData = {
  firstName: "", lastName: "", email: "", dateOfBirth: "",
  nationality: "Kenyan", institution: "", program: "",
  yearOfStudy: "9", location: "", age: "",
  childStatus: "", guardianName: "", guardianContact: "",
  academicMerit: "", characterLeadership: "",
  hardshipChronicallyIll: false, hardshipDistanceToSchool: false,
  hardshipHeavyChores: false, hardshipNoCleanWater: false,
  notes: "",
};

export default function NewApplicantPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardFormData>(INITIAL);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set(key: keyof WizardFormData, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggle(key: keyof WizardFormData) {
    setForm((f) => ({ ...f, [key]: !f[key as keyof WizardFormData] }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setProfilePhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    fd.set("status", "pending");
    if (profilePhoto) fd.append("profilePhoto", profilePhoto);
    const result = await createApplicant(null, fd);
    setSubmitting(false);
    if (result?.error) setError(result.error);
  }

  const previewScore =
    form.childStatus && form.academicMerit && form.characterLeadership
      ? computeScore({
          childStatus: form.childStatus as ChildStatus,
          academicMerit: form.academicMerit as AcademicMerit,
          characterLeadership: form.characterLeadership as CharacterLeadership,
          hardshipChronicallyIll: form.hardshipChronicallyIll,
          hardshipDistanceToSchool: form.hardshipDistanceToSchool,
          hardshipHeavyChores: form.hardshipHeavyChores,
          hardshipNoCleanWater: form.hardshipNoCleanWater,
        })
      : null;

  return (
    <main className="flex-1 p-6 lg:p-8 max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/applicants" className="flex items-center gap-1.5 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-xl font-semibold">New Applicant</h1>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                step === s.id
                  ? "bg-primary text-primary-foreground"
                  : step > s.id
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
              onClick={() => step > s.id && setStep(s.id)}
            >
              {step > s.id ? <Check className="w-3 h-3" /> : <span>{s.id}</span>}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-6 ${step > s.id ? "bg-primary/50" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Personal */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Student identity and school details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Photo picker */}
              <div className="flex flex-col items-center gap-2 pb-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative w-20 h-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors"
                >
                  {photoPreview ? (
                    <Image src={photoPreview} alt="Preview" fill unoptimized className="object-cover" sizes="80px" />
                  ) : (
                    <Camera className="w-7 h-7 text-primary/50 group-hover:text-primary/80 transition-colors" />
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </button>
                <p className="text-xs text-muted-foreground">
                  {photoPreview ? "Click to change photo" : "Upload profile photo (optional)"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>First Name *</Label>
                  <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="John" />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name *</Label>
                  <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Kamau" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="john@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Date of Birth *</Label>
                  <Input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Age</Label>
                  <Input type="number" min="10" max="20" value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="14" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nationality *</Label>
                  <Input value={form.nationality} onChange={(e) => set("nationality", e.target.value)} placeholder="Kenyan" />
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Nairobi" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>School *</Label>
                <Input value={form.institution} onChange={(e) => set("institution", e.target.value)} placeholder="Alliance High School" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Subject / Stream</Label>
                  <Input value={form.program} onChange={(e) => set("program", e.target.value)} placeholder="Sciences" />
                </div>
                <div className="space-y-1.5">
                  <Label>Grade</Label>
                  <Select value={form.yearOfStudy} onValueChange={(v) => set("yearOfStudy", v)}>
                    <SelectTrigger><SelectValue placeholder="Grade" /></SelectTrigger>
                    <SelectContent>
                      {[7, 8, 9, 10, 11, 12].map((g) => (
                        <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Step 2: Family & Guardian */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>Family & Guardian</CardTitle>
              <CardDescription>Child status and guardian contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Child Status *</Label>
                <Select value={form.childStatus} onValueChange={(v) => set("childStatus", v)}>
                  <SelectTrigger><SelectValue placeholder="Select child status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="double_orphan">Double Orphan (Both Parents Deceased)</SelectItem>
                    <SelectItem value="single_orphan">Single Orphan (One Parent Deceased)</SelectItem>
                    <SelectItem value="child_of_disabled">Child of Disabled Parent</SelectItem>
                    <SelectItem value="guardian_only">Raised by Guardian</SelectItem>
                    <SelectItem value="both_parents">Both Parents Present</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Guardian Name</Label>
                <Input value={form.guardianName} onChange={(e) => set("guardianName", e.target.value)} placeholder="Mary Kamau" />
              </div>
              <div className="space-y-1.5">
                <Label>Guardian Contact</Label>
                <Input value={form.guardianContact} onChange={(e) => set("guardianContact", e.target.value)} placeholder="+254 700 000 000" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Step 3: Assessment */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>Academic Assessment</CardTitle>
              <CardDescription>CBC performance levels and hardship indicators.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Academic Merit (CBC) *</Label>
                  <Select value={form.academicMerit} onValueChange={(v) => set("academicMerit", v)}>
                    <SelectTrigger><SelectValue placeholder="CBC level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ee">Exceeds Expectation (EE)</SelectItem>
                      <SelectItem value="me">Meets Expectation (ME)</SelectItem>
                      <SelectItem value="ae">Approaches Expectation (AE)</SelectItem>
                      <SelectItem value="be">Below Expectation (BE)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Character &amp; Leadership *</Label>
                  <Select value={form.characterLeadership} onValueChange={(v) => set("characterLeadership", v)}>
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                      <SelectItem value="below_average">Below Average</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Hardship Indicators</Label>
                <p className="text-xs text-muted-foreground">Check all that apply.</p>
                <div className="space-y-2.5 pt-1">
                  {([
                    { key: "hardshipChronicallyIll" as const, label: "Has a chronically ill family member" },
                    { key: "hardshipDistanceToSchool" as const, label: "Lives far from school" },
                    { key: "hardshipHeavyChores" as const, label: "Responsible for heavy domestic chores" },
                    { key: "hardshipNoCleanWater" as const, label: "Lack of clean water and connection to the power grid" },
                  ] as const).map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer group">
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          form[key]
                            ? "bg-primary border-primary"
                            : "border-border group-hover:border-primary/50"
                        }`}
                        onClick={() => toggle(key)}
                      >
                        {form[key] && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                      </div>
                      <span className="text-sm text-foreground" onClick={() => toggle(key)}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Additional observations or context..."
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>Review &amp; Submit</CardTitle>
              <CardDescription>Confirm applicant details before saving.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="font-medium">{form.firstName} {form.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">School</p>
                  <p className="font-medium">{form.institution || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Grade</p>
                  <p className="font-medium">Grade {form.yearOfStudy}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium">{form.location || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Child Status</p>
                  <p className="font-medium">{form.childStatus ? CHILD_STATUS_LABELS[form.childStatus] : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Guardian</p>
                  <p className="font-medium">{form.guardianName || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Academic Merit</p>
                  <p className="font-medium">{form.academicMerit ? ACADEMIC_LABELS[form.academicMerit] : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Character &amp; Leadership</p>
                  <p className="font-medium">{form.characterLeadership ? CHARACTER_LABELS[form.characterLeadership] : "—"}</p>
                </div>
              </div>

              {/* Hardship tags */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Hardship Indicators</p>
                <div className="flex flex-wrap gap-1.5">
                  {form.hardshipChronicallyIll && <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">Ill family member</span>}
                  {form.hardshipDistanceToSchool && <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">Far from school</span>}
                  {form.hardshipHeavyChores && <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">Heavy chores</span>}
                  {form.hardshipNoCleanWater && <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">No water/power</span>}
                  {!form.hardshipChronicallyIll && !form.hardshipDistanceToSchool && !form.hardshipHeavyChores && !form.hardshipNoCleanWater && (
                    <span className="text-xs text-muted-foreground">None recorded</span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Computed score preview */}
              {previewScore !== null && (
                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Computed Score</p>
                  <span className={`text-2xl font-bold ${getScoreColor(previewScore)}`}>
                    {previewScore}
                    <span className="text-sm font-normal text-muted-foreground ml-1">/ 100</span>
                  </span>
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-md">{error}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
          className="flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep((s) => s + 1)} className="flex items-center gap-1.5">
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {submitting ? "Submitting…" : "Submit Applicant"}
          </Button>
        )}
      </div>
    </main>
  );
}
