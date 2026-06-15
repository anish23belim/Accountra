"use server";

import { prisma } from "@/lib/auth";

export async function getReportData(type: string) {
  try {
    if (type === "Sales Report") {
      const invoices = await prisma.invoice.findMany({
        include: { customer: true, items: true },
        orderBy: { date: 'desc' }
      });
      return invoices.map(i => ({
        "Date": i.date.toISOString().split("T")[0],
        "Invoice Number": i.invoiceNumber,
        "Customer": i.customer.name,
        "Subtotal": i.subTotal,
        "Tax Amount": i.taxAmount,
        "Total Amount": i.totalAmount,
        "Status": i.status
      }));
    }

    if (type === "Purchase Report") {
      const purchases = await prisma.purchase.findMany({
        include: { supplier: true, items: true },
        orderBy: { date: 'desc' }
      });
      return purchases.map(p => ({
        "Date": p.date.toISOString().split("T")[0],
        "Bill Number": p.billNumber || "No Bill#",
        "Supplier": p.supplier.name,
        "Subtotal": p.subTotal,
        "Tax Amount": p.taxAmount,
        "Total Amount": p.totalAmount,
        "Status": p.status
      }));
    }

    if (type === "GST Report") {
      // Gather all sales and purchases
      const sales = await prisma.invoice.findMany({
        include: { customer: true },
        orderBy: { date: 'asc' }
      });
      const purchases = await prisma.purchase.findMany({
        include: { supplier: true },
        orderBy: { date: 'asc' }
      });

      const records: any[] = [];
      sales.forEach(s => {
        records.push({
          "Type": "Sale",
          "Date": s.date.toISOString().split("T")[0],
          "Voucher No": s.invoiceNumber,
          "Party Name": s.customer.name,
          "GSTIN/UIN": s.customer.gstNumber || "Unregistered",
          "Taxable Amount": s.subTotal,
          "Tax Amount": s.taxAmount,
          "Total Amount": s.totalAmount
        });
      });
      purchases.forEach(p => {
        records.push({
          "Type": "Purchase",
          "Date": p.date.toISOString().split("T")[0],
          "Voucher No": p.billNumber || "No Bill#",
          "Party Name": p.supplier.name,
          "GSTIN/UIN": p.supplier.gstNumber || "Unregistered",
          "Taxable Amount": p.subTotal,
          "Tax Amount": p.taxAmount,
          "Total Amount": p.totalAmount
        });
      });

      // Sort by date
      records.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
      console.log(`Generated GST Report. Sales: ${sales.length}, Purchases: ${purchases.length}, Total Records: ${records.length}`);
      return records;
    }

    if (type === "Inventory Report") {
      const products = await prisma.product.findMany({
        orderBy: { name: 'asc' }
      });
      return products.map(p => ({
        "Product Name": p.name,
        "Category": p.category || "-",
        "Unit": p.unit,
        "Purchase Price": p.purchasePrice,
        "Selling Price": p.sellingPrice,
        "Current Stock": p.currentStock,
        "Stock Value": p.currentStock * p.purchasePrice
      }));
    }

    if (type === "Expense Report") {
      const expenses = await prisma.expense.findMany({ orderBy: { date: 'desc' } });
      return expenses.map(e => ({
        "Date": e.date.toISOString().split("T")[0],
        "Category": e.category,
        "Description": e.description || "-",
        "Payment Method": e.paymentMethod,
        "Amount": e.amount
      }));
    }

    if (type === "Customer Statement") {
      const customers = await prisma.customer.findMany({ orderBy: { name: 'asc' } });
      return customers.map(c => ({
        "Name": c.name,
        "Type": c.customerType,
        "Phone": c.phone || "-",
        "GSTIN": c.gstNumber || "-",
        "Current Balance": c.currentBalance
      }));
    }

    if (type === "Supplier Statement") {
      const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } });
      return suppliers.map(s => ({
        "Name": s.name,
        "Phone": s.phone || "-",
        "GSTIN": s.gstNumber || "-",
        "Current Balance": s.currentBalance
      }));
    }

    if (type === "Profit & Loss") {
      const salesAggr = await prisma.invoice.aggregate({ _sum: { subTotal: true } });
      const purchasesAggr = await prisma.purchase.aggregate({ _sum: { subTotal: true } });
      const expensesAggr = await prisma.expense.aggregate({ _sum: { amount: true } });
      
      const sales = salesAggr._sum.subTotal || 0;
      const purchases = purchasesAggr._sum.subTotal || 0;
      const expenses = expensesAggr._sum.amount || 0;
      
      return [
        { "Item": "Total Sales Revenue", "Amount": sales },
        { "Item": "Total Cost of Purchases", "Amount": purchases },
        { "Item": "Total Operating Expenses", "Amount": expenses },
        { "Item": "Net Profit / Loss", "Amount": sales - purchases - expenses }
      ];
    }

    if (type === "Balance Sheet" || type === "Cash Flow") {
      return [
        { "Notice": `Detailed ${type} generation requires further accounting configuration and will be available in future updates.` }
      ];
    }

    return [];
  } catch (error) {
    console.error("Error generating report:", error);
    return [];
  }
}
