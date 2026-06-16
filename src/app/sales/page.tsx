import { SalesTable } from "./sales-table";
import { prisma } from "@/lib/auth";

export default async function SalesPage() {
  const dbInvoices = await prisma.invoice.findMany({
    include: {
      customer: true,
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  const invoices = dbInvoices.map(inv => ({
    id: inv.id,
    number: inv.invoiceNumber,
    customer: inv.customer.name,
    customerDetails: {
      address: inv.customer.address || "",
      phone: inv.customer.phone || "",
      gst: inv.customer.gstNumber || ""
    },
    date: inv.date.toISOString().split('T')[0],
    amount: inv.totalAmount,
    taxAmount: inv.taxAmount,
    status: inv.status,
    transporter: inv.transporter || "",
    vehicleNo: inv.vehicleNo || "",
    ewayBill: inv.ewayBill || "",
    items: inv.items.map(item => ({
      name: item.product.name,
      serialNumber: item.serialNumber || "",
      quantity: item.quantity,
      price: item.unitPrice,
      total: item.total
    }))
  }));

  const settings = await prisma.companySetting.findFirst();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <SalesTable initialData={invoices} settings={settings} />
    </div>
  );
}
