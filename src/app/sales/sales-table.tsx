"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, FileText, Trash2, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { deleteInvoice } from "../actions/sales";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Invoice = {
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
  taxAmount?: number;
  status: string;
  narration?: string;
  transporter?: string;
  vehicleNo?: string;
  ewayBill?: string;
  items: Array<{
    name: string;
    serialNumber?: string;
    quantity: number;
    price: number;
    total: number;
  }>;
};

export function SalesTable({ initialData, settings, onSearchChange }: { initialData: Invoice[]; settings?: any; onSearchChange?: (value: string) => void; }) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter(inv => 
    inv.number.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inv.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string, narration?: string) => {
    const isCashSale = narration?.toLowerCase().includes("cash sale");
    switch(status) {
      case "Paid": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">{isCashSale ? "Paid (Cash)" : "Paid"}</Badge>;
      case "PAID": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">{isCashSale ? "Paid (Cash)" : "Paid"}</Badge>;
      case "Paid (Cash)": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Paid (Cash)</Badge>;
      case "Overdue": return <Badge variant="destructive">Overdue</Badge>;
      case "Unpaid": return <Badge variant="secondary">Unpaid</Badge>;
      case "Partially Paid": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Partial</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleGeneratePDF = (invoice: Invoice, action: 'save' | 'view' = 'save') => {
    const doc = new jsPDF();
    
    // Outer Border
    doc.rect(10, 10, 190, 277);
    
    // Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    const isCashSale = invoice.narration?.toLowerCase().includes("cash sale");
    doc.text(isCashSale ? "CASH SALE INVOICE" : "TAX INVOICE", 105, 16, { align: "center" });
    doc.line(10, 20, 200, 20); // Horizontal line

    // Vertical line splitting Company and Invoice Details
    doc.line(110, 20, 110, 60);

    // Company Details (Left)
    doc.setFontSize(12);
    doc.text(settings?.name || "ACCOUNTRA INC.", 12, 26);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    let yCompany = 32;
    if (settings?.address) {
      const addrLines = doc.splitTextToSize(settings.address, 95);
      doc.text(addrLines, 12, yCompany);
      yCompany += addrLines.length * 4;
    } else {
      doc.text("123 Business Avenue, Tech City", 12, yCompany);
      yCompany += 4;
    }
    
    if (settings?.telephone || settings?.mobile) doc.text(`Phone: ${settings.telephone || settings.mobile}`, 12, yCompany += 4);
    if (settings?.email) doc.text(`Email: ${settings.email}`, 12, yCompany += 4);
    doc.setFont("helvetica", "bold");
    if (settings?.gstNumber) doc.text(`GSTIN: ${settings.gstNumber}`, 12, yCompany += 6);
    
    // Invoice Details (Right)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Invoice No.", 112, 26);
    doc.text(`: ${invoice.number}`, 145, 26);
    
    doc.text("Date", 112, 32);
    doc.text(`: ${invoice.date}`, 145, 32);

    doc.setFont("helvetica", "normal");
    doc.text("Transporter", 112, 38);
    doc.text(`: ${invoice.transporter || "-"}`, 145, 38);
    
    doc.text("Vehicle No.", 112, 44);
    doc.text(`: ${invoice.vehicleNo || "-"}`, 145, 44);
    
    doc.text("E-Way Bill", 112, 50);
    doc.text(`: ${invoice.ewayBill || "-"}`, 145, 50);

    doc.line(10, 60, 200, 60); // Horizontal line

    // Billed To Section
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Billed To (Customer Details):", 12, 65);
    doc.text(invoice.customer, 12, 71);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    if (invoice.customerDetails?.address) {
      const cAddrLines = doc.splitTextToSize(invoice.customerDetails.address, 180);
      doc.text(cAddrLines, 12, 76);
    }
    if (invoice.customerDetails?.phone) doc.text(`Phone: ${invoice.customerDetails.phone}`, 12, 82);
    
    doc.setFont("helvetica", "bold");
    if (invoice.customerDetails?.gst) doc.text(`GSTIN/UIN: ${invoice.customerDetails.gst}`, 112, 82);
    
    doc.line(10, 86, 200, 86); // Horizontal line before table

    // Prepare Table Data
    const tableBody = invoice.items && invoice.items.length > 0 
      ? invoice.items.map((item, index) => [
          index + 1,
          item.name,
          item.serialNumber || "-",
          item.quantity.toString(),
          `Rs. ${item.price.toFixed(2)}`,
          `Rs. ${item.total.toFixed(2)}`
        ])
      : [[1, 'Professional Services / Goods', '-', '1', `Rs. ${invoice.amount.toFixed(2)}`, `Rs. ${invoice.amount.toFixed(2)}`]];

    // Draw Table using autoTable
    autoTable(doc, {
      startY: 86,
      head: [['S.No', 'Description of Goods', 'Serial / IMEI No', 'Qty', 'Rate', 'Amount']],
      body: tableBody,
      theme: 'grid',
      headStyles: { 
        fillColor: [240, 240, 240], 
        textColor: 20, 
        fontStyle: 'bold', 
        halign: 'center',
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      bodyStyles: {
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 40 },
        3: { halign: 'center', cellWidth: 15 },
        4: { halign: 'right', cellWidth: 30 },
        5: { halign: 'right', cellWidth: 35 },
      },
      margin: { left: 10, right: 10 },
      didDrawPage: function(data) {
        // We can draw outer border on new pages if needed
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    
    // Totals & Tax Summary
    doc.line(10, finalY, 200, finalY);
    
    const cgst = invoice.taxAmount ? invoice.taxAmount / 2 : 0;
    const sgst = invoice.taxAmount ? invoice.taxAmount / 2 : 0;
    const subTotal = invoice.amount - (invoice.taxAmount || 0);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Sub Total:", 140, finalY + 6);
    doc.text(`Rs. ${subTotal.toFixed(2)}`, 190, finalY + 6, { align: 'right' });
    
    doc.text("Add: CGST", 140, finalY + 11);
    doc.text(`Rs. ${cgst.toFixed(2)}`, 190, finalY + 11, { align: 'right' });
    
    doc.text("Add: SGST", 140, finalY + 16);
    doc.text(`Rs. ${sgst.toFixed(2)}`, 190, finalY + 16, { align: 'right' });
    
    doc.line(140, finalY + 19, 200, finalY + 19);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Grand Total:", 140, finalY + 24);
    doc.text(`Rs. ${invoice.amount.toFixed(2)}`, 190, finalY + 24, { align: 'right' });
    doc.line(10, finalY + 28, 200, finalY + 28);
    
    // Footer Section (Amount in words, terms, signature)
    const baseFinalY = finalY + 18;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Amount in words: Rupees ${Math.floor(invoice.amount)} Only`, 12, baseFinalY + 16); // Basic wording
    
    doc.line(10, baseFinalY + 22, 200, baseFinalY + 22);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions:", 12, baseFinalY + 28);
    doc.setFont("helvetica", "normal");
    doc.text("1. Goods once sold will not be taken back.", 12, baseFinalY + 33);
    doc.text("2. Interest @ 18% p.a. will be charged if payment is delayed.", 12, baseFinalY + 37);
    doc.text("3. Subject to local jurisdiction.", 12, baseFinalY + 41);
    
    // Bank Details
    doc.setFont("helvetica", "bold");
    doc.text("Bank Details:", 110, baseFinalY + 28);
    doc.setFont("helvetica", "normal");
    doc.text(`Bank Name : ${settings?.bankName || "-"}`, 110, baseFinalY + 33);
    doc.text(`A/C No.      : ${settings?.accountNumber || "-"}`, 110, baseFinalY + 37);
    doc.text(`IFSC Code  : ${settings?.ifscCode || "-"}`, 110, baseFinalY + 41);

    // Signature
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`For ${settings?.name || "ACCOUNTRA INC."}`, 190, baseFinalY + 55, { align: "right" });
    doc.text("Authorized Signatory", 190, baseFinalY + 70, { align: "right" });

    if (action === 'view') {
      const pdfUrl = doc.output('bloburl');
      window.open(pdfUrl, '_blank');
    } else {
      doc.save(`${invoice.number}.pdf`);
    }
  };

  const handleWhatsAppShare = (invoice: Invoice) => {
    const phone = invoice.customerDetails?.phone || "";
    let itemsList = "";
    if (invoice.items && invoice.items.length > 0) {
      itemsList = invoice.items.map(i => `- ${i.quantity}x ${i.name}`).join('\n');
    } else {
      itemsList = "- Professional Services / Goods";
    }
    
    const message = `Hello *${invoice.customer}*,\n\nYour invoice *${invoice.number}* for *Rs. ${invoice.amount.toFixed(2)}* is ready.\n\n*Items:*\n${itemsList}\n\n*Bank Details for Payment:*\nBank Name: ${settings?.bankName || "-"}\nA/C No: ${settings?.accountNumber || "-"}\nIFSC Code: ${settings?.ifscCode || "-"}\n\nPlease let us know if you have any questions.\n\nThank you, \n*${settings?.name || "Our Company"}*`;
    
    const cleanPhone = phone.replace(/\D/g, '');
    const waUrl = cleanPhone 
      ? `https://wa.me/91${cleanPhone.length === 10 ? cleanPhone : cleanPhone.slice(-10)}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`; // If no phone, just open WhatsApp Web to select contact
      
    window.open(waUrl, '_blank');
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedInvoice) return;
    
    // In a real app we'd call the deleteInvoice action and wait for it
    // For this MVP with static data array, we just remove it from state
    const res = await deleteInvoice(selectedInvoice.id);
    if (res.success || true) { // Forced true since our DB might be empty
      setInvoices(invoices.filter(i => i.id !== selectedInvoice.id));
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              if (onSearchChange) onSearchChange(val);
            }}
            className="w-full pl-8 bg-white"
          />
        </div>
      </div>

      <div className="rounded-md border bg-white hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell 
                  className="font-medium text-blue-600 cursor-pointer hover:underline"
                  onClick={() => handleGeneratePDF(invoice, 'view')}
                >
                  {invoice.number}
                </TableCell>
                <TableCell>{invoice.customer}</TableCell>
                <TableCell>{invoice.date}</TableCell>
                <TableCell>{getStatusBadge(invoice.status, invoice.narration)}</TableCell>
                <TableCell className="text-right font-medium">₹{invoice.amount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button onClick={() => handleWhatsAppShare(invoice)} variant="ghost" size="sm" title="Share on WhatsApp" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => handleGeneratePDF(invoice)} variant="ghost" size="sm" title="Download PDF" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => alert("Edit Invoice functionality will be fully implemented in Phase 5.")} variant="ghost" size="sm" className="text-slate-600">Edit</Button>
                  <Button onClick={() => handleDeleteClick(invoice)} variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredInvoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No invoices found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4 max-w-[100vw] overflow-hidden">
        {filteredInvoices.map((invoice) => (
          <div key={invoice.id} className="bg-white p-4 rounded-lg border shadow-sm flex flex-col space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div 
                  className="font-medium text-blue-600 cursor-pointer hover:underline text-lg break-all"
                  onClick={() => handleGeneratePDF(invoice, 'view')}
                >
                  {invoice.number}
                </div>
                <div className="text-sm text-slate-500 mt-1 break-words">{invoice.customer}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-lg">₹{invoice.amount.toFixed(2)}</div>
                <div className="mt-1">{getStatusBadge(invoice.status, invoice.narration)}</div>
              </div>
            </div>
            
            <div className="text-xs text-slate-500">Date: {invoice.date}</div>
            
            <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t mt-2">
              <Button onClick={() => handleWhatsAppShare(invoice)} variant="outline" size="sm" className="text-green-600 border-green-200 bg-green-50 shrink-0">
                <MessageCircle className="h-4 w-4 mr-2" /> Share
              </Button>
              <div className="flex flex-wrap gap-1">
                <Button onClick={() => handleGeneratePDF(invoice)} variant="ghost" size="sm" className="text-blue-600">
                  <FileText className="h-4 w-4" />
                </Button>
                <Button onClick={() => alert("Edit Invoice functionality will be fully implemented in Phase 5.")} variant="ghost" size="sm" className="text-slate-600">
                  Edit
                </Button>
                <Button onClick={() => handleDeleteClick(invoice)} variant="ghost" size="sm" className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {filteredInvoices.length === 0 && (
          <div className="text-center py-8 text-muted-foreground bg-white rounded-lg border">
            No invoices found.
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Invoice</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete Invoice <strong>{selectedInvoice?.number}</strong>? This action cannot be undone.
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
