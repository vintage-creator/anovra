import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const allowedEvents = new Set(["link_click", "scan_started", "scan_completed", "vendor_signup", "product_click", "purchase"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) throw new Error("Supabase configuration is unavailable.");
    const body = await req.json();
    const referralCode = String(body.referral_code || "").trim().toLowerCase();
    const eventType = String(body.event_type || "").trim();
    if (!referralCode || referralCode.length > 160 || !/^[a-z0-9._@-]+$/.test(referralCode)) return json({ error: "A valid referral code is required." }, 400);
    if (!allowedEvents.has(eventType)) return json({ error: "Unsupported referral event." }, 400);

    const admin = createClient(url, serviceKey);
    let { data: member } = await admin.from("admin_team").select("id").eq("status", "active").eq("username", referralCode).maybeSingle();
    if (!member && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(referralCode)) {
      ({ data: member } = await admin.from("admin_team").select("id").eq("status", "active").eq("id", referralCode).maybeSingle());
    }
    if (!member) return json({ tracked: false }, 200);
    const metadata = typeof body.metadata === "object" && body.metadata ? body.metadata : {};
    const { error } = await admin.from("team_referral_events").insert([{
      team_member_id: member.id,
      event_type: eventType,
      amount: Math.max(0, Number(body.amount || 0)),
      city: String(body.city || "Nigeria").slice(0, 120),
      metadata,
    }]);
    if (error) throw error;
    return json({ tracked: true });
  } catch (error) {
    console.error("track-referral-event failed", error);
    return json({ error: error instanceof Error ? error.message : "Referral event could not be recorded." }, 400);
  }
});
