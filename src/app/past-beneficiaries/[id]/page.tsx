import { notFound } from "next/navigation";
import { getPastBeneficiaryById } from "@/lib/db";
import BeneficiaryDetailClient from "@/components/past-beneficiaries/BeneficiaryDetailClient";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const b = await getPastBeneficiaryById(id);
  if (!b) return { title: "Not Found" };
  return { title: `${b.firstName} ${b.lastName} — Student Center` };
}

export default async function BeneficiaryDetailPage({ params }: Props) {
  const { id } = await params;
  const b = await getPastBeneficiaryById(id);
  if (!b) notFound();
  return <BeneficiaryDetailClient beneficiary={b} />;
}
