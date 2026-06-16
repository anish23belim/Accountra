"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, ArrowRightLeft } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { updateStock, transferStock } from "@/app/actions/product";
import Link from "next/link";
import { BarcodeScanner } from "@/components/ui/barcode-scanner";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  currentStock: number;
  lowStockAlert: number;
  locationStocks?: Array<{
    quantity: number;
    locationId: string;
    location: { id: string; name: string; isDefault: boolean; };
  }>;
};

export function InventoryTable({ products, locations }: { products: Product[], locations?: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [newStockStr, setNewStockStr] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // For Global Stock Adjustment
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [adjustmentProductId, setAdjustmentProductId] = useState("");
  const [adjustmentLocationId, setAdjustmentLocationId] = useState("");

  // For Stock Transfer
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferProductId, setTransferProductId] = useState("");
  const [transferFromId, setTransferFromId] = useState("");
  const [transferToId, setTransferToId] = useState("");
  const [transferQty, setTransferQty] = useState("");

  const handleSaveAdjustment = async () => {
    if (!adjustmentProductId) return;
    setIsUpdating(true);
    const stockNum = parseInt(newStockStr) || 0;
    const res = await updateStock(adjustmentProductId, stockNum, adjustmentLocationId);
    if (res.success) {
      setIsAdjustmentOpen(false);
      setAdjustmentProductId("");
      setAdjustmentLocationId("");
    } else {
      alert(res.error);
    }
    setIsUpdating(false);
  };

  const handleSaveTransfer = async () => {
    if (!transferProductId || !transferFromId || !transferToId || !transferQty) return;
    setIsUpdating(true);
    const qty = parseInt(transferQty) || 0;
    const res = await transferStock(transferProductId, transferFromId, transferToId, qty);
    if (res.success) {
      setIsTransferOpen(false);
      setTransferProductId("");
      setTransferFromId("");
      setTransferToId("");
      setTransferQty("");
    } else {
      alert(res.error);
    }
    setIsUpdating(false);
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // If a location is selected, the product must have some stock there, or at least we still show it but with 0 stock.
    // Let's just show it and the stock will compute to 0.
    return matchesSearch;
  });

  const getDisplayStock = (p: Product) => {
    if (!selectedLocation) return p.currentStock;
    const ls = p.locationStocks?.find(ls => ls.locationId === selectedLocation);
    return ls ? ls.quantity : 0;
  };

  const handleUpdateClick = (p: Product) => {
    setEditProduct(p);
    setNewStockStr(getDisplayStock(p).toString());
    setAdjustmentLocationId(selectedLocation);
  };

  const handleSaveStock = async () => {
    if (!editProduct) return;
    setIsUpdating(true);
    const stockNum = parseInt(newStockStr) || 0;
    const res = await updateStock(editProduct.id, stockNum);
    if (res.success) {
      setEditProduct(null);
    } else {
      alert(res.error);
    }
    setIsUpdating(false);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Inventory Management</h2>
        <div className="flex gap-2">
          {locations && locations.length > 1 && (
            <Button variant="outline" className="flex-1 sm:flex-none text-purple-600 border-purple-200 hover:bg-purple-50" onClick={() => {
              setTransferProductId("");
              setTransferFromId("");
              setTransferToId("");
              setTransferQty("");
              setIsTransferOpen(true);
            }}>
              <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer Stock
            </Button>
          )}
          {/* Stock Adjustment usually means updating stock manually without a voucher */}
          <Button variant="outline" className="flex-1 sm:flex-none text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => {
            setAdjustmentProductId("");
            setNewStockStr("");
            setAdjustmentLocationId("");
            setIsAdjustmentOpen(true);
          }}>
            <Search className="mr-2 h-4 w-4" /> Adjustment
          </Button>
          {/* Receive Goods generally implies purchasing stock */}
          <Link href="/purchases/new" className="flex-1 sm:flex-none">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> Receive
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-4">
        <div className="relative w-full max-w-sm flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search items by name or SKU..."
              className="w-full pl-8 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <BarcodeScanner 
            onScan={(text) => setSearchTerm(text)} 
            buttonText="" 
            className="px-3"
          />
        </div>
        
        {locations && locations.length > 0 && (
          <select 
            className="flex h-10 w-full sm:max-w-xs rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="">All Locations (Total Stock)</option>
            {locations.map(l => (
              <option key={l.id} value={l.id}>{l.name} {l.isDefault ? "(Main)" : ""}</option>
            ))}
          </select>
        )}
      </div>

      <div className="rounded-md border bg-white hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Current Stock</TableHead>
              <TableHead className="text-right">Min. Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-slate-500">
                  No inventory items found.
                </TableCell>
              </TableRow>
            ) : filtered.map((item) => {
              const displayStock = getDisplayStock(item);
              const status = displayStock === 0 ? "Out of Stock" : displayStock < item.lowStockAlert ? "Low Stock" : "Healthy";
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.sku || '-'}</TableCell>
                  <TableCell className={`text-right font-bold ${displayStock === 0 ? 'text-red-600' : displayStock < item.lowStockAlert ? 'text-yellow-600' : 'text-slate-900'}`}>
                    {displayStock}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{item.lowStockAlert}</TableCell>
                  <TableCell>
                    <Badge variant={status === "Healthy" ? "default" : status === "Low Stock" ? "secondary" : "destructive"} 
                           className={status === "Healthy" ? "bg-green-100 text-green-800 hover:bg-green-100" : status === "Low Stock" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" : ""}>
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => handleUpdateClick(item)}>Update</Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-white rounded-lg border">
            No inventory items found.
          </div>
        ) : filtered.map((item) => {
          const displayStock = getDisplayStock(item);
          const status = displayStock === 0 ? "Out of Stock" : displayStock < item.lowStockAlert ? "Low Stock" : "Healthy";
          return (
            <div key={item.id} className="bg-white p-4 rounded-lg border shadow-sm flex flex-col space-y-2">
              <div className="flex justify-between items-start">
                <div className="font-medium text-lg text-slate-900">{item.name}</div>
                <Badge variant={status === "Healthy" ? "default" : status === "Low Stock" ? "secondary" : "destructive"} 
                       className={status === "Healthy" ? "bg-green-100 text-green-800 hover:bg-green-100" : status === "Low Stock" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" : ""}>
                  {status}
                </Badge>
              </div>
              <div className="text-sm text-slate-500">
                SKU: {item.sku || "-"}
              </div>
              <div className="flex justify-between items-center pt-2 border-t mt-2">
                <div className="text-sm flex flex-col">
                  <span className="text-muted-foreground">Current Stock</span>
                  <span className={`font-bold text-lg ${displayStock === 0 ? 'text-red-600' : displayStock < item.lowStockAlert ? 'text-yellow-600' : 'text-slate-900'}`}>
                    {displayStock} <span className="text-sm font-normal text-slate-500 ml-1">(Min: {item.lowStockAlert})</span>
                  </span>
                </div>
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200" onClick={() => handleUpdateClick(item)}>Update</Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock Update Modal (Individual) */}
      <Dialog open={!!editProduct} onOpenChange={(open) => !open && setEditProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input value={editProduct.name} disabled />
              </div>
              <div className="space-y-2">
                <Label>Current Stock Quantity</Label>
                <Input 
                  type="number"
                  value={newStockStr} 
                  onChange={(e) => setNewStockStr(e.target.value)} 
                  autoFocus 
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProduct(null)}>Cancel</Button>
            <Button onClick={handleSaveStock} disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global Stock Adjustment Modal */}
      <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stock Adjustment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Item</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={adjustmentProductId}
                onChange={(e) => {
                  setAdjustmentProductId(e.target.value);
                  const p = products.find(x => x.id === e.target.value);
                  if (p) setNewStockStr(p.currentStock.toString());
                }}
              >
                <option value="">Select a product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Current: {p.currentStock})</option>
                ))}
              </select>
            </div>
            {adjustmentProductId && (
              <div className="space-y-2">
                <Label>New Stock Quantity</Label>
                <Input 
                  type="number"
                  value={newStockStr} 
                  onChange={(e) => setNewStockStr(e.target.value)} 
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustmentOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAdjustment} disabled={!adjustmentProductId || isUpdating}>
              {isUpdating ? "Saving..." : "Adjust Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Transfer Modal */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Item to Transfer</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={transferProductId}
                onChange={(e) => setTransferProductId(e.target.value)}
              >
                <option value="">Select a product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Total: {p.currentStock})</option>
                ))}
              </select>
            </div>
            {transferProductId && locations && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Godown</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={transferFromId}
                      onChange={(e) => setTransferFromId(e.target.value)}
                    >
                      <option value="">-- Select Source --</option>
                      {locations.map(l => (
                        <option key={l.id} value={l.id}>{l.name} {l.isDefault ? "(Main)" : ""}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>To Godown</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={transferToId}
                      onChange={(e) => setTransferToId(e.target.value)}
                    >
                      <option value="">-- Select Destination --</option>
                      {locations.map(l => (
                        <option key={l.id} value={l.id}>{l.name} {l.isDefault ? "(Main)" : ""}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Quantity to Transfer</Label>
                  <Input 
                    type="number"
                    value={transferQty} 
                    onChange={(e) => setTransferQty(e.target.value)} 
                    placeholder="Enter quantity"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveTransfer} 
              disabled={!transferProductId || !transferFromId || !transferToId || !transferQty || transferFromId === transferToId || isUpdating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isUpdating ? "Transferring..." : "Confirm Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
