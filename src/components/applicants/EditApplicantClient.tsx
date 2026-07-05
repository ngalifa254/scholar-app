"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Check, Camera } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { updateApplicant } from "@/lib/actions";
import type { Applicant, ApplicantStatus } from "@/types";

interface Props {
  applicant: Applicant;
}

export default function EditApplicantClient({ applicant: original }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(original.profilePhotoUrl ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    firstName: original.firstName,
    lastName: original.lastName,
    email: original.email,
    dateOfBirth: original.dateOfBirth,
    nationality: original.nationality,
    institution: original.institution,
    program: original.program,
    yearOfStudy: String(original.yearOfStudy),
    location: original.location,
    age: String(original.age),
    childStatus: original.childStatus,
    guardianName: original.guardianName,
    guardianContact: original.guardianContact,
    academicMerit: original.academicMerit,
    characterLeadership: original.characterLeadership,
    hardshipChronicallyIll: original.hardshipChronicallyIll,
    hardshipDistanceToSchool: original.hardshipDistanceToSchool,
    hardshipHeavyChores: original.hardshipHeavyChores,
    hardshipNoCleanWater: original.hardshipNoCleanWater,
    notes: original.notes,
    status: original.status as ApplicantStatus,
  });

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setProfilePhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function set(key: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggle(key: keyof typeof form) {
    setForm((f) => ({ ...f, [key]: !f[key] }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    fd.append("existingPhotoUrl", original.profilePhotoUrl ?? "");
    if (profilePhoto) fd.append("profilePhoto", profilePhoto);
    const result = await updateApplicant(original.id, null, fd);
    setSaving(false);
    if (result?.error) setError(result.error);
  }

  return (
    <main className="flex-1 p-6 lg:p-8 max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/applicants/${original.id}`} className="flex items-center gap-1.5 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <h1 className="text-xl font-semibold">
            Edit — {original.firstName} {original.lastName}
          </h1>
        </div>
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5">
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-md">{error}</p>
      )}

      {/* Personal */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Photo picker */}
            <div className="flex items-center gap-4">
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
                className="group relative w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors shrink-0"
              >
                {photoPreview ? (
                  <Image src={photoPreview} alt="Profile" fill className="object-cover" sizes="64px" />
                ) : (
                  <Camera className="w-6 h-6 text-primary/50 group-hover:text-primary/80 transition-colors" />
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </button>
              <div>
                <p className="text-sm font-medium">Profile Photo</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {photoPreview ? "Click photo to change" : "Click to upload a photo"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date of Birth</Label>
                <Input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Age</Label>
                <Input type="number" min="10" max="20" value={form.age} onChange={(e) => set("age", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nationality</Label>
                <Input value={form.nationality} onChange={(e) => set("nationality", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => set("location", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* School */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.06 } }}>
        <Card>
          <CardHeader><CardTitle>School</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>School</Label>
              <Input value={form.institution} onChange={(e) => set("institution", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Programme / Subject</Label>
                <Input value={form.program} onChange={(e) => set("program", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Grade</Label>
                <Select value={form.yearOfStudy} onValueChange={(v) => set("yearOfStudy", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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

      {/* Family & Status */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.12 } }}>
        <Card>
          <CardHeader><CardTitle>Family &amp; Status</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Child Status</Label>
              <Select value={form.childStatus} onValueChange={(v) => set("childStatus", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="double_orphan">Double Orphan (Both Parents Deceased)</SelectItem>
                  <SelectItem value="single_orphan">Single Orphan (One Parent Deceased)</SelectItem>
                  <SelectItem value="child_of_disabled">Child of Disabled Parent</SelectItem>
                  <SelectItem value="guardian_only">Raised by Guardian</SelectItem>
                  <SelectItem value="both_parents">Both Parents Present</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Guardian Name</Label>
                <Input value={form.guardianName} onChange={(e) => set("guardianName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Guardian Contact</Label>
                <Input value={form.guardianContact} onChange={(e) => set("guardianContact", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="selected">Selected</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Assessment */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.18 } }}>
        <Card>
          <CardHeader><CardTitle>Academic Assessment</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Academic Merit (CBC)</Label>
                <Select value={form.academicMerit} onValueChange={(v) => set("academicMerit", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ee">Exceeds Expectation (EE)</SelectItem>
                    <SelectItem value="me">Meets Expectation (ME)</SelectItem>
                    <SelectItem value="ae">Approaches Expectation (AE)</SelectItem>
                    <SelectItem value="be">Below Expectation (BE)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Character &amp; Leadership</Label>
                <Select value={form.characterLeadership} onValueChange={(v) => set("characterLeadership", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                rows={4}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5">
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </main>
  );
}
