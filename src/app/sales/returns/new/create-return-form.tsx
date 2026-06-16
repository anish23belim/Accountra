"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Trash2, Plus, ArrowLeft, Truck } from "lucide-react";
import { createSalesReturn } from "@/app/actions/returns";
import { saveCustomer } from "@/app/actions/customer";

type Customer = { id: string; name: string };
type Product = { id: string; name: string; sellingPrice: number; currentStock: number; unit: string; taxRate: number };

export function CreateReturnForm({ customers, products, locations }: { customers: Customer[], products: Product[], locations: any[] }) {
  const router = useRouter();
  
  const [localCustomers, setLocalCustomers] = useState(customers);
  const [customerId, setCustomerId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
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
  const [backendError, setBackendError] = useState("");

  // Quick Create Customer
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerContactPerson, setNewCustomerContactPerson] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerType, setNewCustomerType] = useState("Customer");
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "NEW") {
      setShowNewCustomerModal(true);
      setCustomerId("");
    } else {
      setCustomerId(e.target.value);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName) return alert("Firm Name is required");
    setIsCreatingCustomer(true);
    const res = await saveCustomer({ 
      name: newCustomerName, 
      contactPerson: newCustomerContactPerson,
      phone: newCustomerPhone, 
      customerType: newCustomerType 
    });
    if (res.success && res.id) {
      const newCust = { id: res.id, name: newCustomerName };
      setLocalCustomers([...localCustomers, newCust]);
      setCustomerId(res.id);
      setShowNewCustomerModal(false);
      setNewCustomerName("");
      setNewCustomerContactPerson("");
      setNewCustomerPhone("");
    } else {
      alert("Error: " + res.error);
    }
    setIsCreatingCustomer(false);
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
            updated.price = product.sellingPrice;
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
    setBackendError("");
    if (!customerId) return alert("Please select a customer");
    if (items.some(i => !i.productId || i.quantity <= 0)) return alert("Please fill all items correctly");
    
    // No frontend stock validation for Returns because we are receiving stock back.
    
    setIsSubmitting(true);
    
    const formattedItems: any[] = calculatedItems.map(i => ({
      productId: i.productId,
      serialNumber: i.serialNumber,
      quantity: i.quantity,
      unitPrice: i.price,
      discountAmount: i.discountAmount,
      taxRate: i.taxRate,
      total: i.total
    }));

    const res = await createSalesReturn({
      customerId,
      locationId: locationId || undefined,
      date,
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
      router.push("/sales/returns");
    } else {
      setBackendError(res.error || "An unknown error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sales
      </Button>

      <Card>
        <CardHeader className="bg-slate-50 border-b pb-4">
          <CardTitle className="text-xl text-blue-800">Sales Voucher (Invoice)</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          
          {/* Header Section */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Party (Sundry Debtor)</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={customerId}
                  onChange={handleCustomerChange}
                >
                  <option value="">-- Select Debtor --</option>
                  <option value="NEW" className="text-blue-600 font-semibold">+ Create New Party</option>
                  {localCustomers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Godown / Branch (Location)</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                >
                  <option value="">-- Main Shop (Default) --</option>
                  {locations.filter(l => !l.isDefault).map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Voucher Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10" />
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
                  <th className="px-4 py-3 w-24">Price (₹)</th>
                  <th className="px-4 py-3 w-24">Disc (₹)</th>
                  <th className="px-4 py-3 w-20">Tax (%)</th>
                  <th className="px-4 py-3 w-28 text-right">Amount (₹)</th>
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
                          <option key={p.id} value={p.id}>{p.name}</option>
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
                      {/* No stock warning for returns */}
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
              
              {backendError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm font-semibold border border-red-200">
                  {backendError}
                </div>
              )}

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 mt-6 h-12 text-lg text-white"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Voucher"}
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Quick Add Customer Modal */}
      <Dialog open={showNewCustomerModal} onOpenChange={setShowNewCustomerModal}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-blue-800">Quick Add Party</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Party Type</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                value={newCustomerType} 
                onChange={(e) => setNewCustomerType(e.target.value)}
              >
                <option value="Customer">Customer</option>
                <option value="Dealer">Dealer</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Firm Name <span className="text-red-500">*</span></Label>
              <Input 
                value={newCustomerName} 
                onChange={(e) => setNewCustomerName(e.target.value)} 
                placeholder="e.g. Sharma Electronics" 
                autoFocus 
              />
            </div>
            <div className="space-y-2">
              <Label>Dealer / Owner Name</Label>
              <Input 
                value={newCustomerContactPerson} 
                onChange={(e) => setNewCustomerContactPerson(e.target.value)} 
                placeholder="e.g. Ramesh Sharma" 
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input 
                value={newCustomerPhone} 
                onChange={(e) => setNewCustomerPhone(e.target.value)} 
                placeholder="Enter phone number" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCustomerModal(false)}>Cancel</Button>
            <Button onClick={handleCreateCustomer} disabled={isCreatingCustomer || !newCustomerName}>
              {isCreatingCustomer ? "Saving..." : "Save Party"}
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



