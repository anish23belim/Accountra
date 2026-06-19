import { getServerSession } from "next-auth";
import { authOptions, prisma as globalPrisma } from "@/lib/auth";
import { cookies } from "next/headers";

export async function getPrisma() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Get selected company ID from cookies
  const cookieStore = cookies();
  const companyId = cookieStore.get("companyId")?.value;

  return globalPrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const tenantModels = [
            'Customer', 'Supplier', 'Product', 'Location',
            'Invoice', 'Purchase', 'Expense', 'Payment', 'SalesReturn', 'PurchaseReturn'
          ];

          if (tenantModels.includes(model)) {
            if (!companyId) throw new Error("No company selected");
            
            // Ensure args.where exists
            if (!args) args = {} as any;
            if (!args.where) args.where = {};

            if (['findMany', 'findFirst', 'count', 'updateMany', 'deleteMany'].includes(operation)) {
              args.where = { ...args.where, companyId };
            } else if (operation === 'findUnique') {
              args.where = { ...args.where, companyId };
              return (globalPrisma as any)[model].findFirst(args);
            } else if (['update', 'delete'].includes(operation)) {
              const existing = await (globalPrisma as any)[model].findFirst({
                where: { ...args.where, companyId },
                select: { id: true }
              });
              if (!existing) {
                throw new Error("Record not found or unauthorized");
              }
            } else if (operation === 'create') {
              args.data = { ...args.data, companyId };
            } else if (operation === 'createMany') {
              if (Array.isArray(args.data)) {
                args.data = args.data.map((d: any) => ({ ...d, companyId }));
              } else {
                (args.data as any).companyId = companyId;
              }
            }
          } else if (model === 'CompanySetting') {
            // CompanySetting is isolated by userId
            if (!args) args = {} as any;
            if (!args.where) args.where = {};

            if (['findMany', 'findFirst', 'count', 'updateMany', 'deleteMany'].includes(operation)) {
              args.where = { ...args.where, userId };
            } else if (operation === 'findUnique') {
              args.where = { ...args.where, userId };
              return (globalPrisma as any)[model].findFirst(args);
            } else if (['update', 'delete'].includes(operation)) {
              const existing = await (globalPrisma as any)[model].findFirst({
                where: { ...args.where, userId },
                select: { id: true }
              });
              if (!existing) throw new Error("Record not found or unauthorized");
            } else if (operation === 'create') {
              args.data = { ...args.data, userId };
            } else if (operation === 'createMany') {
              if (Array.isArray(args.data)) {
                args.data = args.data.map((d: any) => ({ ...d, userId }));
              } else {
                (args.data as any).userId = userId;
              }
            }
          }
          return query(args);
        }
      }
    }
  });
}
