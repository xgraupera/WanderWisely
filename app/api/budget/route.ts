import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyTripOwnership } from "@/lib/auth";


const defaultCategories = [
  "Flights",
  "Accommodation",
  "Internal Transport",
  "Health",
  "Documentation",
  "Activities",
  "Meals",
  "Technology/SIM",
  "Others",
];

// 🟢 GET budgets (lee presupuestos y gastos)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = Number(searchParams.get("tripId"));
    if (!tripId)
      return NextResponse.json({ error: "Missing tripId" }, { status: 400 });

const { trip, error } = await verifyTripOwnership(tripId);
  if (error) return error; // Devuelve 401, 403 o 404 si corresponde

    // 🔹 Ver si ya existen budgets
    let budgets = await prisma.budget.findMany({ where: { tripId: trip.id } });

    // 🟩 Si no hay ninguno, crear los de por defecto (solo la primera vez)
    if (budgets.length === 0) {
      await prisma.budget.createMany({
        data: defaultCategories.map((cat) => ({
          tripId: trip.id,
          category: cat,
          budget: 0,
          spent: 0,
          overbudget: 0,
          percentage: 0,
        })),
      });
      budgets = await prisma.budget.findMany({ where: { tripId: trip.id } });
    }

    // 🔹 Calcular spent (desde Expenses)
    const expenses = await prisma.expense.groupBy({
      by: ["category"],
      where: { tripId: trip.id },
      _sum: { amount: true },
    });

    // 🔹 Actualizar los campos derivados
    const updated = budgets.map((b) => {
      const match = expenses.find((e) => e.category === b.category);
      const spent = match?._sum.amount || 0;
      const over = Math.max(0, spent - b.budget);
      const percentage = b.budget ? (spent / b.budget) * 100 : 0;
      return { ...b, spent, overbudget: over, percentage };
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔵 POST budgets (guarda cambios manuales del usuario)
export async function POST(req: Request) {
  try {
    const { tripId, budgets } = await req.json();
    if (!tripId || !Array.isArray(budgets))
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });

      const { trip, error } = await verifyTripOwnership(tripId);
  if (error) return error; // 401, 403, 404

    // 🔹 Eliminar los anteriores y crear los nuevos
    await prisma.budget.deleteMany({ where: { tripId: trip.id } });

    await prisma.budget.createMany({
      data: budgets.map((b) => ({
        tripId: trip.id,
        category: b.category,
        budget: Number(b.budget) || 0,
        spent: Number(b.spent) || 0,
        overbudget: Math.max(0, (b.spent || 0) - (b.budget || 0)),
        percentage: b.budget ? ((b.spent || 0) / b.budget) * 100 : 0,
      })),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error saving budgets:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
