import ScholarFormClient from "@/components/scholars/ScholarFormClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Add Scholar — Student Center" };

export default function NewScholarPage() {
  return <ScholarFormClient />;
}
