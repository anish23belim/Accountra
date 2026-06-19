export const dynamic = 'force-dynamic';
import { ExpenseTable } from "./expense-table";
import { prisma } from "@/lib/auth";

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <ExpenseTable initialData={expenses} />
    </div>
  );
}
