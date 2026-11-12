"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createScholar, updateScholar } from "@/lib/actions";
import type { Scholar } from "@/types";

interface Props {
  scholar?: Scholar;
}

export default function ScholarFormClient({ scholar }: Props) {
  const isEdit = !!scholar;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(scholar?.profilePhotoUrl ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName: scholar?.firstName ?? "",
    lastName: scholar?.lastName ?? "",
    school: scholar?.school ?? "",
    grade: String(scholar?.grade ?? 10),
    location: scholar?.location ?? "",
    guardianName: scholar?.guardianName ?? "",
    guardianContact: scholar?.guardianContact ?? "",
    yearJoined: String(scholar?.yearJoined ?? new Date().getFullYear()),
    notes: scholar?.notes ?? "",
    status: scholar?.status ?? "active",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setProfilePhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (profilePhoto) fd.append("profilePhoto", profilePhoto);
    if (isEdit) {
      fd.append("existingPhotoUrl", scholar!.profilePhotoUrl ?? "");
      const result = await updateScholar(scholar!.id, null, fd);
      setSaving(false);
      if (result?.error) setError(result.error);
    } else {
      const result = await createScholar(null, fd);
      setSaving(false);
      if (result?.error) setError(result.error);
    }
  }

  return (
    <main className="flex-1 p-6 lg:p-8 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={isEdit ? `/scholars/${scholar!.id}` : "/scholars"} className="flex items-center gap-1.5 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <h1 className="text-xl font-semibold">
            {isEdit ? `Edit — ${scholar!.firstName} ${scholar!.lastName}` : "Add Scholar"}
          </h1>
        </div>
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5">
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-md">{error}</p>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Photo picker */}
            <div className="flex items-center gap-4">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors shrink-0"
              >
                {photoPreview ? (
                  <Image src={photoPreview} alt="Profile" fill unoptimized className="object-cover" sizes="64px" />
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
                  {photoPreview ? "Click to change" : "Click to upload (optional)"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Wanjiku" />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Kariuki" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Nyeri" />
              </div>
              <div className="space-y-1.5">
                <Label>Year Joined</Label>
                <Input type="number" min="2000" max="2030" value={form.yearJoined} onChange={(e) => set("yearJoined", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.06 } }}>
        <Card>
          <CardHeader><CardTitle>School</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>School Name *</Label>
              <Input value={form.school} onChange={(e) => set("school", e.target.value)} placeholder="Nyeri High School" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Grade *</Label>
                <Select value={form.grade} onValueChange={(v) => set("grade", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Grade 10</SelectItem>
                    <SelectItem value="11">Grade 11</SelectItem>
                    <SelectItem value="12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="deferred">Deferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.12 } }}>
        <Card>
          <CardHeader><CardTitle>Guardian</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Guardian Name</Label>
                <Input value={form.guardianName} onChange={(e) => set("guardianName", e.target.value)} placeholder="Mary Kariuki" />
              </div>
              <div className="space-y-1.5">
                <Label>Guardian Contact</Label>
                <Input value={form.guardianContact} onChange={(e) => set("guardianContact", e.target.value)} placeholder="+254 700 000 000" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any additional notes…" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
