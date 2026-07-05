import { getFormTemplates, getScholars, getApplicants } from "@/lib/db";
import FormsClient from "@/components/forms/FormsClient";

export default async function FormsPage() {
  const [forms, scholars, applicants] = await Promise.all([
    getFormTemplates(),
    getScholars(),
    getApplicants(),
  ]);
  return <FormsClient initialForms={forms} scholars={scholars} applicants={applicants} />;
}
