import type { Applicant } from "@/types";

export const CHILD_STATUS_LABELS: Record<string, string> = {
  double_orphan: "Double Orphan",
  single_orphan: "Single Orphan",
  child_of_disabled: "Child of Disabled Parent",
  guardian_only: "Raised by Guardian",
  both_parents: "Both Parents Present",
};

export const ACADEMIC_LABELS: Record<string, string> = {
  ee: "Exceeds Expectation (EE)",
  me: "Meets Expectation (ME)",
  ae: "Approaches Expectation (AE)",
  be: "Below Expectation (BE)",
};

export const CHARACTER_LABELS: Record<string, string> = {
  excellent: "Excellent",
  good: "Good",
  average: "Average",
  below_average: "Below Average",
};

export const RECOMMENDATION_LABELS: Record<string, string> = {
  strongly_recommend: "Strongly Recommend",
  recommend: "Recommend",
  neutral: "Neutral",
  not_recommend: "Do Not Recommend",
};

export const CHILD_STATUS_SCORES: Record<string, number> = {
  double_orphan: 100,
  single_orphan: 75,
  child_of_disabled: 60,
  guardian_only: 50,
  both_parents: 30,
};

export const ACADEMIC_SCORES: Record<string, number> = {
  ee: 100,
  me: 70,
  ae: 45,
  be: 20,
};

export const CHARACTER_SCORES: Record<string, number> = {
  excellent: 100,
  good: 75,
  average: 50,
  below_average: 25,
};

type ScoringInput = Pick<
  Applicant,
  | "childStatus"
  | "academicMerit"
  | "characterLeadership"
  | "hardshipChronicallyIll"
  | "hardshipDistanceToSchool"
  | "hardshipHeavyChores"
  | "hardshipNoCleanWater"
>;

export function computeScore(applicant: ScoringInput): number {
  const childScore = CHILD_STATUS_SCORES[applicant.childStatus] ?? 0;
  const academicScore = ACADEMIC_SCORES[applicant.academicMerit] ?? 0;
  const characterScore = CHARACTER_SCORES[applicant.characterLeadership] ?? 0;
  const hardshipCount = [
    applicant.hardshipChronicallyIll,
    applicant.hardshipDistanceToSchool,
    applicant.hardshipHeavyChores,
    applicant.hardshipNoCleanWater,
  ].filter(Boolean).length;
  const hardshipScore = Math.min(100, hardshipCount * 25);

  return Math.round(
    childScore * 0.4 +
    academicScore * 0.3 +
    characterScore * 0.2 +
    hardshipScore * 0.1
  );
}
