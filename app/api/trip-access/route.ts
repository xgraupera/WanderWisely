// app/api/trip-access/route.ts
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const tripId = Number(searchParams.get("tripId"));

  if (!session) return Response.json({ premium: false, tripPaid: false });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  return Response.json({
    premium: Boolean(user?.isPremium),
  tripPaid: Boolean(trip?.hasPaidForecast),
  });
}
