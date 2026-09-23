import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { appLink, button, credentialsGrid, emailShell, escapeHtml } from "../_shared/email.ts";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

function temporaryPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return `Anovra-${Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("")}!`;
}

async function sendInvite(email: string, name: string, brand: string, branch: string, role: string, password: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Anovra <hello@anovra.africa>", to: [email],
      subject: `Your ${branch} team workspace is ready`,
      html: emailShell({
        eyebrow: "Brand team",
        title: "Welcome to your branch team",
        preview: `${brand} has given you access to ${branch}.`,
        body: `<p style="margin:0 0 14px;">Hello ${escapeHtml(name)}, ${escapeHtml(brand)} has added you to ${escapeHtml(branch)} as a ${escapeHtml(role)}.</p>
          ${credentialsGrid([{ label: "Login email", value: email }, { label: "Temporary password", value: password }])}
          ${button("Sign in to branch workspace", appLink("/#/vendorlogin"))}
          <p style="margin:16px 0 0;color:#667085;font-size:13px;">Change your password after signing in. Your access is limited to this branch.</p>`,
      }),
    }),
  });
  return response.ok;
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return reply({ error: "Method not allowed." }, 405);
  try {
    const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return reply({ error: "Sign in to manage your team." }, 401);
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth.user) return reply({ error: "Your session has expired. Please sign in again." }, 401);
    const { data: owner } = await db.from("profiles").select("id, account_type, business_name, name, verification_status")
      .eq("id", auth.user.id).maybeSingle();
    if (owner?.account_type !== "brand" || ["suspended", "banned"].includes(owner.verification_status))
      return reply({ error: "Only an active Brand HQ owner can manage branch team access." }, 403);
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "list");
    const { data: branches, error: branchError } = await db.from("brand_branches")
      .select("branch_id, branch_name, status").eq("brand_id", owner.id);
    if (branchError) throw branchError;
    const branchIds = (branches || []).map((branch) => branch.branch_id);
    if (action === "list") {
      if (!branchIds.length) return reply({ members: [] });
      const { data, error } = await db.from("team_members")
        .select("id, vendor_id, name, email, role, status, created_at")
        .in("vendor_id", branchIds).in("role", ["Manager", "Viewer"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return reply({ members: data || [] });
    }
    if (action === "create") {
      const branch = (branches || []).find((item) => item.branch_id === body.branchId && item.status === "active");
      const name = String(body.name || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      const role = String(body.role || "");
      if (!branch) return reply({ error: "Choose an active branch." }, 400);
      if (name.length < 2 || name.length > 100) return reply({ error: "Enter the team member's full name." }, 400);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply({ error: "Enter a valid email address." }, 400);
      if (!["Manager", "Viewer"].includes(role)) return reply({ error: "Choose Manager or Viewer access." }, 400);
      const password = temporaryPassword();
      const { data: created, error: createError } = await db.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { role: "vendor_staff", account_type: "staff", full_name: name,
          parent_brand_id: owner.id, branch_id: branch.branch_id },
      });
      if (createError || !created.user) {
        const duplicate = /already|registered|exists/i.test(createError?.message || "");
        return reply({ error: duplicate ? "This email is already registered. Use a different team email." :
          createError?.message || "Could not create the team account." }, duplicate ? 409 : 400);
      }
      const { data: membership, error: membershipError } = await db.from("team_members").insert({
        vendor_id: branch.branch_id, auth_user_id: created.user.id, name, email, role, status: "active",
      }).select("id, vendor_id, name, email, role, status, created_at").single();
      if (membershipError) {
        await db.auth.admin.deleteUser(created.user.id);
        throw membershipError;
      }
      const emailSent = await sendInvite(email, name, owner.business_name || owner.name,
        branch.branch_name, role, password).catch(() => false);
      return reply({ member: membership, emailSent, ...(emailSent ? {} : { temporaryPassword: password }) });
    }
    if (["suspend", "reactivate", "remove"].includes(action)) {
      const { data: member } = await db.from("team_members")
        .select("id, vendor_id, auth_user_id, status").eq("id", String(body.memberId || "")).maybeSingle();
      if (!member || !branchIds.includes(member.vendor_id))
        return reply({ error: "Team member not found in this brand." }, 404);
      if (action === "remove") {
        const { error } = await db.from("team_members").delete().eq("id", member.id);
        if (error) throw error;
        if (member.auth_user_id) await db.auth.admin.deleteUser(member.auth_user_id);
      } else {
        const { error } = await db.from("team_members").update({
          status: action === "suspend" ? "suspended" : "active",
        }).eq("id", member.id);
        if (error) throw error;
      }
      return reply({ success: true });
    }
    return reply({ error: "Unknown team action." }, 400);
  } catch (error) {
    console.error("manage-brand-team failed", error);
    return reply({ error: "Could not update the brand team. Please try again." }, 500);
  }
});
