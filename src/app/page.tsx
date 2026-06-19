import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Overview } from "@/components/dashboard/overview";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { DollarSign, Users, Package, CreditCard, AlertCircle, ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, Banknote, ShoppingCart } from "lucide-react";
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

  const returnsWithItems = await prisma.salesReturn.findMany({
    include: { items: { include: { product: true } } }
  });

  returnsWithItems.forEach(ret => {
    totalSales -= ret.totalAmount;
    ret.items.forEach(item => {
      const costPrice = item.product?.purchasePrice || 0;
      totalCOGS -= costPrice * item.quantity;
    });
  });

  const totalPurchasesAggr = await prisma.purchase.aggregate({ _sum: { totalAmount: true } });
  const purchaseReturnsAggr = await prisma.purchaseReturn.aggregate({ _sum: { totalAmount: true } });
  const totalPurchases = (totalPurchasesAggr._sum.totalAmount || 0) - (purchaseReturnsAggr._sum.totalAmount || 0);

  const totalExpensesAggr = await prisma.expense.aggregate({ _sum: { amount: true } });
  const totalExpenses = totalExpensesAggr._sum.amount || 0;

  // Real Profit (Gross Margin - Expenses)
  const totalProfit = totalSales - totalCOGS - totalExpenses;

  const activeCustomers = await prisma.customer.count();

  // Pending money owed to us
  const pendingReceivablesAggr = await prisma.customer.aggregate({ 
    _sum: { currentBalance: true },
    where: { currentBalance: { gt: 0 } }
  });
  const pendingReceivables = pendingReceivablesAggr._sum.currentBalance || 0;

  // Pending money we owe
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
  const allPayments = await prisma.payment.findMany({ select: { amount: true, type: true } });
  let totalReceived = 0;
  let totalSent = 0;
  allPayments.forEach(p => {
    if (p.type === "IN") totalReceived += p.amount;
    if (p.type === "OUT") totalSent += p.amount;
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
    const monthSalesReturns = returnsWithItems.filter(r => r.date.getFullYear() === currentYear && r.date.getMonth() === index);
    const monthSalesReturnsAmount = monthSalesReturns.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const monthSalesReturnsCOGS = monthSalesReturns.reduce((acc, curr) => {
      let cogs = 0;
      curr.items.forEach(item => {
        const costPrice = item.product?.purchasePrice || 0;
        cogs += costPrice * item.quantity;
      });
      return acc + cogs;
    }, 0);

    const monthSales = monthInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0) - monthSalesReturnsAmount;
    
    const monthCOGS = monthInvoices.reduce((acc, curr) => {
      let cogs = 0;
      curr.items.forEach(item => {
        const costPrice = item.product?.purchasePrice || 0;
        cogs += costPrice * item.quantity;
      });
      return acc + cogs;
    }, 0) - monthSalesReturnsCOGS;

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
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Overview</h2>
          <p className="text-slate-500 mt-1">Here's what's happening with your business today.</p>
        </div>
      </div>
      
      {/* Premium Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        {lowStockProducts.length > 0 && (
          <Link href="/products" className="block outline-none">
            <div className="flex items-center gap-4 bg-orange-50 border border-orange-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-orange-200 transition-all cursor-pointer">
              <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 flex-shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-orange-900">Low Stock</h4>
                <p className="text-sm text-orange-700">{lowStockProducts.length} items need restock.</p>
              </div>
            </div>
          </Link>
        )}
        
        {pendingReceivables > 0 && (
          <Link href="/sales" className="block outline-none">
            <div className="flex items-center gap-4 bg-blue-50 border border-blue-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
                <ArrowDownRight className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">Receivables</h4>
                <p className="text-sm text-blue-700">₹{pendingReceivables.toFixed(2)} pending collection.</p>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Primary Financial Stats (Hero Cards) */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Link href="/payments" className="block outline-none">
          <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-all bg-white relative overflow-hidden group h-full cursor-pointer">
            <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-300">
              <Banknote className="w-20 h-20 text-emerald-600" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-slate-500">Bank / Cash</CardTitle>
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">₹{bankBalance.toFixed(2)}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports" className="block outline-none">
          <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-all bg-white relative overflow-hidden group h-full cursor-pointer">
            <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-20 h-20 text-indigo-600" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-slate-500">Net Profit</CardTitle>
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-indigo-600" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className={`text-2xl sm:text-3xl font-extrabold ${totalProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                ₹{totalProfit.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sales" className="block outline-none">
          <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-all bg-white relative overflow-hidden group h-full cursor-pointer">
            <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-300">
              <ArrowDownRight className="w-20 h-20 text-blue-600" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-slate-500">Receivables</CardTitle>
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <ArrowDownRight className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">₹{pendingReceivables.toFixed(2)}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/purchases" className="block outline-none">
          <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-all bg-white relative overflow-hidden group h-full cursor-pointer">
            <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-300">
              <ArrowUpRight className="w-20 h-20 text-rose-600" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-slate-500">Payables</CardTitle>
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4 text-rose-600" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">₹{pendingPayables.toFixed(2)}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Link href="/sales" className="block outline-none">
          <Card className="rounded-2xl border border-slate-100 shadow-none hover:shadow-sm hover:border-blue-200 transition-all bg-white/50 backdrop-blur-sm cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs uppercase tracking-wider font-bold text-slate-400">Total Sales</CardTitle>
              <Package className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-slate-700">₹{totalSales.toFixed(2)}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/purchases" className="block outline-none">
          <Card className="rounded-2xl border border-slate-100 shadow-none hover:shadow-sm hover:border-blue-200 transition-all bg-white/50 backdrop-blur-sm cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs uppercase tracking-wider font-bold text-slate-400">Purchases</CardTitle>
              <ShoppingCart className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-slate-700">₹{totalPurchases.toFixed(2)}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/expenses" className="block outline-none">
          <Card className="rounded-2xl border border-slate-100 shadow-none hover:shadow-sm hover:border-blue-200 transition-all bg-white/50 backdrop-blur-sm cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs uppercase tracking-wider font-bold text-slate-400">Expenses</CardTitle>
              <CreditCard className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-slate-700">₹{totalExpenses.toFixed(2)}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/customers" className="block outline-none">
          <Card className="rounded-2xl border border-slate-100 shadow-none hover:shadow-sm hover:border-blue-200 transition-all bg-white/50 backdrop-blur-sm cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs uppercase tracking-wider font-bold text-slate-400">Customers</CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-slate-700">{activeCustomers}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts and Recent Transactions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 rounded-2xl border-0 shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-bold">Analytics</CardTitle>
            <CardDescription>Sales vs Expenses this year</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pl-0">
            <Overview data={chartData} />
          </CardContent>
        </Card>
        
        <Card className="col-span-3 rounded-2xl border-0 shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-bold">Recent Sales</CardTitle>
            <CardDescription>Latest customer invoices</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4">
              <RecentTransactions transactions={transactions} />
            </div>
            <Link href="/sales" className="block text-center text-sm font-semibold text-blue-600 hover:bg-blue-50 py-3 border-t border-slate-100 transition-colors">
              View All Sales
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
