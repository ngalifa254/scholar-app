import { getApplicants } from "@/lib/db";
import ApplicantsClient from "@/components/applicants/ApplicantsClient";

export default async function ApplicantsPage() {
  const applicants = await getApplicants();
  return <ApplicantsClient initialApplicants={applicants} />;
}
