import Stripe from "stripe";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response("Webhook error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
  const session = event.data.object as Stripe.Checkout.Session;

  if (session.mode === "payment") {
    const tripId = Number(session.metadata?.tripId);

    const dbUser = await prisma.user.findUnique({
  where: { stripeCustomerId: session.customer as string },
});

if (!dbUser) return new Response("User not found", { status: 404 });


    await prisma.trip.update({
      where: { id: tripId },
      data: { hasPaidForecast: true },
    });

    await prisma.payment.create({
      data: {
        userId: dbUser.id,
        tripId,
        amount: session.amount_total! / 100,
        currency: session.currency!,
        type: "trip",
        stripeId: session.id,
      },
    });
  }
}
if (event.type === "customer.subscription.created" || 
    event.type === "customer.subscription.updated") {

  const sub = event.data.object as Stripe.Subscription;

  await prisma.user.update({
    where: { stripeCustomerId: sub.customer as string },
    data: {
      stripeSubscriptionId: sub.id,
      subscriptionStatus: sub.status,
      isPremium: sub.status === "active",
    },
  });
}

if (event.type === "customer.subscription.deleted") {
  const sub = event.data.object as Stripe.Subscription;

  await prisma.user.update({
    where: { stripeCustomerId: sub.customer as string },
    data: {
      isPremium: false,
      subscriptionStatus: "canceled",
      stripeSubscriptionId: null,
    },
  });
}



  return new Response("OK");
}
