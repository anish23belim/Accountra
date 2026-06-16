export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/auth';
import { ReturnsTable } from './returns-table';

export default async function SalesReturnsPage() {
  const dbReturns = await prisma.salesReturn.findMany({
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const formattedReturns = dbReturns.map((ret) => ({
    id: ret.id,
    number: ret.returnNumber,
    customer: ret.customer.name,
    customerDetails: {
      address: ret.customer.address || '',
      phone: ret.customer.phone || '',
      gst: ret.customer.gstNumber || '',
    },
    date: ret.date.toISOString().split('T')[0],
    amount: ret.totalAmount,
    items: ret.items.map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
      price: i.unitPrice,
      total: i.total,
      serialNumber: i.serialNumber || '',
    })),
  }));

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <ReturnsTable initialData={formattedReturns} />
    </div>
  );
}
