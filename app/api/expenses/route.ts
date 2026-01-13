// app/api/expenses/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 🟢 GET — Obtener gastos de un viaje
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = Number(searchParams.get("tripId"));
    if (isNaN(tripId)) {
  return NextResponse.json({ error: "Invalid tripId" }, { status: 400 });
}
    const userId = searchParams.get("userId") || "demo";

    if (!tripId) {
      return NextResponse.json({ error: "Missing tripId" }, { status: 400 });
    }

    const expenses = await prisma.expense.findMany({
      where: { tripId, userId },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

// 🟢 POST — Crear o actualizar gastos, sin borrar nada
export async function POST(req: Request) {
  try {
    const { tripId: rawTripId, userId, expenses } = await req.json();

const tripId = Number(rawTripId);
if (isNaN(tripId)) {
  return NextResponse.json({ error: "Invalid tripId" }, { status: 400 });
}

    if (!tripId || !userId || !Array.isArray(expenses)) {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
    }

    const trip = await prisma.trip.findUnique({
        where: { id: Number(tripId) },
      select: { travelers: true },
    });

    const numTravelers = Number(trip?.travelers) || 1;

    // 1️⃣ Traer IDs existentes en DB para este viaje y usuario
    const existingExpenses = await prisma.expense.findMany({
      where: { tripId, userId },
      select: { id: true },
    });
    const existingIds = existingExpenses.map((e) => e.id);

    // 2️⃣ IDs enviados por frontend
    const newIds = expenses.filter((e) => e.id).map((e) => e.id);

    // 3️⃣ Borrar los gastos que no están en frontend
    const toDelete = existingIds.filter((id) => !newIds.includes(id));
    if (toDelete.length > 0) {
      await prisma.expense.deleteMany({ where: { id: { in: toDelete } } });
    }

    // 4️⃣ Crear o actualizar
    await Promise.all(
      expenses.map((e) => {
        const amount = Number(e.amount) || 0;
        const doNotSplit = Boolean(e.doNotSplit);
        const amountPerTraveler = doNotSplit
          ? amount
          : amount / (numTravelers > 0 ? numTravelers : 1);

        if (e.id) {
          // Actualizar gasto existente
          return prisma.expense.update({
            where: { id: e.id },
            data: {
              date: e.date ? new Date(e.date) : new Date(),
              place: e.place || "",
              category: e.category || "Others",
              description: e.description || "",
              amount,
              paidBy: e.paidBy || "",
              doNotSplit,
              amountPerTraveler,
            },
          });
        } else {
          // Crear nuevo gasto
          return prisma.expense.create({
            data: {
              tripId,
              userId,
              date: e.date ? new Date(e.date) : new Date(),
              place: e.place || "",
              category: e.category || "Others",
              description: e.description || "",
              amount,
              paidBy: e.paidBy || "",
              doNotSplit,
              amountPerTraveler,
            },
          });
        }
      })
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json({ error: "Failed to save expenses" }, { status: 500 });
  }
}


// 🟢 DELETE — Eliminar gasto individual
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const expenseId = searchParams.get("id"); // ⚡ renombrada
    if (!expenseId) {
      return NextResponse.json({ error: "Missing expense id" }, { status: 400 });
    }

    await prisma.expense.delete({ where: { id: expenseId } });

    return NextResponse.json({ ok: true, deletedId: expenseId });
  } catch (error) {
    console.error("DELETE /api/expenses error:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}

