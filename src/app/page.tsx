import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OverviewWrapper } from "@/components/dashboard/overview-wrapper";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { DollarSign, Users, Package, CreditCard, AlertCircle, ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, Banknote, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { getPrisma } from "@/lib/prisma-client";

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  try {
    const prisma = await getPrisma();
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(`${currentYear}-01-01`);
    const yearEnd = new Date(`${currentYear}-12-31`);

    // Simplified data loading to prevent connection timeouts
    // as requested by the user ("un saari chijo ko hatao fir chack kro")
    
    // Test a single connection query
    await prisma.companySetting.findFirst();

    const totalSales = 0;
    const totalCOGS = 0;
    const totalPurchases = 0;
    const totalExpenses = 0;
    const totalProfit = 0;
    const pendingReceivables = 0;
    const pendingPayables = 0;
    const activeCustomers = 0;
    const bankBalance = 0;
    const lowStockProducts: any[] = [];
    const chartData: any[] = [];
    const transactions: any[] = [];

    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full">
        {/* ... The rest of the dashboard UI ... */}
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
          <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-all bg-white overflow-hidden group h-full cursor-pointer">
            <CardHeader className="flex flex-col items-center justify-center space-y-2 pb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-emerald-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-500 text-center">Bank / Cash</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">₹{bankBalance.toFixed(2)}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports" className="block outline-none">
          <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-all bg-white overflow-hidden group h-full cursor-pointer">
            <CardHeader className="flex flex-col items-center justify-center space-y-2 pb-2">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-indigo-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-500 text-center">Net Profit</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center text-center">
              <div className={`text-2xl sm:text-3xl font-extrabold ${totalProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                ₹{totalProfit.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sales" className="block outline-none">
          <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-all bg-white overflow-hidden group h-full cursor-pointer">
            <CardHeader className="flex flex-col items-center justify-center space-y-2 pb-2">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <ArrowDownRight className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-500 text-center">Receivables</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">₹{pendingReceivables.toFixed(2)}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/purchases" className="block outline-none">
          <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-all bg-white overflow-hidden group h-full cursor-pointer">
            <CardHeader className="flex flex-col items-center justify-center space-y-2 pb-2">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-rose-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-500 text-center">Payables</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">₹{pendingPayables.toFixed(2)}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Link href="/sales" className="block outline-none">
          <Card className="rounded-2xl border border-slate-100 shadow-none hover:shadow-sm hover:border-blue-200 transition-all bg-white/50 backdrop-blur-sm cursor-pointer h-full">
            <CardHeader className="flex flex-col items-center justify-center space-y-2 pb-2">
              <Package className="h-6 w-6 text-slate-400" />
              <CardTitle className="text-xs uppercase tracking-wider font-bold text-slate-400 text-center">Total Sales</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center text-center">
              <div className="text-lg font-bold text-slate-700">₹{totalSales.toFixed(2)}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/purchases" className="block outline-none">
          <Card className="rounded-2xl border border-slate-100 shadow-none hover:shadow-sm hover:border-blue-200 transition-all bg-white/50 backdrop-blur-sm cursor-pointer h-full">
            <CardHeader className="flex flex-col items-center justify-center space-y-2 pb-2">
              <ShoppingCart className="h-6 w-6 text-slate-400" />
              <CardTitle className="text-xs uppercase tracking-wider font-bold text-slate-400 text-center">Purchases</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center text-center">
              <div className="text-lg font-bold text-slate-700">₹{totalPurchases.toFixed(2)}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/expenses" className="block outline-none">
          <Card className="rounded-2xl border border-slate-100 shadow-none hover:shadow-sm hover:border-blue-200 transition-all bg-white/50 backdrop-blur-sm cursor-pointer h-full">
            <CardHeader className="flex flex-col items-center justify-center space-y-2 pb-2">
              <CreditCard className="h-6 w-6 text-slate-400" />
              <CardTitle className="text-xs uppercase tracking-wider font-bold text-slate-400 text-center">Expenses</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center text-center">
              <div className="text-lg font-bold text-slate-700">₹{totalExpenses.toFixed(2)}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/customers" className="block outline-none">
          <Card className="rounded-2xl border border-slate-100 shadow-none hover:shadow-sm hover:border-blue-200 transition-all bg-white/50 backdrop-blur-sm cursor-pointer h-full">
            <CardHeader className="flex flex-col items-center justify-center space-y-2 pb-2">
              <Users className="h-6 w-6 text-slate-400" />
              <CardTitle className="text-xs uppercase tracking-wider font-bold text-slate-400 text-center">Customers</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center text-center">
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
          <CardContent className="pl-2">
            <OverviewWrapper data={chartData} />
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
  } catch (error: any) {
    console.error("Dashboard Error:", error);
    return (
      <div className="flex-1 p-8 pt-6 max-w-7xl mx-auto w-full flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-2xl w-full text-center shadow-sm">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-slate-600 mb-6">There was a problem loading your company data. This usually happens if the database connection times out or the company setup is incomplete.</p>
          <div className="bg-white p-4 rounded-xl border border-red-100 text-left overflow-auto max-h-48 text-sm text-red-600 font-mono mb-6 shadow-inner">
            {error?.message || "Unknown error occurred"}
          </div>
          <Link href="/companies">
            <Button className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg">
              Go back to Companies
            </Button>
          </Link>
        </div>
      </div>
    );
  }
}
