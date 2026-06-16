"use server";

import { prisma } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteInvoice(id: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true }
    });
    
    if (!invoice) return { success: false, error: "Invoice not found" };

    // Revert Customer Balance
    await prisma.customer.update({
      where: { id: invoice.customerId },
      data: { currentBalance: { decrement: invoice.totalAmount } }
    });

    // Revert Stock
    for (const item of invoice.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { currentStock: { increment: item.quantity } }
      });
      
      let targetLocationId = invoice.locationId;
      if (!targetLocationId) {
        const defaultLoc = await prisma.location.findFirst({ where: { isDefault: true } });
        targetLocationId = defaultLoc?.id || null;
      }
      
      if (targetLocationId) {
        await prisma.locationStock.update({
          where: { productId_locationId: { productId: item.productId, locationId: targetLocationId } },
          data: { quantity: { increment: item.quantity } }
        });
      }

      // Revert Serial Numbers
      if (item.serialNumber && item.serialNumber.trim() !== "") {
        const typedSerials = item.serialNumber.split(",").map(s => s.trim()).filter(Boolean);
        await prisma.serialNumber.updateMany({
          where: { serialNum: { in: typedSerials } },
          data: { status: "AVAILABLE" }
        });
      }
    }

    await prisma.invoice.delete({
      where: { id }
    });
    
    revalidatePath("/sales");
    revalidatePath("/customers");
    revalidatePath("/products");
    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return { success: false, error: "Failed to delete invoice" };
  }
}

export type InvoiceItemInput = {
  productId: string;
  serialNumber?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  total: number;
};

export async function createInvoice(data: {
  customerId: string;
  locationId?: string;
  date?: string;
  narration?: string;
  transporter?: string;
  vehicleNo?: string;
  ewayBill?: string;
  destination?: string;
  subTotal: number;
  discountAmount: number;
  freightCharge: number;
  taxAmount: number;
  totalAmount: number;
  items: InvoiceItemInput[];
}) {
  try {
    // Validate stock and serial numbers for all items
    for (const item of data.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return { success: false, error: `Product not found.` };
      }
      
      let targetLocationId = data.locationId;
      if (!targetLocationId) {
        const defaultLoc = await prisma.location.findFirst({ where: { isDefault: true } });
        targetLocationId = defaultLoc?.id;
      }
      
      if (targetLocationId) {
        const locStock = await prisma.locationStock.findUnique({
          where: { productId_locationId: { productId: item.productId, locationId: targetLocationId } }
        });
        const avail = locStock?.quantity || 0;
        if (avail < item.quantity) {
          return { success: false, error: `Insufficient stock in selected Godown for ${product.name}. Available: ${avail}, Requested: ${item.quantity}.` };
        }
      } else {
        if (product.currentStock < item.quantity) {
          return { success: false, error: `Insufficient stock for ${product.name}. Available: ${product.currentStock}, Requested: ${item.quantity}.` };
        }
      }

      // Serial Number Validation
      if (item.serialNumber && item.serialNumber.trim() !== "") {
        const typedSerials = item.serialNumber.split(",").map(s => s.trim()).filter(Boolean);
        
        // Fetch all purchased serials
        const purchases = await prisma.purchaseItem.findMany({
          where: { productId: item.productId },
          select: { serialNumber: true }
        });
        const purchasedSerials = new Set<string>();
        purchases.forEach(p => {
          if (p.serialNumber) {
            p.serialNumber.split(",").map(s => s.trim()).filter(Boolean).forEach(s => purchasedSerials.add(s));
          }
        });
        
        // Also fetch directly tracked SerialNumber records (Opening Stock)
        const trackedSerials = await prisma.serialNumber.findMany({
          where: { productId: item.productId }
        });
        trackedSerials.forEach(ts => purchasedSerials.add(ts.serialNum));

        // Fetch all sold serials
        const sales = await prisma.invoiceItem.findMany({
          where: { productId: item.productId },
          select: { serialNumber: true }
        });
        const soldSerials = new Set<string>();
        sales.forEach(s => {
          if (s.serialNumber) {
            s.serialNumber.split(",").map(s => s.trim()).filter(Boolean).forEach(s => soldSerials.add(s));
          }
        });

        // Calculate available serials
        const availableSerials = new Set([...purchasedSerials].filter(s => !soldSerials.has(s)));

        // Check if all typed serials are in availableSerials
        for (const ts of typedSerials) {
          if (!availableSerials.has(ts)) {
            return { success: false, error: `Serial Number "${ts}" for ${product.name} is NOT in stock. Please check the serial number.` };
          }
        }
      }
    }

    // Generate a simple invoice number based on current time
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    
    // Create the invoice with its items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: data.customerId,
        date: data.date ? new Date(data.date) : undefined,
        narration: data.narration,
        transporter: data.transporter,
        vehicleNo: data.vehicleNo,
        ewayBill: data.ewayBill,
        destination: data.destination,
        subTotal: data.subTotal,
        discountAmount: data.discountAmount,
        freightCharge: data.freightCharge,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        status: "UNPAID",
        locationId: data.locationId || undefined,
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            serialNumber: item.serialNumber,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discountAmount,
            taxRate: item.taxRate,
            total: item.total
          }))
        }
      }
    });

    // Update customer balance (increase balance because they owe money)
    await prisma.customer.update({
      where: { id: data.customerId },
      data: {
        currentBalance: {
          increment: data.totalAmount
        }
      }
    });

    // Reduce product stock and location stock
    for (const item of data.items) {
      // 1. Reduce overall stock
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          currentStock: {
            decrement: item.quantity
          }
        }
      });
      
      // 2. Reduce location specific stock
      let targetLocationId = data.locationId;
      if (!targetLocationId) {
        const defaultLoc = await prisma.location.findFirst({ where: { isDefault: true } });
        targetLocationId = defaultLoc?.id;
      }
      
      if (targetLocationId) {
        await prisma.locationStock.update({
          where: { productId_locationId: { productId: item.productId, locationId: targetLocationId } },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });
        
        // Also update SerialNumber records if applicable
        if (item.serialNumber && item.serialNumber.trim() !== "") {
          const typedSerials = item.serialNumber.split(",").map(s => s.trim()).filter(Boolean);
          await prisma.serialNumber.updateMany({
            where: { serialNum: { in: typedSerials } },
            data: { status: "SOLD" }
          });
        }
      }
    }

    revalidatePath("/sales");
    revalidatePath("/customers");
    revalidatePath("/products");
    
    return { success: true, invoiceId: invoice.id };
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    return { success: false, error: error.message || "Failed to create invoice" };
  }
}
