import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { appLink, button, credentialsGrid, emailShell, escapeHtml, linkBox } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const roles = new Set(["Marketing", "Sales", "Support", "Representative", "Operations", "Manager"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => chars[byte % chars.length]).join("");
}
function slugName(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") || "team.member";
}

async function sendCredentials(admin: any, payload: { recipient: string; name: string; username: string; password: string; subject: string }) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return false;
  const loginUrl = appLink("/#/teamlogin");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: "Anovra <hello@anovra.africa>",
      to: [payload.recipient],
      subject: payload.subject,
      html: emailShell({
        eyebrow: "Team workspace",
        title: payload.subject,
        preview: "Your Anovra staff login details are ready.",
        body: `
          <p style="margin:0 0 14px;">Hi ${escapeHtml(payload.name)},</p>
          <p style="margin:0 0 14px;">You have been added to the Anovra Platform Administration team. Use the login details below to access your staff workspace.</p>
          ${credentialsGrid([
            { label: "Login email", value: payload.username },
            { label: "Temporary password", value: payload.password },
          ])}
          ${button("Sign in to Team Workspace", loginUrl)}
          ${linkBox("Copyable sign-in link", loginUrl)}
          <p style="margin:16px 0 0;color:#667085;font-size:13px;">For your security, change this temporary password after your first sign-in. Do not forward this email.</p>
        `,
      }),
    }),
  });
  const provider = await response.json().catch(() => ({}));
  await admin.from("email_delivery_logs").insert([{ recipient: payload.recipient, subject: payload.subject, template: "platform_team_credentials", status: response.ok ? "sent" : "failed", provider_response: provider, error_message: response.ok ? null : JSON.stringify(provider) }]);
  return response.ok;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anonKey || !serviceKey) throw new Error("Supabase configuration is unavailable.");
    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Authentication required." }, 401);
    const authClient = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user: caller } } = await authClient.auth.getUser();
    const body = await req.json();
    const action = String(body.action || "");
    const callerEmail = caller?.email?.toLowerCase() || "";
    if (!caller) return json({ error: "Authentication required." }, 401);
    const admin = createClient(url, serviceKey);

    if (action === "update_profile") {
      const name = String(body.name || "").trim();
      const phone = String(body.phone || "").trim();
      const headshotUrl = String(body.headshot_url || "").trim();
      if (name.length < 2 || name.length > 100) return json({ error: "Enter a valid full name." }, 400);
      if (phone.length < 7 || phone.length > 25) return json({ error: "Enter a valid phone number." }, 400);
      const { data: member } = await admin.from("admin_team").select("id, status").eq("id", caller.id).maybeSingle();
      if (!member || member.status !== "active") return json({ error: "This team account is not active." }, 403);
      const { error } = await admin.from("admin_team").update({ name, phone, headshot_url: headshotUrl || null, updated_at: new Date().toISOString() }).eq("id", caller.id);
      if (error) throw error;
      await admin.auth.admin.updateUserById(caller.id, { user_metadata: { ...caller.user_metadata, name } });
      return json({ success: true });
    }

    if (!(caller.app_metadata?.role === "admin" || caller.user_metadata?.role === "admin" || ["admin@anovra.africa", "hello@anovra.africa"].includes(callerEmail))) return json({ error: "Platform Super Admin access is required." }, 403);

    if (action === "list") {
      const { data, error } = await admin
        .from("admin_team")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ success: true, members: data || [] });
    }

    if (action === "create") {
      const name = String(body.name || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      const phone = String(body.phone || "").trim();
      const role = String(body.role || "");
      const idFileName = String(body.id_file_name || "").trim();
      const headshotUrl = String(body.headshot_url || "").trim();
      if (name.length < 2 || name.length > 100) return json({ error: "Enter a valid full name." }, 400);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Enter a valid notification email." }, 400);
      if (phone.length < 7 || phone.length > 25) return json({ error: "Enter a valid phone number." }, 400);
      if (!roles.has(role)) return json({ error: "Choose a valid team role." }, 400);
      if (!idFileName.startsWith("https://") || !headshotUrl.startsWith("https://")) return json({ error: "A valid ID document and headshot are required." }, 400);
      const base = slugName(name);
      let username = `${base}@anovra.africa`;
      let suffix = 2;
      while ((await admin.from("admin_team").select("id").eq("username", username).maybeSingle()).data) username = `${base}.${suffix++}@anovra.africa`;
      const password = randomPassword();
      const { data: authData, error: authError } = await admin.auth.admin.createUser({ email: username, password, email_confirm: true, user_metadata: { role: "staff", name }, app_metadata: { role: "staff" } });
      if (authError) return json({ error: authError.message.includes("already") ? "A team account already uses this login. Try a different name." : authError.message }, 409);
      const member = {
        id: authData.user.id, name, phone, email, role,
        id_file_name: idFileName,
        headshot_url: headshotUrl,
        username, password: null, status: "active",
      };
      const { data: saved, error: insertError } = await admin.from("admin_team").insert([member]).select().single();
      if (insertError) { await admin.auth.admin.deleteUser(authData.user.id); return json({ error: insertError.code === "23505" ? "A team account already uses this email address." : insertError.message }, 409); }
      const emailSent = await sendCredentials(admin, { recipient: email, name, username, password, subject: "Your Anovra Team Workspace account" }).catch(() => false);
      return json({ success: true, member: saved, credentials: { username, password }, email_sent: emailSent });
    }

    const memberId = String(body.member_id || "");
    const { data: member } = await admin.from("admin_team").select("*").eq("id", memberId).single();
    if (!member) return json({ error: "Team member not found." }, 404);
    if (action === "set_status") {
      const status = String(body.status || "");
      if (!new Set(["active", "suspended", "removed"]).has(status)) return json({ error: "Unsupported account status." }, 400);
      const { error } = await admin.auth.admin.updateUserById(memberId, { ban_duration: status === "active" ? "none" : "876000h" });
      if (error) throw error;
      await admin.from("admin_team").update({ status, updated_at: new Date().toISOString() }).eq("id", memberId);
      return json({ success: true, status });
    }
    if (action === "reset_password") {
      const password = randomPassword();
      const { error } = await admin.auth.admin.updateUserById(memberId, { password, ban_duration: "none" });
      if (error) throw error;
      await admin.from("admin_team").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", memberId);
      const emailSent = await sendCredentials(admin, { recipient: member.email, name: member.name, username: member.username, password, subject: "Your Anovra Team Workspace login was reset" }).catch(() => false);
      return json({ success: true, credentials: { username: member.username, password }, email_sent: emailSent });
    }
    return json({ error: "Unsupported team management action." }, 400);
  } catch (error) {
    console.error("manage-platform-team failed", error);
    return json({ error: error instanceof Error ? error.message : "Team account action failed." }, 400);
  }
});
