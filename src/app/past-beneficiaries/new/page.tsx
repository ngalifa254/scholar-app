import BeneficiaryFormClient from "@/components/past-beneficiaries/BeneficiaryFormClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Add Past Beneficiary — Student Center" };

export default function NewBeneficiaryPage() {
  return <BeneficiaryFormClient />;
}
