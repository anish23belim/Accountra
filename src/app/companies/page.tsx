"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, ChevronRight, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOut } from "next-auth/react";
import { getCompanies, selectCompany, createCompany } from "../actions/companies";

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCompanyName, setNewCompanyName] = useState("");

  useEffect(() => {
    getCompanies().then((data) => {
      setCompanies(data || []);
      setLoading(false);
    });
  }, []);

  const handleSelect = async (id: string) => {
    await selectCompany(id);
    router.push("/");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    setLoading(true);
    const newId = await createCompany(newCompanyName);
    if (newId) {
      await selectCompany(newId);
      router.push("/");
    } else {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading Companies...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
        
        {/* Left Column: Select Existing */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Select Company</h1>
            <p className="text-slate-500">Choose a company to open its dashboard</p>
          </div>

          <div className="space-y-3">
            {companies.length === 0 ? (
              <Card className="border-dashed border-2 bg-slate-50">
                <CardContent className="p-8 text-center text-slate-500">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No companies found. Create one to get started.</p>
                </CardContent>
              </Card>
            ) : (
              companies.map((company) => (
                <Card 
                  key={company.id} 
                  className="cursor-pointer hover:border-blue-500 transition-all hover:shadow-md group"
                  onClick={() => handleSelect(company.id)}
                >
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {company.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {company.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          ID: {company.id.substring(0, 8)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <Button variant="ghost" className="text-slate-500" onClick={() => signOut()}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Right Column: Create New */}
        <div>
          <Card className="shadow-lg border-0 h-full flex flex-col justify-center">
            <CardHeader>
              <CardTitle>Create New Company</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input 
                    placeholder="e.g. Acme Corp" 
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading || !newCompanyName.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create & Open
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
