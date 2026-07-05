import { notFound } from "next/navigation";
import { getPastBeneficiaryById } from "@/lib/db";
import BeneficiaryFormClient from "@/components/past-beneficiaries/BeneficiaryFormClient";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: "Edit Beneficiary — Student Center" };

export default async function EditBeneficiaryPage({ params }: Props) {
  const { id } = await params;
  const b = await getPastBeneficiaryById(id);
  if (!b) notFound();
  return <BeneficiaryFormClient beneficiary={b} />;
}
