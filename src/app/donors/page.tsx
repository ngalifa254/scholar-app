import { getDonors } from "@/lib/db";
import DonorsClient from "@/components/donors/DonorsClient";
import { PageHeader } from "@/components/layout/PageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Donors — Student Center",
  description: "Donor contacts and contribution history",
};

export default async function DonorsPage() {
  const donors = await getDonors();
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Donors" }]}
        title="Donors"
        subtitle="Contacts and contribution history"
      />
      <DonorsClient initialDonors={donors} />
    </>
  );
}
