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

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (request.method === "GET") return reply({ ready: Boolean(secret) });
  if (request.method !== "POST") return reply({ error: "Method not allowed." }, 405);
  if (!secret) return reply({ error: "Customer checkout is temporarily unavailable." }, 503);

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!bearer) return reply({ error: "Sign in to complete your payment." }, 401);

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user }, error: authError } = await admin.auth.getUser(bearer);
    if (authError || !user?.email) return reply({ error: "Sign in to complete your payment." }, 401);

    const body = await request.json();
    const plan = String(body.plan || "");
    const reference = String(body.reference || "").trim();
    const amount = plan === "basic" ? 350000 : plan === "premium" ? 700000 : 0;
    if (!amount || !/^[A-Za-z0-9.=-]{6,100}$/.test(reference))
      return reply({ error: "Invalid payment details." }, 400);

    const { data: existing, error: lookupError } = await admin.from("payments")
      .select("vendor_id, plan, status").eq("reference", reference).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing && (existing.vendor_id !== user.id || existing.plan !== plan || existing.status !== "success"))
      return reply({ error: "This payment reference belongs to another transaction." }, 409);

    if (!existing) {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${secret}` },
        signal: AbortSignal.timeout(15000),
      });
      const verified = await response.json().catch(() => null);
      const payment = verified?.data;
      if (!response.ok || !verified?.status || payment?.status !== "success"
        || payment.reference !== reference || payment.amount !== amount || payment.currency !== "NGN"
        || String(payment.customer?.email || "").toLowerCase() !== user.email.toLowerCase())
        return reply({ error: "Payment could not be verified. Please contact support with your Paystack reference." }, 400);

      const { error: insertError } = await admin.from("payments").insert({
        vendor_id: user.id, amount: amount / 100, currency: "NGN", plan,
        status: "success", provider: "paystack", reference,
      });
      if (insertError) {
        if (insertError.code === "23505") return reply({ error: "This payment reference has already been used." }, 409);
        throw insertError;
      }
    }

    const { error: updateError } = await admin.from("profiles").update({ plan }).eq("id", user.id);
    if (updateError) throw updateError;
    return reply({ success: true, plan });
  } catch (error) {
    console.error("verify-customer-payment failed", error);
    return reply({ error: "We could not activate your plan. Please contact support with your Paystack reference." }, 500);
  }
});
