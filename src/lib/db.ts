import { getStaffFirestore } from "./staff-firestore";
import type {
  Applicant,
  AppSettings,
  FormTemplate,
  ManagedFormFile,
  FormDocumentFolder,
  ScholarActivityEntry,
  ApplicantStatus,
  ChildStatus,
  AcademicMerit,
  CharacterLeadership,
  Scholar,
  ScholarStatus,
  PastBeneficiary,
  BeneficiaryStatus,
} from "@/types";

const DEFAULT_SETTINGS: AppSettings = {
  scholarshipYear: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
  appOpenDate: "",
  appCloseDate: "",
  selectionDeadline: "",
  intakeQuota: 10,
  orgName: "Wahome Foundation",
  orgTagline: "Inspire & Empower",
  orgEmail: "",
  orgPhone: "",
  scoringChildStatus: 40,
  scoringAcademic: 30,
  scoringCharacter: 20,
  scoringHardship: 10,
};

export async function getSettings(): Promise<AppSettings> {
  const db = await getStaffFirestore();
  const snapshot = await db.collection("settings").doc("1").get();
  const data = snapshot.data() ?? {};
  return {
    scholarshipYear: data.scholarship_year ?? DEFAULT_SETTINGS.scholarshipYear,
    appOpenDate: data.app_open_date ?? "",
    appCloseDate: data.app_close_date ?? "",
    selectionDeadline: data.selection_deadline ?? "",
    intakeQuota: data.intake_quota ?? 10,
    orgName: data.org_name ?? DEFAULT_SETTINGS.orgName,
    orgTagline: data.org_tagline ?? DEFAULT_SETTINGS.orgTagline,
    orgEmail: data.org_email ?? "",
    orgPhone: data.org_phone ?? "",
    scoringChildStatus: data.scoring_child_status ?? 40,
    scoringAcademic: data.scoring_academic ?? 30,
    scoringCharacter: data.scoring_character ?? 20,
    scoringHardship: data.scoring_hardship ?? 10,
  };
}

type ApplicantRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  nationality: string;
  institution: string;
  program: string;
  year_of_study: number;
  location: string;
  age: number;
  child_status: ChildStatus;
  academic_merit: AcademicMerit;
  character_leadership: CharacterLeadership;
  guardian_name: string;
  guardian_contact: string;
  hardship_chronically_ill: boolean;
  hardship_distance_to_school: boolean;
  hardship_heavy_chores: boolean;
  hardship_no_clean_water: boolean;
  notes: string;
  status: ApplicantStatus;
  total_score: number;
  applied_date: string;
  rank: number | null;
  profile_photo_url?: string | null;
  guardian_id_url?: string | null;
  grade8_report_url?: string | null;
  recommendation_url?: string | null;
  other_docs?: Array<{ name: string; url: string }> | null;
};

type FormTemplateRow = {
  id: string;
  name: string;
  description: string;
  fields: number;
  submissions: number;
  status: "active" | "draft" | "archived";
  category: string;
  created_at: string;
  last_modified: string;
};

function rowToApplicant(row: ApplicantRow): Applicant {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    dateOfBirth: row.date_of_birth,
    nationality: row.nationality,
    institution: row.institution,
    program: row.program,
    yearOfStudy: row.year_of_study,
    location: row.location ?? "",
    age: row.age ?? 0,
    childStatus: row.child_status,
    academicMerit: row.academic_merit,
    characterLeadership: row.character_leadership,
    guardianName: row.guardian_name ?? "",
    guardianContact: row.guardian_contact ?? "",
    hardshipChronicallyIll: row.hardship_chronically_ill ?? false,
    hardshipDistanceToSchool: row.hardship_distance_to_school ?? false,
    hardshipHeavyChores: row.hardship_heavy_chores ?? false,
    hardshipNoCleanWater: row.hardship_no_clean_water ?? false,
    notes: row.notes ?? "",
    status: row.status,
    totalScore: Number(row.total_score),
    appliedDate: row.applied_date,
    rank: row.rank ?? undefined,
    profilePhotoUrl: row.profile_photo_url ?? undefined,
    guardianIdUrl: row.guardian_id_url ?? undefined,
    grade8ReportUrl: row.grade8_report_url ?? undefined,
    recommendationUrl: row.recommendation_url ?? undefined,
    otherDocs: row.other_docs ?? [],
  };
}

