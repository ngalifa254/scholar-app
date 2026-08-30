import DonorFormClient from "@/components/donors/DonorFormClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Add Donor — Student Center" };

export default function NewDonorPage() {
  return <DonorFormClient />;
}
