"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStaffFirestore } from "./staff-firestore";
import { privateFileUrl, uploadStaffFile, deleteStaffFile } from "./staff-storage";
import { computeScore } from "./scoring";
import type { ApplicantStatus, AppSettings, ChildStatus, AcademicMerit, CharacterLeadership, ScholarStatus, BeneficiaryStatus } from "@/types";

async function uploadProfilePhoto(file: File): Promise<string | null> {
  const path = await uploadStaffFile(file, "photos");
  return privateFileUrl(path);
}

function parseApplicantFormData(fd: FormData) {
  const childStatus = String(fd.get("childStatus") ?? "") as ChildStatus;
  const academicMerit = String(fd.get("academicMerit") ?? "") as AcademicMerit;
  const characterLeadership = String(fd.get("characterLeadership") ?? "") as CharacterLeadership;
  const hardshipChronicallyIll = fd.get("hardshipChronicallyIll") === "true";
  const hardshipDistanceToSchool = fd.get("hardshipDistanceToSchool") === "true";
  const hardshipHeavyChores = fd.get("hardshipHeavyChores") === "true";
  const hardshipNoCleanWater = fd.get("hardshipNoCleanWater") === "true";

  const totalScore = computeScore({
    childStatus,
    academicMerit,
    characterLeadership,
    hardshipChronicallyIll,
    hardshipDistanceToSchool,
    hardshipHeavyChores,
    hardshipNoCleanWater,
  });

  return {
    first_name: String(fd.get("firstName")),
    last_name: String(fd.get("lastName")),
    email: String(fd.get("email")),
    date_of_birth: String(fd.get("dateOfBirth")),
    nationality: String(fd.get("nationality")),
    institution: String(fd.get("institution")),
    program: String(fd.get("program")),
    year_of_study: Number(fd.get("yearOfStudy") ?? 9),
    location: String(fd.get("location") ?? ""),
    age: Number(fd.get("age") ?? 0),
    child_status: childStatus,
    academic_merit: academicMerit,
    character_leadership: characterLeadership,
    guardian_name: String(fd.get("guardianName") ?? ""),
    guardian_contact: String(fd.get("guardianContact") ?? ""),
    hardship_chronically_ill: hardshipChronicallyIll,
    hardship_distance_to_school: hardshipDistanceToSchool,
    hardship_heavy_chores: hardshipHeavyChores,
    hardship_no_clean_water: hardshipNoCleanWater,
    notes: String(fd.get("notes") ?? ""),
    status: String(fd.get("status") ?? "pending") as ApplicantStatus,
    total_score: totalScore,
  };
}

export async function createApplicant(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const db = await getStaffFirestore();
  const payload = parseApplicantFormData(formData);

  const photoFile = formData.get("profilePhoto") as File | null;
  let profilePhotoUrl: string | null = null;
  if (photoFile && photoFile.size > 0) {
    profilePhotoUrl = await uploadProfilePhoto(photoFile);
  }

  const ref = db.collection("applicants").doc();
  await ref.set({
    ...payload,
    profile_photo_url: profilePhotoUrl,
    applied_date: new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString(),
  });

  revalidatePath("/applicants");
  revalidatePath("/");
  redirect("/applicants");
}

export async function updateApplicant(
  id: string,
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const db = await getStaffFirestore();
  const payload = parseApplicantFormData(formData);

  const photoFile = formData.get("profilePhoto") as File | null;
  let profilePhotoUrl: string | null =
    (formData.get("existingPhotoUrl") as string | null) || null;
  if (photoFile && photoFile.size > 0) {
    const uploaded = await uploadProfilePhoto(photoFile);
    if (uploaded) profilePhotoUrl = uploaded;
  }

  await db.collection("applicants").doc(id).update({ ...payload, profile_photo_url: profilePhotoUrl });

  revalidatePath("/applicants");
  revalidatePath(`/applicants/${id}`);
  revalidatePath("/");
  redirect(`/applicants/${id}`);
}

export async function deleteApplicant(
  id: string
): Promise<{ error?: string }> {
  const db = await getStaffFirestore();
  await db.collection("applicants").doc(id).delete();

  revalidatePath("/applicants");
  revalidatePath("/");
  return {};
}

export async function updateApplicantStatus(
  id: string,
  status: ApplicantStatus
): Promise<{ error?: string }> {
  const db = await getStaffFirestore();
  await db.collection("applicants").doc(id).update({ status });
  revalidatePath("/applicants");
  revalidatePath(`/applicants/${id}`);
  revalidatePath("/");
  return {};
}

