import { getApplicants } from "@/lib/db";
import ApplicantsClient from "@/components/applicants/ApplicantsClient";
import { PageHeader } from "@/components/layout/PageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Applicants — Student Center",
  description: "Prospective scholars currently in the application and review pipeline",
};

export default async function ApplicantsPage() {
  const applicants = await getApplicants();
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Applicants" }]}
        title="Applicants"
        subtitle="Prospective scholars currently in the application and review pipeline"
      />
      <ApplicantsClient initialApplicants={applicants} />
    </>
  );
}
