"use server";

import { getPrisma } from "@/lib/prisma-client";
import { revalidatePath } from "next/cache";

import { cookies } from "next/headers";

export async function getCompanySettings() {
  const prisma = await getPrisma();
  const companyId = cookies().get("companyId")?.value;
  if (!companyId) return null;

  try {
    return await prisma.companySetting.findFirst({
      where: { id: companyId }
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return null;
  }
}

export async function updateCompanySettings(data: {
  name: string;
  address?: string;
  state?: string;
  country?: string;
  pincode?: string;
  telephone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  financialYearFrom?: Date | null;
  booksBeginFrom?: Date | null;
  baseCurrencySymbol?: string;
  baseCurrencyName?: string;
  panNumber?: string;
  gstNumber?: string;
  logoUrl?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  backupEmail?: string;
  backupPassword?: string;
}) {
  const prisma = await getPrisma();

  try {
    const companyId = cookies().get("companyId")?.value;
    if (!companyId) throw new Error("No company selected");

    const existing = await prisma.companySetting.findFirst({ where: { id: companyId } });
    if (existing) {
      await prisma.companySetting.update({
        where: { id: existing.id },
        data: data
      });
    } else {
      await prisma.companySetting.create({
        data: { ...data, id: companyId }
      });
    }
    
    revalidatePath("/settings");
    revalidatePath("/"); // Update layout/nav if it uses settings
    return { success: true };
  } catch (error: any) {
    console.error("Error updating settings:", error);
    return { success: false, error: error.message };
  }
}
