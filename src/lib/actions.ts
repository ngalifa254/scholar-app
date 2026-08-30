"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, createSupabaseAdminClient } from "./supabase";
import { computeScore } from "./scoring";
import type { ApplicantStatus, AppSettings, ChildStatus, AcademicMerit, CharacterLeadership, ScholarStatus, BeneficiaryStatus } from "@/types";

async function uploadProfilePhoto(file: File): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("applicant-photos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    console.error("Photo upload failed:", error.message);
    return null;
  }
  return supabase.storage.from("applicant-photos").getPublicUrl(path).data.publicUrl;
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
  const supabase = await createSupabaseServerClient();
  const payload = parseApplicantFormData(formData);

  const photoFile = formData.get("profilePhoto") as File | null;
  let profilePhotoUrl: string | null = null;
  if (photoFile && photoFile.size > 0) {
    profilePhotoUrl = await uploadProfilePhoto(photoFile);
  }

  const { error } = await supabase
    .from("applicants")
    .insert({ ...payload, profile_photo_url: profilePhotoUrl });
  if (error) return { error: error.message };

  revalidatePath("/applicants");
  revalidatePath("/");
  redirect("/applicants");
}

export async function updateApplicant(
  id: string,
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const payload = parseApplicantFormData(formData);

  const photoFile = formData.get("profilePhoto") as File | null;
  let profilePhotoUrl: string | null =
    (formData.get("existingPhotoUrl") as string | null) || null;
  if (photoFile && photoFile.size > 0) {
    const uploaded = await uploadProfilePhoto(photoFile);
    if (uploaded) profilePhotoUrl = uploaded;
  }

  const { error } = await supabase
    .from("applicants")
    .update({ ...payload, profile_photo_url: profilePhotoUrl })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/applicants");
  revalidatePath(`/applicants/${id}`);
  revalidatePath("/");
  redirect(`/applicants/${id}`);
}

export async function deleteApplicant(
  id: string
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("applicants").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/applicants");
  revalidatePath("/");
  return {};
}

export async function updateApplicantStatus(
  id: string,
  status: ApplicantStatus
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("applicants")
    .update({ status })
    .eq("id", id);
  if (error) return { error: error.message };
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

export async function uploadApplicantDocument(
  applicantId: string,
  docType: ApplicantDocType,
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "No file provided" };

  const adminClient = createSupabaseAdminClient();
  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `docs/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await adminClient.storage
    .from("applicant-photos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: uploadError.message };

  const url = adminClient.storage.from("applicant-photos").getPublicUrl(path).data.publicUrl;

  const col = DOC_TYPE_COL[docType];
  const supabase = await createSupabaseServerClient();
  const { error: dbError } = await supabase
    .from("applicants")
    .update({ [col]: url })
    .eq("id", applicantId);
  if (dbError) return { error: dbError.message };

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

  const adminClient = createSupabaseAdminClient();
  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `docs/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await adminClient.storage
    .from("applicant-photos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: uploadError.message };

  const url = adminClient.storage.from("applicant-photos").getPublicUrl(path).data.publicUrl;

  const supabase = await createSupabaseServerClient();
  const { data: row, error: fetchError } = await supabase
    .from("applicants")
    .select("other_docs")
    .eq("id", applicantId)
    .single();
  if (fetchError) return { error: fetchError.message };

  const existing: Array<{ name: string; url: string }> = (row as { other_docs: Array<{ name: string; url: string }> | null }).other_docs ?? [];
  const updated = [...existing, { name, url }];

  const { error: dbError } = await supabase
    .from("applicants")
    .update({ other_docs: updated })
    .eq("id", applicantId);
  if (dbError) return { error: dbError.message };

  revalidatePath(`/applicants/${applicantId}`);
  return { doc: { name, url } };
}

export async function removeApplicantOtherDoc(
  applicantId: string,
  url: string
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: row, error: fetchError } = await supabase
    .from("applicants")
    .select("other_docs")
    .eq("id", applicantId)
    .single();
  if (fetchError) return { error: fetchError.message };

  const existing: Array<{ name: string; url: string }> = (row as { other_docs: Array<{ name: string; url: string }> | null }).other_docs ?? [];
  const updated = existing.filter((d) => d.url !== url);

  const { error: dbError } = await supabase
    .from("applicants")
    .update({ other_docs: updated })
    .eq("id", applicantId);
  if (dbError) return { error: dbError.message };

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
    thank_you_note: String(fd.get("thankYouNote") ?? ""),
    career_aspiration: String(fd.get("careerAspiration") ?? ""),
    featured: fd.get("featured") === "true",
    status: String(fd.get("status") ?? "active") as ScholarStatus,
  };
}

export async function createScholar(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const payload = parseScholarFormData(formData);
  const photoFile = formData.get("profilePhoto") as File | null;
  let profile_photo_url: string | null = null;
  if (photoFile && photoFile.size > 0) profile_photo_url = await uploadProfilePhoto(photoFile);
  const { error } = await supabase.from("scholars").insert({ ...payload, profile_photo_url });
  if (error) return { error: error.message };
  revalidatePath("/scholars");
  redirect("/scholars");
}

