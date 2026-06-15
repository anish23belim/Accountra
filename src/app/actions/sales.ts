"use server";

import { prisma } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteInvoice(id: string) {
  try {
    await prisma.invoice.delete({
      where: { id }
    });
    revalidatePath("/sales");
    return { success: true };
  } catch (error) {
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
      if (product.currentStock < item.quantity) {
        return { success: false, error: `Insufficient stock for ${product.name}. Available: ${product.currentStock}, Requested: ${item.quantity}.` };
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

    // Reduce product stock
    for (const item of data.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          currentStock: {
            decrement: item.quantity
          }
        }
      });
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
