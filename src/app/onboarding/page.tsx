import { OnboardingCarousel } from "./onboarding-carousel";
import { getCompanySettings } from "@/app/actions/settings";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const settings = await getCompanySettings();
  
  return (
    <div className="min-h-screen bg-slate-50">
      <OnboardingCarousel initialSettings={settings} />
    </div>
  );
}
