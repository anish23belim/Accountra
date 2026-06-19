import { getServerSession } from "next-auth";
import { authOptions, prisma as globalPrisma } from "@/lib/auth";

export async function getPrisma() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return globalPrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const tenantModels = [
            'CompanySetting', 'Customer', 'Supplier', 'Product', 'Location',
            'Invoice', 'Purchase', 'Expense', 'Payment', 'SalesReturn', 'PurchaseReturn'
          ];

          if (tenantModels.includes(model)) {
            // Ensure args.where exists
            if (!args) args = {} as any;
            if (!args.where) args.where = {};

            if (['findMany', 'findFirst', 'count', 'updateMany', 'deleteMany'].includes(operation)) {
              args.where = { ...args.where, userId };
            } else if (operation === 'findUnique') {
              // Convert findUnique to findFirst to inject userId
              args.where = { ...args.where, userId };
              return (globalPrisma as any)[model].findFirst(args);
            } else if (['update', 'delete'].includes(operation)) {
              // Verify ownership before update/delete
              const existing = await (globalPrisma as any)[model].findFirst({
                where: { ...args.where, userId },
                select: { id: true }
              });
              if (!existing) {
                throw new Error("Record not found or unauthorized");
              }
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
