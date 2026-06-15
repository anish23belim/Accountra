import { NextResponse } from "next/server";
import { getReportData } from "@/app/actions/reports";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!type) {
      return new NextResponse("Report type is required", { status: 400 });
    }

    const data = await getReportData(type);

    if (!data || data.length === 0) {
      // Return a basic CSV saying no data
      return new NextResponse("Message\nNo data available in the database for this report.", {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${type.replace(/ /g, "_")}.csv"`,
        },
      });
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.map(h => `"${h}"`).join(","));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        const escaped = ("" + (val !== null && val !== undefined ? val : "")).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }
    
    const csvString = csvRows.join("\n");

    return new NextResponse(csvString, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${type.replace(/ /g, "_")}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return new NextResponse("Error generating export", { status: 500 });
  }
}
