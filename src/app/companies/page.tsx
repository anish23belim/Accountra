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
  const [isFetching, setIsFetching] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSelecting, setIsSelecting] = useState<string | null>(null);
  const [newCompanyName, setNewCompanyName] = useState("");

  useEffect(() => {
    getCompanies().then((data) => {
      setCompanies(data || []);
      setIsFetching(false);
    });
  }, []);

  const handleSelect = async (id: string) => {
    try {
      setIsSelecting(id);
      // Fallback: Set cookie directly on the client to avoid Next.js Server Action flakiness
      document.cookie = `companyId=${id}; path=/; max-age=2592000`; // 30 days
      
      // Force a hard reload to ensure middleware and cookies are synchronized
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      setIsSelecting(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    setIsCreating(true);
    try {
      const newId = await createCompany(newCompanyName);
      if (newId) {
        document.cookie = `companyId=${newId}; path=/; max-age=2592000`; // 30 days
        if (companies.length === 0) {
          window.location.href = "/onboarding";
        } else {
          window.location.href = "/";
        }
      } else {
        setIsCreating(false);
      }
    } catch (err) {
      console.error(err);
      setIsCreating(false);
    }
  };

  if (isFetching) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading Companies...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] bg-gradient-to-tl from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {companies.length === 0 ? (
        // First Time User Experience (Zero Companies)
        <div className="w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-500">
          <Card className="w-full shadow-2xl shadow-blue-900/10 border-0 overflow-hidden bg-white/90 backdrop-blur-3xl rounded-3xl relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
            
            <CardHeader className="px-8 pt-12 pb-6 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 mx-auto mb-6 transform hover:scale-105 transition-transform duration-300">
                <Building2 className="w-10 h-10" />
              </div>
              <CardTitle className="text-3xl font-extrabold text-slate-900 tracking-tight">Let's setup your business</CardTitle>
              <p className="text-slate-500 mt-3 text-lg">Create your first company to start managing your finances like a pro.</p>
            </CardHeader>

            <CardContent className="px-8 pb-12">
              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-slate-700 font-bold text-sm uppercase tracking-wider">Company Name</Label>
                  <Input 
                    placeholder="e.g. Acme Corporation" 
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    required
                    className="h-16 rounded-2xl border-slate-200 bg-slate-50/80 px-5 text-xl font-medium focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all shadow-inner"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-16 text-lg font-bold rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isCreating || !newCompanyName.trim()}
                >
                  {isCreating ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Preparing Dashboard...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Plus className="w-6 h-6 mr-2" />
                      Create Company & Start Tour
                    </span>
                  )}
                </Button>

                <div className="pt-4 text-center">
                  <Button variant="ghost" className="text-slate-400 hover:text-slate-600" onClick={() => signOut()}>
                    Sign out instead
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Existing Companies Selection UI
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 lg:gap-16 relative z-10">
          
          {/* Left Column: Select Existing */}
          <div className="flex flex-col justify-center space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl mb-6 shadow-blue-500/30">
                <Building2 className="w-7 h-7" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">Welcome Back</h1>
              <p className="text-slate-500 text-lg">Select a company to open its dashboard and continue your work.</p>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
              {companies.map((company) => (
                <Card 
                  key={company.id} 
                  className={`cursor-pointer border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-white/80 backdrop-blur-xl ${isSelecting === company.id ? 'opacity-75 pointer-events-none scale-[0.98]' : ''}`}
                  onClick={() => handleSelect(company.id)}
                >
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-700 font-bold text-xl shadow-inner group-hover:from-blue-500 group-hover:to-indigo-500 group-hover:text-white transition-all duration-300">
                        {isSelecting === company.id ? (
                          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                          company.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                          {company.name}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium">
                          ID: <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-md ml-1">{company.id.substring(0, 8)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                      {isSelecting === company.id ? (
                        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : (
                        <ChevronRight className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <Button variant="ghost" className="text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl" onClick={() => signOut()}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Right Column: Create New */}
          <div className="flex items-center justify-center animate-in fade-in slide-in-from-right-4 duration-500">
            <Card className="w-full shadow-2xl shadow-blue-900/5 border-0 overflow-hidden bg-white/90 backdrop-blur-2xl rounded-3xl relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
              <CardHeader className="px-8 pt-10 pb-6">
                <CardTitle className="text-2xl font-bold text-slate-800">Create New Company</CardTitle>
                <p className="text-sm text-slate-500 mt-2">Start a new isolated workspace for your business.</p>
              </CardHeader>
              <CardContent className="px-8 pb-10">
                <form onSubmit={handleCreate} className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-slate-700 font-semibold text-sm">Company Name</Label>
                    <Input 
                      placeholder="e.g. Acme Corporation" 
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      required
                      className="h-14 rounded-xl border-slate-200 bg-slate-50/50 px-4 text-lg focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    disabled={isCreating || !newCompanyName.trim()}
                  >
                    {isCreating ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Creating...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Plus className="w-5 h-5 mr-2" />
                        Create & Open
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

        </div>
      )}

    </div>
  );
}
