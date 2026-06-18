import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Overview } from "@/components/dashboard/overview";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { DollarSign, Users, Package, CreditCard, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { prisma } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  // 1. Fetch real aggregated data
  const invoicesWithItems = await prisma.invoice.findMany({
    include: { items: { include: { product: true } } }
  });

  let totalSales = 0;
  let totalCOGS = 0;

  invoicesWithItems.forEach(inv => {
    totalSales += inv.totalAmount;
    inv.items.forEach(item => {
      const costPrice = item.product?.purchasePrice || 0;
      totalCOGS += costPrice * item.quantity;
    });
  });

  const totalPurchasesAggr = await prisma.purchase.aggregate({ _sum: { totalAmount: true } });
  const totalPurchases = totalPurchasesAggr._sum.totalAmount || 0;

  const totalExpensesAggr = await prisma.expense.aggregate({ _sum: { amount: true } });
  const totalExpenses = totalExpensesAggr._sum.amount || 0;

  // Real Profit (Gross Margin - Expenses)
  const totalProfit = totalSales - totalCOGS - totalExpenses;

  const activeCustomers = await prisma.customer.count();
  const totalSuppliers = await prisma.supplier.count();

  // Pending money owed to us (Only positive customer balances)
  const pendingReceivablesAggr = await prisma.customer.aggregate({ 
    _sum: { currentBalance: true },
    where: { currentBalance: { gt: 0 } }
  });
  const pendingReceivables = pendingReceivablesAggr._sum.currentBalance || 0;

  // Pending money we owe (Positive supplier balances + Negative customer balances)
  const pendingPayablesSupplierAggr = await prisma.supplier.aggregate({ 
    _sum: { currentBalance: true },
    where: { currentBalance: { gt: 0 } }
  });
  
  const pendingPayablesCustomerAggr = await prisma.customer.aggregate({
    _sum: { currentBalance: true },
    where: { currentBalance: { lt: 0 } }
  });
  
  const pendingPayables = (pendingPayablesSupplierAggr._sum.currentBalance || 0) + Math.abs(pendingPayablesCustomerAggr._sum.currentBalance || 0);

  // Low stock products
  const products = await prisma.product.findMany();
  const lowStockProducts = products.filter(p => p.currentStock <= p.lowStockAlert);

  // Calculate actual Bank/Cash Balance based on Payments
  const allPayments = await prisma.payment.findMany({ select: { amount: true, customerId: true, supplierId: true } });
  let totalReceived = 0;
  let totalSent = 0;
  allPayments.forEach(p => {
    if (p.customerId) totalReceived += p.amount;
    if (p.supplierId) totalSent += p.amount;
  });
  
  const bankBalance = totalReceived - totalSent - totalExpenses;

  // 2. Fetch data for the Chart (Current Year Monthly Data)
  const currentYear = new Date().getFullYear();
  
  const allPurchases = await prisma.purchase.findMany({
    where: { date: { gte: new Date(`${currentYear}-01-01`), lte: new Date(`${currentYear}-12-31`) } },
    select: { date: true, totalAmount: true }
  });
  
  const allExpenses = await prisma.expense.findMany({
    where: { date: { gte: new Date(`${currentYear}-01-01`), lte: new Date(`${currentYear}-12-31`) } },
    select: { date: true, amount: true }
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const chartData = monthNames.map((name, index) => {
    const monthInvoices = invoicesWithItems.filter(i => i.date.getFullYear() === currentYear && i.date.getMonth() === index);
    const monthSales = monthInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
    
    const monthCOGS = monthInvoices.reduce((acc, curr) => {
      let cogs = 0;
      curr.items.forEach(item => {
        const costPrice = item.product?.purchasePrice || 0;
        cogs += costPrice * item.quantity;
      });
      return acc + cogs;
    }, 0);

    const monthPurchases = allPurchases.filter(p => p.date.getMonth() === index).reduce((acc, curr) => acc + curr.totalAmount, 0);
    const monthExpenses = allExpenses.filter(e => e.date.getMonth() === index).reduce((acc, curr) => acc + curr.amount, 0);
    
    return {
      name,
      sales: monthSales,
      expenses: monthExpenses,
      purchases: monthPurchases,
      profit: monthSales - monthCOGS - monthExpenses
    };
  });

  // Recent transactions (Top 5 sales)
  const recentInvoices = await prisma.invoice.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { customer: true }
  });

  const transactions = recentInvoices.map(inv => ({
    id: inv.id,
    name: inv.customer.name,
    email: inv.customer.email || "No email",
    amount: `+₹${inv.totalAmount.toFixed(2)}`,
    status: inv.status || "Completed",
    type: "Sale"
  }));

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      {/* Alerts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {lowStockProducts.length > 0 ? (
          <Link href="/products" className="block outline-none">
            <Alert variant="destructive" className="hover:border-red-500 hover:shadow-sm transition-all cursor-pointer bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Low Stock Alert</AlertTitle>
              <AlertDescription>
                {lowStockProducts.length} products are running low on inventory. Please restock soon.
              </AlertDescription>
            </Alert>
          </Link>
        ) : (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <Package className="h-4 w-4" color="green" />
            <AlertTitle>Inventory Healthy</AlertTitle>
            <AlertDescription>
              All products are adequately stocked.
            </AlertDescription>
          </Alert>
        )}
        
        {pendingReceivables > 0 ? (
          <Link href="/sales" className="block outline-none">
            <Alert className="hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer bg-white">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Pending Receivables</AlertTitle>
              <AlertDescription>
                You have ₹{pendingReceivables.toFixed(2)} pending to be collected from customers.
              </AlertDescription>
            </Alert>
          </Link>
        ) : (
          <Alert className="bg-slate-50 text-slate-800">
            <CreditCard className="h-4 w-4 text-slate-600" />
            <AlertTitle>No Pending Receivables</AlertTitle>
            <AlertDescription>
              All customer invoices are paid.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Stats Cards Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Link href="/sales" className="block outline-none">
          <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer h-full bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalSales.toFixed(2)}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/purchases" className="block outline-none">
          <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer h-full bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
              <Package className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalPurchases.toFixed(2)}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/expenses" className="block outline-none">
          <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer h-full bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <CreditCard className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalExpenses.toFixed(2)}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/reports" className="block outline-none">
          <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer h-full bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{totalProfit.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/customers" className="block outline-none">
          <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer h-full bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCustomers}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/suppliers" className="block outline-none">
          <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer h-full bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
              <Users className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSuppliers}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/payments" className="block outline-none">
          <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer h-full bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Est. Bank Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{bankBalance.toFixed(2)}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/sales" className="block outline-none">
          <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer h-full bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Receivables</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-500 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{pendingReceivables.toFixed(2)}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/purchases" className="block outline-none">
          <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer h-full bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Payables</CardTitle>
              <CreditCard className="h-4 w-4 text-slate-500 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₹{pendingPayables.toFixed(2)}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts and Recent Transactions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              Monthly Sales and Expenses Activity
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview data={chartData} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>
              Your most recent customer invoices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTransactions transactions={transactions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
