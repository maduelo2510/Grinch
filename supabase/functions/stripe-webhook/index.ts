import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "");

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
    );
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Activar PRO cuando se completa el checkout
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const customerId = session.customer as string;
    const userId = session.metadata?.userId as string | undefined;

    let profile;
    if (userId) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      profile = data;
    } else {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("stripe_customer_id", customerId)
        .single();
      profile = data;
    }

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          is_pro: true,
          credits_limit: 100,
          stripe_customer_id: customerId,
        })
        .eq("id", profile.id);
    }
  }

  // Renovación mensual de suscripción
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as any;
    const customerId = invoice.customer as string;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("stripe_customer_id", customerId)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          credits_used: 0,
          is_pro: true,
        })
        .eq("id", profile.id);
    }
  }

  // Cancelación de suscripción
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as any;
    const customerId = subscription.customer as string;

    await supabase
      .from("profiles")
      .update({
        is_pro: false,
        credits_limit: 5,
      })
      .eq("stripe_customer_id", customerId);
  }

  // Actualización de suscripción
  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as any;
    const customerId = subscription.customer as string;
    const status = subscription.status;

    if (status === "active") {
      await supabase
        .from("profiles")
        .update({ is_pro: true })
        .eq("stripe_customer_id", customerId);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});


