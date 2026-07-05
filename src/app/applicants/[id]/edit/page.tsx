import { notFound } from "next/navigation";
import { getApplicantById } from "@/lib/db";
import EditApplicantClient from "@/components/applicants/EditApplicantClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditApplicantPage({ params }: Props) {
  const { id } = await params;
  const applicant = await getApplicantById(id);
  if (!applicant) notFound();
  return <EditApplicantClient applicant={applicant} />;
}
