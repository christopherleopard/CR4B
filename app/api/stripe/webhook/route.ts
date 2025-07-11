import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerSupabase } from "@/lib/supabase"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createServerSupabase()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        // Update user's subscription in database
        if (session.customer && session.subscription) {
          await supabase.from("subscriptions").upsert({
            userId: session.client_reference_id,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            status: "active",
            plan: session.metadata?.plan || "pro",
            currentPeriodEnd: new Date(
              (session.subscription_data?.trial_end || Date.now() / 1000 + 30 * 24 * 60 * 60) * 1000,
            ),
          })
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription && invoice.customer) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)

          // Update subscription in database
          await supabase
            .from("subscriptions")
            .update({
              status: "active",
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            })
            .eq("stripeSubscriptionId", invoice.subscription)
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          })
          .eq("stripeSubscriptionId", subscription.id)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
          })
          .eq("stripeSubscriptionId", subscription.id)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Error processing webhook" }, { status: 500 })
  }
}
