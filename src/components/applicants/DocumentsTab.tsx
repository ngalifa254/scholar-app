"use client";

import { useRef, useState } from "react";
import {
  Upload,
  FileText,
  ExternalLink,
  Loader2,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  uploadApplicantDocument,
  addApplicantOtherDoc,
  removeApplicantOtherDoc,
} from "@/lib/actions";
import type { Applicant } from "@/types";

type DocType = "guardian_id" | "grade8_report" | "recommendation";

const FIXED_DOCS: { key: DocType; label: string; hint: string }[] = [
  { key: "guardian_id",    label: "Parent / Guardian ID",   hint: "National ID or passport" },
  { key: "grade8_report", label: "Grade 8 Report Card",    hint: "KCPE results or equivalent" },
  { key: "recommendation",label: "Recommendation Letter",  hint: "From teacher or community leader" },
];

function urlKey(docType: DocType, app: Applicant): string | undefined {
  if (docType === "guardian_id") return app.guardianIdUrl;
  if (docType === "grade8_report") return app.grade8ReportUrl;
  return app.recommendationUrl;
}

interface Props { applicant: Applicant }

export default function DocumentsTab({ applicant }: Props) {
  const [fixedUrls, setFixedUrls] = useState<Record<DocType, string | undefined>>({
    guardian_id:    applicant.guardianIdUrl,
    grade8_report:  applicant.grade8ReportUrl,
    recommendation: applicant.recommendationUrl,
  });
  const [otherDocs, setOtherDocs] = useState<Array<{ name: string; url: string }>>(
    applicant.otherDocs ?? []
  );
  const [uploadingFixed, setUploadingFixed] = useState<DocType | null>(null);
  const [fixedError, setFixedError] = useState<string | null>(null);

  const [otherLabel, setOtherLabel] = useState("");
  const [otherFile, setOtherFile] = useState<File | null>(null);
  const [addingOther, setAddingOther] = useState(false);
  const [otherError, setOtherError] = useState<string | null>(null);
  const [removingUrl, setRemovingUrl] = useState<string | null>(null);

  const fixedInputRef = useRef<HTMLInputElement>(null);
  const pendingDocType = useRef<DocType | null>(null);
  const otherFileInputRef = useRef<HTMLInputElement>(null);

  function triggerFixed(docType: DocType) {
    pendingDocType.current = docType;
    setFixedError(null);
    fixedInputRef.current?.click();
  }

  async function handleFixedFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const docType = pendingDocType.current;
    if (!file || !docType) return;
    e.target.value = "";

    setUploadingFixed(docType);
    setFixedError(null);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadApplicantDocument(applicant.id, docType, fd);
    setUploadingFixed(null);

    if (result.error) {
      setFixedError(result.error);
    } else if (result.url) {
      setFixedUrls((prev) => ({ ...prev, [docType]: result.url }));
    }
  }

  async function handleAddOther() {
    if (!otherFile || !otherLabel.trim()) return;
    setAddingOther(true);
    setOtherError(null);
    const fd = new FormData();
    fd.append("name", otherLabel.trim());
    fd.append("file", otherFile);
    const result = await addApplicantOtherDoc(applicant.id, fd);
    setAddingOther(false);

    if (result.error) {
      setOtherError(result.error);
    } else if (result.doc) {
      setOtherDocs((prev) => [...prev, result.doc!]);
      setOtherLabel("");
      setOtherFile(null);
      if (otherFileInputRef.current) otherFileInputRef.current.value = "";
    }
  }

  async function handleRemoveOther(url: string) {
    setRemovingUrl(url);
    await removeApplicantOtherDoc(applicant.id, url);
    setOtherDocs((prev) => prev.filter((d) => d.url !== url));
    setRemovingUrl(null);
  }

  return (
    <div className="space-y-4">
      {/* Fixed document slots */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FileText className="w-4 h-4" /> Required Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {fixedError && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-md mb-2">
              {fixedError}
            </p>
          )}
          {FIXED_DOCS.map(({ key, label, hint }) => {
            const url = fixedUrls[key];
            const isUploading = uploadingFixed === key;
            return (
              <div
                key={key}
                className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      url
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{label}</p>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary flex items-center gap-0.5 hover:underline"
                      >
                        View document <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-xs text-muted-foreground">{hint}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  onClick={() => triggerFixed(key)}
                  className="h-7 text-xs gap-1.5 shrink-0"
                >
                  {isUploading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Upload className="w-3 h-3" />
                  )}
                  {url ? "Replace" : "Upload"}
                </Button>
              </div>
            );
          })}
          <input
            ref={fixedInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleFixedFileChange}
          />
          <p className="text-[11px] text-muted-foreground pt-1">
            Accepted: PDF, JPG, PNG · Saved automatically on selection.
          </p>
        </CardContent>
      </Card>

      {/* Other documents */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FileText className="w-4 h-4" /> Other Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {otherDocs.length > 0 && (
            <>
              <div className="space-y-1">
                {otherDocs.map((doc) => (
                  <div
                    key={doc.url}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:text-primary transition-colors truncate flex items-center gap-1"
                      >
                        {doc.name} <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                      disabled={removingUrl === doc.url}
                      onClick={() => handleRemoveOther(doc.url)}
                    >
                      {removingUrl === doc.url ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
              <Separator />
            </>
          )}

          {otherError && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-md">
              {otherError}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Document name (e.g. Death Certificate)"
              value={otherLabel}
              onChange={(e) => setOtherLabel(e.target.value)}
              className="flex-1 h-8 text-sm"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 whitespace-nowrap"
                onClick={() => otherFileInputRef.current?.click()}
              >
                <Upload className="w-3 h-3" />
                {otherFile ? otherFile.name.slice(0, 18) + (otherFile.name.length > 18 ? "…" : "") : "Choose file"}
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5"
                disabled={!otherLabel.trim() || !otherFile || addingOther}
                onClick={handleAddOther}
              >
                {addingOther ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Plus className="w-3 h-3" />
                )}
                Add
              </Button>
            </div>
          </div>
          <input
            ref={otherFileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => setOtherFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-[11px] text-muted-foreground">
            Add any additional supporting documents (medical certificate, death certificate, etc.)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
