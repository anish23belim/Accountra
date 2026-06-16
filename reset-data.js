const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reset() {
  console.log("Starting data reset...");

  try {
    // Delete all transaction records
    console.log("Deleting Invoices...");
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();

    console.log("Deleting Purchases...");
    await prisma.purchaseItem.deleteMany();
    await prisma.purchase.deleteMany();

    console.log("Deleting Expenses & Payments...");
    await prisma.expense.deleteMany();
    await prisma.payment.deleteMany();

    console.log("Deleting Serial Numbers...");
    await prisma.serialNumber.deleteMany();

    // Reset Stock
    console.log("Resetting Location Stocks...");
    await prisma.locationStock.deleteMany();
    
    console.log("Resetting Product Stock...");
    await prisma.product.updateMany({
      data: { currentStock: 0 }
    });

    // Reset Balances to Opening Balances
    console.log("Resetting Customer & Supplier Balances...");
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

    console.log("Data reset successful! You can now start adding fresh data.");
  } catch (error) {
    console.error("Error during reset:", error);
  }
}

reset()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
