"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpRight, ArrowDownRight, Trash2, FileText, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deletePayment, createPayment, getDueBills } from "../actions/payment";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Payment = {
  id: string;
  reference: string;
  date: string;
  party: string | undefined;
  partyPhone?: string;
  amount: number;
  method: string;
  type: "Received" | "Sent";
  appliedTo?: string;
};

type Customer = { id: string; name: string; currentBalance: number };
type Supplier = { id: string; name: string; currentBalance: number };

export function PaymentsTable({ 
  initialData, 
  customers, 
  suppliers,
  settings 
}: { 
  initialData: Payment[], 
  customers: Customer[], 
  suppliers: Supplier[],
  settings?: any
}) {
  const [payments, setPayments] = useState<Payment[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payType, setPayType] = useState<"Received" | "Sent">("Received");
  
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  
  const [dueBills, setDueBills] = useState<any[]>([]);
  const [selectedBillId, setSelectedBillId] = useState("");

  useEffect(() => {
    if (!selectedPartyId) {
      setDueBills([]);
      setSelectedBillId("");
      return;
    }
    const fetchBills = async () => {
      const bills = await getDueBills(selectedPartyId, payType === "Received" ? "Customer" : "Supplier");
      setDueBills(bills);
      setSelectedBillId("");
    };
    fetchBills();
  }, [selectedPartyId, payType]);

  const handleBillSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const billId = e.target.value;
    setSelectedBillId(billId);
    if (billId) {
      const bill = dueBills.find(b => b.id === billId);
      if (bill) setAmount(bill.due.toString());
    }
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const filteredPayments = payments.filter(p => 
    p.reference.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.party?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (type: "Received" | "Sent") => {
    setPayType(type);
    setSelectedPartyId("");
    setAmount("");
    setMethod("Bank Transfer");
    setIsPayModalOpen(true);
  };

  const handleSavePayment = async () => {
    if (!selectedPartyId || !amount || Number(amount) <= 0) return alert("Invalid details");

    const payload = {
      amount: Number(amount),
      method,
      reference: "", // Optional
      customerId: payType === "Received" ? selectedPartyId : undefined,
      supplierId: payType === "Sent" ? selectedPartyId : undefined,
      invoiceId: payType === "Received" && selectedBillId ? selectedBillId : undefined,
      purchaseId: payType === "Sent" && selectedBillId ? selectedBillId : undefined,
    };

    const res = await createPayment(payload);
    if (res.success) {
      window.location.reload(); // Quick refresh to get new state and balances
    } else {
      alert("Error: " + res.error);
    }
  };

  const handleDeleteClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPayment) return;
    const res = await deletePayment(selectedPayment.id);
    if (res.success) {
      setPayments(payments.filter(p => p.id !== selectedPayment.id));
      setIsDeleteDialogOpen(false);
    }
  };

  const handleGenerateReceiptPDF = (payment: Payment, action: 'save' | 'view' = 'save') => {
    const doc = new jsPDF();
    
    // Outer Border
    doc.rect(10, 10, 190, 120);
    
    // Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT RECEIPT", 105, 18, { align: "center" });
    doc.line(10, 24, 200, 24); // Horizontal line
    
    // Company Details
    doc.setFontSize(12);
    doc.text(settings?.name || "ACCOUNTRA INC.", 12, 32);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    if (settings?.address) doc.text(settings.address, 12, 38);
    if (settings?.telephone || settings?.mobile) doc.text(`Phone: ${settings.telephone || settings.mobile}`, 12, 44);
    if (settings?.email) doc.text(`Email: ${settings.email}`, 12, 50);
    
    // Receipt Details
    doc.setFont("helvetica", "bold");
    doc.text("Receipt No.", 110, 32);
    doc.text(`: ${payment.reference}`, 145, 32);
    
    doc.text("Date", 110, 38);
    doc.text(`: ${payment.date}`, 145, 38);
    
    doc.line(10, 56, 200, 56);
    
    // Payment Content
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(payment.type === "Received" ? "Received From:" : "Paid To:", 12, 64);
    doc.text(payment.party || "Unknown", 45, 64);
    
    doc.setFont("helvetica", "normal");
    doc.text("Payment Method :", 12, 72);
    doc.text(payment.method, 45, 72);
    
    doc.text("Applied Against :", 110, 72);
    doc.text(payment.appliedTo || "Advance / On Account", 145, 72);
    
    doc.setFont("helvetica", "bold");
    doc.text("Amount :", 12, 82);
    doc.text(`Rs. ${payment.amount.toFixed(2)}`, 45, 82);
    
    doc.setFont("helvetica", "normal");
    doc.text(`(Amount in words: Rupees ${Math.floor(payment.amount)} Only)`, 12, 88);
    
    doc.line(10, 96, 200, 96);
    
    // Signature
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`For ${settings?.name || "ACCOUNTRA INC."}`, 190, 106, { align: "right" });
    doc.text("Authorized Signatory", 190, 120, { align: "right" });

    if (action === 'view') {
      const pdfUrl = doc.output('bloburl');
      window.open(pdfUrl, '_blank');
    } else {
      doc.save(`Receipt_${payment.reference}.pdf`);
    }
  };

  const handleWhatsAppShare = (payment: Payment) => {
    const phone = payment.partyPhone || "";
    const actionText = payment.type === "Received" ? "received payment from you" : "made a payment to you";
    const message = `Hello *${payment.party}*,\n\nThis is a confirmation that we have *${actionText}* for *Rs. ${payment.amount.toFixed(2)}* on *${payment.date}*.\n\n*Receipt No:* ${payment.reference}\n*Method:* ${payment.method}\n*Applied To:* ${payment.appliedTo || "Advance / On Account"}\n\nThank you, \n*${settings?.name || "Our Company"}*`;
    
    const cleanPhone = phone.replace(/\D/g, '');
    const waUrl = cleanPhone 
      ? `https://wa.me/91${cleanPhone.length === 10 ? cleanPhone : cleanPhone.slice(-10)}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
      
    window.open(waUrl, '_blank');
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Payments</h2>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenModal("Received")} variant="outline" className="flex-1 sm:flex-none text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200">
            <ArrowDownRight className="mr-2 h-4 w-4" /> Receive Payment
          </Button>
          <Button onClick={() => handleOpenModal("Sent")} variant="outline" className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
            <ArrowUpRight className="mr-2 h-4 w-4" /> Make Payment
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search payments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 bg-white"
          />
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer/Supplier</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Applied To</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell 
                  className="font-medium text-blue-600 cursor-pointer hover:underline"
                  onClick={() => handleGenerateReceiptPDF(payment, 'view')}
                >
                  {payment.reference}
                </TableCell>
                <TableCell>{payment.date}</TableCell>
                <TableCell>{payment.party}</TableCell>
                <TableCell>{payment.method}</TableCell>
                <TableCell>
                  <Badge variant={payment.type === "Received" ? "outline" : "secondary"} className={payment.type === "Received" ? "text-green-600 border-green-200 bg-green-50" : "text-red-600 border-red-200 bg-red-50"}>
                    {payment.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-500 text-sm">{payment.appliedTo}</TableCell>
                <TableCell className={`text-right font-medium ${payment.type === "Received" ? "text-green-600" : "text-red-600"}`}>
                  {payment.type === "Received" ? "+" : "-"}₹{payment.amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-right flex justify-end gap-1">
                  <Button onClick={() => handleWhatsAppShare(payment)} variant="ghost" size="sm" title="Share on WhatsApp" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => handleGenerateReceiptPDF(payment)} variant="ghost" size="sm" title="Download Receipt" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => handleDeleteClick(payment)} variant="ghost" size="sm" title="Delete Payment" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredPayments.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                  No payments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Make/Receive Payment Modal */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>{payType === "Received" ? "Receive Payment (From Customer)" : "Make Payment (To Supplier)"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>{payType === "Received" ? "Customer" : "Supplier"}</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                value={selectedPartyId}
                onChange={(e) => setSelectedPartyId(e.target.value)}
              >
                <option value="">Select...</option>
                {payType === "Received" 
                  ? customers.map(c => <option key={c.id} value={c.id}>{c.name} (Due: ₹{c.currentBalance})</option>)
                  : suppliers.map(s => <option key={s.id} value={s.id}>{s.name} (Owe: ₹{s.currentBalance})</option>)
                }
              </select>
            </div>
              <div className="space-y-2 bg-slate-50 p-3 rounded-md border">
                <Label className="text-blue-700">Applied Against</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                  value={selectedBillId}
                  onChange={handleBillSelect}
                >
                  <option value="">Advance Payment / On Account</option>
                  {dueBills.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.billNumber} | Due: ₹{b.due} (Total: ₹{b.total})
                    </option>
                  ))}
                </select>
              </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option>Bank Transfer</option>
                <option>Cash</option>
                <option>Credit Card</option>
                <option>Cheque</option>
                <option>UPI</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePayment} className={payType === "Received" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}>
              Save Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Payment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete this payment? This will revert the party's balance.
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
