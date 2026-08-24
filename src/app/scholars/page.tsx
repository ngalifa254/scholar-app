import { getScholars } from "@/lib/db";
import ScholarsClient from "@/components/scholars/ScholarsClient";
import { PageHeader } from "@/components/layout/PageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scholars — Student Center",
  description: "Current scholarship beneficiaries in Grades 10–12",
};

export default async function ScholarsPage() {
  const scholars = await getScholars();
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Scholars" }]}
        title="Scholars"
        subtitle="Current scholarship beneficiaries, Grades 10–12"
      />
      <ScholarsClient initialScholars={scholars} />
    </>
  );
}
