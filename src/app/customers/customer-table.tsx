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
import { deleteCustomer, saveCustomer } from "../actions/customer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Customer = {
  id: string;
  name: string;
  contactPerson: string | null;
  customerType: string;
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

export function CustomerTable({ initialData }: { initialData: Customer[] }) {
  const [customers, setCustomers] = useState<Customer[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "", contactPerson: "", customerType: "Customer", alias: "", email: "", phone: "", address: "", state: "", pincode: "",
    panNumber: "", gstRegistrationType: "Regular", gstNumber: "", creditPeriodDays: 0, balance: 0
  });
  
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.contactPerson && c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (c.alias && c.alias.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === "All" || c.customerType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({ 
      name: "", contactPerson: "", customerType: "Customer", alias: "", email: "", phone: "", address: "", state: "", pincode: "",
      panNumber: "", gstRegistrationType: "Regular", gstNumber: "", creditPeriodDays: 0, balance: 0
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      contactPerson: customer.contactPerson || "",
      customerType: customer.customerType || "Customer",
      alias: customer.alias || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      state: customer.state || "",
      pincode: customer.pincode || "",
      panNumber: customer.panNumber || "",
      gstRegistrationType: customer.gstRegistrationType || "Regular",
      gstNumber: customer.gstNumber || "",
      creditPeriodDays: customer.creditPeriodDays || 0,
      balance: customer.currentBalance,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!editingCustomer) return;
    const res = await deleteCustomer(editingCustomer.id);
    if (res.success) {
      setCustomers(customers.filter(c => c.id !== editingCustomer.id));
      setIsDeleteDialogOpen(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.name || isSaving) return;
    setIsSaving(true);
    
    const res = await saveCustomer({
      id: editingCustomer?.id,
      name: formData.name,
      contactPerson: formData.contactPerson,
      customerType: formData.customerType,
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
      alert("Error saving customer.");
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Customers (Sundry Debtors)</h2>
        <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add Sundry Debtor
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 py-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search debtors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 bg-white"
          />
        </div>
        <div className="flex border rounded-md overflow-hidden bg-white">
          <button 
            onClick={() => setTypeFilter("All")}
            className={`px-4 py-2 text-sm font-medium ${typeFilter === "All" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
          >
            All
          </button>
          <button 
            onClick={() => setTypeFilter("Customer")}
            className={`px-4 py-2 text-sm font-medium border-l ${typeFilter === "Customer" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Customers
          </button>
          <button 
            onClick={() => setTypeFilter("Dealer")}
            className={`px-4 py-2 text-sm font-medium border-l ${typeFilter === "Dealer" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Dealers
          </button>
        </div>
      </div>

      <div className="rounded-md border bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Firm / Customer Name</TableHead>
              <TableHead>Dealer / Contact</TableHead>
              <TableHead>Email/Phone</TableHead>
              <TableHead>GSTIN / PAN</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${customer.customerType === 'Dealer' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {customer.customerType || 'Customer'}
                  </span>
                </TableCell>
                <TableCell className="font-medium">
                  {customer.name}
                  {customer.alias && <span className="text-xs text-muted-foreground block">({customer.alias})</span>}
                </TableCell>
                <TableCell>{customer.contactPerson || "-"}</TableCell>
                <TableCell>
                  <div className="text-sm">{customer.email || "-"}</div>
                  <div className="text-xs text-muted-foreground">{customer.phone || "-"}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{customer.gstNumber || "-"}</div>
                  <div className="text-xs text-muted-foreground">{customer.panNumber || "-"}</div>
                </TableCell>
                <TableCell className={`text-right font-medium ${customer.currentBalance > 0 ? 'text-green-600' : customer.currentBalance < 0 ? 'text-red-600' : ''}`}>
                  ₹{Math.abs(customer.currentBalance).toFixed(2)}
                  {customer.currentBalance > 0 ? ' Dr' : customer.currentBalance < 0 ? ' Cr' : ''}
                </TableCell>
                <TableCell className="text-right">
                  <Button onClick={() => handleOpenEdit(customer)} variant="ghost" size="sm" className="text-blue-600">Edit</Button>
                  <Button onClick={() => handleDeleteClick(customer)} variant="ghost" size="sm" className="text-red-600 hover:text-red-700">Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredCustomers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  No customers found.
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
            <DialogTitle className="text-xl font-bold text-blue-800">{editingCustomer ? 'Edit Sundry Debtor' : 'Create Sundry Debtor'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customerType">Party Type</Label>
                <select 
                  id="customerType"
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                  value={formData.customerType} 
                  onChange={e => setFormData({...formData, customerType: e.target.value})}
                >
                  <option value="Customer">Customer</option>
                  <option value="Dealer">Dealer</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">{formData.customerType === 'Dealer' ? 'Firm Name' : 'Customer Name'} <span className="text-red-500">*</span></Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={formData.customerType === 'Dealer' ? "e.g. Sharma Electronics" : "e.g. Rahul Kumar"} />
              </div>
            </div>

            {formData.customerType === 'Dealer' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contactPerson">Dealer / Owner Name</Label>
                  <Input id="contactPerson" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} placeholder="e.g. Ramesh Sharma" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="e.g. 9876543210" />
                </div>
              </div>
            )}
            {formData.customerType === 'Customer' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="e.g. 9876543210" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="e.g. rahul@example.com" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="alias">Alias / Short Name</Label>
                <Input id="alias" value={formData.alias} onChange={e => setFormData({...formData, alias: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
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
                <Label htmlFor="balance">Opening Balance (Dr: Positive, Cr: Negative)</Label>
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
            Are you sure you want to delete <strong>{editingCustomer?.name}</strong>? This action cannot be undone.
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

