import { notFound } from "next/navigation";
import { getScholarById } from "@/lib/db";
import ScholarDetailClient from "@/components/scholars/ScholarDetailClient";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const scholar = await getScholarById(id);
  if (!scholar) return { title: "Scholar Not Found" };
  return { title: `${scholar.firstName} ${scholar.lastName} — Student Center` };
}

export default async function ScholarDetailPage({ params }: Props) {
  const { id } = await params;
  const scholar = await getScholarById(id);
  if (!scholar) notFound();
  return <ScholarDetailClient scholar={scholar} />;
}
