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

  const top3 = applicants
    .filter((a) => a.rank && a.rank <= 3)
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));

  return (
    <DashboardClient
      scholars={scholars}
      top3={top3}
      kpi={kpi}
      scholarCount={scholars.length}
      beneficiaryCount={beneficiaries.length}
      formsCount={forms.length}
    />
  );
}
