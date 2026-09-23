import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return reply({ error: "Method not allowed." }, 405);
  try {
    const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return reply({ error: "Sign in before moving to Brand HQ." }, 401);
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth.user) return reply({ error: "Your session has expired. Please sign in again." }, 401);
    const user = auth.user;
    const { data: profile, error: profileError } = await db.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (profileError || !profile) return reply({ error: "Your vendor profile could not be found." }, 404);
    if (profile.account_type !== "vendor" || profile.parent_brand_id)
      return reply({ error: "Only an independent vendor owner can move this account to Brand HQ." }, 403);
    if (["suspended", "banned"].includes(profile.verification_status))
      return reply({ error: "Resolve your account status with Anovra before changing account type." }, 403);
    const name = String(profile.business_name || profile.name || "").trim();
    const slug = String(profile.slug || "").trim();
    if (!name || !slug || !user.email) return reply({ error: "Complete your storefront name and email before moving to Brand HQ." }, 400);
    const { data: existing } = await db.from("brand_branches").select("id").eq("branch_slug", slug).maybeSingle();
    if (existing) return reply({ error: "This store URL is already used by a branch. Contact Anovra support." }, 409);

    const { data: branch, error: branchError } = await db.from("brand_branches").insert({
      brand_id: user.id, branch_id: user.id, branch_name: name, branch_email: user.email,
      branch_slug: slug, location: profile.location, phone: profile.phone,
      status: "active", created_by: user.id,
    }).select("id").single();
    if (branchError) throw branchError;
    const { error: updateError } = await db.from("profiles").update({ account_type: "brand" }).eq("id", user.id);
    if (updateError) {
      await db.from("brand_branches").delete().eq("id", branch.id);
      throw updateError;
    }
    const { error: metadataError } = await db.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, role: "brand", account_type: "brand" },
    });
    if (metadataError) {
      await db.from("profiles").update({ account_type: "vendor" }).eq("id", user.id);
      await db.from("brand_branches").delete().eq("id", branch.id);
      throw metadataError;
    }
    return reply({ success: true, flagshipSlug: slug });
  } catch (error) {
    console.error("upgrade-vendor-to-brand failed", error);
    return reply({ error: "Could not move this account to Brand HQ. Please contact Anovra support." }, 500);
  }
});