// ─── Applicant Documents ─────────────────────────────────────────────────────

type ApplicantDocType = "guardian_id" | "grade8_report" | "recommendation";

const DOC_TYPE_COL: Record<ApplicantDocType, string> = {
  guardian_id: "guardian_id_url",
  grade8_report: "grade8_report_url",
  recommendation: "recommendation_url",
};

function filePathFromPrivateUrl(url: string) {
  try {
    return new URL(url, "http://localhost").searchParams.get("path") ?? "";
  } catch {
    return "";
  }
}

export async function uploadApplicantDocument(
  applicantId: string,
  docType: ApplicantDocType,
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "No file provided" };

  const path = await uploadStaffFile(file, "docs");
  const url = privateFileUrl(path);
  const col = DOC_TYPE_COL[docType];
  const db = await getStaffFirestore();
  const applicantRef = db.collection("applicants").doc(applicantId);
  const existing = await applicantRef.get();
  if (!existing.exists) return { error: "Applicant not found." };
  const oldUrl = String(existing.get(col) ?? "");
  await applicantRef.update({ [col]: url });
  const oldPath = filePathFromPrivateUrl(oldUrl);
  if (oldPath) await deleteStaffFile(oldPath);

  revalidatePath(`/applicants/${applicantId}`);
  return { url };
}

export async function addApplicantOtherDoc(
  applicantId: string,
  formData: FormData
): Promise<{ doc?: { name: string; url: string }; error?: string }> {
  const file = formData.get("file") as File | null;
  const name = String(formData.get("name") ?? "").trim();
  if (!file || file.size === 0) return { error: "No file provided" };
  if (!name) return { error: "Document name is required" };

  const path = await uploadStaffFile(file, "docs");
  const url = privateFileUrl(path);
  const db = await getStaffFirestore();
  const ref = db.collection("applicants").doc(applicantId);
  const snapshot = await ref.get();
  if (!snapshot.exists) return { error: "Applicant not found." };
  const existing = (snapshot.get("other_docs") as Array<{ name: string; url: string }> | null) ?? [];
  await ref.update({ other_docs: [...existing, { name, url }] });

  revalidatePath(`/applicants/${applicantId}`);
  return { doc: { name, url } };
}

export async function removeApplicantOtherDoc(
  applicantId: string,
  url: string
): Promise<{ error?: string }> {
  const db = await getStaffFirestore();
  const ref = db.collection("applicants").doc(applicantId);
  const snapshot = await ref.get();
  if (!snapshot.exists) return { error: "Applicant not found." };
  const existing = (snapshot.get("other_docs") as Array<{ name: string; url: string }> | null) ?? [];
  await ref.update({ other_docs: existing.filter((document) => document.url !== url) });
  const path = filePathFromPrivateUrl(url);
  if (path) await deleteStaffFile(path);

  revalidatePath(`/applicants/${applicantId}`);
  return {};
}

// ─── Scholars ────────────────────────────────────────────────────────────────

function parseScholarFormData(fd: FormData) {
  return {
    first_name: String(fd.get("firstName") ?? ""),
    last_name: String(fd.get("lastName") ?? ""),
    school: String(fd.get("school") ?? ""),
    grade: Number(fd.get("grade") ?? 10),
    location: String(fd.get("location") ?? ""),
    guardian_name: String(fd.get("guardianName") ?? ""),
    guardian_contact: String(fd.get("guardianContact") ?? ""),
    year_joined: Number(fd.get("yearJoined") ?? new Date().getFullYear()),
    notes: String(fd.get("notes") ?? ""),
    status: String(fd.get("status") ?? "active") as ScholarStatus,
  };
}

export async function createScholar(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const db = await getStaffFirestore();
  const payload = parseScholarFormData(formData);
  const photoFile = formData.get("profilePhoto") as File | null;
  let profile_photo_url: string | null = null;
  if (photoFile && photoFile.size > 0) profile_photo_url = await uploadProfilePhoto(photoFile);
  const ref = db.collection("scholars").doc();
  await ref.set({ ...payload, profile_photo_url, created_at: new Date().toISOString() });
  revalidatePath("/scholars");
  redirect("/scholars");
}

