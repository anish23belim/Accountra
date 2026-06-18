import { prisma } from "@/lib/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function CashbookPage() {
  const payments = await prisma.payment.findMany({
    where: {
      method: { in: ["Cash", "CASH", "cash"] }
    },
    include: {
      customer: true,
      supplier: true,
    },
    orderBy: { date: 'asc' }
  });

  const expenses = await prisma.expense.findMany({
    where: {
      paymentMethod: { in: ["Cash", "CASH", "cash"] }
    },
    orderBy: { date: 'asc' }
  });

  type LedgerEntry = {
    id: string;
    date: Date;
    description: string;
    type: "IN" | "OUT";
    amount: number;
    balance: number;
  };

  let entries: LedgerEntry[] = [];

  for (const p of payments) {
      if (p.type === "IN") {
        entries.push({
          id: p.id,
          date: p.date,
          description: `Receipt from ${p.customerId ? `Customer: ${p.customer?.name}` : `Supplier: ${p.supplier?.name}`} ${p.reference ? `(${p.reference})` : ''}`,
          type: "IN",
          amount: p.amount,
          balance: 0
        });
      } else {
        entries.push({
          id: p.id,
          date: p.date,
          description: `Payment to ${p.customerId ? `Customer: ${p.customer?.name}` : `Supplier: ${p.supplier?.name}`} ${p.reference ? `(${p.reference})` : ''}`,
          type: "OUT",
          amount: p.amount,
          balance: 0
        });
      }
  }

  for (const e of expenses) {
    entries.push({
      id: e.id,
      date: e.date,
      description: `Expense: ${e.category} ${e.description ? `- ${e.description}` : ''}`,
      type: "OUT",
      amount: e.amount,
      balance: 0
    });
  }

  entries.sort((a, b) => a.date.getTime() - b.date.getTime());

  let runningBalance = 0;
  for (const entry of entries) {
    if (entry.type === "IN") runningBalance += entry.amount;
    else runningBalance -= entry.amount;
    entry.balance = runningBalance;
  }

  const totalIn = entries.filter(e => e.type === "IN").reduce((acc, curr) => acc + curr.amount, 0);
  const totalOut = entries.filter(e => e.type === "OUT").reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Cash Book / Cash Ledger</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-700 font-semibold mb-1">Total Cash In</div>
          <div className="text-2xl font-bold text-green-900">₹{totalIn.toFixed(2)}</div>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-700 font-semibold mb-1">Total Cash Out</div>
          <div className="text-2xl font-bold text-red-900">₹{totalOut.toFixed(2)}</div>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-700 font-semibold mb-1">Current Cash Balance</div>
          <div className="text-2xl font-bold text-blue-900">₹{runningBalance.toFixed(2)}</div>
        </div>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right text-green-700">Cash In (+)</TableHead>
              <TableHead className="text-right text-red-700">Cash Out (-)</TableHead>
              <TableHead className="text-right font-bold">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">No cash transactions found</TableCell>
              </TableRow>
            ) : entries.map(entry => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap">
                  {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(entry.date)}
                </TableCell>
                <TableCell>{entry.description}</TableCell>
                <TableCell className="text-right text-green-700">{entry.type === "IN" ? `₹${entry.amount.toFixed(2)}` : ""}</TableCell>
                <TableCell className="text-right text-red-700">{entry.type === "OUT" ? `₹${entry.amount.toFixed(2)}` : ""}</TableCell>
                <TableCell className="text-right font-medium">₹{entry.balance.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
