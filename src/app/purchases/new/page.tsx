export const dynamic = 'force-dynamic';
import { getPrisma } from "@/lib/prisma-client";
import { CreatePurchaseForm } from "./create-purchase-form";

export default async function NewPurchasePage() {
  const suppliers = await (await getPrisma()).supplier.findMany({
    orderBy: { name: 'asc' }
  });
  
  const products = await (await getPrisma()).product.findMany({
    orderBy: { name: 'asc' }
  });
  
  const locations = await (await getPrisma()).location.findMany({
    orderBy: { createdAt: 'asc' }
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Record Purchase (Bill)</h2>
      </div>
      <CreatePurchaseForm suppliers={suppliers} products={products} locations={locations} />
    </div>
  );
}

