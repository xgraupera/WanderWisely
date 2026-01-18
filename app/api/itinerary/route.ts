import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyTripOwnership } from "@/lib/auth";

// 🟢 GET
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tripId = Number(searchParams.get("tripId"));

  if (isNaN(tripId)) {
    return NextResponse.json({ error: "Invalid tripId" }, { status: 400 });
  }

  const { trip, error } = await verifyTripOwnership(tripId);
  if (error) return error;

  const itinerary = await prisma.itinerary.findMany({
    where: { tripId: trip.id },
    orderBy: { day: "asc" },
  });

  return NextResponse.json(itinerary);
}

// 🟢 POST
export async function POST(req: Request) {
  const body = await req.json();
  const tripId = Number(body.tripId);

  if (isNaN(tripId) || !Array.isArray(body.itinerary)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { trip, error } = await verifyTripOwnership(tripId);
  if (error) return error;

  const providedDays = body.itinerary
    .map((d: any) => Number(d.day))
    .filter((n: number) => !isNaN(n));

  for (const i of body.itinerary) {
    const day = Number(i.day);
    if (isNaN(day)) continue;

    await prisma.itinerary.upsert({
      where: { tripId_day: { tripId: trip.id, day } },
      update: {
        date: i.date ? new Date(i.date) : new Date(),
        city: i.city || "",
        activity: i.activity || "",
        notes: i.notes || "",
      },
      create: {
        day,
        date: i.date ? new Date(i.date) : new Date(),
        city: i.city || "",
        activity: i.activity || "",
        notes: i.notes || "",
        trip: { connect: { id: trip.id } },
      },
    });
  }

  await prisma.itinerary.deleteMany({
    where: {
      tripId: trip.id,
      day: providedDays.length ? { notIn: providedDays } : undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
