"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteExpense, saveExpense } from "../actions/expense";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Expense = {
  id: string;
  date: Date;
  category: string;
  description: string | null;
  amount: number;
  paymentMethod: string;
};

export function ExpenseTable({ initialData }: { initialData: Expense[] }) {
  const [expenses, setExpenses] = useState<Expense[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const [formData, setFormData] = useState({ category: "", description: "", amount: 0, paymentMethod: "CASH" });
  
  const filteredExpenses = expenses.filter(e => 
    e.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormData({ category: "Office Supplies", description: "", amount: 0, paymentMethod: "CASH" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      description: expense.description || "",
      amount: expense.amount,
      paymentMethod: expense.paymentMethod,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (expense: Expense) => {
    setEditingExpense(expense);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!editingExpense) return;
    const res = await deleteExpense(editingExpense.id);
    if (res.success) {
      setExpenses(expenses.filter(e => e.id !== editingExpense.id));
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSave = async () => {
    if (!formData.category || formData.amount <= 0) return;
    
    const res = await saveExpense({
      id: editingExpense?.id,
      category: formData.category,
      description: formData.description,
      amount: Number(formData.amount),
      paymentMethod: formData.paymentMethod,
    });

    if (res.success) {
      window.location.reload(); 
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
        <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Record Expense
        </Button>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 bg-white"
          />
        </div>
        <Button variant="outline" className="bg-white">
          <Filter className="mr-2 h-4 w-4" /> Filter
        </Button>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">{expense.category}</TableCell>
                <TableCell>{expense.description || "-"}</TableCell>
                <TableCell>{expense.paymentMethod.replace('_', ' ')}</TableCell>
                <TableCell className="text-right font-medium text-red-600">
                  ₹{expense.amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <Button onClick={() => handleOpenEdit(expense)} variant="ghost" size="sm" className="text-blue-600">Edit</Button>
                  <Button onClick={() => handleDeleteClick(expense)} variant="ghost" size="sm" className="text-red-600 hover:text-red-700">Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredExpenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No expenses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Record Expense'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="e.g. Office Supplies, Travel" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="method">Method (CASH, CARD, UPI)</Label>
                <Input id="method" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value.toUpperCase()})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Save Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Expense</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete this <strong>₹{editingExpense?.amount}</strong> expense? This action cannot be undone.
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
