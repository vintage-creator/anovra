import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const baseUrl = "https://skin-analysis-production-9c4b.up.railway.app";
const areas: Record<string, string> = {
  face: "face", neck: "neck", back: "back", hands: "hands", legs: "legs",
  "whole body": "whole-body", "other area": "other",
};
const reply = (body: unknown, status = 200, retryAfter?: string | null) =>
  new Response(JSON.stringify(body), { status, headers: {
    ...corsHeaders, ...(retryAfter ? { "Retry-After": retryAfter } : {}),
  } });

function meta<T>(description: string, key: string, fallback: T): T {
  const match = description.match(new RegExp(`<!--${key}:([\\s\\S]*?)-->`));
  if (!match) return fallback;
  try { return JSON.parse(match[1]); } catch { return fallback; }
}

async function callApi(path: string, body: unknown, key: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(115000),
  });
  const payload = await response.json().catch(() => ({}));
  if (response.ok) return { data: payload };
  const detail = payload as { error?: string | { code?: string; message?: string }; retryable?: boolean };
  return { error: typeof detail.error === "string" ? detail.error : detail.error?.message || "Skin analysis is unavailable.",
    retryable: detail.retryable, status: response.status, retryAfter: response.headers.get("retry-after") };
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return reply({ error: "Method not allowed." }, 405);
  try {
    const requestOrigin = request.headers.get("origin");
    const allowed = [
      Deno.env.get("ANOVRA_APP_URL") || "https://anovra-api.vercel.app",
      "https://anovra.africa", "https://www.anovra.africa",
      "http://localhost:5173", "http://127.0.0.1:5173",
    ];
    if (requestOrigin && !allowed.includes(requestOrigin))
      return reply({ error: "This scan source is not allowed." }, 403);
    const key = Deno.env.get("SKIN_ANALYSIS_API_KEY");
    if (!key) return reply({ error: "Skin analysis is not configured." }, 503);
    const body = await request.json();
    const imageBase64 = String(body.imageBase64 || "");
    const skinArea = areas[String(body.skinArea || "").trim().toLowerCase()];
    const vendorId = body.vendorId ? String(body.vendorId) : null;
    if (!skinArea || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(imageBase64) || imageBase64.length > 7_000_000)
      return reply({ error: "Choose a skin area and upload a JPEG, PNG, or WebP photo under 5 MB." }, 400);
    if (vendorId && !/^[0-9a-f-]{36}$/i.test(vendorId)) return reply({ error: "Invalid storefront." }, 400);

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const clientAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("cf-connecting-ip") || "unknown";
    const hashBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${key}:${clientAddress}`));
    const keyHash = Array.from(new Uint8Array(hashBytes)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    const { data: slotAcquired, error: limitError } = await db.rpc("acquire_skin_scan_slot", { p_key_hash: keyHash });
    if (limitError) throw limitError;
    if (!slotAcquired) return reply({ error: "You have reached the scan limit. Please try again in an hour." }, 429, "3600");
    let sourceProducts: Record<string, unknown>[] = [];
    let catalog: Record<string, unknown>[] = [];
    if (vendorId) {
      const { data: vendor, error: vendorError } = await db.from("profiles")
        .select("id, account_type, branch_status, is_verified, verification_status, parent_brand_id, plan, created_at")
        .eq("id", vendorId).maybeSingle();
      if (vendorError || !vendor || !vendor.is_verified || vendor.verification_status !== "approved" ||
          (vendor.account_type === "branch" && vendor.branch_status !== "active"))
        return reply({ error: "This storefront is unavailable." }, 403);
      let planOwner: { plan: string | null; created_at: string | null } = vendor;
      if (vendor.parent_brand_id) {
        const { data: parent } = await db.from("profiles")
          .select("is_verified, verification_status, plan, created_at")
          .eq("id", vendor.parent_brand_id).maybeSingle();
        if (!parent?.is_verified || parent.verification_status !== "approved")
          return reply({ error: "This storefront is unavailable." }, 403);
        planOwner = parent;
      }
      const trialEnd = new Date(planOwner.created_at || 0).getTime() + 7 * 24 * 60 * 60 * 1000;
      if ((!planOwner.plan || planOwner.plan === "free") && Date.now() > trialEnd)
        return reply({ error: "This partner's trial has ended. The skin test is unavailable until they subscribe." }, 403);
      const { data: products, error: productError } = await db.from("products").select("*")
        .eq("vendor_id", vendorId).eq("nafdac_status", "approved").limit(50);
      if (productError) throw productError;
      sourceProducts = products || [];
      catalog = sourceProducts.map((product) => {
        const description = String(product.description || "");
        return {
          id: String(product.id), name: String(product.name), brand: String(product.brand || ""),
          price: Number(product.price || 0), currency: "NGN", category: String(product.category || "Skincare"),
          description: description.replace(/<!--[A-Z_]+:[\s\S]*?-->/g, "").trim(),
          ingredients: [...meta<string[]>(description, "KEY_INGREDIENTS", []), ...meta<string[]>(description, "ACTIVE_INGREDIENTS", [])],
          skinTypes: meta<string[]>(description, "SKINTYPES", []),
          concerns: [], usage: meta<string>(description, "USAGE", ""),
          imageUrl: String(product.image_url || meta<string[]>(description, "IMAGES", [])[0] || ""),
          nafdacStatus: "approved",
        };
      });
    }

    const media = { type: "image", base64: imageBase64.split(",")[1],
      mimeType: imageBase64.slice(5, imageBase64.indexOf(";")) };
    const capture = await callApi("/v1/capture", { media, skinArea, options: { locale: "en-NG" } }, key);
    if ("error" in capture) return reply(capture, capture.status, capture.retryAfter);
    const verdict = capture.data as { accepted: boolean; capture?: { reject_reasons?: unknown[] }; capture_token?: string };
    if (!verdict.accepted) return reply({ accepted: false, rejectReasons: verdict.capture?.reject_reasons || [] });

    const analysis = await callApi("/v1/analyse", {
      media, skinArea, captureToken: verdict.capture_token, catalog,
      options: { locale: "en-NG", includeLegacy: true },
    }, key);
    if ("error" in analysis) return reply(analysis, analysis.status, analysis.retryAfter);
    const result = analysis.data as {
      accepted: boolean; capture?: { reject_reasons?: unknown[] };
      legacy?: { concern: string; result: string; score: number; severity: unknown[]; benefits: string[] };
      products?: Record<string, unknown>[]; ingredient_fallback?: unknown[]; treatment?: unknown[];
      disclaimer?: string; no_issues_detected?: boolean;
    };
    if (!result.accepted) return reply({ accepted: false, rejectReasons: result.capture?.reject_reasons || [] });
    if (!result.legacy) return reply({ error: "The scanner returned an incomplete report. Please try again." }, 502);
    const products = (result.products || []).filter((item) => sourceProducts.some((source) => source.id === item.id));
    return reply({ accepted: true, ...result.legacy, products,
      ingredientFallback: result.ingredient_fallback || [],
      treatmentPlan: result.treatment || [],
      disclaimer: result.disclaimer, noIssuesDetected: result.no_issues_detected });
  } catch (error) {
    console.error("analyse-skin failed", error);
    return reply({ error: "The scanner is temporarily unavailable. Please try again shortly." }, 502);
  }
});
