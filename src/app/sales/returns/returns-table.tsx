"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, FileText, Trash2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { deleteSalesReturn } from "../../actions/returns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";

type ReturnNote = {
  id: string;
  number: string;
  customer: string;
  customerDetails?: {
    address: string;
    phone: string;
    gst: string;
  };
  date: string;
  amount: number;
  items: Array<{
    name: string;
    serialNumber?: string;
    quantity: number;
    price: number;
    total: number;
  }>;
};

export function ReturnsTable({ initialData }: { initialData: ReturnNote[] }) {
  const [data, setData] = useState<ReturnNote[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [returnToDelete, setReturnToDelete] = useState<ReturnNote | null>(null);

  const filteredData = data.filter(d => 
    d.number.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generatePDF = (ret: ReturnNote) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("CREDIT NOTE", 105, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Credit Note No: ${ret.number}`, 14, 25);
    doc.text(`Date: ${ret.date}`, 14, 30);
    
    // Customer Info
    doc.text("To,", 14, 40);
    doc.setFont("helvetica", "bold");
    doc.text(ret.customer, 14, 45);
    doc.setFont("helvetica", "normal");
    if (ret.customerDetails) {
      if (ret.customerDetails.address) doc.text(ret.customerDetails.address, 14, 50);
      if (ret.customerDetails.phone) doc.text(`Phone: ${ret.customerDetails.phone}`, 14, 55);
      if (ret.customerDetails.gst) doc.text(`GSTIN: ${ret.customerDetails.gst}`, 14, 60);
    }

    // Items Table
    const tableData = ret.items.map(item => [
      item.name + (item.serialNumber ? ` (SN: ${item.serialNumber})` : ""),
      item.quantity,
      `Rs ${item.price.toFixed(2)}`,
      `Rs ${item.total.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 70,
      head: [["Description of Goods", "Qty", "Rate", "Amount"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 70;
    
    doc.setFont("helvetica", "bold");
    doc.text(`Total Credit Amount: Rs ${ret.amount.toFixed(2)}`, 14, finalY + 10);
    
    doc.save(`Credit_Note_${ret.number}.pdf`);
  };

  const handleDeleteClick = (ret: ReturnNote) => {
    setReturnToDelete(ret);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!returnToDelete) return;
    const res = await deleteSalesReturn(returnToDelete.id);
    if (res.success) {
      setData(data.filter(d => d.id !== returnToDelete.id));
      setIsDeleteDialogOpen(false);
    } else {
      alert(res.error || "Failed to delete return");
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/sales">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Sales Returns (Credit Notes)</h2>
        </div>
        <Link href="/sales/returns/new" className="w-full sm:w-auto">
          <Button className="bg-red-600 hover:bg-red-700 w-full sm:w-auto">Create Return</Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search returns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 bg-white"
          />
        </div>
      </div>

      <div className="rounded-md border bg-white overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>Return No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((ret) => (
              <TableRow key={ret.id}>
                <TableCell className="font-medium">{ret.number}</TableCell>
                <TableCell>{ret.date}</TableCell>
                <TableCell>{ret.customer}</TableCell>
                <TableCell className="text-right font-medium">₹{ret.amount.toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button onClick={() => generatePDF(ret)} variant="outline" size="sm" className="text-blue-600 h-8 px-2">
                      <FileText className="h-4 w-4 mr-1" /> PDF
                    </Button>
                    <Button onClick={() => handleDeleteClick(ret)} variant="outline" size="sm" className="text-red-600 h-8 px-2 hover:bg-red-50 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredData.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No sales returns found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Credit Note</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete <strong>{returnToDelete?.number}</strong>? 
            <br/><br/>
            This will reverse the stock changes and update the customer's balance back.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmDelete} variant="destructive">Yes, Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
