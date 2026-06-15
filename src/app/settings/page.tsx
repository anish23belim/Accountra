import { getCompanySettings } from "@/app/actions/settings";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const settings = await getCompanySettings();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Company Settings</h2>
      </div>
      
      <div className="max-w-2xl mt-8">
        <SettingsForm initialData={settings} />
      </div>
    </div>
  );
}
