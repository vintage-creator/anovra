import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, PATCH, OPTIONS",
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function randomPassword() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes).map((byte) => byte.toString(36).slice(-1)).join("");
  return `Anovra-${token}9!`;
}

async function sendBranchEmail(payload: {
  email: string;
  branchName: string;
  brandName: string;
  password: string;
  slug: string;
}) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: "Anovra <hello@anovra.africa>",
      to: [payload.email],
      subject: `${payload.branchName} has been added to Anovra`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:12px">
          <h2 style="color:#008236;margin-top:0">Your branch workspace is ready</h2>
          <p>${payload.brandName} has created an Anovra branch workspace for <strong>${payload.branchName}</strong>.</p>
          <p><strong>Login email:</strong> ${payload.email}<br/><strong>Temporary password:</strong> ${payload.password}</p>
          <p><strong>Storefront:</strong> https://anovra.africa/#/shop/${payload.slug}<br/><strong>Skin test:</strong> https://anovra.africa/#/scan/${payload.slug}</p>
          <p><a href="https://anovra.africa/#/signin" style="background:#008236;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Sign in to branch dashboard</a></p>
          <p style="font-size:12px;color:#777">Please change this password after signing in.</p>
        </div>
      `,
    }),
  });
  return response.ok;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return json({ error: "Missing Supabase function environment." }, 500);
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) throw new Error("Missing Authorization bearer token.");

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Invalid session.");

    const caller = userData.user;
    const callerRole = caller.user_metadata?.role;
    const callerEmail = caller.email?.toLowerCase();
    const { data: callerProfile } = await admin
      .from("profiles")
      .select("id, name, business_name, account_type, slug")
      .eq("id", caller.id)
      .maybeSingle();

    const isBrand = callerRole === "brand" || callerProfile?.account_type === "brand";
    const isAdmin = callerRole === "admin" || callerEmail === "admin@anovra.africa" || callerEmail === "hello@anovra.africa";
    if (!isBrand && !isAdmin) throw new Error("Only Brand Admins or Platform Admins can manage brand branches.");

    const body = await req.json().catch(() => ({}));
    const action = body.action || (req.method === "PATCH" ? "update" : "create");

    if (action === "create") {
      const branchName = String(body.branch_name || body.branchName || "").trim();
      const branchEmail = String(body.branch_email || body.branchEmail || "").trim().toLowerCase();
      const location = String(body.location || "").trim();
      const phone = String(body.phone || "").trim();
      const providedPassword = String(body.password || "").trim();
      if (branchName.length < 2) throw new Error("Branch name is required.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(branchEmail)) throw new Error("A valid branch email is required.");
      if (location.length < 3) throw new Error("A branch location is required.");
      if (phone.replace(/\D/g, "").length < 10) throw new Error("A valid branch contact number is required.");

      const brandId = isAdmin && body.brand_id ? String(body.brand_id) : caller.id;
      const { data: brandProfile, error: brandError } = await admin
        .from("profiles")
        .select("id, name, business_name, slug, account_type")
        .eq("id", brandId)
        .maybeSingle();
      if (brandError || !brandProfile) throw new Error("Brand profile not found.");
      if (!isAdmin && brandProfile.id !== caller.id) throw new Error("You can only create branches for your own brand.");
      if (branchName.toLowerCase() === String(brandProfile.business_name || brandProfile.name || "").trim().toLowerCase()) {
        throw new Error("The branch name must be distinct from the Brand HQ organisation name.");
      }

      const brandSlug = slugify(brandProfile.slug || brandProfile.business_name || brandProfile.name || "brand");
      const baseBranchSlug = slugify(body.branch_slug || body.branchSlug || `${brandSlug}-${branchName}`);
      let branchSlug = baseBranchSlug;
      let suffix = 2;
      while (true) {
        const { data: existingBranch } = await admin.from("brand_branches").select("id").eq("branch_slug", branchSlug).maybeSingle();
        const { data: existingProfile } = await admin.from("profiles").select("id").eq("slug", branchSlug).maybeSingle();
        if (!existingBranch && !existingProfile) break;
        branchSlug = `${baseBranchSlug}-${suffix}`;
        suffix += 1;
      }

      const password = providedPassword || randomPassword();
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: branchEmail,
        password,
        email_confirm: true,
        user_metadata: {
          role: "vendor",
          account_type: "branch",
          parent_brand_id: brandProfile.id,
          full_name: branchName,
          business_name: branchName,
          phone,
          location,
          slug: branchSlug,
          branch_status: "active",
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Branch auth account could not be created.");

      const branchId = authData.user.id;
      const profilePayload = {
        id: branchId,
        name: branchName,
        business_name: branchName,
        email: branchEmail,
        phone,
        location,
        branch_location: location,
        account_type: "branch",
        parent_brand_id: brandProfile.id,
        slug: branchSlug,
        branch_status: "active",
        plan: "brand",
        is_verified: true,
        verification_status: "approved",
      };
      const { error: profileError } = await admin.from("profiles").upsert([profilePayload], { onConflict: "id" });
      if (profileError) {
        await admin.auth.admin.deleteUser(branchId).catch(() => {});
        throw profileError;
      }

      const { data: branchRecord, error: branchError } = await admin
        .from("brand_branches")
        .insert([{
          brand_id: brandProfile.id,
          branch_id: branchId,
          branch_name: branchName,
          branch_email: branchEmail,
          branch_slug: branchSlug,
          location,
          phone,
          status: "active",
          created_by: caller.id,
        }])
        .select()
        .single();
      if (branchError) {
        await admin.auth.admin.deleteUser(branchId).catch(() => {});
        throw branchError;
      }

      const emailSent = await sendBranchEmail({
        email: branchEmail,
        branchName,
        brandName: brandProfile.business_name || brandProfile.name || "Your brand",
        password,
        slug: branchSlug,
      }).catch((error) => {
        console.warn("Branch credential email failed:", error);
        return false;
      });

      return json({
        success: true,
        branch: branchRecord,
        email_sent: emailSent,
        credentials: { email: branchEmail, password },
        links: {
          shop: `https://anovra.africa/#/shop/${branchSlug}`,
          scan: `https://anovra.africa/#/scan/${branchSlug}`,
        },
      });
    }

    if (action === "update") {
      const branchId = String(body.branch_id || body.branchId || "");
      const status = String(body.status || "").trim();
      if (!branchId) throw new Error("branch_id is required.");
      if (status && !["active", "inactive", "suspended"].includes(status)) throw new Error("Unsupported branch status.");

      const { data: membership } = await admin
        .from("brand_branches")
        .select("id, brand_id, branch_id")
        .eq("branch_id", branchId)
        .maybeSingle();
      if (!membership) throw new Error("Branch membership not found.");
      if (!isAdmin && membership.brand_id !== caller.id) throw new Error("You can only update your own branches.");

      const updates: Record<string, string> = {};
      if (body.branch_name || body.branchName) updates.branch_name = String(body.branch_name || body.branchName).trim();
      if (body.branch_email || body.branchEmail) {
        const branchEmail = String(body.branch_email || body.branchEmail).trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(branchEmail)) throw new Error("A valid branch email is required.");
        updates.branch_email = branchEmail;
      }
      if (body.location !== undefined) updates.location = String(body.location || "").trim();
      if (body.phone !== undefined) updates.phone = String(body.phone || "").trim();
      if (status) updates.status = status;

      const { data: branch, error: updateError } = await admin
        .from("brand_branches")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("branch_id", branchId)
        .select()
        .single();
      if (updateError) throw updateError;

      const profileUpdates: Record<string, string> = {};
      if (updates.branch_name) {
        profileUpdates.name = updates.branch_name;
        profileUpdates.business_name = updates.branch_name;
      }
      if (updates.branch_email) profileUpdates.email = updates.branch_email;
      if (updates.location !== undefined) {
        profileUpdates.location = updates.location;
        profileUpdates.branch_location = updates.location;
      }
      if (updates.phone !== undefined) profileUpdates.phone = updates.phone;
      if (status) profileUpdates.branch_status = status;
      if (Object.keys(profileUpdates).length) {
        await admin.from("profiles").update(profileUpdates).eq("id", branchId);
      }

      if (updates.branch_email) {
        const { error: authEmailError } = await admin.auth.admin.updateUserById(branchId, {
          email: updates.branch_email,
          email_confirm: true,
        });
        if (authEmailError) throw authEmailError;
      }

      if (status === "suspended" || status === "inactive") {
        await admin.auth.admin.updateUserById(branchId, { ban_duration: "876000h" }).catch(() => {});
      } else if (status === "active") {
        await admin.auth.admin.updateUserById(branchId, { ban_duration: "none" }).catch(() => {});
      }

      return json({ success: true, branch });
    }

    throw new Error("Unsupported branch action.");
  } catch (error: any) {
    return json({ error: error.message }, 400);
  }
});