export async function updateScholar(
  id: string,
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const db = await getStaffFirestore();
  const payload = parseScholarFormData(formData);
  const photoFile = formData.get("profilePhoto") as File | null;
  let profile_photo_url: string | null = (formData.get("existingPhotoUrl") as string | null) || null;
  if (photoFile && photoFile.size > 0) {
    const uploaded = await uploadProfilePhoto(photoFile);
    if (uploaded) profile_photo_url = uploaded;
  }
  await db.collection("scholars").doc(id).update({ ...payload, profile_photo_url });
  revalidatePath("/scholars");
  revalidatePath(`/scholars/${id}`);
  redirect(`/scholars/${id}`);
}

export async function deleteScholar(id: string): Promise<{ error?: string }> {
  const db = await getStaffFirestore();
  await db.collection("scholars").doc(id).delete();
  revalidatePath("/scholars");
  return {};
}

export async function uploadScholarReportCard(
  scholarId: string,
  term: 1 | 2 | 3,
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "No file provided" };

  const path = await uploadStaffFile(file, "reports");
  const url = privateFileUrl(path);
  const db = await getStaffFirestore();
  const col = `term${term}_report_url`;
  await db.collection("scholars").doc(scholarId).update({ [col]: url });

  revalidatePath(`/scholars/${scholarId}`);
  revalidatePath("/forms");
  return { url };
}

// ─── Past Beneficiaries ───────────────────────────────────────────────────────

function parseBeneficiaryFormData(fd: FormData) {
  return {
    first_name: String(fd.get("firstName") ?? ""),
    last_name: String(fd.get("lastName") ?? ""),
    high_school: String(fd.get("highSchool") ?? ""),
    year_graduated: Number(fd.get("yearGraduated") ?? 0),
    current_status: String(fd.get("currentStatus") ?? "university") as BeneficiaryStatus,
    institution: String(fd.get("institution") ?? ""),
    field_of_study: String(fd.get("fieldOfStudy") ?? ""),
    location: String(fd.get("location") ?? ""),
    notes: String(fd.get("notes") ?? ""),
  };
}

export async function createPastBeneficiary(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const db = await getStaffFirestore();
  const payload = parseBeneficiaryFormData(formData);
  const photoFile = formData.get("profilePhoto") as File | null;
  let profile_photo_url: string | null = null;
  if (photoFile && photoFile.size > 0) profile_photo_url = await uploadProfilePhoto(photoFile);
  const ref = db.collection("past_beneficiaries").doc();
  await ref.set({ ...payload, profile_photo_url, created_at: new Date().toISOString() });
  revalidatePath("/past-beneficiaries");
  redirect("/past-beneficiaries");
}

export async function updatePastBeneficiary(
  id: string,
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const db = await getStaffFirestore();
  const payload = parseBeneficiaryFormData(formData);
  const photoFile = formData.get("profilePhoto") as File | null;
  let profile_photo_url: string | null = (formData.get("existingPhotoUrl") as string | null) || null;
  if (photoFile && photoFile.size > 0) {
    const uploaded = await uploadProfilePhoto(photoFile);
    if (uploaded) profile_photo_url = uploaded;
  }
  await db.collection("past_beneficiaries").doc(id).update({ ...payload, profile_photo_url });
  revalidatePath("/past-beneficiaries");
  revalidatePath(`/past-beneficiaries/${id}`);
  redirect(`/past-beneficiaries/${id}`);
}

export async function deletePastBeneficiary(id: string): Promise<{ error?: string }> {
  const db = await getStaffFirestore();
  await db.collection("past_beneficiaries").doc(id).delete();
  revalidatePath("/past-beneficiaries");
  return {};
}

// ─── Form Templates ───────────────────────────────────────────────────────────

