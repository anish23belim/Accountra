"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCompanySettings } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ArrowRight, LayoutDashboard, FileText, Package, CheckCircle2 } from "lucide-react";

export function OnboardingCarousel({ initialSettings }: { initialSettings: any }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  const [companyName, setCompanyName] = useState(initialSettings?.name || "My Company");
  const [companyPhone, setCompanyPhone] = useState(initialSettings?.mobile || "");

  const handleFinish = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenTour', 'true');
    }
    router.push("/");
  };

  const handleSaveCompany = async () => {
    setIsSaving(true);
    await updateCompanySettings({
      name: companyName,
      mobile: companyPhone
    });
    setIsSaving(false);
    setStep(2);
  };

  const steps = [
    // Step 0: Welcome
    (
      <div key="welcome" className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Thank You!</h1>
        <p className="text-slate-500 text-lg mb-8 max-w-sm">
          Welcome to Accountra. We are thrilled to have you on board. Let's get your business set up in seconds.
        </p>
        <div className="flex gap-4 w-full">
          <Button onClick={() => setStep(1)} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-lg rounded-xl shadow-lg">
            Get Started
          </Button>
        </div>
      </div>
    ),
    // Step 1: Create Company
    (
      <div key="company" className="flex flex-col animate-in slide-in-from-right duration-500 w-full max-w-sm mx-auto">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-sm">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Create Company</h2>
        <p className="text-slate-500 text-center mb-6">Enter your primary business details.</p>
        
        <div className="space-y-4 mb-8">
          <div className="space-y-2">
            <Label>Firm Name</Label>
            <Input 
              value={companyName} 
              onChange={(e) => setCompanyName(e.target.value)} 
              className="h-12 rounded-xl bg-slate-50"
              placeholder="e.g. Sharma Traders"
            />
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input 
              value={companyPhone} 
              onChange={(e) => setCompanyPhone(e.target.value)} 
              className="h-12 rounded-xl bg-slate-50"
              placeholder="e.g. 9876543210"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12 rounded-xl">Skip</Button>
          <Button onClick={handleSaveCompany} disabled={isSaving} className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg">
            {isSaving ? "Saving..." : "Save & Next"}
          </Button>
        </div>
      </div>
    ),
    // Step 2: Dashboard Feature
    (
      <div key="feat1" className="flex flex-col items-center text-center animate-in slide-in-from-right duration-500">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 shadow-md transform rotate-3">
          <LayoutDashboard className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Powerful Dashboard</h2>
        <p className="text-slate-500 mb-8 max-w-sm">
          Track your cash flow, total sales, purchases, and outstanding balances all in one clean view.
        </p>
        <div className="flex gap-3 w-full max-w-sm">
          <Button variant="ghost" onClick={handleFinish} className="flex-1 h-12 text-slate-500">Skip Tour</Button>
          <Button onClick={() => setStep(3)} className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg">
            Next <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    ),
    // Step 3: Billing Feature
    (
      <div key="feat2" className="flex flex-col items-center text-center animate-in slide-in-from-right duration-500">
        <div className="w-24 h-24 bg-violet-100 text-violet-600 rounded-3xl flex items-center justify-center mb-6 shadow-md transform -rotate-3">
          <FileText className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Instant Sale Bills</h2>
        <p className="text-slate-500 mb-8 max-w-sm">
          Create GST or standard invoices in seconds. Generate professional PDFs instantly to share via WhatsApp or Email.
        </p>
        <div className="flex gap-3 w-full max-w-sm">
          <Button variant="ghost" onClick={handleFinish} className="flex-1 h-12 text-slate-500">Skip Tour</Button>
          <Button onClick={() => setStep(4)} className="flex-1 h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-lg">
            Next <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    ),
    // Step 4: Inventory
    (
      <div key="feat3" className="flex flex-col items-center text-center animate-in slide-in-from-right duration-500">
        <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mb-6 shadow-md">
          <Package className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Inventory Management</h2>
        <p className="text-slate-500 mb-8 max-w-sm">
          Never run out of stock. Track your items with barcode support and get low-stock alerts automatically.
        </p>
        <div className="flex gap-3 w-full max-w-sm">
          <Button onClick={handleFinish} className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg text-lg">
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-b from-white to-slate-50">
      
      {/* Dynamic Background Blobs based on step */}
      <div className={`absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full blur-3xl transition-colors duration-1000 ${step === 0 ? 'bg-blue-100' : step === 1 ? 'bg-indigo-100' : step === 2 ? 'bg-emerald-100' : step === 3 ? 'bg-violet-100' : 'bg-amber-100'}`}></div>
      
      <div className="w-full max-w-md relative z-10 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/20">
        {steps[step]}
        
        {/* Progress indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-slate-800' : 'w-2 bg-slate-200'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
