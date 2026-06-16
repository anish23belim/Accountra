"use server";

import { prisma } from "@/lib/auth";

export async function getLocations() {
  try {
    let locations = await prisma.location.findMany({
      orderBy: { createdAt: "asc" }
    });
    
    if (locations.length === 0) {
      // First time initialization: Create "Main Shop" and migrate existing stock
      const mainShop = await prisma.location.create({
        data: {
          name: "Main Shop",
          isDefault: true,
        }
      });
      
      // Migrate existing products to LocationStock for "Main Shop"
      const products = await prisma.product.findMany();
      for (const product of products) {
        if (product.currentStock > 0) {
          await prisma.locationStock.create({
            data: {
              productId: product.id,
              locationId: mainShop.id,
              quantity: product.currentStock,
            }
          });
        }
      }
      
      // Migrate all existing serial numbers to "Main Shop"
      await prisma.serialNumber.updateMany({
        where: { locationId: null },
        data: { locationId: mainShop.id }
      });
      
      locations = [mainShop];
    }
    
    return locations;
  } catch (error) {
    console.error("Error fetching/initializing locations:", error);
    return [];
  }
}

export async function createLocation(name: string) {
  try {
    const existing = await prisma.location.findUnique({ where: { name } });
    if (existing) return { success: false, error: "Location already exists" };
    
    const location = await prisma.location.create({
      data: { name }
    });
    return { success: true, location };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteLocation(id: string) {
  try {
    const loc = await prisma.location.findUnique({ where: { id } });
    if (loc?.isDefault) {
      return { success: false, error: "Cannot delete the default Main Shop" };
    }
    
    await prisma.location.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
