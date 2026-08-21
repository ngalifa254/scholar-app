import { getSettings } from "@/lib/db";
import SettingsClient from "@/components/settings/SettingsClient";

export const metadata = {
  title: "Settings — Student Center",
  description: "Manage programme settings, scoring weights, and data exports.",
};

export default async function SettingsPage() {
  const settings = await getSettings();
  return <SettingsClient initialSettings={settings} />;
}
