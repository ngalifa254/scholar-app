import { notFound } from "next/navigation";
import { getDonorById, getScholars } from "@/lib/db";
import DonorDetailClient from "@/components/donors/DonorDetailClient";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const donor = await getDonorById(id);
  if (!donor) return { title: "Donor Not Found" };
  return { title: `${donor.name} — Student Center` };
}

export default async function DonorDetailPage({ params }: Props) {
  const { id } = await params;
  const [donor, scholars] = await Promise.all([getDonorById(id), getScholars()]);
  if (!donor) notFound();
  return <DonorDetailClient donor={donor} scholars={scholars} />;
}
