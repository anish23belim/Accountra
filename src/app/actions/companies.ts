"use server";

import { getServerSession } from "next-auth";
import { authOptions, prisma } from "@/lib/auth";
import { cookies } from "next/headers";

export async function getCompanies() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return [];

  // We use the global prisma here, because getPrisma() automatically injects the tenant.
  // But for fetching all companies for a user, we can use global prisma directly.
  return await prisma.companySetting.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' }
  });
}

export async function selectCompany(companyId: string) {
  const cookieStore = cookies();
  // Set cookie to expire in 30 days
  cookieStore.set("companyId", companyId, {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return true;
}

export async function createCompany(name: string) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return null;

  try {
    const newCompany = await prisma.companySetting.create({
      data: {
        name,
        userId
      }
    });
    return newCompany.id;
  } catch (error) {
    console.error("Error creating company:", error);
    return null;
  }
}
