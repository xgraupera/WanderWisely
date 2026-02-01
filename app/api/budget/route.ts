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

const CATEGORY_TYPE_MAP: Record<string, "fixed" | "variable" | "mixed"> = {
  Flights: "fixed",
  Documentation: "fixed",
  Health: "fixed",
  Accommodation: "mixed",
  "Internal Transport": "mixed",
  Activities: "mixed",
  "Technology/SIM": "mixed",
  Others: "mixed",
  Meals: "variable",
};


// 🟢 GET budgets
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = Number(searchParams.get("tripId"));
    if (!tripId)
      return NextResponse.json({ error: "Missing tripId" }, { status: 400 });

   

    const { trip, error } = await verifyTripOwnership(tripId);
    if (error) return error;

    // Budgets
    let budgets = await prisma.budget.findMany({ where: { tripId: trip.id } });

    if (budgets.length === 0) {
      await prisma.budget.createMany({
        data: defaultCategories.map((cat) => ({
          tripId: trip.id,
          category: cat,
          budget: 0,
          spent: 0,
          overbudget: 0,
          percentage: 0,
          type: CATEGORY_TYPE_MAP[cat] ?? "mixed",
        })),
      });
      budgets = await prisma.budget.findMany({ where: { tripId: trip.id } });
    }

     const allReservations = await prisma.reservation.findMany({
  where: { tripId: trip.id },
});

    // Expenses
    const expenses = await prisma.expense.groupBy({
      by: ["category"],
      where: { tripId: trip.id },
      _sum: { amount: true },
    });

    // Reservations (NO confirmed = forecast)
    const reservations = await prisma.reservation.groupBy({
      by: ["category", "confirmed"],
      where: { tripId: trip.id, category: { not: null } },
      _sum: { amount: true },
    });

    const plannedReservationMap: Record<string, number> = {};

    reservations.forEach((r) => {
      if (!r.confirmed) {
        plannedReservationMap[r.category!] =
          (plannedReservationMap[r.category!] || 0) + (r._sum.amount ?? 0);
      }
    });

    // Individual reservations for alerts
    const reservationList = await prisma.reservation.findMany({
      where: { tripId: trip.id },
    });

    const updated = budgets.map((b) => {
      const match = expenses.find((e) => e.category === b.category);
      const spent = match?._sum.amount || 0;
      const planned = plannedReservationMap[b.category] ?? 0;
      const over = Math.max(0, spent - b.budget);
      const percentage = b.budget ? (spent / b.budget) * 100 : 0;

      return {
        ...b,
        spent,
        plannedReservations: planned,
        percentage,
        overbudget: over,
        reservationList: allReservations.filter(r => r.category === b.category), // 👈 only for frontend logic, NOT stored in DB
        
      };
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
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
        type: b.type ?? "mixed", // ✅ aquí también
      })),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error saving budgets:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
