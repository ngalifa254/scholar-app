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
      className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      dot: "bg-emerald-500",
    },
    rejected: {
      label: "Rejected",
      className: "bg-red-50 text-red-700 border border-red-200",
      dot: "bg-red-500",
    },
    pending: {
      label: "Pending",
      className: "bg-amber-50 text-amber-700 border border-amber-200",
      dot: "bg-amber-500",
    },
    reviewed: {
      label: "Reviewed",
      className: "bg-blue-50 text-blue-700 border border-blue-200",
      dot: "bg-blue-500",
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
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-amber-600";
  return "text-red-600";
}

export function getScoreBarColor(score: number): string {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-amber-500";
  return "bg-red-400";
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
