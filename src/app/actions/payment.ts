"use server";

import { getPrisma } from "@/lib/prisma-client";
import { revalidatePath } from "next/cache";

export async function createPayment(data: {
  amount: number;
  method: string;
  reference?: string;
  customerId?: string;
  supplierId?: string;
  invoiceId?: string;
  purchaseId?: string;
  direction?: 'IN' | 'OUT'; // IN = Received from them, OUT = Paid to them
}) {
  const prisma = await getPrisma();

  try {
    const paymentNumber = `PAY-${Date.now().toString().slice(-6)}`;
    
    await (await getPrisma()).payment.create({
      data: {
        paymentNumber,
        amount: data.amount,
        method: data.method,
        type: data.direction || (data.customerId ? "IN" : "OUT"),
        reference: data.reference,
        customerId: data.customerId || null,
        supplierId: data.supplierId || null,
        invoiceId: data.invoiceId || null,
        purchaseId: data.purchaseId || null,
      }
    });

    // Update customer balance
    if (data.customerId) {
      await (await getPrisma()).customer.update({
        where: { id: data.customerId },
        data: {
          currentBalance: data.direction === 'OUT' 
            ? { increment: data.amount } 
            : { decrement: data.amount }
        }
      });
      revalidatePath("/customers");
    }

    // Update supplier balance
    if (data.supplierId) {
      await (await getPrisma()).supplier.update({
        where: { id: data.supplierId },
        data: {
          currentBalance: data.direction === 'IN'
            ? { increment: data.amount } // Supplier paid us back (refund)
            : { decrement: data.amount } // We paid supplier
        }
      });
      revalidatePath("/suppliers");
    }

    // Update invoice if linked
    if (data.invoiceId) {
      const inv = await (await getPrisma()).invoice.findUnique({ where: { id: data.invoiceId } });
      if (inv) {
        const newPaid = inv.amountPaid + data.amount;
        await (await getPrisma()).invoice.update({
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
      const pur = await (await getPrisma()).purchase.findUnique({ where: { id: data.purchaseId } });
      if (pur) {
        const newPaid = pur.amountPaid + data.amount;
        await (await getPrisma()).purchase.update({
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
  const prisma = await getPrisma();

  try {
    const payment = await (await getPrisma()).payment.findUnique({ where: { id } });
    if (payment) {
        if (payment.customerId) {
          await (await getPrisma()).customer.update({
            where: { id: payment.customerId },
            data: { 
              currentBalance: payment.type === 'OUT' 
                ? { decrement: payment.amount }
                : { increment: payment.amount } 
            }
          });
        }
        if (payment.supplierId) {
          await (await getPrisma()).supplier.update({
            where: { id: payment.supplierId },
            data: { 
              currentBalance: payment.type === 'IN'
                ? { decrement: payment.amount }
                : { increment: payment.amount } 
            }
          });
        }
    }
    
    
    await (await getPrisma()).payment.delete({
      where: { id }
    });
    
    // Also revert invoice/purchase amountPaid
    if (payment && payment.invoiceId) {
      const inv = await (await getPrisma()).invoice.findUnique({ where: { id: payment.invoiceId } });
      if (inv) {
        const newPaid = Math.max(0, inv.amountPaid - payment.amount);
        await (await getPrisma()).invoice.update({
          where: { id: payment.invoiceId },
          data: { amountPaid: newPaid, status: newPaid === 0 ? "UNPAID" : newPaid >= inv.totalAmount ? "PAID" : "PARTIAL" }
        });
        revalidatePath("/sales");
      }
    }
    if (payment && payment.purchaseId) {
      const pur = await (await getPrisma()).purchase.findUnique({ where: { id: payment.purchaseId } });
      if (pur) {
        const newPaid = Math.max(0, pur.amountPaid - payment.amount);
        await (await getPrisma()).purchase.update({
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
  const prisma = await getPrisma();

  try {
    if (type === "Customer") {
      const bills = await (await getPrisma()).invoice.findMany({
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
      const bills = await (await getPrisma()).purchase.findMany({
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
