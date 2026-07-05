import { getScholars } from "@/lib/db";
import ScholarsClient from "@/components/scholars/ScholarsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scholars — Student Center",
  description: "Current scholarship beneficiaries in Grades 10–12",
};

export default async function ScholarsPage() {
  const scholars = await getScholars();
  return <ScholarsClient initialScholars={scholars} />;
}
