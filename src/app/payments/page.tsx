export const dynamic = 'force-dynamic';
import { getPrisma } from "@/lib/prisma-client";
import { PaymentsTable } from "./payments-table";

export default async function PaymentsPage() {
  const dbPayments = await (await getPrisma()).payment.findMany({
    include: {
      customer: true,
      supplier: true,
      invoice: {
        select: { invoiceNumber: true }
      },
      purchase: {
        select: { billNumber: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  const payments = dbPayments.map(p => ({
    id: p.id,
    reference: p.paymentNumber,
    date: p.date.toISOString().split('T')[0],
    party: (p.customerId ? p.customer?.name : p.supplier?.name) || "Unknown",
    partyPhone: (p.customerId ? p.customer?.phone : p.supplier?.phone) || "",
    amount: p.amount,
    method: p.method,
    type: (p.type === "IN" ? "Received" : "Sent") as "Received" | "Sent",
    appliedTo: p.invoice?.invoiceNumber || p.purchase?.billNumber || "Advance / On Account"
  }));

  const customers = await (await getPrisma()).customer.findMany({
    select: { id: true, name: true, currentBalance: true },
    orderBy: { name: 'asc' }
  });

  const suppliers = await (await getPrisma()).supplier.findMany({
    select: { id: true, name: true, currentBalance: true },
    orderBy: { name: 'asc' }
  });

  const settings = await (await getPrisma()).companySetting.findFirst() || {};

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PaymentsTable 
        initialData={payments} 
        customers={customers} 
        suppliers={suppliers}
        settings={settings}
      />
    </div>
  );
}

