import { getApplicants, getKpiData, getScholars, getPastBeneficiaries, getFormTemplates } from "@/lib/db";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const [applicants, kpi, scholars, beneficiaries, forms] = await Promise.all([
    getApplicants({ sortKey: "appliedDate", sortDir: "desc" }),
    getKpiData(),
    getScholars(),
    getPastBeneficiaries(),
    getFormTemplates(),
  ]);

  const selectedApplicants = applicants
    .filter((applicant) => applicant.status === "selected")
    .sort((a, b) => b.totalScore - a.totalScore);

  return (
    <DashboardClient
      scholars={scholars}
      selectedApplicants={selectedApplicants}
      kpi={kpi}
      scholarCount={scholars.length}
      beneficiaryCount={beneficiaries.length}
      formsCount={forms.length}
    />
  );
}
