// lib/auth.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import NextAuth from "next-auth";


declare module "next-auth" {
  interface Session {
    user: {
      id: number; // <-- tu id de usuario
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  

  interface User {
    id: number;
  }
}

export async function verifyTripOwnership(tripId: number) {
  const session = await getServerSession(authOptions);

  // Si no hay sesión o no hay user → 401
  if (!session || !session.user || !session.user.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }



  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return { error: NextResponse.json({ error: "Trip not found" }, { status: 404 }) };

  // Comprobamos que el trip pertenece al usuario logueado
  if (trip.userId !== Number(session.user.id)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { trip, session };
}
