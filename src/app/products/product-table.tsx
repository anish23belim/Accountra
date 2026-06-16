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

type Product = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  currentStock: number;
  sellingPrice: number;
  tracksSerial?: boolean;
};

export function ProductTable({ initialData }: { initialData: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState<{name: string, sku: string, category: string, currentStock: number, sellingPrice: number, tracksSerial: boolean, serialNumbers: string[]}>({ 
    name: "", sku: "", category: "", currentStock: 0, sellingPrice: 0, tracksSerial: false, serialNumbers: [] 
  });
  const [currentSerialInput, setCurrentSerialInput] = useState("");
  const [piecesPerScan, setPiecesPerScan] = useState<number>(1);
  
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({ name: "", sku: "", category: "", currentStock: 0, sellingPrice: 0, tracksSerial: false, serialNumbers: [] });
    setCurrentSerialInput("");
    setPiecesPerScan(1);
    setIsDialogOpen(true);
  };

  const handleAddSerials = (inputStr: string) => {
    if (!inputStr.trim()) return;
    const baseSerials = inputStr.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
    
    let generatedSerials: string[] = [];
    baseSerials.forEach(baseSn => {
      if (piecesPerScan > 1) {
        for (let i = 1; i <= piecesPerScan; i++) {
          generatedSerials.push(`${baseSn}-${i}`);
        }
      } else {
        generatedSerials.push(baseSn);
      }
    });

    setFormData(prev => {
      const existing = prev.serialNumbers;
      const uniqueToAdd = generatedSerials.filter(s => !existing.includes(s));
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

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Products & Services</h2>
        <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      <div className="flex items-center gap-2 py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
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
              <TableHead className="text-right">Price</TableHead>
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
                  {product.currentStock <= 5 ? (
                    <Badge variant="destructive" className="ml-auto">{product.currentStock}</Badge>
                  ) : (
                    <span className="font-medium">{product.currentStock}</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">₹{product.sellingPrice.toFixed(2)}</TableCell>
                <TableCell className="text-right">
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
              <div className="text-sm">
                Stock: {product.currentStock <= 5 ? (
                  <Badge variant="destructive" className="ml-1">{product.currentStock}</Badge>
                ) : (
                  <span className="font-medium ml-1">{product.currentStock}</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleOpenEdit(product)} variant="outline" size="sm" className="text-blue-600 border-blue-200">Edit</Button>
                <Button onClick={() => handleDeleteClick(product)} variant="outline" size="sm" className="text-red-600 border-red-200">Delete</Button>
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
            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="grid gap-2">
                <Label htmlFor="price">Selling Price</Label>
                <Input id="price" type="number" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} />
              </div>
              <div className="flex items-center gap-2 h-10">
                <input 
                  type="checkbox" 
                  id="tracksSerial" 
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={formData.tracksSerial}
                  onChange={e => setFormData({...formData, tracksSerial: e.target.checked})}
                />
                <Label htmlFor="tracksSerial" className="font-normal cursor-pointer">Track Serial Numbers</Label>
              </div>
            </div>

            {formData.tracksSerial ? (
              <div className="space-y-3 bg-slate-50 p-3 rounded-md border">
                <div className="flex justify-between items-center">
                  <Label>Scan or Type Serial Number</Label>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Pieces per scan:</Label>
                    <Input 
                      type="number" 
                      min="1" 
                      value={piecesPerScan} 
                      onChange={e => setPiecesPerScan(Math.max(1, Number(e.target.value)))}
                      className="w-16 h-8 text-sm"
                    />
                  </div>
                </div>
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
            Are you sure you want to delete <strong>{editingProduct?.name}</strong>? This action cannot be undone.
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
