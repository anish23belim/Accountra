import { ProductTable } from "./product-table";
import { prisma } from "@/lib/auth";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <ProductTable initialData={products} />
    </div>
  );
}