export async function deleteFormTemplate(
  id: string
): Promise<{ error?: string }> {
  const db = await getStaffFirestore();
  await db.collection("form_templates").doc(id).delete();

  revalidatePath("/forms");
  return {};
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function saveSettings(
  settings: AppSettings
): Promise<{ error?: string }> {
  const db = await getStaffFirestore();
  const payload = {
    scholarship_year: settings.scholarshipYear,
    app_open_date: settings.appOpenDate || null,
    app_close_date: settings.appCloseDate || null,
    selection_deadline: settings.selectionDeadline || null,
    intake_quota: settings.intakeQuota,
    org_name: settings.orgName,
    org_tagline: settings.orgTagline,
    org_email: settings.orgEmail,
    org_phone: settings.orgPhone,
    scoring_child_status: settings.scoringChildStatus,
    scoring_academic: settings.scoringAcademic,
    scoring_character: settings.scoringCharacter,
    scoring_hardship: settings.scoringHardship,
  };
  await db.collection("settings").doc("1").set(payload, { merge: true });
  revalidatePath("/settings");
  revalidatePath("/");
  return {};
}

export async function recomputeAllScores(
  weights: Pick<AppSettings, "scoringChildStatus" | "scoringAcademic" | "scoringCharacter" | "scoringHardship">
): Promise<{ updated: number; error?: string }> {
  const db = await getStaffFirestore();
  const snapshot = await db.collection("applicants").get();

  type Row = {
    id: string;
    child_status: string;
    academic_merit: string;
    character_leadership: string;
    hardship_chronically_ill: boolean;
    hardship_distance_to_school: boolean;
    hardship_heavy_chores: boolean;
    hardship_no_clean_water: boolean;
  };

  const { CHILD_STATUS_SCORES, ACADEMIC_SCORES, CHARACTER_SCORES } = await import("./scoring");

  const updates = snapshot.docs.map((document) => {
    const row = { ...document.data(), id: document.id } as Row;
    const hardshipCount = [
      row.hardship_chronically_ill,
      row.hardship_distance_to_school,
      row.hardship_heavy_chores,
      row.hardship_no_clean_water,
    ].filter(Boolean).length;
    const hardshipScore = Math.min(100, hardshipCount * 25);
    const total_score = Math.round(
      (CHILD_STATUS_SCORES[row.child_status] ?? 0) * (weights.scoringChildStatus / 100) +
      (ACADEMIC_SCORES[row.academic_merit] ?? 0) * (weights.scoringAcademic / 100) +
      (CHARACTER_SCORES[row.character_leadership] ?? 0) * (weights.scoringCharacter / 100) +
      hardshipScore * (weights.scoringHardship / 100)
    );
    return { id: row.id, total_score };
  });

  let updated = 0;
  for (let index = 0; index < updates.length; index += 450) {
    const batch = db.batch();
    for (const update of updates.slice(index, index + 450)) {
      batch.update(db.collection("applicants").doc(update.id), { total_score: update.total_score });
    }
    await batch.commit();
    updated += Math.min(450, updates.length - index);
  }

  revalidatePath("/applicants");
  revalidatePath("/");
  return { updated };
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

export async function exportApplicantsCSV(): Promise<{ csv?: string; error?: string }> {
  const db = await getStaffFirestore();
  const snapshot = await db.collection("applicants").get();
  const data = snapshot.docs
    .map((document) => document.data())
    .sort((a, b) => Number(b.total_score ?? 0) - Number(a.total_score ?? 0));

  const header = "Name,Email,Institution,Grade,Location,Status,Score,Applied Date,Rank";
  const rows = data.map((r) =>
    [
      `"${r.first_name} ${r.last_name}"`,
      r.email ?? "",
      `"${r.institution ?? ""}"`,
      r.year_of_study ?? "",
      `"${r.location ?? ""}"`,
      r.status ?? "",
      r.total_score ?? "",
      r.applied_date ?? "",
      r.rank ?? "",
    ].join(",")
  );
  return { csv: [header, ...rows].join("\n") };
}

export async function exportScholarsCSV(): Promise<{ csv?: string; error?: string }> {
  const db = await getStaffFirestore();
  const snapshot = await db.collection("scholars").get();
  const data = snapshot.docs
    .map((document) => document.data())
    .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));

  const header = "Name,School,Grade,Location,Status,Year Joined";
  const rows = data.map((r) =>
    [
      `"${r.first_name} ${r.last_name}"`,
      `"${r.school ?? ""}"`,
      r.grade ?? "",
      `"${r.location ?? ""}"`,
      r.status ?? "",
      r.year_joined ?? "",
    ].join(",")
  );
  return { csv: [header, ...rows].join("\n") };
}

export async function exportBeneficiariesCSV(): Promise<{ csv?: string; error?: string }> {
  const db = await getStaffFirestore();
  const snapshot = await db.collection("past_beneficiaries").get();
  const data = snapshot.docs
    .map((document) => document.data())
    .sort((a, b) => Number(b.year_graduated ?? 0) - Number(a.year_graduated ?? 0));

  const header = "Name,High School,Year Graduated,Status,Institution,Field of Study,Location";
  const rows = data.map((r) =>
    [
      `"${r.first_name} ${r.last_name}"`,
      `"${r.high_school ?? ""}"`,
      r.year_graduated ?? "",
      r.current_status ?? "",
      `"${r.institution ?? ""}"`,
      `"${r.field_of_study ?? ""}"`,
      `"${r.location ?? ""}"`,
    ].join(",")
  );
  return { csv: [header, ...rows].join("\n") };
}
