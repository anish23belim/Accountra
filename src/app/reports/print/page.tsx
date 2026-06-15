import { getReportData } from "@/app/actions/reports";
import { PrintReportClient } from "./print-client";

export default async function PrintReportPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const params = await searchParams;
  const type = params.type || "Report";
  const data = await getReportData(type);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 0; } /* Removes default browser headers and footers (URLs) */
          body { 
            padding: 1.5cm; 
            background-color: white !important;
            -webkit-print-color-adjust: exact; 
          }
          .print-hidden { display: none !important; }
        }
      `}} />
      <div className="p-8 max-w-[210mm] mx-auto bg-white min-h-screen text-slate-900 shadow-sm print:shadow-none print:p-0">
        
        {/* Report Header */}
        <div className="flex justify-between items-start border-b-2 border-blue-800 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-blue-900 uppercase tracking-tight">{type}</h1>
            <p className="text-slate-600 mt-2 font-medium">Date Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black text-blue-700 tracking-wider">ACCOUNTRA</h2>
            <p className="text-sm text-slate-500 font-semibold mt-1">Smart Business Accounting</p>
          </div>
        </div>

        {/* Report Body */}
        {data.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg">
            <p className="text-lg text-slate-500 font-medium">No records found for this report.</p>
          </div>
        ) : (
          <div className="rounded-md overflow-hidden border border-slate-300">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-blue-50 text-blue-900 border-b-2 border-blue-200">
                <tr>
                  {Object.keys(data[0]).map((key) => (
                    <th key={key} className="px-4 py-3 font-bold uppercase tracking-wider text-xs">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    {Object.values(row).map((val: any, j) => {
                      const isNumber = typeof val === 'number';
                      return (
                        <td key={j} className={`px-4 py-3 ${isNumber ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
                          {isNumber ? val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report Footer */}
        <div className="mt-12 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
          Generated automatically by Accountra System.
        </div>

        <div className="print-hidden">
          <PrintReportClient />
        </div>
      </div>
    </>
  );
}
