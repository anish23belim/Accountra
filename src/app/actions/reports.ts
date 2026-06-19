"use server";

import { getPrisma } from "@/lib/prisma-client";

export async function getReportData(type: string) {
  const prisma = await getPrisma();

  try {
    if (type === "Sales Report") {
      const invoices = await (await getPrisma()).invoice.findMany({
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
      const purchases = await (await getPrisma()).purchase.findMany({
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
      const sales = await (await getPrisma()).invoice.findMany({
        include: { customer: true },
        orderBy: { date: 'asc' }
      });
      const purchases = await (await getPrisma()).purchase.findMany({
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
      const products = await (await getPrisma()).product.findMany({
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
      const expenses = await (await getPrisma()).expense.findMany({ orderBy: { date: 'desc' } });
      return expenses.map(e => ({
        "Date": e.date.toISOString().split("T")[0],
        "Category": e.category,
        "Description": e.description || "-",
        "Payment Method": e.paymentMethod,
        "Amount": e.amount
      }));
    }

    if (type === "Customer Statement") {
      const customers = await (await getPrisma()).customer.findMany({ orderBy: { name: 'asc' } });
      return customers.map(c => ({
        "Name": c.name,
        "Type": c.customerType,
        "Phone": c.phone || "-",
        "GSTIN": c.gstNumber || "-",
        "Current Balance": c.currentBalance
      }));
    }

    if (type === "Supplier Statement") {
      const suppliers = await (await getPrisma()).supplier.findMany({ orderBy: { name: 'asc' } });
      return suppliers.map(s => ({
        "Name": s.name,
        "Phone": s.phone || "-",
        "GSTIN": s.gstNumber || "-",
        "Current Balance": s.currentBalance
      }));
    }

    if (type === "Profit & Loss") {
      const sales = await (await getPrisma()).invoice.findMany();
      const purchases = await (await getPrisma()).purchase.findMany();
      const expenses = await (await getPrisma()).expense.findMany();
      
      const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
      const totalPurchases = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      
      return [
        { "Category": "Sales", "Amount": totalSales },
        { "Category": "Purchases", "Amount": totalPurchases },
        { "Category": "Expenses", "Amount": totalExpenses },
        { "Category": "Net Profit", "Amount": totalSales - totalPurchases - totalExpenses }
      ];
    }

    if (type === "Balance Sheet" || type === "Cash Flow") {
      return [
        { "Notice": `Detailed ${type} generation requires further accounting configuration and will be available in future updates.` }
      ];
    }

    return [];
  } catch (error) {
    console.error("Failed to fetch report:", error);
    return [];
  }
}

export async function getProfitLossStats() {
  const prisma = await getPrisma();

  try {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

    const sales = await (await getPrisma()).invoice.findMany({
      where: { date: { gte: startDate, lte: endDate } }
    });
    
    const purchases = await (await getPrisma()).purchase.findMany({
      where: { date: { gte: startDate, lte: endDate } }
    });

    const expenses = await (await getPrisma()).expense.findMany({
      where: { date: { gte: startDate, lte: endDate } }
    });

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      name: new Date(currentYear, i, 1).toLocaleString('default', { month: 'short' }),
      sales: 0,
      purchases: 0,
      expenses: 0,
      profit: 0
    }));

    sales.forEach(s => {
      const month = s.date.getMonth();
      monthlyData[month].sales += s.totalAmount;
      monthlyData[month].profit += s.totalAmount;
    });

    purchases.forEach(p => {
      const month = p.date.getMonth();
      monthlyData[month].purchases += p.totalAmount;
      monthlyData[month].profit -= p.totalAmount;
    });

    expenses.forEach(e => {
      const month = e.date.getMonth();
      monthlyData[month].expenses += e.amount;
      monthlyData[month].profit -= e.amount;
    });

    return monthlyData;
  } catch (error) {
    console.error(error);
    return [];
  }
}
