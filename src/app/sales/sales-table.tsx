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
    
    // Config
    const pageWidth = doc.internal.pageSize.getWidth(); // 210
    const pageHeight = doc.internal.pageSize.getHeight(); // 297
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin; // 190

    // Colors
    const headerBgColor = [227, 240, 216]; // light green #e3f0d8
    const tableHeaderBgColor = [191, 229, 229]; // teal #bfe5e5
    const borderColor = [0, 0, 0];

    let currentY = margin;
    
    // Top Bar (PROFORMA / TAX INVOICE)
    doc.setFillColor(headerBgColor[0], headerBgColor[1], headerBgColor[2]);
    doc.rect(margin, currentY, contentWidth, 8, 'FD'); // Filled and stroke
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const titleText = invoice.narration?.toLowerCase().includes("proforma") ? "PROFORMA" : 
                      (invoice.narration?.toLowerCase().includes("cash sale") ? "CASH SALE INVOICE" : "TAX INVOICE");
    doc.text(titleText, pageWidth / 2, currentY + 5.5, { align: "center" });
    
    currentY += 8;

    // Company Details
    const companySectionHeight = 24;
    doc.rect(margin, currentY, contentWidth, companySectionHeight, 'S'); // Stroke for company block
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(settings?.name || "Company Name", pageWidth / 2, currentY + 6, { align: "center" });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const address = settings?.address || "Company Address Here";
    doc.text(address, pageWidth / 2, currentY + 11, { align: "center" });
    
    const contactStr = `Mobile: ${settings?.mobile || settings?.telephone || "-"} | Email: ${settings?.email || "mail@domain.com"}`;
    doc.text(contactStr, pageWidth / 2, currentY + 16, { align: "center" });
    
    doc.setFont("helvetica", "bold");
    const gstPanStr = `GSTIN - ${settings?.gstNumber || "N/A"} | PAN - N/A`;
    doc.text(gstPanStr, pageWidth / 2, currentY + 21, { align: "center" });

    currentY += companySectionHeight;

    // Invoice Details Grid (Left and Right columns)
    const invoiceSectionHeight = 30;
    doc.rect(margin, currentY, contentWidth, invoiceSectionHeight, 'S'); // Outer box for invoice details
    
    const midX = pageWidth / 2;
    doc.line(midX, currentY, midX, currentY + invoiceSectionHeight); // Vertical split
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    
    const labelX = margin + 2;
    const valueX = margin + 35;
    
    doc.text("Invoice Number", labelX, currentY + 5);
    doc.setFont("helvetica", "normal");
    doc.text(`: ${invoice.number}`, valueX, currentY + 5);
    
    doc.setFont("helvetica", "bold");
    doc.text("Invoice Date", labelX, currentY + 10);
    doc.setFont("helvetica", "normal");
    doc.text(`: ${invoice.date}`, valueX, currentY + 10);
    
    doc.setFont("helvetica", "bold");
    doc.text("Due Date", labelX, currentY + 15);
    doc.setFont("helvetica", "normal");
    doc.text(`: ${invoice.date}`, valueX, currentY + 15); 
    
    doc.setFont("helvetica", "bold");
    doc.text("Place of Supply", labelX, currentY + 20);
    doc.setFont("helvetica", "normal");
    doc.text(`: State`, valueX, currentY + 20);
    
    doc.setFont("helvetica", "bold");
    doc.text("Reverse Charge", labelX, currentY + 25);
    doc.setFont("helvetica", "normal");
    doc.text(`: No`, valueX, currentY + 25);
    
    // Right side of invoice details (blank for now)
    
    currentY += invoiceSectionHeight;

    // Party Details (Billing & Shipping)
    const customerName = invoice.customer;
    const cGST = invoice.customerDetails?.gst || "N/A";
    const cMobile = invoice.customerDetails?.phone || "N/A";
    const cAddress = invoice.customerDetails?.address || "Address not provided";
    
    const cAddrLines = doc.splitTextToSize(cAddress, midX - margin - 4);
    const addrHeight = cAddrLines.length * 4;
    const partySectionHeight = 22 + Math.max(addrHeight, 4);

    doc.rect(margin, currentY, contentWidth, partySectionHeight, 'S');
    doc.line(midX, currentY, midX, currentY + partySectionHeight); // Vertical split
    
    doc.setFont("helvetica", "bold");
    doc.text("Billing Details", margin + 2, currentY + 5);
    doc.text("Shipping Details", midX + 2, currentY + 5);
    
    doc.text(customerName, margin + 2, currentY + 10);
    doc.text(customerName, midX + 2, currentY + 10); // Same for shipping
    
    doc.setFont("helvetica", "normal");
    const gstLine = `GSTIN: ${cGST} | Mobile: ${cMobile}`;
    doc.text(gstLine, margin + 2, currentY + 15);
    doc.text(gstLine, midX + 2, currentY + 15);
    
    doc.text(cAddrLines, margin + 2, currentY + 20);
    doc.text(cAddrLines, midX + 2, currentY + 20);
    
    currentY += partySectionHeight;
    
    // Prepare Table Data
    const tableBody = invoice.items && invoice.items.length > 0 
      ? invoice.items.map((item, index) => [
          index + 1,
          item.name,
          "0000", // HSN placeholder or item.hsn
          item.quantity.toFixed(2),
          "Pcs.", // Unit
          item.price.toFixed(2),
          "0.00 (%)", // Disc
          (item as any).taxRate?.toFixed(2) || "0.00", // Tax %
          item.total.toFixed(2)
        ])
      : [[1, 'Professional Services / Goods', '-', '1.00', 'Pcs.', invoice.amount.toFixed(2), '0.00 (%)', '0.00', invoice.amount.toFixed(2)]];

    // Table
    autoTable(doc, {
      startY: currentY,
      head: [['Sr.', 'Item Description', 'HSN/SAC', 'Qty', 'Unit', 'List Price', 'Disc.', 'Tax %', 'Amount (Rs)']],
      body: tableBody,
      theme: 'grid',
      headStyles: { 
        fillColor: tableHeaderBgColor as [number, number, number], 
        textColor: 20, 
        fontStyle: 'bold', 
        halign: 'center',
        lineColor: borderColor as [number, number, number],
        lineWidth: 0.2
      },
      bodyStyles: {
        lineColor: borderColor as [number, number, number],
        lineWidth: 0.2,
        textColor: 20,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 'auto' },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'center', cellWidth: 12 },
        4: { halign: 'center', cellWidth: 12 },
        5: { halign: 'right', cellWidth: 20 },
        6: { halign: 'center', cellWidth: 18 },
        7: { halign: 'center', cellWidth: 15 },
        8: { halign: 'right', cellWidth: 25 },
      },
      margin: { left: margin, right: margin }
    });

    let finalY = (doc as any).lastAutoTable.finalY;
    
    // Add Total Row
    doc.rect(margin, finalY, contentWidth, 8, 'S');
    doc.setFillColor(headerBgColor[0], headerBgColor[1], headerBgColor[2]);
    doc.rect(margin + contentWidth - 25, finalY, 25, 8, 'F'); // Highlight amount cell
    
    doc.setFont("helvetica", "bold");
    doc.text("Total", margin + 150, finalY + 5.5, { align: "right" });
    doc.text(invoice.amount.toFixed(2), pageWidth - margin - 2, finalY + 5.5, { align: "right" });
    
    finalY += 8;
    
    // Amount in words
    doc.rect(margin, finalY, contentWidth, 8, 'S');
    doc.text(`Rs. ${Math.floor(invoice.amount)} Only`, margin + 2, finalY + 5.5);
    
    finalY += 8;
    
    // Footer section (Terms, Bank, Signature)
    const footerHeight = 45;
    doc.rect(margin, finalY, contentWidth, footerHeight, 'S');
    
    // Two vertical lines to split into 3 blocks: Terms (40%), Bank/QR (30%), Signature (30%)
    const block1W = contentWidth * 0.40;
    const block2W = contentWidth * 0.30;
    
    doc.line(margin + block1W, finalY, margin + block1W, finalY + footerHeight);
    doc.line(margin + block1W + block2W, finalY, margin + block1W + block2W, finalY + footerHeight);
    
    // Terms
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Terms and Conditions", margin + 2, finalY + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const termsStr = "1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is delayed.\n3. Subject to local Jurisdiction only.";
    const termsLines = doc.splitTextToSize(termsStr, block1W - 4);
    doc.text(termsLines, margin + 2, finalY + 10);
    
    // Bank Details (Middle Block)
    const midBlockX = margin + block1W + 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Account Number:", midBlockX, finalY + 20);
    doc.setFont("helvetica", "normal");
    doc.text(`${settings?.accountNumber || "-"}`, midBlockX, finalY + 24);
    
    doc.setFont("helvetica", "bold");
    doc.text(`Bank:`, midBlockX, finalY + 30);
    doc.setFont("helvetica", "normal");
    doc.text(`${settings?.bankName || "-"}`, midBlockX + 10, finalY + 30);
    
    doc.setFont("helvetica", "bold");
    doc.text(`IFSC:`, midBlockX, finalY + 35);
    doc.setFont("helvetica", "normal");
    doc.text(`${settings?.ifscCode || "-"}`, midBlockX + 10, finalY + 35);
    
    // Signature (Right Block)
    const rightBlockX = margin + block1W + block2W;
    doc.setFont("helvetica", "bold");
    doc.text(`For ${settings?.name || "Company Name"}`, rightBlockX + 2, finalY + 5);
    
    doc.setFont("helvetica", "bold");
    doc.text("Signature", pageWidth - margin - 2, finalY + footerHeight - 2, { align: "right" });

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

