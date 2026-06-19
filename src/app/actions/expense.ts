"use server";

import { getPrisma } from "@/lib/prisma-client";
import { revalidatePath } from "next/cache";

export async function deleteExpense(id: string) {
  const prisma = await getPrisma();

  try {
    await (await getPrisma()).expense.delete({
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
  const prisma = await getPrisma();

  try {
    if (data.id) {
      await (await getPrisma()).expense.update({
        where: { id: data.id },
        data: {
          category: data.category,
          description: data.description,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
        }
      });
    } else {
      await (await getPrisma()).expense.create({
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
