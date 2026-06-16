"use server";

import { prisma } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({
      where: { id }
    });
    revalidatePath("/products");
    revalidatePath("/inventory");
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
  purchasePrice?: number;
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
      purchasePrice: data.purchasePrice || 0,
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
        // Ensure Main Shop exists
        let defaultLocation = await prisma.location.findFirst({ where: { isDefault: true } });
        if (!defaultLocation) {
          defaultLocation = await prisma.location.create({ data: { name: "Main Shop", isDefault: true } });
        }
        
        const serialData = data.serialNumbers.map(sn => ({
          serialNum: sn,
          productId: product.id,
          status: "AVAILABLE",
          locationId: defaultLocation!.id
        }));
        
        await prisma.serialNumber.createMany({
          data: serialData,
          skipDuplicates: true,
        });
        
        const actualCount = await prisma.serialNumber.count({
          where: { productId: product.id, status: "AVAILABLE", locationId: defaultLocation.id }
        });
        
        // Update LocationStock
        await prisma.locationStock.upsert({
          where: { productId_locationId: { productId: product.id, locationId: defaultLocation.id } },
          update: { quantity: actualCount },
          create: { productId: product.id, locationId: defaultLocation.id, quantity: actualCount }
        });
        
        // Update Total Stock
        const allStock = await prisma.serialNumber.count({
          where: { productId: product.id, status: "AVAILABLE" }
        });
        
        product = await prisma.product.update({
          where: { id: product.id },
          data: { currentStock: allStock }
        });
      }

    revalidatePath("/products");
    revalidatePath("/inventory");
    return { success: true, product };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to save product" };
  }
}

export async function updateStock(id: string, newStock: number, locationId?: string) {
  try {
    let targetLocationId = locationId;
    if (!targetLocationId) {
      let defaultLocation = await prisma.location.findFirst({ where: { isDefault: true } });
      if (!defaultLocation) {
        defaultLocation = await prisma.location.create({ data: { name: "Main Shop", isDefault: true } });
      }
      targetLocationId = defaultLocation.id;
    }

    await prisma.locationStock.upsert({
      where: { productId_locationId: { productId: id, locationId: targetLocationId } },
      update: { quantity: newStock },
      create: { productId: id, locationId: targetLocationId, quantity: newStock }
    });

    // Recalculate total stock for the product
    const locationStocks = await prisma.locationStock.findMany({ where: { productId: id } });
    const totalStock = locationStocks.reduce((acc, curr) => acc + curr.quantity, 0);

    await prisma.product.update({
      where: { id },
      data: { currentStock: totalStock }
    });

    revalidatePath("/inventory");
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update stock" };
  }
}

export async function transferStock(productId: string, fromLocationId: string, toLocationId: string, quantity: number, serialNumbers?: string[]) {
  try {
    if (fromLocationId === toLocationId) return { success: false, error: "Cannot transfer to the same location" };
    if (quantity <= 0) return { success: false, error: "Quantity must be greater than 0" };

    const fromStock = await prisma.locationStock.findUnique({
      where: { productId_locationId: { productId, locationId: fromLocationId } }
    });

    if (!fromStock || fromStock.quantity < quantity) {
      return { success: false, error: "Insufficient stock in source location" };
    }

    if (serialNumbers && serialNumbers.length > 0) {
      if (serialNumbers.length !== quantity) {
        return { success: false, error: "Number of serials provided must match quantity to transfer" };
      }
      
      const serials = await prisma.serialNumber.findMany({
        where: {
          serialNum: { in: serialNumbers },
          productId: productId,
          locationId: fromLocationId,
          status: "AVAILABLE"
        }
      });
      
      if (serials.length !== quantity) {
        return { success: false, error: "One or more serial numbers are invalid or not present in the source location." };
      }

      await prisma.serialNumber.updateMany({
        where: { serialNum: { in: serialNumbers } },
        data: { locationId: toLocationId }
      });
    }

    // Decrement from source
    await prisma.locationStock.update({
      where: { productId_locationId: { productId, locationId: fromLocationId } },
      data: { quantity: { decrement: quantity } }
    });

    // Increment in destination
    await prisma.locationStock.upsert({
      where: { productId_locationId: { productId, locationId: toLocationId } },
      update: { quantity: { increment: quantity } },
      create: { productId, locationId: toLocationId, quantity }
    });

    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to transfer stock" };
  }
}
