"use server";

import { getPrisma } from "@/lib/prisma-client";
import { revalidatePath } from "next/cache";

export async function deletePurchase(id: string) {
  const prisma = await getPrisma();

  try {
    const purchase = await (await getPrisma()).purchase.findUnique({
      where: { id },
      include: { items: true }
    });
    
    if (!purchase) return { success: false, error: "Purchase not found" };

    // Revert Supplier Balance
    await (await getPrisma()).supplier.update({
      where: { id: purchase.supplierId },
      data: { currentBalance: { decrement: purchase.totalAmount } }
    });

    // Revert Stock
    for (const item of purchase.items) {
      await (await getPrisma()).product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } }
      });
      
      let targetLocationId = purchase.locationId;
      if (!targetLocationId) {
        const defaultLoc = await (await getPrisma()).location.findFirst({ where: { isDefault: true } });
        targetLocationId = defaultLoc?.id || null;
      }
      
      if (targetLocationId) {
        await (await getPrisma()).locationStock.update({
          where: { productId_locationId: { productId: item.productId, locationId: targetLocationId } },
          data: { quantity: { decrement: item.quantity } }
        });
      }

      // Revert Serial Numbers (Delete them since they were created in this purchase)
      if (item.serialNumber && item.serialNumber.trim() !== "") {
        const typedSerials = item.serialNumber.split(",").map(s => s.trim()).filter(Boolean);
        await (await getPrisma()).serialNumber.deleteMany({
          where: { serialNum: { in: typedSerials } }
        });
      }
    }

    await (await getPrisma()).purchase.delete({
      where: { id }
    });
    
    revalidatePath("/purchases");
    revalidatePath("/suppliers");
    revalidatePath("/products");
    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Error deleting purchase:", error);
    return { success: false, error: "Failed to delete purchase" };
  }
}

export type PurchaseItemInput = {
  productId: string;
  serialNumber?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  total: number;
};

export async function createPurchase(data: {
  supplierId: string;
  locationId?: string;
  date?: string;
  billNumber?: string;
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
  items: PurchaseItemInput[];
}) {
  const prisma = await getPrisma();

  try {
    // Determine the target location
    let targetLocationId = data.locationId;
    if (!targetLocationId) {
      const defaultLoc = await (await getPrisma()).location.findFirst({ where: { isDefault: true } });
      targetLocationId = defaultLoc?.id;
    }

    const purchase = await (await getPrisma()).purchase.create({
      data: {
        billNumber: data.billNumber || `PO-${Date.now().toString().slice(-6)}`,
        date: data.date ? new Date(data.date) : undefined,
        supplierId: data.supplierId,
        locationId: targetLocationId,
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

    // Update supplier balance (increase balance because we owe them money)
    await (await getPrisma()).supplier.update({
      where: { id: data.supplierId },
      data: {
        currentBalance: {
          increment: data.totalAmount
        }
      }
    });

    // Increase product stock AND LocationStock
    for (const item of data.items) {
      // 1. Overall Product Stock
      await (await getPrisma()).product.update({
        where: { id: item.productId },
        data: {
          currentStock: {
            increment: item.quantity
          }
        }
      });

      // 2. Location Stock
      if (targetLocationId) {
        await (await getPrisma()).locationStock.upsert({
          where: { productId_locationId: { productId: item.productId, locationId: targetLocationId } },
          update: { quantity: { increment: item.quantity } },
          create: { productId: item.productId, locationId: targetLocationId, quantity: item.quantity }
        });
      }
      
      // Also register SerialNumbers if provided
      if (item.serialNumber && item.serialNumber.trim() !== "") {
        const typedSerials = item.serialNumber.split(",").map(s => s.trim()).filter(Boolean);
        const serialData = typedSerials.map(sn => ({
          serialNum: sn,
          productId: item.productId,
          status: "AVAILABLE",
          locationId: targetLocationId
        }));
        
        await (await getPrisma()).serialNumber.createMany({
          data: serialData,
          skipDuplicates: true,
        });
      }
    }

    revalidatePath("/purchases");
    revalidatePath("/suppliers");
    revalidatePath("/products");
    
    return { success: true, purchaseId: purchase.id };
  } catch (error: any) {
    console.error("Error creating purchase:", error);
    return { success: false, error: error.message || "Failed to create purchase" };
  }
}
