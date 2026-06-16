"use server";

import { prisma } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createSalesReturn(data: any) {
  try {
    const sr = await prisma.salesReturn.create({
      data: {
        returnNumber: data.returnNumber,
        date: data.date ? new Date(data.date) : new Date(),
        customerId: data.customerId,
        invoiceId: data.invoiceId || null,
        locationId: data.locationId || null,
        narration: data.narration || null,
        subTotal: data.subTotal || 0,
        taxAmount: data.taxAmount || 0,
        totalAmount: data.totalAmount || 0,
        items: {
          create: data.items.map((item: any) => ({
            productId: item.productId,
            serialNumber: item.serialNumber || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || 0,
            total: item.total
          }))
        }
      },
      include: { items: true }
    });

    // Customer Balance decreases (they returned goods, they owe us less)
    await prisma.customer.update({
      where: { id: data.customerId },
      data: { currentBalance: { decrement: data.totalAmount } }
    });

    // Increase Stock
    for (const item of data.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { currentStock: { increment: item.quantity } }
      });
      
      let targetLocationId = data.locationId;
      if (!targetLocationId) {
        const defaultLoc = await prisma.location.findFirst({ where: { isDefault: true } });
        targetLocationId = defaultLoc?.id || null;
      }
      
      if (targetLocationId) {
        await prisma.locationStock.upsert({
          where: { productId_locationId: { productId: item.productId, locationId: targetLocationId } },
          update: { quantity: { increment: item.quantity } },
          create: { productId: item.productId, locationId: targetLocationId, quantity: item.quantity }
        });
      }

      // Update Serial Numbers
      if (item.serialNumber && item.serialNumber.trim() !== "") {
        const typedSerials = item.serialNumber.split(",").map((s: string) => s.trim()).filter(Boolean);
        
        // Find the SalesReturnItem we just created to link
        const srItem = sr.items.find(i => i.productId === item.productId && i.unitPrice === item.unitPrice);
        
        await prisma.serialNumber.updateMany({
          where: { serialNum: { in: typedSerials } },
          data: { 
            status: "AVAILABLE",
            salesReturnItemId: srItem?.id
            // We do not clear invoiceItemId so we know which invoice it was sold on, but it is now available again
          }
        });
      }
    }

    revalidatePath("/sales/returns");
    revalidatePath("/inventory");
    revalidatePath("/customers");
    revalidatePath("/products");
    
    return { success: true, returnId: sr.id };
  } catch (error: any) {
    console.error("Sales Return error:", error);
    return { success: false, error: error.message || "Failed to create sales return" };
  }
}

export async function createPurchaseReturn(data: any) {
  try {
    const pr = await prisma.purchaseReturn.create({
      data: {
        returnNumber: data.returnNumber,
        date: data.date ? new Date(data.date) : new Date(),
        supplierId: data.supplierId,
        purchaseId: data.purchaseId || null,
        locationId: data.locationId || null,
        narration: data.narration || null,
        subTotal: data.subTotal || 0,
        taxAmount: data.taxAmount || 0,
        totalAmount: data.totalAmount || 0,
        items: {
          create: data.items.map((item: any) => ({
            productId: item.productId,
            serialNumber: item.serialNumber || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || 0,
            total: item.total
          }))
        }
      },
      include: { items: true }
    });

    // Supplier Balance decreases (we returned goods, we owe them less)
    await prisma.supplier.update({
      where: { id: data.supplierId },
      data: { currentBalance: { decrement: data.totalAmount } }
    });

    // Decrease Stock
    for (const item of data.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } }
      });
      
      let targetLocationId = data.locationId;
      if (!targetLocationId) {
        const defaultLoc = await prisma.location.findFirst({ where: { isDefault: true } });
        targetLocationId = defaultLoc?.id || null;
      }
      
      if (targetLocationId) {
        await prisma.locationStock.upsert({
          where: { productId_locationId: { productId: item.productId, locationId: targetLocationId } },
          update: { quantity: { decrement: item.quantity } },
          create: { productId: item.productId, locationId: targetLocationId, quantity: 0 }
        });
      }

      // Update Serial Numbers
      if (item.serialNumber && item.serialNumber.trim() !== "") {
        const typedSerials = item.serialNumber.split(",").map((s: string) => s.trim()).filter(Boolean);
        
        const prItem = pr.items.find(i => i.productId === item.productId && i.unitPrice === item.unitPrice);
        
        await prisma.serialNumber.updateMany({
          where: { serialNum: { in: typedSerials } },
          data: { 
            status: "RETURNED",
            purchaseReturnItemId: prItem?.id
          }
        });
      }
    }

    revalidatePath("/purchases/returns");
    revalidatePath("/inventory");
    revalidatePath("/suppliers");
    revalidatePath("/products");
    
    return { success: true, returnId: pr.id };
  } catch (error: any) {
    console.error("Purchase Return error:", error);
    return { success: false, error: error.message || "Failed to create purchase return" };
  }
}

