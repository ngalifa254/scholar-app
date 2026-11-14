import { getFormTemplates, getScholars, getApplicants, getManagedFormFiles } from "@/lib/db";
import FormsClient from "@/components/forms/FormsClient";

export default async function FormsPage() {
  const [forms, scholars, applicants, files] = await Promise.all([
    getFormTemplates(),
    getScholars(),
    getApplicants(),
    getManagedFormFiles(),
  ]);
  return <FormsClient initialForms={forms} scholars={scholars} applicants={applicants} initialFiles={files} />;
}
