"use client";

import { useState } from "react";
import { SettingsForm } from "./settings-form";
import { LocationsManager } from "./locations-manager";
import { Building2, MapPin } from "lucide-react";

export function SettingsLayout({ settings }: { settings: any }) {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="flex flex-col md:flex-row gap-8 mt-6 max-w-6xl">
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="sticky top-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Settings Menu</h3>
          <nav className="flex flex-col gap-1">
            <button 
              onClick={() => setActiveTab('general')} 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'general' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" /> 
              Company Details
            </button>
            <button 
              onClick={() => setActiveTab('locations')} 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'locations' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-4 h-4" /> 
              Godowns & Branches
            </button>
          </nav>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        {activeTab === 'general' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SettingsForm initialData={settings} />
          </div>
        )}
        {activeTab === 'locations' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <LocationsManager />
          </div>
        )}
      </main>
    </div>
  );
}
