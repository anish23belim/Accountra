"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";
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
  amount: number;
  method: string;
  type: "Received" | "Sent";
};

type Customer = { id: string; name: string; currentBalance: number };
type Supplier = { id: string; name: string; currentBalance: number };

export function PaymentsTable({ 
  initialData, 
  customers, 
  suppliers 
}: { 
  initialData: Payment[], 
  customers: Customer[], 
  suppliers: Supplier[] 
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
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium text-slate-700">{payment.reference}</TableCell>
                <TableCell>{payment.date}</TableCell>
                <TableCell>{payment.party}</TableCell>
                <TableCell>{payment.method}</TableCell>
                <TableCell>
                  <Badge variant={payment.type === "Received" ? "outline" : "secondary"} className={payment.type === "Received" ? "text-green-600 border-green-200 bg-green-50" : "text-red-600 border-red-200 bg-red-50"}>
                    {payment.type}
                  </Badge>
                </TableCell>
                <TableCell className={`text-right font-medium ${payment.type === "Received" ? "text-green-600" : "text-red-600"}`}>
                  {payment.type === "Received" ? "+" : "-"}₹{payment.amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <Button onClick={() => handleDeleteClick(payment)} variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredPayments.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
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
            {dueBills.length > 0 && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-md border">
                <Label className="text-blue-700">Pending Bills (Select to auto-fill amount)</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                  value={selectedBillId}
                  onChange={handleBillSelect}
                >
                  <option value="">-- Apply as Advance / On Account --</option>
                  {dueBills.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.billNumber} | Due: ₹{b.due} (Total: ₹{b.total})
                    </option>
                  ))}
                </select>
              </div>
            )}
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
