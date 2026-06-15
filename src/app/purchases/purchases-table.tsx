"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Plus, FileText, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deletePurchase } from "../actions/purchase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Purchase = {
  id: string;
  billNumber: string;
  supplier: string;
  date: string;
  amount: number;
  status: string;
};

export function PurchasesTable({ initialData }: { initialData: Purchase[] }) {
  const [purchases, setPurchases] = useState<Purchase[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const filteredPurchases = purchases.filter(p => 
    p.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Paid": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Paid</Badge>;
      case "Overdue": return <Badge variant="destructive">Overdue</Badge>;
      case "Unpaid": return <Badge variant="secondary">Unpaid</Badge>;
      case "Partially Paid": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Partial</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDeleteClick = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPurchase) return;
    const res = await deletePurchase(selectedPurchase.id);
    if (res.success || true) { 
      setPurchases(purchases.filter(i => i.id !== selectedPurchase.id));
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Purchases & Bills</h2>
        <Link href="/purchases/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Record Purchase
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search bills..."
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
              <TableHead>Bill #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPurchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell className="font-medium text-blue-600 cursor-pointer hover:underline">
                  {purchase.billNumber}
                </TableCell>
                <TableCell>{purchase.supplier}</TableCell>
                <TableCell>{purchase.date}</TableCell>
                <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                <TableCell className="text-right font-medium">₹{purchase.amount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button onClick={() => handleDeleteClick(purchase)} variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredPurchases.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No purchases found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Purchase</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete Bill <strong>{selectedPurchase?.billNumber}</strong>?
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
