import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Landmark, FileSpreadsheet, Download } from "lucide-react";

export default function TaxPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">GST & Tax Hub</h2>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Download className="mr-2 h-4 w-4" /> Export All Tax Data
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 py-4">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CGST Collected</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹1,234.50</div>
            <p className="text-xs text-muted-foreground">Central Goods and Services Tax</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SGST Collected</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹1,234.50</div>
            <p className="text-xs text-muted-foreground">State Goods and Services Tax</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IGST Collected</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹4,500.00</div>
            <p className="text-xs text-muted-foreground">Integrated Goods and Services Tax</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>GSTR-1 Summary</CardTitle>
            <CardDescription>Details of outward supplies of goods or services.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium">Total B2B Invoices</span>
                <span className="font-bold">42</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium">Total B2C Invoices</span>
                <span className="font-bold">128</span>
              </div>
              <Button variant="outline" className="w-full mt-4">
                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" /> Export Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>GSTR-3B Summary</CardTitle>
            <CardDescription>Summary return of outward supplies and input tax credit.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium">Eligible ITC</span>
                <span className="font-bold text-green-600">₹8,400.00</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium">Net Tax Payable</span>
                <span className="font-bold text-red-600">₹3,200.00</span>
              </div>
              <Button variant="outline" className="w-full mt-4">
                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" /> Export Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