export async function getApplicants(opts?: {
  status?: ApplicantStatus | "all";
  search?: string;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}): Promise<Applicant[]> {
  const db = await getStaffFirestore();
  const snapshot = await db.collection("applicants").get();
  const colMap: Record<string, string> = {
    firstName: "first_name",
    institution: "institution",
    totalScore: "total_score",
    appliedDate: "applied_date",
    status: "status",
  };
  const col = colMap[opts?.sortKey ?? "total_score"] ?? "total_score";
  const direction = opts?.sortDir === "asc" ? 1 : -1;
  let results = snapshot.docs
    .map((document) => rowToApplicant({ ...document.data(), id: document.id } as ApplicantRow))
    .filter((applicant) => !opts?.status || opts.status === "all" || applicant.status === opts.status)
    .sort((a, b) => {
      const first = a[col as keyof Applicant] as string | number;
      const second = b[col as keyof Applicant] as string | number;
      if (first === second) return 0;
      return (first < second ? -1 : 1) * direction;
    });

  if (opts?.search) {
    const q = opts.search.toLowerCase();
    results = results.filter(
      (a) =>
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
        a.institution.toLowerCase().includes(q) ||
        a.program.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q)
    );
  }
  return results;
}

export async function getApplicantById(id: string): Promise<Applicant | null> {
  const db = await getStaffFirestore();
  const document = await db.collection("applicants").doc(id).get();
  return document.exists
    ? rowToApplicant({ ...document.data(), id: document.id } as ApplicantRow)
    : null;
}

export async function getApplicantsRanked(): Promise<Applicant[]> {
  const db = await getStaffFirestore();
  const snapshot = await db.collection("applicants").get();
  return snapshot.docs
    .map((document) => rowToApplicant({ ...document.data(), id: document.id } as ApplicantRow))
    .filter((applicant) => applicant.rank != null)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
}

export async function getKpiData() {
  const db = await getStaffFirestore();
  const snapshot = await db.collection("applicants").get();
  type KpiRow = Pick<ApplicantRow, "status" | "total_score" | "applied_date">;
  const all = snapshot.docs.map((document) => document.data() as KpiRow);
  const latest = all.map((row) => row.applied_date ?? "").sort().at(-1) ?? "";
  const totalApplicants = all.length;

  return {
    totalApplicants,
    selected: all.filter((a) => a.status === "selected").length,
    pending: all.filter((a) => a.status === "pending").length,
    reviewed: all.filter((a) => a.status === "reviewed").length,
    rejected: all.filter((a) => a.status === "rejected").length,
    averageScore: totalApplicants
      ? all.reduce((s, a) => s + Number(a.total_score), 0) / totalApplicants
      : 0,
    lastApplicationDate: latest,
  };
}

// ─── Scholars ────────────────────────────────────────────────────────────────

type ScholarRow = {
  id: string;
  first_name: string;
  last_name: string;
  profile_photo_url?: string | null;
  school: string;
  grade: number;
  location: string;
  guardian_name: string;
  guardian_contact: string;
  year_joined: number;
  notes: string;
  status: ScholarStatus;
  created_at: string;
  source_applicant_id?: string | null;
  activity_log?: ScholarActivityEntry[] | null;
  guardian_id_url?: string | null;
  grade8_report_url?: string | null;
  recommendation_url?: string | null;
  other_docs?: Array<{ name: string; url: string }> | null;
  term1_report_url?: string | null;
  term2_report_url?: string | null;
  term3_report_url?: string | null;
};

function rowToScholar(row: ScholarRow): Scholar {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    profilePhotoUrl: row.profile_photo_url ?? undefined,
    school: row.school,
    grade: row.grade,
    location: row.location ?? "",
    guardianName: row.guardian_name ?? "",
    guardianContact: row.guardian_contact ?? "",
    yearJoined: row.year_joined ?? 0,
    notes: row.notes ?? "",
    status: row.status ?? "active",
    createdAt: row.created_at,
    sourceApplicantId: row.source_applicant_id ?? undefined,
    activityLog: row.activity_log ?? [],
    guardianIdUrl: row.guardian_id_url ?? undefined,
    grade8ReportUrl: row.grade8_report_url ?? undefined,
    recommendationUrl: row.recommendation_url ?? undefined,
    otherDocs: row.other_docs ?? [],
    term1ReportUrl: row.term1_report_url ?? undefined,
    term2ReportUrl: row.term2_report_url ?? undefined,
    term3ReportUrl: row.term3_report_url ?? undefined,
  };
}

