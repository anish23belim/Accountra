import { prisma } from "@/lib/auth";
import { PaymentsTable } from "./payments-table";

export default async function PaymentsPage() {
  const dbPayments = await prisma.payment.findMany({
    include: {
      customer: true,
      supplier: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  const payments = dbPayments.map(p => ({
    id: p.id,
    reference: p.paymentNumber,
    date: p.date.toISOString().split('T')[0],
    party: (p.customerId ? p.customer?.name : p.supplier?.name) || "Unknown",
    amount: p.amount,
    method: p.method,
    type: (p.customerId ? "Received" : "Sent") as "Received" | "Sent"
  }));

  const customers = await prisma.customer.findMany({
    select: { id: true, name: true, currentBalance: true },
    orderBy: { name: 'asc' }
  });

  const suppliers = await prisma.supplier.findMany({
    select: { id: true, name: true, currentBalance: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PaymentsTable 
        initialData={payments} 
        customers={customers} 
        suppliers={suppliers} 
      />
    </div>
  );
}
