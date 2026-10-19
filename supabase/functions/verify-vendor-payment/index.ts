import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

const PLAN_PRICES_KOBO: Record<string, number> = {
  basic: 1250000,    // ₦12,500
  premium: 2500000,  // ₦25,000 (Vendor Pro)
  brand: 4500000,    // ₦45,000 (Brand Enterprise)
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (request.method === "GET") return reply({ ready: Boolean(secret) });
  if (request.method !== "POST") return reply({ error: "Method not allowed." }, 405);
  if (!secret) return reply({ error: "Vendor checkout service is temporarily unavailable." }, 503);

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!bearer) return reply({ error: "Sign in to complete or verify your payment." }, 401);

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user }, error: authError } = await admin.auth.getUser(bearer);
    if (authError || !user?.email) return reply({ error: "Sign in to complete or verify your payment." }, 401);

    const body = await request.json();
    const plan = String(body.plan || "").toLowerCase();
    const reference = String(body.reference || "").trim();

    if (!PLAN_PRICES_KOBO[plan] || !reference) {
      return reply({ error: "Invalid payment plan or transaction reference." }, 400);
    }

    const expectedAmountKobo = PLAN_PRICES_KOBO[plan];

    // Check if this payment was already recorded
    const { data: existingPayment } = await admin
      .from("payments")
      .select("id, vendor_id, plan, status, reference")
      .eq("reference", reference)
      .maybeSingle();

    if (existingPayment) {
      if (existingPayment.status === "success") {
        // Ensure profile plan is up-to-date
        await admin
          .from("profiles")
          .update({ plan })
          .eq("id", user.id);

        return reply({
          success: true,
          plan,
          message: `Payment already verified. Your ${plan.toUpperCase()} plan is active.`,
        });
      }
    }

    // Query Paystack API to verify transaction
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${secret}` },
        signal: AbortSignal.timeout(15000),
      }
    );

    const paystackResult = await paystackResponse.json().catch(() => null);
    const tx = paystackResult?.data;

    if (!paystackResponse.ok || !paystackResult?.status || !tx) {
      return reply({
        error: "Unable to verify transaction with Paystack. Please check the reference and try again.",
      }, 400);
    }

    // Handle ongoing or pending transfers (bank transfer clearing delay)
    if (tx.status === "ongoing" || tx.status === "pending" || tx.status === "processing") {
      return reply({
        pending: true,
        status: tx.status,
        message: "Your bank transfer is currently being confirmed by the banking network. Please check back in 1–2 minutes.",
      });
    }

    if (tx.status !== "success") {
      return reply({
        error: `Paystack reported transaction status: ${tx.status || "failed"}. ${tx.gateway_response || ""}`,
        status: tx.status,
      }, 400);
    }

    // Validate currency and amount
    if (tx.currency !== "NGN") {
      return reply({ error: "Transaction currency mismatch." }, 400);
    }

    if (tx.amount < expectedAmountKobo) {
      return reply({
        error: `Transaction amount (₦${(tx.amount / 100).toLocaleString()}) does not match the required amount (₦${(expectedAmountKobo / 100).toLocaleString()}).`,
      }, 400);
    }

    // Insert or update payment record
    if (!existingPayment) {
      await admin.from("payments").insert({
        vendor_id: user.id,
        amount: tx.amount / 100,
        currency: "NGN",
        plan,
        status: "success",
        provider: "paystack",
        reference,
      });
    } else {
      await admin.from("payments").update({
        status: "success",
        plan,
        amount: tx.amount / 100,
      }).eq("id", existingPayment.id);
    }

    // Update vendor profile plan
    await admin
      .from("profiles")
      .update({ plan })
      .eq("id", user.id);

    return reply({
      success: true,
      plan,
      amount: tx.amount / 100,
      reference,
      message: `Your ${plan.toUpperCase()} plan has been activated successfully!`,
    });
  } catch (err: any) {
    console.error("verify-vendor-payment error:", err);
    return reply({
      error: "Could not activate plan. Please contact Anovra support with your transaction reference.",
    }, 500);
  }
});
