"use server";

import { prisma } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createPayment(data: {
  amount: number;
  method: string;
  reference?: string;
  customerId?: string;
  supplierId?: string;
  invoiceId?: string;
  purchaseId?: string;
}) {
  try {
    const paymentNumber = `PAY-${Date.now().toString().slice(-6)}`;
    
    await prisma.payment.create({
      data: {
        paymentNumber,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
        customerId: data.customerId || null,
        supplierId: data.supplierId || null,
        invoiceId: data.invoiceId || null,
        purchaseId: data.purchaseId || null,
      }
    });

    // Reduce customer balance if they paid us
    if (data.customerId) {
      await prisma.customer.update({
        where: { id: data.customerId },
        data: {
          currentBalance: {
            decrement: data.amount
          }
        }
      });
      revalidatePath("/customers");
    }

    // Reduce supplier balance if we paid them
    if (data.supplierId) {
      await prisma.supplier.update({
        where: { id: data.supplierId },
        data: {
          currentBalance: {
            decrement: data.amount
          }
        }
      });
      revalidatePath("/suppliers");
    }

    // Update invoice if linked
    if (data.invoiceId) {
      const inv = await prisma.invoice.findUnique({ where: { id: data.invoiceId } });
      if (inv) {
        const newPaid = inv.amountPaid + data.amount;
        await prisma.invoice.update({
          where: { id: data.invoiceId },
          data: {
            amountPaid: newPaid,
            status: newPaid >= inv.totalAmount ? "PAID" : "PARTIAL"
          }
        });
        revalidatePath("/sales");
      }
    }

    // Update purchase if linked
    if (data.purchaseId) {
      const pur = await prisma.purchase.findUnique({ where: { id: data.purchaseId } });
      if (pur) {
        const newPaid = pur.amountPaid + data.amount;
        await prisma.purchase.update({
          where: { id: data.purchaseId },
          data: {
            amountPaid: newPaid,
            status: newPaid >= pur.totalAmount ? "PAID" : "PARTIAL"
          }
        });
        revalidatePath("/purchases");
      }
    }

    revalidatePath("/payments");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return { success: false, error: error.message || "Failed to create payment" };
  }
}

export async function deletePayment(id: string) {
  try {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (payment) {
      if (payment.customerId) {
        await prisma.customer.update({
          where: { id: payment.customerId },
          data: { currentBalance: { increment: payment.amount } }
        });
      }
      if (payment.supplierId) {
        await prisma.supplier.update({
          where: { id: payment.supplierId },
          data: { currentBalance: { increment: payment.amount } }
        });
      }
    }
    
    
    await prisma.payment.delete({
      where: { id }
    });
    
    // Also revert invoice/purchase amountPaid
    if (payment && payment.invoiceId) {
      const inv = await prisma.invoice.findUnique({ where: { id: payment.invoiceId } });
      if (inv) {
        const newPaid = Math.max(0, inv.amountPaid - payment.amount);
        await prisma.invoice.update({
          where: { id: payment.invoiceId },
          data: { amountPaid: newPaid, status: newPaid === 0 ? "UNPAID" : newPaid >= inv.totalAmount ? "PAID" : "PARTIAL" }
        });
        revalidatePath("/sales");
      }
    }
    if (payment && payment.purchaseId) {
      const pur = await prisma.purchase.findUnique({ where: { id: payment.purchaseId } });
      if (pur) {
        const newPaid = Math.max(0, pur.amountPaid - payment.amount);
        await prisma.purchase.update({
          where: { id: payment.purchaseId },
          data: { amountPaid: newPaid, status: newPaid === 0 ? "UNPAID" : newPaid >= pur.totalAmount ? "PAID" : "PARTIAL" }
        });
        revalidatePath("/purchases");
      }
    }

    revalidatePath("/payments");
    revalidatePath("/customers");
    revalidatePath("/suppliers");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete payment" };
  }
}

export async function getDueBills(partyId: string, type: "Customer" | "Supplier") {
  try {
    if (type === "Customer") {
      const bills = await prisma.invoice.findMany({
        where: {
          customerId: partyId,
          status: { in: ["UNPAID", "PARTIAL"] }
        },
        orderBy: { date: 'asc' },
        select: { id: true, invoiceNumber: true, totalAmount: true, amountPaid: true, date: true }
      });
      return bills.map(b => ({
        id: b.id,
        billNumber: b.invoiceNumber,
        date: b.date,
        total: b.totalAmount,
        paid: b.amountPaid,
        due: b.totalAmount - b.amountPaid
      }));
    } else {
      const bills = await prisma.purchase.findMany({
        where: {
          supplierId: partyId,
          status: { in: ["UNPAID", "PARTIAL"] }
        },
        orderBy: { date: 'asc' },
        select: { id: true, billNumber: true, totalAmount: true, amountPaid: true, date: true }
      });
      return bills.map(b => ({
        id: b.id,
        billNumber: b.billNumber || "No Bill#",
        date: b.date,
        total: b.totalAmount,
        paid: b.amountPaid,
        due: b.totalAmount - b.amountPaid
      }));
    }
  } catch (error) {
    console.error("Error fetching due bills:", error);
    return [];
  }
}
