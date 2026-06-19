export const dynamic = 'force-dynamic';
import { SupplierTable } from "./supplier-table";
import { prisma } from "@/lib/auth";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <SupplierTable initialData={suppliers} />
    </div>
  );
}
