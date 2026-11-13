import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ApplicantStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStatusConfig(status: ApplicantStatus): {
  label: string;
  className: string;
  dot: string;
} {
  const configs: Record<ApplicantStatus, { label: string; className: string; dot: string }> = {
    selected: {
      label: "Selected",
      className: "bg-primary/10 text-primary border border-primary/20",
      dot: "bg-primary",
    },
    rejected: {
      label: "Rejected",
      className: "bg-rose-50 text-rose-800 border border-rose-200",
      dot: "bg-rose-500",
    },
    pending: {
      label: "Pending",
      className: "bg-amber-50 text-amber-700 border border-amber-200",
      dot: "bg-amber-500",
    },
    reviewed: {
      label: "Reviewed",
      className: "bg-muted text-muted-foreground border border-border",
      dot: "bg-stone-400",
    },
  };
  return configs[status] ?? {
    label: String(status),
    className: "bg-muted text-muted-foreground border border-border",
    dot: "bg-muted-foreground",
  };
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getScoreColor(score: number): string {
  void score;
  return "text-primary";
}

export function getScoreBarColor(score: number): string {
  void score;
  return "bg-primary";
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getRankMedal(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}
