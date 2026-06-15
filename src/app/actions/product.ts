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
}) {
  try {
    if (data.id) {
      await prisma.product.update({
        where: { id: data.id },
        data: {
          name: data.name,
          sku: data.sku,
          category: data.category,
          currentStock: data.currentStock || 0,
          sellingPrice: data.sellingPrice || 0,
        }
      });
    } else {
      await prisma.product.create({
        data: {
          name: data.name,
          sku: data.sku,
          category: data.category,
          currentStock: data.currentStock || 0,
          sellingPrice: data.sellingPrice || 0,
        }
      });
    }
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
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
