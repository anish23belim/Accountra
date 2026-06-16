"use server";

import { prisma } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function resetTransactionData() {
  try {
    // Delete all transaction records
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.purchaseItem.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.serialNumber.deleteMany();

    // Reset Stock
    await prisma.locationStock.deleteMany();
    await prisma.product.updateMany({
      data: { currentStock: 0 }
    });

    // Reset Balances to Opening Balances
    const customers = await prisma.customer.findMany();
    for (const c of customers) {
      await prisma.customer.update({
        where: { id: c.id },
        data: { currentBalance: c.openingBalance }
      });
    }

    const suppliers = await prisma.supplier.findMany();
    for (const s of suppliers) {
      await prisma.supplier.update({
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
