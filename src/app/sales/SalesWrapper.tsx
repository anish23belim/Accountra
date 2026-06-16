"use client";

import { useState } from "react";
import { ExportButton } from "../components/ExportButton";
import { SalesTable } from "./sales-table";

export default function SalesWrapper({ initialInvoices, settings }: { initialInvoices: any[]; settings: any }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Sales</h2>
        <ExportButton entity="sales" filters={{ search: searchQuery }} />
      </div>
      <SalesTable initialData={initialInvoices} settings={settings} onSearchChange={setSearchQuery} />
    </div>
  );
}
