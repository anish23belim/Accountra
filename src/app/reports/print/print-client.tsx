"use client";

import { useEffect } from "react";

export function PrintReportClient() {
  useEffect(() => {
    // Wait a bit for fonts/styles to load then print
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mt-8 text-center print:hidden">
      <button 
        onClick={() => window.print()} 
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm"
      >
        Print / Save as PDF
      </button>
      <p className="text-sm text-slate-500 mt-2">
        Tip: Select "Save as PDF" in your print dialog destination.
      </p>
    </div>
  );
}
