import { notFound } from "next/navigation";
import { getApplicantById } from "@/lib/db";
import ApplicantDetailClient from "@/components/applicants/ApplicantDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ApplicantDetailPage({ params }: Props) {
  const { id } = await params;
  const applicant = await getApplicantById(id);
  if (!applicant) notFound();
  return <ApplicantDetailClient applicant={applicant} />;
}
