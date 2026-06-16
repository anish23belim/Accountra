"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Calendar, FileSpreadsheet, FileText, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DataExportManager() {
  const [entity, setEntity] = useState<string>("sales");
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = async (format: "csv" | "xlsx") => {
    setLoading(true);
    setExportSuccess(false);
    try {
      const params = new URLSearchParams({
        entity,
        format,
        startDate,
        endDate,
      });

      const res = await fetch(`/api/export?${params.toString()}`);
      if (!res.ok) {
        const err = await res.text();
        alert(`Export failed: ${err}`);
        setLoading(false);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="?([^\"]+)"?/);
      a.download = filenameMatch ? filenameMatch[1] : `${entity}_report.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert("An error occurred during export.");
    }
    setLoading(false);
  };

  return (
    <Card className="border shadow-md bg-white">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-600" /> Export Data & Reports
        </CardTitle>
        <CardDescription>
          Download sales, purchases, or expenses data in CSV or Excel format filtered by custom date ranges.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transaction Type Select */}
        <div className="space-y-2">
          <Label htmlFor="entity" className="text-sm font-semibold">Select Transaction Type</Label>
          <select
            id="entity"
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="sales">Sales (Invoices)</option>
            <option value="purchases">Purchases (Bills)</option>
            <option value="expenses">Expenses</option>
          </select>
        </div>

        {/* Date Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="flex items-center gap-1.5 text-sm font-semibold">
              <Calendar className="w-4 h-4 text-slate-500" /> Start Date
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate" className="flex items-center gap-1.5 text-sm font-semibold">
              <Calendar className="w-4 h-4 text-slate-500" /> End Date
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white"
            />
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            onClick={() => handleExport("xlsx")}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" /> 
            {loading ? "Exporting..." : "Export as Excel (.xlsx)"}
          </Button>
          <Button
            onClick={() => handleExport("csv")}
            disabled={loading}
            variant="outline"
            className="flex-1 border-slate-300 hover:bg-slate-50 font-bold"
          >
            <FileText className="mr-2 h-4 w-4" /> 
            {loading ? "Exporting..." : "Export as CSV (.csv)"}
          </Button>
        </div>

        {exportSuccess && (
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle className="w-4 h-4" /> Report downloaded successfully!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
