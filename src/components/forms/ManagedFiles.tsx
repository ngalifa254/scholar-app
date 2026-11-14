"use client";

import { useRef, useState } from "react";
import { ExternalLink, FileText, Loader2, Pencil, Save, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteManagedFormFile, renameManagedFormFile, uploadManagedFormFile } from "@/lib/actions";
import type { FormDocumentFolder, ManagedFormFile } from "@/types";

interface Props {
  folder: FormDocumentFolder;
  initialFiles: ManagedFormFile[];
  search?: string;
}

export default function ManagedFiles({ folder, initialFiles, search = "" }: Props) {
  const [files, setFiles] = useState(initialFiles);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newName, setNewName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const query = search.trim().toLowerCase();
  const visibleFiles = files.filter((file) => !query || `${file.name} ${file.fileName}`.toLowerCase().includes(query));

  async function uploadFile() {
    if (!selectedFile || !newName.trim()) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", selectedFile);
    const result = await uploadManagedFormFile(folder, newName, formData);
    setUploading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.file) setFiles((previous) => [result.file!, ...previous]);
    setSelectedFile(null);
    setNewName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function saveRename(id: string) {
    setBusyId(id);
    setError(null);
    const result = await renameManagedFormFile(id, renameValue);
    setBusyId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setFiles((previous) => previous.map((file) => file.id === id ? { ...file, name: result.name! } : file));
    setRenamingId(null);
  }

  async function deleteFile(id: string) {
    setBusyId(id);
    setError(null);
    const result = await deleteManagedFormFile(id);
    setBusyId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setFiles((previous) => previous.filter((file) => file.id !== id));
    setConfirmDeleteId(null);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <FileText className="h-4 w-4" /> Files
          <span className="ml-auto text-xs font-normal">{visibleFiles.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="rounded-sm bg-destructive/10 px-3 py-1.5 text-xs text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="File name" className="h-9 min-w-40 flex-1" />
          <input ref={fileInputRef} type="file" className="hidden" onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setSelectedFile(file);
            if (file && !newName.trim()) setNewName(file.name.replace(/\.[^.]+$/, ""));
          }} />
          <Button type="button" variant="outline" size="sm" className="h-9 max-w-56 gap-1.5" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{selectedFile?.name ?? "Choose file"}</span>
          </Button>
          <Button type="button" size="sm" className="h-9 gap-1.5" disabled={uploading || !selectedFile || !newName.trim()} onClick={uploadFile}>
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Upload
          </Button>
        </div>

        {visibleFiles.length === 0 ? (
          <p className="border-t border-border pt-3 text-xs text-muted-foreground">No uploaded files in this folder yet.</p>
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {visibleFiles.map((file) => (
              <li key={file.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {renamingId === file.id ? (
                    <div className="flex min-w-48 flex-1 gap-2">
                      <Input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} className="h-8" aria-label="New file name" />
                      <Button type="button" size="icon" className="h-8 w-8 shrink-0" disabled={busyId === file.id || !renameValue.trim()} onClick={() => saveRename(file.id)} aria-label="Save file name">
                        {busyId === file.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setRenamingId(null)} aria-label="Cancel rename">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="flex min-w-48 flex-1 items-center gap-2 hover:text-primary">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{file.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{file.fileName}</span>
                      </span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  )}

                  {renamingId !== file.id && (
                    <div className="flex items-center gap-1">
                      {confirmDeleteId === file.id ? (
                        <>
                          <span className="mr-1 text-xs text-muted-foreground">Delete file?</span>
                          <Button type="button" variant="destructive" size="sm" className="h-7" disabled={busyId === file.id} onClick={() => deleteFile(file.id)}>
                            {busyId === file.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Delete"}
                          </Button>
                          <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                        </>
                      ) : (
                        <>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setRenameValue(file.name); setRenamingId(file.id); }} aria-label={`Rename ${file.name}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setConfirmDeleteId(file.id)} aria-label={`Delete ${file.name}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