export async function getScholars(opts?: { search?: string; status?: ScholarStatus | "all" }): Promise<Scholar[]> {
  const db = await getStaffFirestore();
  const snapshot = await db.collection("scholars").get();
  let results = snapshot.docs
    .map((document) => rowToScholar({ ...document.data(), id: document.id } as ScholarRow))
    .filter((scholar) => !opts?.status || opts.status === "all" || scholar.status === opts.status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (opts?.search) {
    const q = opts.search.toLowerCase();
    results = results.filter(
      (s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.school.toLowerCase().includes(q)
    );
  }
  return results;
}

export async function getScholarById(id: string): Promise<Scholar | null> {
  const db = await getStaffFirestore();
  const document = await db.collection("scholars").doc(id).get();
  return document.exists
    ? rowToScholar({ ...document.data(), id: document.id } as ScholarRow)
    : null;
}

// ─── Past Beneficiaries ───────────────────────────────────────────────────────

type PastBeneficiaryRow = {
  id: string;
  first_name: string;
  last_name: string;
  profile_photo_url?: string | null;
  high_school: string;
  year_graduated: number;
  current_status: BeneficiaryStatus;
  institution: string;
  field_of_study: string;
  location: string;
  notes: string;
  created_at: string;
  source_scholar_id?: string | null;
  grade_at_graduation?: number | null;
  year_joined?: number | null;
  guardian_name?: string | null;
  guardian_contact?: string | null;
  guardian_id_url?: string | null;
  grade8_report_url?: string | null;
  recommendation_url?: string | null;
  other_docs?: Array<{ name: string; url: string }> | null;
  term1_report_url?: string | null;
  term2_report_url?: string | null;
  term3_report_url?: string | null;
  activity_log?: ScholarActivityEntry[] | null;
};

function rowToBeneficiary(row: PastBeneficiaryRow): PastBeneficiary {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    profilePhotoUrl: row.profile_photo_url ?? undefined,
    highSchool: row.high_school,
    yearGraduated: row.year_graduated ?? 0,
    currentStatus: row.current_status ?? "university",
    institution: row.institution ?? "",
    fieldOfStudy: row.field_of_study ?? "",
    location: row.location ?? "",
    notes: row.notes ?? "",
    createdAt: row.created_at,
    sourceScholarId: row.source_scholar_id ?? undefined,
    gradeAtGraduation: row.grade_at_graduation ?? undefined,
    yearJoined: row.year_joined ?? undefined,
    guardianName: row.guardian_name ?? undefined,
    guardianContact: row.guardian_contact ?? undefined,
    guardianIdUrl: row.guardian_id_url ?? undefined,
    grade8ReportUrl: row.grade8_report_url ?? undefined,
    recommendationUrl: row.recommendation_url ?? undefined,
    otherDocs: row.other_docs ?? [],
    term1ReportUrl: row.term1_report_url ?? undefined,
    term2ReportUrl: row.term2_report_url ?? undefined,
    term3ReportUrl: row.term3_report_url ?? undefined,
    activityLog: row.activity_log ?? [],
  };
}

export async function getPastBeneficiaries(opts?: { search?: string; status?: BeneficiaryStatus | "all" }): Promise<PastBeneficiary[]> {
  const db = await getStaffFirestore();
  const snapshot = await db.collection("past_beneficiaries").get();
  let results = snapshot.docs
    .map((document) => rowToBeneficiary({ ...document.data(), id: document.id } as PastBeneficiaryRow))
    .filter((beneficiary) => !opts?.status || opts.status === "all" || beneficiary.currentStatus === opts.status)
    .sort((a, b) => b.yearGraduated - a.yearGraduated);
  if (opts?.search) {
    const q = opts.search.toLowerCase();
    results = results.filter(
      (b) => `${b.firstName} ${b.lastName}`.toLowerCase().includes(q) || b.highSchool.toLowerCase().includes(q) || b.institution.toLowerCase().includes(q)
    );
  }
  return results;
}

export async function getPastBeneficiaryById(id: string): Promise<PastBeneficiary | null> {
  const db = await getStaffFirestore();
  const document = await db.collection("past_beneficiaries").doc(id).get();
  return document.exists
    ? rowToBeneficiary({ ...document.data(), id: document.id } as PastBeneficiaryRow)
    : null;
}

// ─── Form Templates ───────────────────────────────────────────────────────────

export async function getFormTemplates(): Promise<FormTemplate[]> {
  const db = await getStaffFirestore();
  const snapshot = await db.collection("form_templates").get();
  return snapshot.docs
    .map((document) => ({ ...document.data(), id: document.id } as FormTemplateRow))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    fields: row.fields,
    submissions: row.submissions,
    status: row.status,
    category: (row.category ?? "other") as import("@/types").FormCategory,
    createdAt: row.created_at,
    lastModified: row.last_modified,
  }));
}

export async function getManagedFormFiles(): Promise<ManagedFormFile[]> {
  const db = await getStaffFirestore();
  const snapshot = await db.collection("form_documents").get();
  return snapshot.docs
    .map((document) => {
      const row = document.data();
      return {
        id: document.id,
        folder: row.folder as FormDocumentFolder,
        name: String(row.name ?? ""),
        fileName: String(row.file_name ?? ""),
        fileUrl: String(row.file_url ?? ""),
        storagePath: String(row.storage_path ?? ""),
        createdAt: String(row.created_at ?? ""),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
