import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase function environment." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  let logPayload: any = {};
  try {
    const { vendor_id, event_type, payload = {} } = await req.json();
    if (!vendor_id || !event_type) throw new Error("vendor_id and event_type are required.");
    logPayload = { vendor_id, event_type, payload };

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("webhook_url")
      .eq("id", vendor_id)
      .maybeSingle();
    if (profileError) throw profileError;

    if (!profile?.webhook_url) {
      await admin.from("webhook_delivery_logs").insert([{ ...logPayload, success: false, error_message: "No webhook URL configured." }]);
      return new Response(JSON.stringify({ skipped: true, reason: "No webhook URL configured." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(profile.webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Anovra-Event": event_type,
      },
      body: JSON.stringify({ event: event_type, created_at: new Date().toISOString(), data: payload }),
    });
    const responseBody = await response.text();
    await admin.from("webhook_delivery_logs").insert([{
      ...logPayload,
      endpoint_url: profile.webhook_url,
      response_status: response.status,
      response_body: responseBody.slice(0, 2000),
      success: response.ok,
      error_message: response.ok ? null : `Webhook returned HTTP ${response.status}`,
    }]);

    return new Response(JSON.stringify({ success: response.ok, status: response.status }), {
      status: response.ok ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    await admin.from("webhook_delivery_logs").insert([{ ...logPayload, success: false, error_message: error.message }]).catch(() => {});
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
