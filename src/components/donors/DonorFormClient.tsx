"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createDonor, updateDonor } from "@/lib/actions";
import type { Donor } from "@/types";

interface Props {
  donor?: Donor;
}

export default function DonorFormClient({ donor }: Props) {
  const isEdit = !!donor;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: donor?.name ?? "",
    email: donor?.email ?? "",
    phone: donor?.phone ?? "",
    notes: donor?.notes ?? "",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (isEdit) {
      const result = await updateDonor(donor!.id, null, fd);
      setSaving(false);
      if (result?.error) setError(result.error);
    } else {
      const result = await createDonor(null, fd);
      setSaving(false);
      if (result?.error) setError(result.error);
    }
  }

  return (
    <main className="flex-1 p-6 lg:p-8 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={isEdit ? `/donors/${donor!.id}` : "/donors"} className="flex items-center gap-1.5 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <h1 className="text-xl font-semibold">{isEdit ? `Edit — ${donor!.name}` : "Add Donor"}</h1>
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
          <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Wanjiku" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+254 700 000 000" />
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
