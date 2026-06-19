export const dynamic = 'force-dynamic';
import { SupplierTable } from "./supplier-table";
import { getPrisma } from "@/lib/prisma-client";

export default async function SuppliersPage() {
  const suppliers = await (await getPrisma()).supplier.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <SupplierTable initialData={suppliers} />
    </div>
  );
}
