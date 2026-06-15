import { prisma } from "@/lib/auth";
import { PurchasesTable } from "./purchases-table";

export default async function PurchasesPage() {
  const dbPurchases = await prisma.purchase.findMany({
    include: {
      supplier: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  const purchases = dbPurchases.map(p => ({
    id: p.id,
    billNumber: p.billNumber,
    supplier: p.supplier.name,
    date: p.date.toISOString().split('T')[0],
    amount: p.totalAmount,
    status: p.status
  }));

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PurchasesTable initialData={purchases} />
    </div>
  );
}
