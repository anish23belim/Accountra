import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma-client";
import nodemailer from "nodemailer";

export async function GET(request: Request) {
  try {
    // 1. Get Company Settings for backup credentials
    const settings = await (await getPrisma()).companySetting.findFirst();
    if (!settings || !settings.backupEmail || !settings.backupPassword) {
      return NextResponse.json(
        { error: "Backup email or password not configured in Company Settings." },
        { status: 400 }
      );
    }

    // 2. Fetch all important database tables
    const [products, customers, suppliers, invoices, purchases, payments, expenses, serials] = await Promise.all([
      (await getPrisma()).product.findMany(),
      (await getPrisma()).customer.findMany(),
      (await getPrisma()).supplier.findMany(),
      (await getPrisma()).invoice.findMany({ include: { items: true } }),
      (await getPrisma()).purchase.findMany({ include: { items: true } }),
      (await getPrisma()).payment.findMany(),
      (await getPrisma()).expense.findMany(),
      (await getPrisma()).serialNumber.findMany(),
    ]);

    // 3. Create JSON payload
    const backupData = {
      timestamp: new Date().toISOString(),
      company: settings,
      products,
      customers,
      suppliers,
      invoices,
      purchases,
      payments,
      expenses,
      serials,
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const dateString = new Date().toISOString().split("T")[0];
    const filename = `Accountra_Backup_${dateString}.json`;

    // 4. Setup Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: settings.backupEmail,
        pass: settings.backupPassword, // Must be an App Password
      },
    });

    // 5. Send Email
    await transporter.sendMail({
      from: `"Accountra Auto-Backup" <${settings.backupEmail}>`,
      to: settings.backupEmail, // Send to the same email
      subject: `Daily Accountra Backup - ${dateString}`,
      text: `Please find attached the daily automatic backup of your Accountra database for ${dateString}.\n\nKeep this file safe. You can use it to restore your data in case of an emergency.\n\nTotal Records:\n- Products: ${products.length}\n- Customers: ${customers.length}\n- Suppliers: ${suppliers.length}\n- Invoices: ${invoices.length}\n- Purchases: ${purchases.length}\n\nThank you for using Accountra!`,
      attachments: [
        {
          filename: filename,
          content: jsonString,
          contentType: "application/json",
        },
      ],
    });

    return NextResponse.json({ success: true, message: "Backup sent successfully via email." });
  } catch (error: any) {
    console.error("Backup Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
