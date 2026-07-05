import { notFound } from "next/navigation";
import { getScholarById } from "@/lib/db";
import ScholarFormClient from "@/components/scholars/ScholarFormClient";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: "Edit Scholar — Student Center" };

export default async function EditScholarPage({ params }: Props) {
  const { id } = await params;
  const scholar = await getScholarById(id);
  if (!scholar) notFound();
  return <ScholarFormClient scholar={scholar} />;
}
