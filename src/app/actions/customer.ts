"use server";

import { getPrisma } from "@/lib/prisma-client";
import { revalidatePath } from "next/cache";

export async function getCustomers() {
  const prisma = await getPrisma();

  try {
    const customers = await (await getPrisma()).customer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: customers };
  } catch (error) {
    return { success: false, error: "Failed to fetch customers" };
  }
}

export async function deleteCustomer(id: string) {
  const prisma = await getPrisma();

  try {
    await (await getPrisma()).customer.delete({
      where: { id }
    });
    revalidatePath("/customers");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete customer" };
  }
}

export async function saveCustomer(data: {
  id?: string;
  name: string;
  customerType?: string;
  alias?: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  address?: string;
  state?: string;
  pincode?: string;
  panNumber?: string;
  gstRegistrationType?: string;
  gstNumber?: string;
  creditPeriodDays?: number;
  balance?: number;
}) {
  const prisma = await getPrisma();

  try {
      if (data.id) {
        // Update
        await (await getPrisma()).customer.update({
          where: { id: data.id },
          data: {
            name: data.name,
            contactPerson: data.contactPerson,
            customerType: data.customerType || "Customer",
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
        revalidatePath("/customers");
        return { success: true, id: data.id };
      } else {
        // Create
        const newCust = await (await getPrisma()).customer.create({
          data: {
            name: data.name,
            contactPerson: data.contactPerson,
            customerType: data.customerType || "Customer",
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
        revalidatePath("/customers");
        return { success: true, id: newCust.id };
      }
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to save customer" };
  }
}
