"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Trash2, Plus, ArrowLeft, Truck } from "lucide-react";
import { createPurchase, PurchaseItemInput } from "@/app/actions/purchase";
import { saveSupplier } from "@/app/actions/supplier";

type Supplier = { id: string; name: string };
type Product = { id: string; name: string; purchasePrice: number; currentStock: number; unit: string; taxRate: number };

export function CreatePurchaseForm({ suppliers, products }: { suppliers: Supplier[], products: Product[] }) {
  const router = useRouter();
  
  const [localSuppliers, setLocalSuppliers] = useState(suppliers);
  const [supplierId, setSupplierId] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [narration, setNarration] = useState("");
  
  // Transport Details
  const [transporter, setTransporter] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [ewayBill, setEwayBill] = useState("");
  const [destination, setDestination] = useState("");
  
  const [items, setItems] = useState<Array<{ 
    id: number, 
    productId: string, 
    serialNumber: string,
    quantity: number, 
    price: number,
    unit: string,
    discountAmount: number,
    taxRate: number
  }>>([{ id: Date.now(), productId: "", serialNumber: "", quantity: 1, price: 0, unit: "PCS", discountAmount: 0, taxRate: 0 }]);
  
  // Bill Sundries
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [freightCharge, setFreightCharge] = useState(0);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Create Supplier
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierPhone, setNewSupplierNamePhone] = useState("");
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "NEW") {
      setShowNewSupplierModal(true);
      setSupplierId("");
    } else {
      setSupplierId(e.target.value);
    }
  };

  const handleCreateSupplier = async () => {
    if (!newSupplierName) return alert("Party Name is required");
    setIsCreatingSupplier(true);
    const res = await saveSupplier({ name: newSupplierName, phone: newSupplierPhone });
    if (res.success && res.id) {
      const newSup = { id: res.id, name: newSupplierName };
      setLocalSuppliers([...localSuppliers, newSup]);
      setSupplierId(res.id);
      setShowNewSupplierModal(false);
      setNewSupplierName("");
      setNewSupplierNamePhone("");
    } else {
      alert("Error: " + res.error);
    }
    setIsCreatingSupplier(false);
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), productId: "", serialNumber: "", quantity: 1, price: 0, unit: "PCS", discountAmount: 0, taxRate: 0 }]);
  };

  const handleRemoveItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: number, field: string, value: string | number) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === "productId") {
          const product = products.find(p => p.id === value);
          if (product) {
            updated.price = product.purchasePrice;
            updated.unit = product.unit;
            updated.taxRate = product.taxRate;
          }
        }
        return updated;
      }
      return item;
    }));
  };

  // Calculations
  const calculatedItems = useMemo(() => {
    return items.map(item => {
      const amount = (item.quantity * item.price) - item.discountAmount;
      const tax = (amount * item.taxRate) / 100;
      const total = amount + tax;
      return { ...item, amount, tax, total };
    });
  }, [items]);

  const subTotal = calculatedItems.reduce((sum, item) => sum + item.amount, 0);
  const totalTaxAmount = calculatedItems.reduce((sum, item) => sum + item.tax, 0);
  
  const totalAmount = subTotal + totalTaxAmount - globalDiscount + freightCharge;

  const handleSubmit = async () => {
    if (!supplierId) return alert("Please select a supplier");
    if (items.some(i => !i.productId || i.quantity <= 0)) return alert("Please fill all items correctly");
    
    setIsSubmitting(true);
    
    const formattedItems: PurchaseItemInput[] = calculatedItems.map(i => ({
      productId: i.productId,
      serialNumber: i.serialNumber,
      quantity: i.quantity,
      unitPrice: i.price,
      discountAmount: i.discountAmount,
      taxRate: i.taxRate,
      total: i.total
    }));

    const res = await createPurchase({
      supplierId,
      billNumber,
      narration,
      transporter,
      vehicleNo,
      ewayBill,
      destination,
      subTotal,
      discountAmount: globalDiscount,
      freightCharge,
      taxAmount: totalTaxAmount,
      totalAmount,
      items: formattedItems
    });

    if (res.success) {
      router.push("/purchases");
    } else {
      alert("Error: " + res.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Purchases
      </Button>

      <Card>
        <CardHeader className="bg-slate-50 border-b pb-4">
          <CardTitle className="text-xl text-blue-800">Purchase Voucher</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          
          {/* Header Section */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Party (Sundry Creditor)</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={supplierId}
                  onChange={handleSupplierChange}
                >
                  <option value="">-- Select Creditor --</option>
                  <option value="NEW" className="text-blue-600 font-semibold">+ Create New Party</option>
                  {localSuppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Supplier Bill / Reference No.</Label>
                <Input 
                  placeholder="e.g. INV-9921" 
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                />
              </div>
            </div>
            
            {/* Transport Details */}
            <div className="bg-slate-50 p-4 border rounded-md space-y-4">
              <div className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                <Truck className="w-4 h-4" /> Transport Details
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Transporter</Label>
                  <Input className="h-8 text-sm" value={transporter} onChange={(e) => setTransporter(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Vehicle No.</Label>
                  <Input className="h-8 text-sm" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">E-Way Bill</Label>
                  <Input className="h-8 text-sm" value={ewayBill} onChange={(e) => setEwayBill(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Destination</Label>
                  <Input className="h-8 text-sm" value={destination} onChange={(e) => setDestination(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Item Grid Section */}
          <div className="space-y-4 border rounded-md overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-700 bg-slate-100 uppercase border-b">
                <tr>
                  <th className="px-2 py-3 w-8 text-center">#</th>
                  <th className="px-4 py-3">Item Name</th>
                  <th className="px-4 py-3 w-40">Serial No. / Desc</th>
                  <th className="px-4 py-3 w-20">Qty</th>
                  <th className="px-4 py-3 w-20">Unit</th>
                  <th className="px-4 py-3 w-28">Cost (₹)</th>
                  <th className="px-4 py-3 w-28">Disc (₹)</th>
                  <th className="px-4 py-3 w-24">Tax (%)</th>
                  <th className="px-4 py-3 w-32 text-right">Amount (₹)</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {calculatedItems.map((item, index) => (
                  <tr key={item.id} className="border-b bg-white hover:bg-slate-50">
                    <td className="px-2 py-2 text-center text-slate-500 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2">
                      <select 
                        className="w-full bg-transparent border-0 focus:ring-0 text-sm p-1"
                        value={item.productId}
                        onChange={(e) => updateItem(item.id, "productId", e.target.value)}
                      >
                        <option value="">Select Item...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <SerialNumberManager 
                        value={item.serialNumber} 
                        onChange={(val) => updateItem(item.id, "serialNumber", val)} 
                        onQuantityChange={(qty) => {
                          if (qty > 0) updateItem(item.id, "quantity", qty);
                        }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input type="number" min="1" className="h-8 w-full px-2" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))} />
                    </td>
                    <td className="px-4 py-2">
                      <Input className="h-8 w-full px-2 bg-slate-50 cursor-not-allowed" readOnly value={item.unit} />
                    </td>
                    <td className="px-4 py-2">
                      <Input type="number" min="0" className="h-8 w-full px-2" value={item.price} onChange={(e) => updateItem(item.id, "price", Number(e.target.value))} />
                    </td>
                    <td className="px-4 py-2">
                      <Input type="number" min="0" className="h-8 w-full px-2 text-red-600" value={item.discountAmount} onChange={(e) => updateItem(item.id, "discountAmount", Number(e.target.value))} />
                    </td>
                    <td className="px-4 py-2">
                      <Input type="number" min="0" className="h-8 w-full px-2 text-blue-600" value={item.taxRate} onChange={(e) => updateItem(item.id, "taxRate", Number(e.target.value))} />
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {item.total.toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50" onClick={() => handleRemoveItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-2 bg-slate-50 border-t">
              <Button variant="ghost" size="sm" onClick={handleAddItem} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <Plus className="mr-2 h-4 w-4" /> Add Row
              </Button>
            </div>
          </div>

          {/* Footer & Bill Sundries */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label>Narration / Remarks</Label>
              <textarea 
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Enter remarks here..."
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
              />
            </div>

            <div className="bg-slate-50 p-6 rounded-lg border space-y-4">
              <h3 className="font-semibold text-slate-800 border-b pb-2">Bill Sundries</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Subtotal (Items)</span>
                  <span className="font-medium">₹{subTotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total Tax Amount</span>
                  <span className="font-medium text-blue-600">₹{totalTaxAmount.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-600">Bill Discount (-)</span>
                  <Input 
                    type="number" min="0" 
                    className="w-24 text-right h-8 text-red-600" 
                    value={globalDiscount} 
                    onChange={(e) => setGlobalDiscount(Number(e.target.value))} 
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-600">Freight & Forwarding (+)</span>
                  <Input 
                    type="number" min="0" 
                    className="w-24 text-right h-8" 
                    value={freightCharge} 
                    onChange={(e) => setFreightCharge(Number(e.target.value))} 
                  />
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-200 mt-4">
                  <span className="font-bold text-lg text-slate-900">Grand Total</span>
                  <span className="font-bold text-2xl text-blue-700">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 mt-6 h-12 text-lg" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Voucher"}
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Quick Add Supplier Modal */}
      <Dialog open={showNewSupplierModal} onOpenChange={setShowNewSupplierModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Party (Creditor)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Party Name <span className="text-red-500">*</span></Label>
              <Input 
                value={newSupplierName} 
                onChange={(e) => setNewSupplierName(e.target.value)} 
                placeholder="Enter party name" 
                autoFocus 
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input 
                value={newSupplierPhone} 
                onChange={(e) => setNewSupplierNamePhone(e.target.value)} 
                placeholder="Enter phone number" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSupplierModal(false)}>Cancel</Button>
            <Button onClick={handleCreateSupplier} disabled={isCreatingSupplier || !newSupplierName}>
              {isCreatingSupplier ? "Saving..." : "Save Party"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// A helper component to handle separate serial number tags in a Modal
function SerialNumberManager({ value, onChange, onQuantityChange }: { value: string; onChange: (v: string) => void; onQuantityChange: (qty: number) => void }) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const tags = value ? value.split(",").filter(Boolean) : [];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        const newTags = [...tags, newTag];
        onChange(newTags.join(","));
        onQuantityChange(newTags.length);
        setInputValue("");
      }
    }
  };

  const removeTag = (indexToRemove: number) => {
    const newTags = tags.filter((_, index) => index !== indexToRemove);
    onChange(newTags.join(","));
    onQuantityChange(newTags.length);
  };

  return (
    <>
      <Button 
        type="button" 
        onClick={() => setOpen(true)} 
        variant="outline" 
        size="sm" 
        className="h-8 w-full text-xs font-normal text-slate-600 bg-white shadow-sm border-dashed border-slate-300"
      >
        {tags.length > 0 ? (
          <span className="text-blue-700 font-medium">S.Nos ({tags.length})</span>
        ) : "Add S.Nos"}
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Item Serial Numbers</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Scan or Type Serial Number & Press Enter</Label>
            <Input 
              autoFocus
              placeholder="e.g. IMEI-12345" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="border rounded-md p-2 min-h-[150px] max-h-[300px] overflow-y-auto bg-slate-50">
            {tags.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No serial numbers added yet.</p>
            ) : (
              <div className="space-y-2">
                {tags.map((tag, index) => (
                  <div key={index} className="flex items-center justify-between bg-white border p-2 rounded-md text-sm shadow-sm">
                    <span className="font-medium text-slate-700">{index + 1}. {tag}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:bg-red-50" onClick={() => removeTag(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-slate-700">Total Scanned: <span className="text-blue-600 text-lg">{tags.length}</span></span>
            <Button onClick={() => setOpen(false)}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
