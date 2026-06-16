"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteSupplier, saveSupplier } from "../actions/supplier";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Supplier = {
  id: string;
  name: string;
  contactPerson: string | null;
  alias: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  state: string | null;
  pincode: string | null;
  panNumber: string | null;
  gstRegistrationType: string | null;
  gstNumber: string | null;
  creditPeriodDays: number | null;
  currentBalance: number;
};

export function SupplierTable({ initialData }: { initialData: Supplier[] }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  const [formData, setFormData] = useState({
    name: "", alias: "", email: "", phone: "", address: "", state: "", pincode: "",
    panNumber: "", gstRegistrationType: "Regular", gstNumber: "", creditPeriodDays: 0, balance: 0
  });
  
  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.alias && s.alias.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({ 
      name: "", alias: "", email: "", phone: "", address: "", state: "", pincode: "",
      panNumber: "", gstRegistrationType: "Regular", gstNumber: "", creditPeriodDays: 0, balance: 0
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      alias: supplier.alias || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      state: supplier.state || "",
      pincode: supplier.pincode || "",
      panNumber: supplier.panNumber || "",
      gstRegistrationType: supplier.gstRegistrationType || "Regular",
      gstNumber: supplier.gstNumber || "",
      creditPeriodDays: supplier.creditPeriodDays || 0,
      balance: supplier.currentBalance,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!editingSupplier) return;
    const res = await deleteSupplier(editingSupplier.id);
    if (res.success) {
      setSuppliers(suppliers.filter(s => s.id !== editingSupplier.id));
      setIsDeleteDialogOpen(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.name || isSaving) return;
    setIsSaving(true);
    
    const res = await saveSupplier({
      id: editingSupplier?.id,
      name: formData.name,
      alias: formData.alias,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      state: formData.state,
      pincode: formData.pincode,
      panNumber: formData.panNumber,
      gstRegistrationType: formData.gstRegistrationType,
      gstNumber: formData.gstNumber,
      creditPeriodDays: Number(formData.creditPeriodDays),
      balance: Number(formData.balance),
    });

    if (res.success) {
      window.location.reload(); 
    } else {
      alert("Error saving supplier.");
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Suppliers (Sundry Creditors)</h2>
        <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add Sundry Creditor
        </Button>
      </div>

      <div className="flex items-center gap-2 py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search creditors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 bg-white"
          />
        </div>
      </div>

      <div className="rounded-md border bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Alias</TableHead>
              <TableHead>Email/Phone</TableHead>
              <TableHead>GSTIN / PAN</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell>{supplier.alias || "-"}</TableCell>
                <TableCell>
                  <div className="text-sm">{supplier.email || "-"}</div>
                  <div className="text-xs text-muted-foreground">{supplier.phone || "-"}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{supplier.gstNumber || "-"}</div>
                  <div className="text-xs text-muted-foreground">{supplier.panNumber || "-"}</div>
                </TableCell>
                <TableCell className={`text-right font-medium ${supplier.currentBalance > 0 ? 'text-red-600' : supplier.currentBalance < 0 ? 'text-green-600' : ''}`}>
                  ₹{Math.abs(supplier.currentBalance).toFixed(2)}
                  {supplier.currentBalance > 0 ? ' Cr' : supplier.currentBalance < 0 ? ' Dr' : ''}
                </TableCell>
                <TableCell className="text-right">
                  <Button onClick={() => handleOpenEdit(supplier)} variant="ghost" size="sm" className="text-blue-600">Edit</Button>
                  <Button onClick={() => handleDeleteClick(supplier)} variant="ghost" size="sm" className="text-red-600 hover:text-red-700">Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredSuppliers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No suppliers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] bg-white h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-800">{editingSupplier ? 'Edit Sundry Creditor' : 'Create Sundry Creditor'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="alias">Alias</Label>
                <Input id="alias" value={formData.alias} onChange={e => setFormData({...formData, alias: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone / Mobile</Label>
                <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border rounded-md">
              <div className="grid gap-2 col-span-2">
                <Label className="font-semibold text-slate-700">Tax & Registration Details</Label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="panNumber">PAN / IT No.</Label>
                <Input id="panNumber" value={formData.panNumber} onChange={e => setFormData({...formData, panNumber: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gstRegistrationType">Registration Type</Label>
                <select 
                  id="gstRegistrationType"
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                  value={formData.gstRegistrationType} 
                  onChange={e => setFormData({...formData, gstRegistrationType: e.target.value})}
                >
                  <option value="Regular">Regular</option>
                  <option value="Composition">Composition</option>
                  <option value="Unregistered">Unregistered</option>
                </select>
              </div>
              <div className="grid gap-2 col-span-2">
                <Label htmlFor="gstNumber">GSTIN / UIN</Label>
                <Input id="gstNumber" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="creditPeriodDays">Default Credit Period (Days)</Label>
                <Input id="creditPeriodDays" type="number" value={formData.creditPeriodDays} onChange={e => setFormData({...formData, creditPeriodDays: Number(e.target.value)})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="balance">Opening Balance (Cr: Positive, Dr: Negative)</Label>
                <Input id="balance" type="number" value={formData.balance} onChange={e => setFormData({...formData, balance: Number(e.target.value)})} />
              </div>
            </div>

          </div>
          <DialogFooter className="sticky bottom-0 bg-white py-2 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 px-8">
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Party</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete <strong>{editingSupplier?.name}</strong>? This action cannot be undone.
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
