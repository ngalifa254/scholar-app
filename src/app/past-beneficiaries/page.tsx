import { getPastBeneficiaries } from "@/lib/db";
import BeneficiariesClient from "@/components/past-beneficiaries/BeneficiariesClient";
import { PageHeader } from "@/components/layout/PageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Past Beneficiaries — Student Center",
  description: "Scholarship graduates now in university or a career",
};

export default async function PastBeneficiariesPage() {
  const beneficiaries = await getPastBeneficiaries();
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Past Beneficiaries" }]}
        title="Past Beneficiaries"
        subtitle="Scholarship graduates now in university or a career"
      />
      <BeneficiariesClient initialBeneficiaries={beneficiaries} />
    </>
  );
}
