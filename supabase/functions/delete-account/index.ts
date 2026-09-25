import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const reply = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return reply({ error: "Method not allowed." }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !serviceKey || !anonKey) return reply({ error: "Account deletion is temporarily unavailable." }, 503);

  try {
    const bearer = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!bearer) return reply({ error: "Sign in to delete your account." }, 401);
    const admin = createClient(url, serviceKey);
    const { data: identity, error: identityError } = await admin.auth.getUser(bearer);
    const user = identity.user;
    if (identityError || !user?.email) return reply({ error: "Your session has expired. Sign in again." }, 401);

    const body = await request.json().catch(() => ({}));
    const password = typeof body.password === "string" ? body.password : "";
    if (body.confirmation !== "DELETE" || !password)
      return reply({ error: "Enter your password and type DELETE to confirm." }, 400);

    const { data: profile, error: profileError } = await admin.from("profiles")
      .select("id, account_type, parent_brand_id").eq("id", user.id).maybeSingle();
    if (profileError || !profile || !["customer", "vendor", "brand"].includes(profile.account_type)
      || profile.parent_brand_id || user.user_metadata?.role === "admin")
      return reply({ error: "This account cannot be self-deleted. Contact Anovra support." }, 403);

    const verifier = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: proof, error: passwordError } = await verifier.auth.signInWithPassword({ email: user.email, password });
    if (passwordError || proof.user?.id !== user.id)
      return reply({ error: "That password is incorrect. Try again before deleting your account." }, 401);

    const ownedIds = new Set<string>([user.id]);
    if (profile.account_type === "brand") {
      const { data: linked, error: branchError } = await admin.from("brand_branches")
        .select("branch_id").eq("brand_id", user.id);
      const { data: children, error: childrenError } = await admin.from("profiles")
        .select("id").eq("parent_brand_id", user.id);
      if (branchError || childrenError) throw branchError || childrenError;
      for (const row of linked || []) ownedIds.add(row.branch_id);
      for (const row of children || []) ownedIds.add(row.id);
    }

    const ids = [...ownedIds];
    const [profiles, products] = await Promise.all([
      admin.from("profiles").select("logo_url,cac_document_url").in("id", ids),
      admin.from("products").select("image_url").in("vendor_id", ids),
    ]);
    if (profiles.error || products.error) throw profiles.error || products.error;

    const storagePaths = new Map<string, Set<string>>();
    const storagePrefix = `${url}/storage/v1/object/public/`;
    const addStorageUrl = (value: unknown) => {
      if (typeof value !== "string" || !value.startsWith(storagePrefix)) return;
      const relative = decodeURIComponent(value.slice(storagePrefix.length).split("?")[0]);
      const slash = relative.indexOf("/");
      if (slash < 1) return;
      const bucket = relative.slice(0, slash);
      if (!["product-images", "vendor-documents"].includes(bucket)) return;
      const path = relative.slice(slash + 1);
      if (!path || path.includes("..")) return;
      if (!storagePaths.has(bucket)) storagePaths.set(bucket, new Set());
      storagePaths.get(bucket)!.add(path);
    };
    for (const row of profiles.data || []) {
      addStorageUrl(row.logo_url);
      addStorageUrl(row.cac_document_url);
    }
    for (const row of products.data || []) addStorageUrl(row.image_url);

    const { error: eraseError } = await admin.rpc("erase_account_and_owned_data", { target_id: user.id });
    if (eraseError) throw eraseError;

    let filesPending = false;
    for (const [bucket, paths] of storagePaths) {
      const filePaths = [...paths];
      for (let index = 0; index < filePaths.length; index += 100) {
        try {
          const { error } = await admin.storage.from(bucket).remove(filePaths.slice(index, index + 100));
          if (error) throw error;
        } catch (error) {
          filesPending = true;
          console.error("Account file erasure failed", bucket, error);
        }
      }
    }
    return reply({ deleted: true, filesPending });
  } catch (error) {
    console.error("Account erasure failed", error);
    return reply({ error: "We could not complete account deletion. Your account is unchanged; please try again or contact support." }, 500);
  }
});
