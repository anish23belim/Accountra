export const dynamic = 'force-dynamic';
import { CustomerTable } from "./customer-table";
import { getPrisma } from "@/lib/prisma-client";

export default async function CustomersPage() {
  const customers = await (await getPrisma()).customer.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <CustomerTable initialData={customers} />
    </div>
  );
}
