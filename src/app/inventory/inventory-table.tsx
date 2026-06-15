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
import { updateStock } from "@/app/actions/product";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  currentStock: number;
  lowStockAlert: number;
};

export function InventoryTable({ products }: { products: Product[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [newStockStr, setNewStockStr] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // For Global Stock Adjustment
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [adjustmentProductId, setAdjustmentProductId] = useState("");

  const handleSaveAdjustment = async () => {
    if (!adjustmentProductId) return;
    setIsUpdating(true);
    const stockNum = parseInt(newStockStr) || 0;
    const res = await updateStock(adjustmentProductId, stockNum);
    if (res.success) {
      setIsAdjustmentOpen(false);
      setAdjustmentProductId("");
    } else {
      alert(res.error);
    }
    setIsUpdating(false);
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleUpdateClick = (p: Product) => {
    setEditProduct(p);
    setNewStockStr(p.currentStock.toString());
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
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
        <div className="flex gap-2">
          {/* Stock Adjustment usually means updating stock manually without a voucher */}
          <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => {
            setAdjustmentProductId("");
            setNewStockStr("");
            setIsAdjustmentOpen(true);
          }}>
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Stock Adjustment
          </Button>
          {/* Receive Goods generally implies purchasing stock */}
          <Link href="/purchases/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> Receive Goods
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search items by name or SKU..."
            className="w-full pl-8 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
              const status = item.currentStock === 0 ? "Out of Stock" : item.currentStock < item.lowStockAlert ? "Low Stock" : "Healthy";
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.sku || '-'}</TableCell>
                  <TableCell className={`text-right font-bold ${item.currentStock === 0 ? 'text-red-600' : item.currentStock < item.lowStockAlert ? 'text-yellow-600' : 'text-slate-900'}`}>
                    {item.currentStock}
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
          const status = item.currentStock === 0 ? "Out of Stock" : item.currentStock < item.lowStockAlert ? "Low Stock" : "Healthy";
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
                  <span className={`font-bold text-lg ${item.currentStock === 0 ? 'text-red-600' : item.currentStock < item.lowStockAlert ? 'text-yellow-600' : 'text-slate-900'}`}>
                    {item.currentStock} <span className="text-sm font-normal text-slate-500 ml-1">(Min: {item.lowStockAlert})</span>
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
    </div>
  );
}
