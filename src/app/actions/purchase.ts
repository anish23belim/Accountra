"use server";

import { prisma } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deletePurchase(id: string) {
  try {
    await prisma.purchase.delete({
      where: { id }
    });
    revalidatePath("/purchases");
    return { success: true };
  } catch (error) {
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
  try {
    // Determine the target location
    let targetLocationId = data.locationId;
    if (!targetLocationId) {
      const defaultLoc = await prisma.location.findFirst({ where: { isDefault: true } });
      targetLocationId = defaultLoc?.id;
    }

    const purchase = await prisma.purchase.create({
      data: {
        billNumber: data.billNumber || `PO-${Date.now().toString().slice(-6)}`,
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
    await prisma.supplier.update({
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
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          currentStock: {
            increment: item.quantity
          }
        }
      });

      // 2. Location Stock
      if (targetLocationId) {
        await prisma.locationStock.upsert({
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
        
        await prisma.serialNumber.createMany({
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