export async function deleteSalesReturn(id: string) {
  try {
    const sr = await prisma.salesReturn.findUnique({
      where: { id },
      include: { items: true }
    });
    
    if (!sr) return { success: false, error: "Return not found" };

    // Revert Customer Balance (increase back)
    await prisma.customer.update({
      where: { id: sr.customerId },
      data: { currentBalance: { increment: sr.totalAmount } }
    });

    // Revert Stock (decrease back)
    for (const item of sr.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } }
      });
      
      let targetLocationId = sr.locationId;
      if (!targetLocationId) {
        const defaultLoc = await prisma.location.findFirst({ where: { isDefault: true } });
        targetLocationId = defaultLoc?.id || null;
      }
      
      if (targetLocationId) {
        await prisma.locationStock.update({
          where: { productId_locationId: { productId: item.productId, locationId: targetLocationId } },
          data: { quantity: { decrement: item.quantity } }
        });
      }

      if (item.serialNumber && item.serialNumber.trim() !== "") {
        const typedSerials = item.serialNumber.split(",").map(s => s.trim()).filter(Boolean);
        await prisma.serialNumber.updateMany({
          where: { serialNum: { in: typedSerials } },
          data: { status: "SOLD", salesReturnItemId: null }
        });
      }
    }

    await prisma.salesReturn.delete({ where: { id } });

    revalidatePath("/sales/returns");
    revalidatePath("/inventory");
    revalidatePath("/customers");
    revalidatePath("/products");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete return" };
  }
}

export async function deletePurchaseReturn(id: string) {
  try {
    const pr = await prisma.purchaseReturn.findUnique({
      where: { id },
      include: { items: true }
    });
    
    if (!pr) return { success: false, error: "Return not found" };

    // Revert Supplier Balance (increase back)
    await prisma.supplier.update({
      where: { id: pr.supplierId },
      data: { currentBalance: { increment: pr.totalAmount } }
    });

    // Revert Stock (increase back)
    for (const item of pr.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { currentStock: { increment: item.quantity } }
      });
      
      let targetLocationId = pr.locationId;
      if (!targetLocationId) {
        const defaultLoc = await prisma.location.findFirst({ where: { isDefault: true } });
        targetLocationId = defaultLoc?.id || null;
      }
      
      if (targetLocationId) {
        await prisma.locationStock.upsert({
          where: { productId_locationId: { productId: item.productId, locationId: targetLocationId } },
          update: { quantity: { increment: item.quantity } },
          create: { productId: item.productId, locationId: targetLocationId, quantity: item.quantity }
        });
      }

      if (item.serialNumber && item.serialNumber.trim() !== "") {
        const typedSerials = item.serialNumber.split(",").map(s => s.trim()).filter(Boolean);
        await prisma.serialNumber.updateMany({
          where: { serialNum: { in: typedSerials } },
          data: { status: "AVAILABLE", purchaseReturnItemId: null }
        });
      }
    }

    await prisma.purchaseReturn.delete({ where: { id } });

    revalidatePath("/purchases/returns");
    revalidatePath("/inventory");
    revalidatePath("/suppliers");
    revalidatePath("/products");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete return" };
  }
}
