import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyTripOwnership } from "@/lib/auth";

// 🟢 GET — Obtener gastos de un viaje
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = Number(searchParams.get("tripId"));

    if (isNaN(tripId)) {
      return NextResponse.json({ error: "Invalid tripId" }, { status: 400 });
    }

    const result = await verifyTripOwnership(tripId);
    if (result.error) return result.error;

    const { trip, session } = result;
    if (!trip || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = String(session.user.id); // ✅ convertir a string

    const expenses = await prisma.expense.findMany({
      where: { tripId: trip.id, userId },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(expenses);
  } catch (err) {
    console.error("GET /api/expenses error:", err);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

// POST — Crear gastos nuevos
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tripId = Number(body.tripId);
    const expenses = body.expenses;

    if (isNaN(tripId) || !Array.isArray(expenses)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const result = await verifyTripOwnership(tripId);
    if (result.error) return result.error;

    const { trip, session } = result;
    const userId = String(session.user.id);
    const numTravelers = Number(trip.travelers) || 1;

    const created = await Promise.all(
      expenses.map((e: any) => {
        const amount = Number(e.amount) || 0;
        const doNotSplit = Boolean(e.doNotSplit);
        const amountPerTraveler = doNotSplit ? amount : amount / numTravelers;

        return prisma.expense.create({
          data: {
            tripId: trip.id,
            userId,
            date: new Date(e.date),
            place: e.place || "",
            category: e.category || "Others",
            description: e.description || "",
            amount,
            paidBy: e.paidBy || "",
            doNotSplit,
            amountPerTraveler,
          },
        });
      })
    );

    return NextResponse.json({ expenses: created });
  } catch (err) {
    console.error("POST /api/expenses", err);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}


export async function PUT(req: Request) {
  try {
    const { tripId, expense } = await req.json();

    if (!expense?.id) {
      return NextResponse.json({ error: "Missing expense id" }, { status: 400 });
    }

    const result = await verifyTripOwnership(Number(tripId));
    if (result.error) return result.error;

    const updated = await prisma.expense.update({
      where: { id: expense.id },
      data: {
        date: new Date(expense.date),
        place: expense.place,
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        paidBy: expense.paidBy,
        doNotSplit: expense.doNotSplit,
        amountPerTraveler: expense.amountPerTraveler,
      },
    });

    return NextResponse.json({ expense: updated });
  } catch (err) {
    console.error("PUT /api/expenses", err);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}



// DELETE — Eliminar gasto individual
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const expenseId = searchParams.get("id");

    if (!expenseId) {
      return NextResponse.json({ error: "Invalid expense id" }, { status: 400 });
    }

    const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    const result = await verifyTripOwnership(expense.tripId);
    if (result.error) return result.error;

    await prisma.expense.delete({ where: { id: expenseId } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/expenses error:", err);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}

