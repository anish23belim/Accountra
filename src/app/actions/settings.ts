"use server";

import { prisma } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getCompanySettings() {
  try {
    let settings = await prisma.companySetting.findFirst();
    if (!settings) {
      settings = await prisma.companySetting.create({
        data: {
          id: "1",
          name: "Accountra Inc",
        }
      });
    }
    return settings;
  } catch (error) {
    console.error("Error fetching settings:", error);
    return null;
  }
}

export async function updateCompanySettings(data: {
  name: string;
  address: string;
  state: string;
  country: string;
  pincode: string;
  telephone: string;
  mobile: string;
  email: string;
  website: string;
  financialYearFrom: Date | null;
  booksBeginFrom: Date | null;
  baseCurrencySymbol: string;
  baseCurrencyName: string;
  panNumber: string;
  gstNumber: string;
  logoUrl: string;
}) {
  try {
    await prisma.companySetting.upsert({
      where: { id: "1" },
      update: data,
      create: {
        id: "1",
        ...data
      }
    });
    
    revalidatePath("/settings");
    revalidatePath("/"); // Update layout/nav if it uses settings
    return { success: true };
  } catch (error: any) {
    console.error("Error updating settings:", error);
    return { success: false, error: error.message };
  }
}
