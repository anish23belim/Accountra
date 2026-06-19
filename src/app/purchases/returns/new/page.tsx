export const dynamic = 'force-dynamic';
import { getPrisma } from "@/lib/prisma-client";
import { CreateReturnForm } from "./create-return-form";

export default async function NewpurchaseReturnPage() {
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
        <h2 className="text-3xl font-bold tracking-tight">Create Sales Return (Debit Note)</h2>
      </div>
      <CreateReturnForm suppliers={suppliers} products={products} locations={locations} />
    </div>
  );
}


