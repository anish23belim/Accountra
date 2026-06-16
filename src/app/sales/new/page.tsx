import { prisma } from "@/lib/auth";
import { CreateInvoiceForm } from "./create-invoice-form";

export default async function NewInvoicePage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: 'asc' }
  });
  
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' }
  });
  
  const locations = await prisma.location.findMany({
    orderBy: { createdAt: 'asc' }
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Create Invoice</h2>
      </div>
      <CreateInvoiceForm customers={customers} products={products} locations={locations} />
    </div>
  );
}
