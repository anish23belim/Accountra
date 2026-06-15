"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function RecentTransactions({ transactions }: { transactions: Array<{id: string, name: string, email: string, amount: string, status: string, type: string}> }) {

  return (
    <div className="space-y-8">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{transaction.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{transaction.name}</p>
            <p className="text-sm text-muted-foreground">
              {transaction.type} • {transaction.status}
            </p>
          </div>
          <div className="ml-auto font-medium">{transaction.amount}</div>
        </div>
      ))}
    </div>
  );
}
