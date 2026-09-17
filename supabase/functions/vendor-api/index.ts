import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const toHex = (bytes: Uint8Array) => Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toHex(new Uint8Array(digest));
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase function environment.");

    const apiKey = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
    if (!apiKey) return json({ error: "Missing API bearer key." }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const keyHash = await sha256(apiKey);
    const { data: keyRecord, error: keyError } = await admin
      .from("vendor_api_keys")
      .select("id, vendor_id, status")
      .eq("key_hash", keyHash)
      .eq("status", "active")
      .maybeSingle();
    if (keyError || !keyRecord) return json({ error: "Invalid API key." }, 401);

    const { data: profile } = await admin
      .from("profiles")
      .select("verification_status, account_type, branch_status, parent_brand_id")
      .eq("id", keyRecord.vendor_id)
      .maybeSingle();
    if (!profile || ["suspended", "banned"].includes(profile.verification_status) || (profile.account_type === "branch" && profile.branch_status !== "active")) {
      return json({ error: "This account is not currently active." }, 403);
    }
    if (profile.account_type === "branch" && profile.parent_brand_id) {
      const { data: parentBrand } = await admin.from("profiles").select("verification_status").eq("id", profile.parent_brand_id).maybeSingle();
      if (["suspended", "banned"].includes(parentBrand?.verification_status)) return json({ error: "This Brand HQ account is not currently active." }, 403);
    }

    await admin.from("vendor_api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id);

    const route = new URL(req.url).pathname.split("/vendor-api")[1] || "/";
    if (req.method === "GET" && route.startsWith("/scans")) {
      const { data, error } = await admin
        .from("scans")
        .select("*")
        .eq("vendor_id", keyRecord.vendor_id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return json({ data });
    }

    if (req.method === "GET" && route.startsWith("/catalog")) {
      const { data, error } = await admin
        .from("products")
        .select("*")
        .eq("vendor_id", keyRecord.vendor_id)
        .eq("nafdac_status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ data });
    }

    if (req.method === "POST" && route.startsWith("/recommendations")) {
      const body = await req.json().catch(() => ({}));
      const concern = String(body.concern || body.skinConcern || "").toLowerCase();
      const { data: products, error } = await admin
        .from("products")
        .select("*")
        .eq("vendor_id", keyRecord.vendor_id)
        .eq("nafdac_status", "approved");
      if (error) throw error;
      const ranked = (products || [])
        .map((product: any) => {
          const searchable = `${product.name || ""} ${product.category || ""} ${product.description || ""}`.toLowerCase();
          const score = concern && searchable.includes(concern) ? 94 : 70;
          return { ...product, match_score: score };
        })
        .sort((a: any, b: any) => b.match_score - a.match_score)
        .slice(0, 10);
      return json({ data: ranked });
    }

    return json({ error: "Endpoint not found." }, 404);
  } catch (error: any) {
    return json({ error: error.message }, 400);
  }
});
