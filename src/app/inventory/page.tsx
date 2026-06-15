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
    }
  });

  return <InventoryTable products={products} />;
}
