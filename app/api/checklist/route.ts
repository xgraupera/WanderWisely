// ✅ app/api/checklist/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyTripOwnership } from "@/lib/auth";

const prisma = new PrismaClient();

// 🧾 Default checklist (si no hay nada guardado)
const defaultChecklist = [
  { category: "Documentation", task: "ID and Passport", notes: "" },
  { category: "Documentation", task: "Visa", notes: "" },
  { category: "Documentation", task: "Fotocopy of Passport and Visa", notes: "" },
  { category: "Documentation", task: "International Driver's Licence", notes: "" },
  { category: "Documentation", task: "Hotel and Transport Reservations", notes: "" },
  { category: "Others", task: "International Credit/Debit Card", notes: "" },
  { category: "Health", task: "Basic First Aid Kit", notes: "" },
  { category: "Health", task: "Vaccinations", notes: "" },
  { category: "Health", task: "Health Insurance", notes: "" },
  { category: "Technology", task: "Charger and Plug Adapters", notes: "" },
  { category: "Technology", task: "Power Bank", notes: "" },
  { category: "Technology", task: "International SIM Card/eSIM", notes: "" },
  { category: "Others", task: "Other items", notes: "" },
];

// 🟢 GET — obtener checklist por tripId
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = Number(searchParams.get("tripId"));
    const { trip, error } = await verifyTripOwnership(tripId);
if (error) return error;

    if (!tripId || isNaN(tripId))
      return NextResponse.json({ error: "Missing or invalid tripId" }, { status: 400 });

    const checklist = await prisma.checklist.findMany({
      where: { tripId: tripId },
      orderBy: { id: "asc" },
    });

    // Si no hay checklist guardada, devolver default con done=false
    if (checklist.length === 0) {
      return NextResponse.json(
        defaultChecklist.map((c) => ({ ...c, done: false }))
      );
    }

    return NextResponse.json(checklist);
  } catch (error) {
    console.error("❌ Error loading checklist:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 🟢 POST — guardar checklist
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tripId, checklist } = body;

    if (!tripId || !Array.isArray(checklist)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Eliminar checklist previa para ese viaje
    await prisma.checklist.deleteMany({ where: { tripId: Number(tripId) } });

    // Crear nuevas filas una por una
    const createdItems = await Promise.all(
      checklist.map(async (item: any) => {
        if (!item.task?.trim()) return null; // evitar crear tareas vacías
        return prisma.checklist.create({
          data: {
            tripId: Number(tripId),
            category: item.category || "Uncategorized",
            task: item.task || "",
            notes: item.notes || "",
            done: Boolean(item.done),
          },
        });
      })
    );

    return NextResponse.json({
      message: "✅ Checklist saved successfully",
      count: createdItems.filter(Boolean).length,
    });
  } catch (error: any) {
    console.error("❌ Error saving checklist:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
