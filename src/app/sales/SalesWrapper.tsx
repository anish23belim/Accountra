"use client";

import { useState } from "react";
import { ExportButton } from "../components/ExportButton";
import { SalesTable } from "./sales-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function SalesWrapper({ initialInvoices, settings }: { initialInvoices: any[]; settings: any }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold tracking-tight">Sales</h2>
        <div className="flex items-center gap-2">
          <ExportButton entity="sales" filters={{ search: searchQuery }} />
          <Link href="/sales/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> Create Invoice
            </Button>
          </Link>
        </div>
      </div>
      <SalesTable initialData={initialInvoices} settings={settings} onSearchChange={setSearchQuery} />
    </div>
  );
}
