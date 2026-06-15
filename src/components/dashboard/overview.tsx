"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

const data = [
  { name: "Jan", sales: 4000, expenses: 2400, profit: 1600 },
  { name: "Feb", sales: 3000, expenses: 1398, profit: 1602 },
  { name: "Mar", sales: 2000, expenses: 9800, profit: -7800 },
  { name: "Apr", sales: 2780, expenses: 3908, profit: -1128 },
  { name: "May", sales: 1890, expenses: 4800, profit: -2910 },
  { name: "Jun", sales: 2390, expenses: 3800, profit: -1410 },
  { name: "Jul", sales: 3490, expenses: 4300, profit: -810 },
  { name: "Aug", sales: 4000, expenses: 2400, profit: 1600 },
  { name: "Sep", sales: 3000, expenses: 1398, profit: 1602 },
  { name: "Oct", sales: 2000, expenses: 9800, profit: -7800 },
  { name: "Nov", sales: 2780, expenses: 3908, profit: -1128 },
  { name: "Dec", sales: 3490, expenses: 4300, profit: -810 },
];

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${value}`}
        />
        <Tooltip />
        <Legend />
        <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Sales" />
        <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
        <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="Profit" />
      </BarChart>
    </ResponsiveContainer>
  );
}
