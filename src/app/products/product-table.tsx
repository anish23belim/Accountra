"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Plus, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteProduct, saveProduct } from "../actions/product";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BarcodeScanner } from "@/components/ui/barcode-scanner";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  currentStock: number;
  purchasePrice: number;
  sellingPrice: number;
  tracksSerial?: boolean;
  availableSerials?: string[];
};

export function ProductTable({ initialData }: { initialData: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewSerialsProduct, setViewSerialsProduct] = useState<Product | null>(null);
  const [showAllStock, setShowAllStock] = useState(false);
  
  const [formData, setFormData] = useState<{name: string, sku: string, category: string, currentStock: number, purchasePrice: number, sellingPrice: number, tracksSerial: boolean, serialNumbers: string[]}>({ 
    name: "", sku: "", category: "", currentStock: 0, purchasePrice: 0, sellingPrice: 0, tracksSerial: false, serialNumbers: [] 
  });
  const [currentSerialInput, setCurrentSerialInput] = useState("");
  
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.availableSerials && p.availableSerials.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({ name: "", sku: "", category: "", currentStock: 0, purchasePrice: 0, sellingPrice: 0, tracksSerial: false, serialNumbers: [] });
    setCurrentSerialInput("");
    setIsDialogOpen(true);
  };

  const handleAddSerials = (inputStr: string) => {
    if (!inputStr.trim()) return;
    const baseSerials = inputStr.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
    
    setFormData(prev => {
      const existing = prev.serialNumbers;
      const uniqueToAdd = baseSerials.filter(s => !existing.includes(s));
      if (uniqueToAdd.length > 0) {
        return { ...prev, serialNumbers: [...existing, ...uniqueToAdd] };
      }
      return prev;
    });
    setCurrentSerialInput("");
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || "",
      category: product.category || "",
      currentStock: product.currentStock,
      purchasePrice: product.purchasePrice || 0,
      sellingPrice: product.sellingPrice,
      tracksSerial: product.tracksSerial || false,
      serialNumbers: [], // We don't fetch existing serials in this simple view, only add new ones or edit basic info
    });
    setCurrentSerialInput("");
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setEditingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!editingProduct) return;
    const res = await deleteProduct(editingProduct.id);
    if (res.success) {
      setProducts(products.filter(p => p.id !== editingProduct.id));
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) return;
    
    const res = await saveProduct({
      id: editingProduct?.id,
      name: formData.name,
      sku: formData.sku,
      category: formData.category,
      currentStock: Number(formData.currentStock),
      purchasePrice: Number(formData.purchasePrice),
      sellingPrice: Number(formData.sellingPrice),
      tracksSerial: formData.tracksSerial,
      serialNumbers: formData.serialNumbers,
    });

    if (res.success && res.product) {
      if (editingProduct) {
        setProducts(products.map(p => p.id === editingProduct.id ? res.product : p));
      } else {
        setProducts([res.product, ...products]);
      }
      setIsDialogOpen(false);
    } else if (res.success) {
      // Fallback if product data is not returned
      window.location.reload(); 
    } else {
      alert("Failed to save product.");
    }
  };

  const totalStockCount = products.reduce((acc, p) => acc + p.currentStock, 0);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Products & Services</h2>
          <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            Total Stock Quantity: <span className="font-semibold text-slate-700">{showAllStock ? totalStockCount : "***"}</span>
            <Button variant="ghost" size="sm" onClick={() => setShowAllStock(!showAllStock)} className="h-6 px-2 text-slate-400 hover:text-slate-700">
              {showAllStock ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      <div className="flex items-center gap-2 py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products or serial numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 bg-white"
          />
        </div>
      </div>

      <div className="rounded-md border bg-white hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Purchase Price</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.sku || "-"}</TableCell>
                <TableCell>{product.category || "-"}</TableCell>
                <TableCell className="text-right">
                  {showAllStock ? (
                    product.currentStock <= 5 ? (
                      <Badge variant="destructive" className="ml-auto">{product.currentStock}</Badge>
                    ) : (
                      <span className="font-medium">{product.currentStock}</span>
                    )
                  ) : (
                    <span className="text-slate-400">***</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium text-slate-500">₹{(product.purchasePrice || 0).toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium text-slate-900">₹{product.sellingPrice.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  {product.tracksSerial && product.availableSerials && product.availableSerials.length > 0 && (
                    <Button onClick={() => setViewSerialsProduct(product)} variant="ghost" size="sm" className="text-purple-600 mr-2 border border-purple-200 h-7 px-2 text-xs">
                      View Serials
                    </Button>
                  )}
                  <Button onClick={() => handleOpenEdit(product)} variant="ghost" size="sm" className="text-blue-600">Edit</Button>
                  <Button onClick={() => handleDeleteClick(product)} variant="ghost" size="sm" className="text-red-600 hover:text-red-700">Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white p-4 rounded-lg border shadow-sm flex flex-col space-y-2">
            <div className="flex justify-between items-start">
              <div className="font-medium text-lg text-slate-900">{product.name}</div>
              <div className="font-bold text-lg">₹{product.sellingPrice.toFixed(2)}</div>
            </div>
            <div className="text-sm text-slate-500">
              SKU: {product.sku || "-"} • Cat: {product.category || "-"}
            </div>
              <div className="flex justify-between items-center pt-2 border-t mt-2">
                <div className="text-sm flex items-center gap-2">
                  Stock: 
                  {showAllStock ? (
                    product.currentStock <= 5 ? (
                      <Badge variant="destructive">{product.currentStock}</Badge>
                    ) : (
                      <span className="font-medium">{product.currentStock}</span>
                    )
                  ) : (
                    <span className="text-slate-400">***</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {product.tracksSerial && product.availableSerials && product.availableSerials.length > 0 && (
                    <Button onClick={() => setViewSerialsProduct(product)} variant="ghost" size="sm" className="text-purple-600 border border-purple-200 h-7 px-2 text-xs">
                      Serials
                    </Button>
                  )}
                  <Button onClick={() => handleOpenEdit(product)} variant="ghost" size="sm" className="text-blue-600 h-8">Edit</Button>
                  <Button onClick={() => handleDeleteClick(product)} variant="ghost" size="sm" className="text-red-600 h-8">Delete</Button>
                </div>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground bg-white rounded-lg border">
            No products found.
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Item Name</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <Input id="purchasePrice" type="number" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: Number(e.target.value)})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sellingPrice">Selling Price</Label>
                <Input id="sellingPrice" type="number" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} />
              </div>
            </div>
            
            <div className="flex items-center gap-2 h-10 mt-2">
              <input 
                type="checkbox" 
                id="tracksSerial" 
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={formData.tracksSerial}
                onChange={e => setFormData({...formData, tracksSerial: e.target.checked})}
              />
              <Label htmlFor="tracksSerial" className="font-normal cursor-pointer">Track Serial Numbers (IMEI/SN)</Label>
            </div>

            {formData.tracksSerial ? (
              <div className="space-y-3 bg-slate-50 p-3 rounded-md border">
                <Label>Scan or Type Serial Number</Label>
                <div className="flex gap-2">
                  <Input 
                    value={currentSerialInput}
                    onChange={e => setCurrentSerialInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSerials(currentSerialInput);
                      }
                    }}
                    placeholder="Scan barcode and press Enter..."
                    className="bg-white"
                  />
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={() => handleAddSerials(currentSerialInput)}
                  >
                    Add
                  </Button>
                  <BarcodeScanner onScan={(text) => handleAddSerials(text)} />
                </div>
                {formData.serialNumbers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 max-h-[120px] overflow-y-auto">
                    {formData.serialNumbers.map((sn, idx) => (
                      <Badge key={idx} variant="outline" className="bg-white flex items-center gap-1 pl-2 pr-1 py-1">
                        {sn}
                        <div 
                          role="button" 
                          className="hover:bg-slate-200 rounded-full p-0.5 cursor-pointer"
                          onClick={() => setFormData({
                            ...formData,
                            serialNumbers: formData.serialNumbers.filter(s => s !== sn)
                          })}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </div>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="text-sm font-medium text-blue-700">
                  Total Stock: {formData.serialNumbers.length}
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="stock">Current Stock</Label>
                <Input id="stock" type="number" value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: Number(e.target.value)})} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Save Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Product</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete <strong>{editingProduct?.name}</strong>? 
            This action cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmDelete} variant="destructive">Yes, Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewSerialsProduct} onOpenChange={(open) => !open && setViewSerialsProduct(null)}>
        <DialogContent className="sm:max-w-[500px] bg-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Available Serial Numbers</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <h3 className="font-semibold text-lg mb-2">{viewSerialsProduct?.name}</h3>
            <div className="text-sm text-slate-500 mb-4">Total Available: {viewSerialsProduct?.availableSerials?.length || 0}</div>
            
            {viewSerialsProduct?.availableSerials && viewSerialsProduct.availableSerials.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {viewSerialsProduct.availableSerials.map((serial, idx) => (
                  <Badge key={idx} variant="outline" className="bg-slate-50 border-slate-300 px-3 py-1 text-sm font-mono">
                    {serial}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-md">
                No serial numbers available in stock.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setViewSerialsProduct(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

