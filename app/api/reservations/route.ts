import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyTripOwnership } from "@/lib/auth";

// 🔹 GET: obtener reservas de un viaje
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = Number(searchParams.get("tripId"));

    if (isNaN(tripId)) {
      return NextResponse.json({ error: "Invalid tripId" }, { status: 400 });
    }

    // ✅ Verificar que el usuario es propietario del viaje
    const result = await verifyTripOwnership(tripId);
if (result.error) return result.error;

const { trip, session } = result;

    const reservations = await prisma.reservation.findMany({
      where: { tripId: trip.id },
      orderBy: { createdAt: "desc" },
    });

    const budgets = await prisma.budget.findMany({ where: { tripId: trip.id } });
    const categories = budgets.map((b) => b.category);

    return NextResponse.json({ reservations, categories });
  } catch (error: any) {
    console.error("GET /api/reservations error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔹 POST: crear o actualizar reservas y manejar reminders
export async function POST(req: Request) {
  try {
    const body = await req.json();
const { tripId: rawTripId, reservations, reservation } = body;
    const tripId = Number(rawTripId);

    if (isNaN(tripId)) {
  return NextResponse.json({ error: "Invalid tripId" }, { status: 400 });
}


    // ✅ Verificar propietario
    const result = await verifyTripOwnership(tripId);
if (result.error) return result.error;

const { trip, session } = result;
    // 🔹 CREATE INDIVIDUAL (una sola reserva)
if (reservation && !Array.isArray(reservations)) {
  const r = reservation;

  const created = await prisma.reservation.create({
    data: {
      tripId: trip.id,
      type: r.type,
      category: r.category,
      provider: r.provider || "",
      link: r.link || "",
      bookingDate: r.bookingDate ? new Date(r.bookingDate) : null,
      startDate: r.startDate ? new Date(r.startDate) : null,
      endDate: r.endDate ? new Date(r.endDate) : null,
      cancellationDate: r.cancellationDate ? new Date(r.cancellationDate) : null,
      amount: Number(r.amount) || 0,
      confirmed: Boolean(r.confirmed),
    },
  });

  return NextResponse.json(created);
}



    if (!Array.isArray(reservations)) {
  return NextResponse.json(
    { error: "Reservations array required for bulk update" },
    { status: 400 }
  );
}


    const savedReservations = [];

    for (const r of reservations) {
  if (r.isPredefined || typeof r.id !== "number") continue; // 🔥 nunca tocar predefinidas

  const saved = await prisma.reservation.update({
    where: { id: r.id },
    data: {
      tripId: trip.id,
      type: r.type,
      category: r.category,
      provider: r.provider || "",
      link: r.link || "",
      bookingDate: r.bookingDate ? new Date(r.bookingDate) : null,
      startDate: r.startDate ? new Date(r.startDate) : null,
      endDate: r.endDate ? new Date(r.endDate) : null,
      cancellationDate: r.cancellationDate ? new Date(r.cancellationDate) : null,
      amount: Number(r.amount) || 0,
      confirmed: Boolean(r.confirmed),
    },
  });

  savedReservations.push(saved);

  // Reminders
  if (saved.cancellationDate) {
    const existingReminder = await prisma.reminder.findFirst({
      where: { reservationId: saved.id },
    });

    if (existingReminder) {
      await prisma.reminder.update({
        where: { id: existingReminder.id },
        data: { sendAt: saved.cancellationDate },
      });
    } else {
      await prisma.reminder.create({
        data: {
          reservationId: saved.id,
          email: session.user.email!,
          sendAt: saved.cancellationDate,
        },
      });
    }
  } else {
    await prisma.reminder.deleteMany({ where: { reservationId: saved.id } });
  }
}



    return NextResponse.json({ reservations: savedReservations });
  } catch (error: any) {
    console.error("POST /api/reservations error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔹 PUT: actualizar una reserva específica
export async function PUT(req: Request) {
  try {
    const { id, tripId, ...updates } = await req.json();

    if (!id || !tripId) {
      return NextResponse.json({ error: "Missing reservation id or tripId" }, { status: 400 });
    }

    // ✅ Verificar propietario
 const { trip, session, error } = await verifyTripOwnership(tripId);
if (error) return error;

    const {
  type,
  category,
  provider,
  link,
  bookingDate,
  startDate,
  endDate,
  cancellationDate,
  amount,
  confirmed,
} = updates;

const reservation = await prisma.reservation.update({
  where: { id },
  data: {
    type,
    category,
    provider,
    link,
    bookingDate: bookingDate ? new Date(bookingDate) : null,
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    cancellationDate: cancellationDate ? new Date(cancellationDate) : null,
    amount: Number(amount) || 0,
    confirmed: Boolean(confirmed),
  },
});


    return NextResponse.json(reservation);
  } catch (error: any) {
    console.error("PUT /api/reservations error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔹 DELETE: eliminar una reserva
export async function DELETE(req: Request) {
  try {
    const { id, tripId } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing reservation id or tripId" }, { status: 400 });
    }

    // ✅ Verificar propietario
    const { trip, error } = await verifyTripOwnership(Number(tripId ?? (await prisma.reservation.findUnique({
  where: { id },
  select: { tripId: true },
}))?.tripId));

if (error) return error;

await prisma.reservation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/reservations error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
