"use server";

import { getPrisma } from "@/lib/prisma-client";
import { revalidatePath } from "next/cache";

export async function resetTransactionData() {
  const prisma = await getPrisma();

  try {
    // Delete all transaction records
    await (await getPrisma()).invoiceItem.deleteMany();
    await (await getPrisma()).invoice.deleteMany();
    await (await getPrisma()).purchaseItem.deleteMany();
    await (await getPrisma()).purchase.deleteMany();
    await (await getPrisma()).expense.deleteMany();
    await (await getPrisma()).payment.deleteMany();
    await (await getPrisma()).serialNumber.deleteMany();

    // Reset Stock
    await (await getPrisma()).locationStock.deleteMany();
    await (await getPrisma()).product.updateMany({
      data: { currentStock: 0 }
    });

    // Reset Balances to Opening Balances
    const customers = await (await getPrisma()).customer.findMany();
    for (const c of customers) {
      await (await getPrisma()).customer.update({
        where: { id: c.id },
        data: { currentBalance: c.openingBalance }
      });
    }

    const suppliers = await (await getPrisma()).supplier.findMany();
    for (const s of suppliers) {
      await (await getPrisma()).supplier.update({
        where: { id: s.id },
        data: { currentBalance: s.openingBalance }
      });
    }

    revalidatePath("/");
    revalidatePath("/inventory");
    revalidatePath("/sales");
    revalidatePath("/purchases");
    revalidatePath("/expenses");
    revalidatePath("/payments");
    revalidatePath("/customers");
    revalidatePath("/suppliers");
    revalidatePath("/products");
    
    return { success: true };
  } catch (error: any) {
    console.error("Error resetting data:", error);
    return { success: false, error: error.message || "Failed to reset data" };
  }
}
