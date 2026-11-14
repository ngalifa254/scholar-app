"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Loader2, RotateCcw, UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateScholarProgramStatus } from "@/lib/actions";
import type { Scholar, ScholarStatus } from "@/types";

interface Props {
  scholar: Scholar;
  compact?: boolean;
}

export default function ScholarProgramActions({ scholar, compact = false }: Props) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] = useState<ScholarStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const action = pendingStatus === "archived"
    ? { title: "Archive scholar", label: "Archive", icon: Archive }
    : pendingStatus === "withdrawn"
      ? { title: "Remove from program", label: "Remove from program", icon: UserRoundX }
      : { title: "Restore scholar", label: "Restore to active", icon: RotateCcw };

  async function confirmAction() {
    if (!pendingStatus) return;
    setSaving(true);
    setError(null);
    const result = await updateScholarProgramStatus(scholar.id, pendingStatus);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setPendingStatus(null);
    if (result.beneficiaryId) router.replace(`/past-beneficiaries/${result.beneficiaryId}`);
    else router.refresh();
  }

  const isRemoved = scholar.status === "withdrawn";
  const isArchived = scholar.status === "archived";

  return (
    <>
      <div className={`flex flex-wrap gap-2 ${compact ? "" : "items-center"}`}>
        {isRemoved || isArchived ? (
          <Button type="button" variant="outline" size={compact ? "sm" : "default"} onClick={() => setPendingStatus("active")} className="gap-1.5">
            <RotateCcw className="h-4 w-4" /> Restore to active
          </Button>
        ) : (
          <>
            <Button type="button" variant="outline" size={compact ? "sm" : "default"} onClick={() => setPendingStatus("archived")} className="gap-1.5">
              <Archive className="h-4 w-4" /> Archive
            </Button>
            <Button type="button" variant="outline" size={compact ? "sm" : "default"} onClick={() => setPendingStatus("withdrawn")} className="gap-1.5 text-destructive hover:text-destructive">
              <UserRoundX className="h-4 w-4" /> Remove from program
            </Button>
          </>
        )}
      </div>

      <Dialog open={!!pendingStatus} onOpenChange={(open) => { if (!open && !saving) { setPendingStatus(null); setError(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{action.title}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            {pendingStatus === "archived"
              ? `${scholar.firstName} ${scholar.lastName} will move to Past Beneficiaries with their documents and activity history.`
              : pendingStatus === "withdrawn"
                ? `${scholar.firstName} ${scholar.lastName} will be marked as removed from the program. Their record and documents will be kept.`
                : `${scholar.firstName} ${scholar.lastName} will return to the active Scholars list.`}
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={saving} onClick={() => setPendingStatus(null)}>Cancel</Button>
            <Button type="button" variant={pendingStatus === "withdrawn" ? "destructive" : "default"} disabled={saving} onClick={confirmAction} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <action.icon className="h-4 w-4" />}
              {saving ? "Saving…" : action.label}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