export async function updateScholar(
  id: string,
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const payload = parseScholarFormData(formData);
  const photoFile = formData.get("profilePhoto") as File | null;
  let profile_photo_url: string | null = (formData.get("existingPhotoUrl") as string | null) || null;
  if (photoFile && photoFile.size > 0) {
    const uploaded = await uploadProfilePhoto(photoFile);
    if (uploaded) profile_photo_url = uploaded;
  }
  const { error } = await supabase.from("scholars").update({ ...payload, profile_photo_url }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/scholars");
  revalidatePath(`/scholars/${id}`);
  redirect(`/scholars/${id}`);
}

export async function deleteScholar(id: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("scholars").delete().eq("id", id);
  if (error) return { error: error.message };
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

  const adminClient = createSupabaseAdminClient();
  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `reports/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await adminClient.storage
    .from("applicant-photos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: uploadError.message };

  const url = adminClient.storage.from("applicant-photos").getPublicUrl(path).data.publicUrl;

  const supabase = await createSupabaseServerClient();
  const col = `term${term}_report_url`;
  const { error: dbError } = await supabase
    .from("scholars")
    .update({ [col]: url })
    .eq("id", scholarId);
  if (dbError) return { error: dbError.message };

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
  const supabase = await createSupabaseServerClient();
  const payload = parseBeneficiaryFormData(formData);
  const photoFile = formData.get("profilePhoto") as File | null;
  let profile_photo_url: string | null = null;
  if (photoFile && photoFile.size > 0) profile_photo_url = await uploadProfilePhoto(photoFile);
  const { error } = await supabase.from("past_beneficiaries").insert({ ...payload, profile_photo_url });
  if (error) return { error: error.message };
  revalidatePath("/past-beneficiaries");
  redirect("/past-beneficiaries");
}

export async function updatePastBeneficiary(
  id: string,
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const payload = parseBeneficiaryFormData(formData);
  const photoFile = formData.get("profilePhoto") as File | null;
  let profile_photo_url: string | null = (formData.get("existingPhotoUrl") as string | null) || null;
  if (photoFile && photoFile.size > 0) {
    const uploaded = await uploadProfilePhoto(photoFile);
    if (uploaded) profile_photo_url = uploaded;
  }
  const { error } = await supabase.from("past_beneficiaries").update({ ...payload, profile_photo_url }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/past-beneficiaries");
  revalidatePath(`/past-beneficiaries/${id}`);
  redirect(`/past-beneficiaries/${id}`);
}

export async function deletePastBeneficiary(id: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("past_beneficiaries").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/past-beneficiaries");
  return {};
}

// ─── Donors ────────────────────────────────────────────────────────────────

function parseDonorFormData(fd: FormData) {
  return {
    name: String(fd.get("name") ?? ""),
    email: String(fd.get("email") ?? ""),
    phone: String(fd.get("phone") ?? ""),
    notes: String(fd.get("notes") ?? ""),
  };
}

export async function createDonor(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const payload = parseDonorFormData(formData);
  const { error } = await supabase.from("donors").insert(payload);
  if (error) return { error: error.message };
  revalidatePath("/donors");
  redirect("/donors");
}

export async function updateDonor(
  id: string,
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const payload = parseDonorFormData(formData);
  const { error } = await supabase.from("donors").update(payload).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/donors");
  revalidatePath(`/donors/${id}`);
  redirect(`/donors/${id}`);
}

export async function deleteDonor(id: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("donors").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/donors");
  return {};
}

export async function createDonation(
  donorId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const amount = Number(formData.get("amount") ?? 0);
  const contributed_on = String(formData.get("contributedOn") ?? "");
  const scholarId = String(formData.get("scholarId") ?? "");
  const note = String(formData.get("note") ?? "");
  const { error } = await supabase.from("donations").insert({
    donor_id: donorId,
    scholar_id: scholarId || null,
    amount,
    contributed_on,
    note,
  });
  if (error) return { error: error.message };
  revalidatePath(`/donors/${donorId}`);
  revalidatePath("/donors");
  return {};
}

export async function deleteDonation(donationId: string, donorId: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("donations").delete().eq("id", donationId);
  if (error) return { error: error.message };
  revalidatePath(`/donors/${donorId}`);
  revalidatePath("/donors");
  return {};
}

// ─── Form Templates ───────────────────────────────────────────────────────────

export async function deleteFormTemplate(
  id: string
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("form_templates")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/forms");
  return {};
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function saveSettings(
  settings: AppSettings
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const payload = {
    id: 1,
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
  const { error } = await supabase.from("settings").upsert(payload, { onConflict: "id" });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/");
  return {};
}

export async function recomputeAllScores(
  weights: Pick<AppSettings, "scoringChildStatus" | "scoringAcademic" | "scoringCharacter" | "scoringHardship">
): Promise<{ updated: number; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("applicants").select("*");
  if (error) return { updated: 0, error: error.message };

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

  const updates = (data as Row[]).map((row) => {
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
  for (const u of updates) {
    const { error: ue } = await supabase
      .from("applicants")
      .update({ total_score: u.total_score })
      .eq("id", u.id);
    if (!ue) updated++;
  }

  revalidatePath("/applicants");
  revalidatePath("/");
  return { updated };
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

export async function exportApplicantsCSV(): Promise<{ csv?: string; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("applicants")
    .select("first_name,last_name,email,institution,year_of_study,location,status,total_score,applied_date,rank")
    .order("total_score", { ascending: false });
  if (error) return { error: error.message };

  const header = "Name,Email,Institution,Grade,Location,Status,Score,Applied Date,Rank";
  const rows = (data as Array<Record<string, string | number | null>>).map((r) =>
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
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("scholars")
    .select("first_name,last_name,school,grade,location,status,year_joined")
    .order("created_at", { ascending: false });
  if (error) return { error: error.message };

  const header = "Name,School,Grade,Location,Status,Year Joined";
  const rows = (data as Array<Record<string, string | number | null>>).map((r) =>
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
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("past_beneficiaries")
    .select("first_name,last_name,high_school,year_graduated,current_status,institution,field_of_study,location")
    .order("year_graduated", { ascending: false });
  if (error) return { error: error.message };

  const header = "Name,High School,Year Graduated,Status,Institution,Field of Study,Location";
  const rows = (data as Array<Record<string, string | number | null>>).map((r) =>
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
