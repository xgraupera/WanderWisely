import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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


export async function POST(req: Request) {
  try {
    const { tripId, categories } = await req.json();

    if (!tripId || !Array.isArray(categories)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Crear / actualizar budgets
    await prisma.budget.deleteMany({ where: { tripId } });

    await prisma.budget.createMany({
  data: categories.map((c) => ({
    tripId,
    category: c.key,
    budget: Number(c.value) || 0,
    spent: 0,
    overbudget: 0,
    percentage: 0,
    type: CATEGORY_TYPE_MAP[c.key] ?? "mixed",
  })),
});


    // Marcar wizard como completado
    await prisma.trip.update({
      where: { id: tripId },
      data: { hasCompletedBudgetSetup: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Budget setup error:", err);
    return NextResponse.json({ error: "Failed to setup budget" }, { status: 500 });
  }
}
