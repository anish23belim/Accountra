import { prisma } from "@/lib/auth";
import { InventoryTable } from "./inventory-table";

export default async function InventoryPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      sku: true,
      currentStock: true,
      lowStockAlert: true,
      locationStocks: {
        include: { location: true }
      }
    }
  });

  const locations = await prisma.location.findMany({
    orderBy: { createdAt: 'asc' }
  });

  return <InventoryTable products={products} locations={locations} />;
}
