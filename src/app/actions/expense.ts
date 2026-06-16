"use server";

import { prisma } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteExpense(id: string) {
  try {
    await prisma.expense.delete({
      where: { id }
    });
    revalidatePath("/expenses");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete expense" };
  }
}

export async function saveExpense(data: {
  id?: string;
  category: string;
  description?: string;
  amount: number;
  paymentMethod: string;
}) {
  try {
    if (data.id) {
      await prisma.expense.update({
        where: { id: data.id },
        data: {
          category: data.category,
          description: data.description,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
        }
      });
    } else {
      await prisma.expense.create({
        data: {
          category: data.category,
          description: data.description,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
        }
      });
    }
    revalidatePath("/expenses");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to save expense" };
  }
}
