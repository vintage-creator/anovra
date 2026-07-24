import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const toHex = (bytes: Uint8Array) => Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) throw new Error("Missing Authorization bearer token.");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase function environment.");

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Invalid session.");

    const body = await req.json().catch(() => ({}));
    const action = body.action || "create";
    if (action !== "create") throw new Error("Unsupported API key action.");

    const rawBytes = new Uint8Array(24);
    crypto.getRandomValues(rawBytes);
    const key = `ak_live_${toHex(rawBytes)}`;
    const keyHash = await sha256(key);
    const keyPrefix = `${key.slice(0, 14)}...`;

    await admin
      .from("vendor_api_keys")
      .update({ status: "revoked" })
      .eq("vendor_id", userData.user.id)
      .eq("status", "active");

    const { error } = await admin.from("vendor_api_keys").insert([{
      vendor_id: userData.user.id,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      name: body.name || "Live API key",
      status: "active",
    }]);
    if (error) throw error;

    return new Response(JSON.stringify({ key, key_prefix: keyPrefix }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
