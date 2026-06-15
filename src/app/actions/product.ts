"use server";

import { prisma } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({
      where: { id }
    });
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete product" };
  }
}

export async function saveProduct(data: {
  id?: string;
  name: string;
  sku?: string;
  category?: string;
  currentStock?: number;
  sellingPrice?: number;
  tracksSerial?: boolean;
  serialNumbers?: string[];
}) {
  try {
    let product: any;
    
    // Sanitize optional unique fields
    const safeSku = data.sku?.trim() === "" ? null : data.sku?.trim();

    const productData = {
      name: data.name,
      sku: safeSku,
      category: data.category,
      currentStock: data.tracksSerial ? (data.serialNumbers?.length || 0) : (data.currentStock || 0),
      sellingPrice: data.sellingPrice || 0,
      tracksSerial: data.tracksSerial || false,
    };

    if (data.id) {
      product = await prisma.product.update({
        where: { id: data.id },
        data: productData
      });
    } else {
      product = await prisma.product.create({
        data: productData
      });
    }

    // Process serial numbers if tracking is enabled
    if (data.tracksSerial && data.serialNumbers && data.serialNumbers.length > 0) {
      const serialData = data.serialNumbers.map(sn => ({
        serialNum: sn,
        productId: product.id,
        status: "AVAILABLE",
      }));
      
      // We use createMany and skip duplicates
      await prisma.serialNumber.createMany({
        data: serialData,
        skipDuplicates: true,
      });
      
      // Recalculate stock based on actual AVAILABLE serials
      const actualCount = await prisma.serialNumber.count({
        where: { productId: product.id, status: "AVAILABLE" }
      });
      
      product = await prisma.product.update({
        where: { id: product.id },
        data: { currentStock: actualCount }
      });
    }

    revalidatePath("/products");
    return { success: true, product };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to save product" };
  }
}

export async function updateStock(id: string, newStock: number) {
  try {
    await prisma.product.update({
      where: { id },
      data: { currentStock: newStock }
    });
    revalidatePath("/inventory");
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update stock" };
  }
}
