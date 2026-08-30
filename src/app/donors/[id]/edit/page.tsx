import { notFound } from "next/navigation";
import { getDonorById } from "@/lib/db";
import DonorFormClient from "@/components/donors/DonorFormClient";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: "Edit Donor — Student Center" };

export default async function EditDonorPage({ params }: Props) {
  const { id } = await params;
  const donor = await getDonorById(id);
  if (!donor) notFound();
  return <DonorFormClient donor={donor} />;
}
