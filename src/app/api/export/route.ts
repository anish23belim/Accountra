// src/app/api/export/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/auth';
import { exportToCsv, exportToXlsx } from '@/lib/export';
import type { ExportColumn } from '@/types/export';

/**
 * Mapping of entity name -> Prisma fetch & column definition.
 * Add more entities as needed.
 */
const entityMap: Record<string, { fetch: () => Promise<any[]>; columns: ExportColumn[]; filename: (format: string) => string }> = {
  sales: {
    fetch: async () => {
      const data = await prisma.invoice.findMany({
        include: { customer: true, items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      });
      // flatten for export
      return data.map(inv => ({
        id: inv.id,
        number: inv.invoiceNumber,
        customer: inv.customer.name,
        date: inv.date?.toISOString().split('T')[0] ?? '',
        subTotal: inv.subTotal,
        discount: inv.discountAmount,
        freight: inv.freightCharge,
        tax: inv.taxAmount,
        total: inv.totalAmount,
        status: inv.status,
      }));
    },
    columns: [
      { header: 'ID', accessor: 'id' },
      { header: 'Invoice No', accessor: 'number' },
      { header: 'Customer', accessor: 'customer' },
      { header: 'Date', accessor: 'date' },
      { header: 'Sub Total', accessor: 'subTotal' },
      { header: 'Discount', accessor: 'discount' },
      { header: 'Freight', accessor: 'freight' },
      { header: 'Tax', accessor: 'tax' },
      { header: 'Total', accessor: 'total' },
      { header: 'Status', accessor: 'status' },
    ],
    filename: fmt => `sales_${new Date().toISOString().split('T')[0]}.${fmt}`,
  },
  purchases: {
    fetch: async () => {
      const data = await prisma.purchase.findMany({
        include: { supplier: true },
        orderBy: { createdAt: 'desc' },
      });
      return data.map(p => ({
        id: p.id,
        number: p.billNumber ?? '',
        supplier: p.supplier.name,
        date: p.date?.toISOString().split('T')[0] ?? '',
        subTotal: p.subTotal,
        tax: p.taxAmount,
        total: p.totalAmount,
        status: p.status,
      }));
    },
    columns: [
      { header: 'ID', accessor: 'id' },
      { header: 'Purchase No', accessor: 'number' },
      { header: 'Supplier', accessor: 'supplier' },
      { header: 'Date', accessor: 'date' },
      { header: 'Sub Total', accessor: 'subTotal' },
      { header: 'Tax', accessor: 'tax' },
      { header: 'Total', accessor: 'total' },
      { header: 'Status', accessor: 'status' },
    ],
    filename: fmt => `purchases_${new Date().toISOString().split('T')[0]}.${fmt}`,
  },
  // Add other entities (expenses, payments, inventory, customers, suppliers) similarly.
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const entity = url.searchParams.get('entity');
  const format = url.searchParams.get('format')?.toLowerCase() ?? 'csv'; // csv or xlsx

  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  if (!entity || !(entity in entityMap)) {
    return new NextResponse('Invalid entity', { status: 400 });
  }

  const { fetch, columns, filename } = entityMap[entity];
  let data = await fetch();
  const search = url.searchParams.get('search')?.toLowerCase() ?? '';
  if (search) {
    data = data.filter((row: any) =>
      (row.number?.toString().toLowerCase().includes(search) ||
       row.customer?.toString().toLowerCase().includes(search))
    );
  }

  let buffer: Buffer;
  let mime: string;
  if (format === 'xlsx') {
    buffer = await exportToXlsx(data, columns, `${entity} export`);
    mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  } else {
    buffer = await exportToCsv(data, columns);
    mime = 'text/csv';
  }

  const res = new NextResponse(buffer as any, {
    status: 200,
    headers: {
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="${filename(format)}"`,
    },
  });
  return res;
}
