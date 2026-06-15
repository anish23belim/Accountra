"use server";

import { prisma } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteSupplier(id: string) {
  try {
    await prisma.supplier.delete({
      where: { id }
    });
    revalidatePath("/suppliers");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete supplier" };
  }
}

export async function saveSupplier(data: {
  id?: string;
  name: string;
  alias?: string;
  email?: string;
  phone?: string;
  address?: string;
  state?: string;
  pincode?: string;
  panNumber?: string;
  gstRegistrationType?: string;
  gstNumber?: string;
  creditPeriodDays?: number;
  balance?: number;
}) {
  try {
    if (data.id) {
      await prisma.supplier.update({
        where: { id: data.id },
        data: {
          name: data.name,
          alias: data.alias,
          email: data.email,
          phone: data.phone,
          address: data.address,
          state: data.state,
          pincode: data.pincode,
          panNumber: data.panNumber,
          gstRegistrationType: data.gstRegistrationType,
          gstNumber: data.gstNumber,
          creditPeriodDays: data.creditPeriodDays,
          currentBalance: data.balance !== undefined ? data.balance : undefined,
        }
      });
      revalidatePath("/suppliers");
      return { success: true, id: data.id };
    } else {
      const newSup = await prisma.supplier.create({
        data: {
          name: data.name,
          alias: data.alias,
          email: data.email,
          phone: data.phone,
          address: data.address,
          state: data.state,
          pincode: data.pincode,
          panNumber: data.panNumber,
          gstRegistrationType: data.gstRegistrationType,
          gstNumber: data.gstNumber,
          creditPeriodDays: data.creditPeriodDays || 0,
          openingBalance: data.balance || 0,
          currentBalance: data.balance || 0,
        }
      });
      revalidatePath("/suppliers");
      return { success: true, id: newSup.id };
    }
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to save supplier" };
  }
}
