import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function GET() {
  try {
    const now = new Date();

    const reminders = await prisma.reminder.findMany({
      where: {
        sent: false,
        sendAt: { lte: now },
      },
      include: {
        reservation: true,
      },
    });

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true para SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // contraseña de aplicación
  },
  tls: {
    rejectUnauthorized: false,
  },
});

    for (const reminder of reminders) {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: reminder.email,
        subject: "⏰ Cancellation reminder",
        html: `
          <h2>Don’t forget your cancellation deadline</h2>
          <p>Your reservation <strong>${reminder.reservation.type}</strong> has a cancellation limit on:</p>
          <p><strong>${reminder.sendAt.toLocaleDateString()}</strong></p>
          <p>Tripilot</p>
        `,
      });

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { sent: true },
      });
    }

    return NextResponse.json({ sent: reminders.length });
  } catch (err) {
    console.error("Reminder error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
