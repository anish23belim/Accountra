"use server";

import { getPrisma } from "@/lib/prisma-client";

export async function getLocations() {
  const prisma = await getPrisma();

  try {
    let locations = await (await getPrisma()).location.findMany({
      orderBy: { createdAt: "asc" }
    });
    
    if (locations.length === 0) {
      // First time initialization: Create "Main Shop" and migrate existing stock
      const mainShop = await (await getPrisma()).location.create({
        data: {
          name: "Main Shop",
          isDefault: true,
        }
      });
      
      // Migrate existing products to LocationStock for "Main Shop"
      const products = await (await getPrisma()).product.findMany();
      for (const product of products) {
        if (product.currentStock > 0) {
          await (await getPrisma()).locationStock.create({
            data: {
              productId: product.id,
              locationId: mainShop.id,
              quantity: product.currentStock,
            }
          });
        }
      }
      
      // Migrate all existing serial numbers to "Main Shop"
      await (await getPrisma()).serialNumber.updateMany({
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
  const prisma = await getPrisma();

  try {
    const existing = await (await getPrisma()).location.findUnique({ where: { name } });
    if (existing) return { success: false, error: "Location already exists" };
    
    const location = await (await getPrisma()).location.create({
      data: { name }
    });
    return { success: true, location };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteLocation(id: string) {
  const prisma = await getPrisma();

  try {
    const loc = await (await getPrisma()).location.findUnique({ where: { id } });
    if (loc?.isDefault) {
      return { success: false, error: "Cannot delete the default Main Shop" };
    }
    
    await (await getPrisma()).location.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
