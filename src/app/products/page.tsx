export const dynamic = 'force-dynamic';
import { ProductTable } from "./product-table";
import { prisma } from "@/lib/auth";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: { serialNumbers: { where: { status: 'AVAILABLE' } } }
  });

  const formattedProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    currentStock: p.currentStock,
    purchasePrice: p.purchasePrice,
    sellingPrice: p.sellingPrice,
    tracksSerial: p.tracksSerial,
    availableSerials: p.serialNumbers.map(s => s.serialNum)
  }));

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <ProductTable initialData={formattedProducts} />
    </div>
  );
}
