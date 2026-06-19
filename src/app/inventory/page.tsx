export const dynamic = 'force-dynamic';
import { getPrisma } from "@/lib/prisma-client";
import { InventoryTable } from "./inventory-table";

export default async function InventoryPage() {
  const products = await (await getPrisma()).product.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      sku: true,
      currentStock: true,
      lowStockAlert: true,
      tracksSerial: true,
      locationStocks: {
        include: { location: true }
      }
    }
  });

  const locations = await (await getPrisma()).location.findMany({
    orderBy: { createdAt: 'asc' }
  });

  return <InventoryTable products={products} locations={locations} />;
}

