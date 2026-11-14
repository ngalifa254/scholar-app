"use client";

import { useRef, useState } from "react";
import { Clock3, ExternalLink, FileText, Loader2, MessageSquareText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addScholarActivityNote, uploadScholarApplicationDocument } from "@/lib/actions";
import type { Scholar } from "@/types";

type DocType = "guardian_id" | "grade8_report" | "recommendation";

const DOCS: { key: DocType; label: string; hint: string }[] = [
  { key: "guardian_id", label: "Parent / Guardian ID", hint: "National ID or passport" },
  { key: "grade8_report", label: "Grade 8 Report Card", hint: "KCPE results or equivalent" },
  { key: "recommendation", label: "Recommendation Letter", hint: "From teacher or community leader" },
];

interface Props {
  scholar: Scholar;
}

export default function ScholarDocuments({ scholar }: Props) {
  const [urls, setUrls] = useState<Record<DocType, string | undefined>>({
    guardian_id: scholar.guardianIdUrl,
    grade8_report: scholar.grade8ReportUrl,
    recommendation: scholar.recommendationUrl,
  });
  const [uploading, setUploading] = useState<DocType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState(scholar.activityLog ?? []);
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingType = useRef<DocType | null>(null);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const type = pendingType.current;
    event.target.value = "";
    if (!file || !type) return;

    setUploading(type);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadScholarApplicationDocument(scholar.id, type, formData);
    setUploading(null);
    if (result.error) setError(result.error);
    else if (result.url) setUrls((previous) => ({ ...previous, [type]: result.url }));
  }

  function chooseFile(type: DocType) {
    pendingType.current = type;
    setError(null);
    inputRef.current?.click();
  }

  async function saveNote() {
    if (!subject.trim() || !note.trim()) return;
    setSavingNote(true);
    setNoteError(null);
    const result = await addScholarActivityNote(scholar.id, subject, note);
    setSavingNote(false);
    if (result.error) setNoteError(result.error);
    else if (result.entry) {
      setActivityLog((previous) => [...previous, result.entry!]);
      setSubject("");
      setNote("");
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock3 className="h-4 w-4" /> Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            maxLength={100}
            placeholder="Activity subject"
            aria-label="Activity subject"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Add a short note about this scholar…"
              className="min-h-20 flex-1 resize-y rounded-sm border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Activity note"
            />
            <Button type="button" onClick={saveNote} disabled={savingNote || !subject.trim() || !note.trim()} className="shrink-0 gap-1.5">
              {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareText className="h-4 w-4" />}
              Add activity
            </Button>
          </div>
          <div className="flex justify-end text-[11px] text-muted-foreground">{note.length}/500 characters</div>
          {noteError && <p className="text-xs text-destructive">{noteError}</p>}
          {activityLog.length === 0 ? (
            <p className="border-t border-border pt-3 text-xs text-muted-foreground">No activity notes yet.</p>
          ) : (
            <ol className="divide-y divide-border border-t border-border">
              {[...activityLog].reverse().map((entry, index) => (
                <li key={`${entry.createdAt}-${index}`} className="py-3">
                  <details>
                    <summary className="cursor-pointer list-inside text-sm font-medium hover:text-primary">
                      {entry.subject || "Activity note"}
                    </summary>
                    <div className="ml-5 mt-2 border-l-2 border-primary/20 pl-3">
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">{entry.note}</p>
                      <time dateTime={entry.createdAt} className="mt-1 block text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString()}
                      </time>
                    </div>
                  </details>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FileText className="h-4 w-4" /> Application Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {error && <p className="mb-2 rounded-sm bg-destructive/10 px-3 py-1.5 text-xs text-destructive">{error}</p>}
          {DOCS.map(({ key, label, hint }) => {
            const url = urls[key];
            const isUploading = uploading === key;
            return (
              <div key={key} className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${url ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{label}</p>
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-xs text-primary hover:underline">
                        View document <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="text-xs text-muted-foreground">{hint}</p>
                    )}
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" disabled={!!uploading} onClick={() => chooseFile(key)} className="h-7 shrink-0 gap-1.5 text-xs">
                  {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  {url ? "Replace" : "Upload"}
                </Button>
              </div>
            );
          })}
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleUpload} />
          <p className="pt-1 text-[11px] text-muted-foreground">Accepted: PDF, JPG, PNG. Files save automatically.</p>
        </CardContent>
      </Card>

    </div>
  );
}
