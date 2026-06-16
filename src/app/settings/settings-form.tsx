"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateCompanySettings } from "@/app/actions/settings";
import { resetTransactionData } from "@/app/actions/reset";
import { Save } from "lucide-react";

export function SettingsForm({ initialData }: { initialData: any }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    address: initialData?.address || "",
    state: initialData?.state || "",
    country: initialData?.country || "India",
    pincode: initialData?.pincode || "",
    telephone: initialData?.telephone || "",
    mobile: initialData?.mobile || "",
    email: initialData?.email || "",
    website: initialData?.website || "",
    financialYearFrom: initialData?.financialYearFrom ? new Date(initialData.financialYearFrom).toISOString().split('T')[0] : "",
    booksBeginFrom: initialData?.booksBeginFrom ? new Date(initialData.booksBeginFrom).toISOString().split('T')[0] : "",
    baseCurrencySymbol: initialData?.baseCurrencySymbol || "₹",
    baseCurrencyName: initialData?.baseCurrencyName || "INR",
    panNumber: initialData?.panNumber || "",
    gstNumber: initialData?.gstNumber || "",
    logoUrl: initialData?.logoUrl || "",
    backupEmail: initialData?.backupEmail || "",
    backupPassword: initialData?.backupPassword || "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetData = async () => {
    if (confirm("Are you ABSOLUTELY sure? This will delete all Invoices, Purchases, Payments, Expenses and reset Stock to 0. This CANNOT be undone!")) {
      const secondConfirm = prompt("Type 'RESET' to confirm deletion:");
      if (secondConfirm === "RESET") {
        setIsResetting(true);
        const res = await resetTransactionData();
        if (res.success) {
          alert("All transaction data has been completely reset!");
          window.location.reload();
        } else {
          alert("Failed to reset: " + res.error);
        }
        setIsResetting(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      ...formData,
      financialYearFrom: formData.financialYearFrom ? new Date(formData.financialYearFrom) : null,
      booksBeginFrom: formData.booksBeginFrom ? new Date(formData.booksBeginFrom) : null,
    };

    const res = await updateCompanySettings(payload);

    if (res.success) {
      alert("Company settings saved successfully!");
      window.location.reload();
    } else {
      alert("Error saving settings: " + res.error);
    }
    
    setIsSubmitting(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Company Features / Settings</CardTitle>
        <CardDescription>
          Configure company details similar to Tally/Busy company creation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2 text-blue-600">Basic Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Company Name</Label>
                <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label>Mailing Address</Label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.address} 
                  onChange={(e) => handleChange("address", e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label>State</Label>
                <Input value={formData.state} onChange={(e) => handleChange("state", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={formData.country} onChange={(e) => handleChange("country", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input value={formData.pincode} onChange={(e) => handleChange("pincode", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2 text-blue-600">Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telephone No.</Label>
                <Input value={formData.telephone} onChange={(e) => handleChange("telephone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Mobile No.</Label>
                <Input value={formData.mobile} onChange={(e) => handleChange("mobile", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={formData.website} onChange={(e) => handleChange("website", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Books and Financial Year Details */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold border-b pb-2 text-blue-600">Books and Financial Year Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Financial Year begins from</Label>
                <Input type="date" value={formData.financialYearFrom} onChange={(e) => handleChange("financialYearFrom", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Books beginning from</Label>
                <Input type="date" value={formData.booksBeginFrom} onChange={(e) => handleChange("booksBeginFrom", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Statutory & Taxation */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold border-b pb-2 text-blue-600">Statutory & Taxation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>PAN / IT No.</Label>
                <Input value={formData.panNumber} onChange={(e) => handleChange("panNumber", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>GSTIN / UIN</Label>
                <Input value={formData.gstNumber} onChange={(e) => handleChange("gstNumber", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Base Currency Information */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold border-b pb-2 text-blue-600">Base Currency Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Currency Symbol</Label>
                <Input value={formData.baseCurrencySymbol} onChange={(e) => handleChange("baseCurrencySymbol", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Base Currency Name</Label>
                <Input value={formData.baseCurrencyName} onChange={(e) => handleChange("baseCurrencyName", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Backup Settings Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold border-b pb-2 text-blue-600">Auto Backup Settings (Nightly)</h3>
            <p className="text-sm text-slate-500">Provide a Gmail address and its <strong>App Password</strong> to receive your database backup every night at 12 AM.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gmail Address</Label>
                <Input 
                  type="email" 
                  placeholder="yourname@gmail.com" 
                  value={formData.backupEmail} 
                  onChange={(e) => handleChange("backupEmail", e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>App Password</Label>
                <Input 
                  type="password" 
                  placeholder="16-character app password" 
                  value={formData.backupPassword} 
                  onChange={(e) => handleChange("backupPassword", e.target.value)} 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Go to Google Account &gt; Security &gt; 2-Step Verification &gt; App Passwords to generate this.
                </p>
              </div>
            </div>
          </div>
          
          <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700">
            <Save className="mr-2 h-5 w-5" />
            {isSubmitting ? "Saving Company Details..." : "Save Company Details"}
          </Button>
        </form>
      </CardContent>
    </Card>

    <Card className="max-w-4xl mx-auto mt-8 border-red-200">
      <CardHeader className="bg-red-50 rounded-t-lg">
        <CardTitle className="text-xl font-bold text-red-600">Danger Zone</CardTitle>
        <CardDescription className="text-red-700">
          Destructive actions that cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="font-semibold text-slate-900">Reset All Transactions</h4>
            <p className="text-sm text-slate-500">
              This will permanently delete all your Invoices, Purchases, Expenses, Payments, and Serial Numbers. 
              Stock will be set to 0. Party balances will be reset to Opening Balances.
            </p>
          </div>
          <Button 
            variant="destructive" 
            disabled={isResetting}
            onClick={handleResetData}
            className="shrink-0"
          >
            {isResetting ? "Resetting Data..." : "Delete All Transactions"}
          </Button>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
