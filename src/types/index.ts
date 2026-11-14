export type ApplicantStatus = 'pending' | 'reviewed' | 'selected' | 'rejected';

export type ChildStatus =
  | 'double_orphan'
  | 'single_orphan'
  | 'child_of_disabled'
  | 'guardian_only'
  | 'both_parents';

export type AcademicMerit = 'ee' | 'me' | 'ae' | 'be';

export type CharacterLeadership = 'excellent' | 'good' | 'average' | 'below_average';

export interface Applicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  nationality: string;
  institution: string;
  program: string;
  yearOfStudy: number;
  location: string;
  age: number;
  childStatus: ChildStatus;
  academicMerit: AcademicMerit;
  characterLeadership: CharacterLeadership;
  guardianName: string;
  guardianContact: string;
  hardshipChronicallyIll: boolean;
  hardshipDistanceToSchool: boolean;
  hardshipHeavyChores: boolean;
  hardshipNoCleanWater: boolean;
  notes: string;
  status: ApplicantStatus;
  totalScore: number;
  appliedDate: string;
  rank?: number;
  profilePhotoUrl?: string;
  guardianIdUrl?: string;
  grade8ReportUrl?: string;
  recommendationUrl?: string;
  otherDocs?: Array<{ name: string; url: string }>;
}

export type FormCategory = 'scholarship_docs' | 'tools' | 'resources' | 'archives' | 'other';
export type FormDocumentFolder = FormCategory | 'submissions' | 'report_cards';

export interface ManagedFormFile {
  id: string;
  folder: FormDocumentFolder;
  name: string;
  fileName: string;
  fileUrl: string;
  storagePath: string;
  createdAt: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  fields: number;
  submissions: number;
  status: 'active' | 'draft' | 'archived';
  category: FormCategory;
  createdAt: string;
  lastModified: string;
}

export interface SortConfig {
  key: keyof Applicant | null;
  direction: 'asc' | 'desc';
}

export type ScholarStatus = 'active' | 'completed' | 'deferred' | 'archived' | 'withdrawn';

export interface ScholarActivityEntry {
  subject: string;
  note: string;
  createdAt: string;
}

export interface Scholar {
  id: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl?: string;
  school: string;
  grade: number;
  location: string;
  guardianName: string;
  guardianContact: string;
  yearJoined: number;
  notes: string;
  status: ScholarStatus;
  createdAt: string;
  sourceApplicantId?: string;
  activityLog?: ScholarActivityEntry[];
  guardianIdUrl?: string;
  grade8ReportUrl?: string;
  recommendationUrl?: string;
  otherDocs?: Array<{ name: string; url: string }>;
  term1ReportUrl?: string;
  term2ReportUrl?: string;
  term3ReportUrl?: string;
}

export type BeneficiaryStatus = 'university' | 'career' | 'other';

export interface AppSettings {
  scholarshipYear: string;
  appOpenDate: string;
  appCloseDate: string;
  selectionDeadline: string;
  intakeQuota: number;
  orgName: string;
  orgTagline: string;
  orgEmail: string;
  orgPhone: string;
  scoringChildStatus: number;
  scoringAcademic: number;
  scoringCharacter: number;
  scoringHardship: number;
}

export interface PastBeneficiary {
  id: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl?: string;
  highSchool: string;
  yearGraduated: number;
  currentStatus: BeneficiaryStatus;
  institution: string;
  fieldOfStudy: string;
  location: string;
  notes: string;
  createdAt: string;
  sourceScholarId?: string;
  gradeAtGraduation?: number;
  yearJoined?: number;
  guardianName?: string;
  guardianContact?: string;
  guardianIdUrl?: string;
  grade8ReportUrl?: string;
  recommendationUrl?: string;
  otherDocs?: Array<{ name: string; url: string }>;
  term1ReportUrl?: string;
  term2ReportUrl?: string;
  term3ReportUrl?: string;
  activityLog?: ScholarActivityEntry[];
}
