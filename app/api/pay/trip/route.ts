import Stripe from "stripe";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
  where: { email: session.user.email },
});

if (!user) {
  return Response.json({ error: "User not found" }, { status: 404 });
}
    let customerId = user.stripeCustomerId;

if (!customerId) {
  const customer = await stripe.customers.create({
    email: session.user.email!,
  });
  customerId = customer.id;

  await prisma.user.update({
    where: { email: session.user.email! },
    data: { stripeCustomerId: customerId },
  });
}


    const { tripId } = await req.json();

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_TRIP!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_URL}/en/dashboard/trip/${tripId}?paid=1`,
cancel_url: `${process.env.NEXT_PUBLIC_URL}/en/dashboard/trip/${tripId}`,
      metadata: { tripId: String(tripId) },
      customer: customerId,
    });

    return Response.json({ url: checkout.url });
  } catch (e: any) {
    console.error("Stripe API ERROR:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
