import { getScholars } from "@/lib/db";
import ScholarShowcase from "@/components/scholars/ScholarShowcase";
import { PageHeader } from "@/components/layout/PageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scholars Showcase — Student Center",
  description: "Featured scholarship recipients and their stories",
};

export default async function ScholarsShowcasePage() {
  const scholars = await getScholars({ featured: true });
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Scholars", href: "/scholars" }, { label: "Showcase" }]}
        title="Scholars Showcase"
        subtitle="Meet our current scholarship recipients"
      />
      <ScholarShowcase scholars={scholars} />
    </>
  );
}
