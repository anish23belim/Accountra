"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet, FileBarChart2, Loader2, TrendingUp } from "lucide-react";
import { getReportData, getProfitLossStats } from "../actions/reports";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function ReportsPage() {
  const reports = [
    {
      category: "Financial Statements",
      items: [
        { name: "Profit & Loss", description: "Income, expenses, and net profit over a period." },
        { name: "GST Report", description: "All sales and purchases mapped with GST details." },
      ]
    },
    {
      category: "Sales & Purchases",
      items: [
        { name: "Sales Report", description: "Detailed summary of all sales invoices and receipts." },
        { name: "Purchase Report", description: "Summary of bills and purchases from suppliers." },
        { name: "Expense Report", description: "Breakdown of operating expenses by category." },
      ]
    },
    {
      category: "Entities & Inventory",
      items: [
        { name: "Customer Statement", description: "Ledger of transactions for specific customers." },
        { name: "Supplier Statement", description: "Ledger of transactions for specific suppliers." },
        { name: "Inventory Report", description: "Current stock valuation and low stock warnings." },
      ]
    }
  ];

  const [loadingReport, setLoadingReport] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState<{type: "error" | "success" | "info", text: string} | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const data = await getProfitLossStats();
      setChartData(data);
      setLoadingChart(false);
    }
    loadStats();
  }, []);

  const handleDownloadExcel = (reportName: string) => {
    // Redirect to API route which forces a file download directly from the server
    window.location.href = `/api/export?type=${encodeURIComponent(reportName)}`;
    setPageMessage({ type: "success", text: `${reportName} download started. Please check your browser's downloads folder.` });
  };

  const handleViewPDF = (reportName: string) => {
    // For now, redirect to a simple print view page
    window.open(`/reports/print?type=${encodeURIComponent(reportName)}`, '_blank');
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
      </div>

      {pageMessage && (
        <div className={`p-4 rounded-md border text-sm font-medium ${
          pageMessage.type === "error" ? "bg-red-50 text-red-700 border-red-200" : 
          pageMessage.type === "success" ? "bg-green-50 text-green-700 border-green-200" :
          "bg-blue-50 text-blue-700 border-blue-200"
        }`}>
          {pageMessage.text}
        </div>
      )}

      {/* Advanced Dashboard Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Financial Performance (Current Year)
          </CardTitle>
          <CardDescription>Monthly breakdown of Sales, Purchases, Expenses, and Profit</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingChart ? (
            <div className="h-[400px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `₹${value}`} />
                  <Tooltip formatter={(value) => `₹${value}`} />
                  <Legend />
                  <Bar dataKey="sales" name="Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="purchases" name="Purchases" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#3b82f6" strokeWidth={3} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-8 py-4">
        {reports.map((section, index) => (
          <div key={index} className="space-y-4">
            <h3 className="text-lg font-medium text-slate-800 border-b pb-2">{section.category}</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {section.items.map((report, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileBarChart2 className="h-5 w-5 text-blue-600" />
                      {report.name}
                    </CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mt-2">
                      <Button onClick={() => handleViewPDF(report.name)} variant="outline" size="sm" className="w-full text-xs">
                        <FileText className="mr-2 h-3 w-3" /> View PDF
                      </Button>
                      <Button 
                        onClick={() => handleDownloadExcel(report.name)} 
                        variant="outline" size="sm" className="w-full text-xs"
                        disabled={loadingReport === report.name + "-excel"}
                      >
                        {loadingReport === report.name + "-excel" ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <FileSpreadsheet className="mr-2 h-3 w-3" />}
                        Excel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
