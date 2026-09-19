import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { appLink, button, detailsCard, emailShell, escapeHtml } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const actions = new Set(["suspend", "ban", "reactivate", "unban"]);
const reasonCodes = new Set([
  "compliance_review", "fraudulent_documents", "unsafe_products", "repeated_violations",
  "fraud_or_payment_abuse", "account_security", "customer_safety_complaints", "terms_breach",
  "regulatory_request", "issue_resolved", "appeal_approved", "compliance_cleared", "other",
]);

const labelForReason: Record<string, string> = {
  compliance_review: "Compliance review",
  fraudulent_documents: "Fraudulent or unverifiable documents",
  unsafe_products: "Unsafe or prohibited products",
  repeated_violations: "Repeated policy violations",
  fraud_or_payment_abuse: "Fraud or payment abuse",
  account_security: "Account security concern",
  customer_safety_complaints: "Customer safety complaints",
  terms_breach: "Terms of service breach",
  regulatory_request: "Regulatory request",
  issue_resolved: "Issue resolved",
  appeal_approved: "Appeal approved",
  compliance_cleared: "Compliance review cleared",
  other: "Other",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function sendModerationEmail(admin: any, profile: any, action: string, reasonCode: string, details: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey || !profile.email) return false;
  const restored = action === "reactivate" || action === "unban";
  const subject = restored ? "Your Anovra account access has been restored" : `Your Anovra account has been ${action === "ban" ? "banned" : "suspended"}`;
  const statusText = restored ? "restored" : action === "ban" ? "banned" : "temporarily suspended";
  const dashboardUrl = appLink(profile.account_type === "brand" ? "/#/branddashboard" : "/#/dashboard");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: "Anovra <hello@anovra.africa>",
      to: [profile.email],
      subject,
      html: emailShell({
        eyebrow: "Trust & Safety",
        title: `Account access ${statusText}`,
        preview: subject,
        body: `
          <p style="margin:0 0 14px;">Hi ${escapeHtml(profile.name || profile.business_name || "there")},</p>
          <p style="margin:0 0 14px;">Your Anovra account access has been <strong>${escapeHtml(statusText)}</strong>.</p>
          ${detailsCard("Decision details", [
            { label: "Reason", value: labelForReason[reasonCode] || reasonCode },
            { label: "Details", value: details },
          ])}
          ${restored ? `${button("Open your workspace", dashboardUrl)}<p style="margin:14px 0 0;color:#667085;font-size:13px;">You can now sign in and continue using your workspace.</p>` : `<p style="margin:14px 0 0;color:#667085;font-size:13px;">Your data has been preserved. Reply to this email if you believe this decision should be reviewed.</p>`}
        `,
        footerNote: "Anovra Trust & Safety",
      }),
    }),
  });
  const providerResponse = await response.json().catch(() => ({}));
  await admin.from("email_delivery_logs").insert([{
    recipient: profile.email,
    subject,
    template: `account_${action}`,
    status: response.ok ? "sent" : "failed",
    provider_response: providerResponse,
    error_message: response.ok ? null : JSON.stringify(providerResponse),
  }]);
  return response.ok;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey) throw new Error("Supabase configuration is unavailable.");

    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Authentication required." }, 401);
    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user: caller }, error: callerError } = await authClient.auth.getUser();
    if (callerError || !caller) return json({ error: "Your session is invalid or has expired." }, 401);

    const callerEmail = caller.email?.toLowerCase() || "";
    const isAdmin = caller.app_metadata?.role === "admin" || ["admin@anovra.africa", "hello@anovra.africa"].includes(callerEmail);
    if (!isAdmin) return json({ error: "Only a Platform Super Admin can moderate accounts." }, 403);

    const body = await req.json();
    const accountId = String(body.account_id || "").trim();
    const action = String(body.action || "").trim();
    const reasonCode = String(body.reason_code || "").trim();
    const reasonDetails = String(body.reason_details || "").trim();
    const internalNotes = String(body.internal_notes || "").trim();
    if (!accountId) return json({ error: "An account is required." }, 400);
    if (!actions.has(action)) return json({ error: "Unsupported moderation action." }, 400);
    if (!reasonCodes.has(reasonCode)) return json({ error: "Choose a valid reason." }, 400);
    if (reasonDetails.length < 10 || reasonDetails.length > 1000) return json({ error: "Provide a clear reason between 10 and 1,000 characters." }, 400);
    if (internalNotes.length > 2000) return json({ error: "Internal notes cannot exceed 2,000 characters." }, 400);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: profile, error: profileError } = await admin.from("profiles").select("*").eq("id", accountId).single();
    if (profileError || !profile) return json({ error: "Account not found." }, 404);
    if (!["vendor", "brand", "branch"].includes(profile.account_type || "vendor")) return json({ error: "This account type cannot be moderated here." }, 400);

    const previousStatus = profile.verification_status || (profile.is_verified ? "approved" : "pending");
    if ((action === "reactivate" && previousStatus !== "suspended") || (action === "unban" && previousStatus !== "banned")) {
      return json({ error: `This account cannot be ${action === "unban" ? "unbanned" : "reactivated"} from its current status.` }, 409);
    }
    if ((action === "suspend" && previousStatus === "suspended") || (action === "ban" && previousStatus === "banned")) {
      return json({ error: `This account is already ${previousStatus}.` }, 409);
    }

    const restored = action === "reactivate" || action === "unban";
    const newStatus = restored ? "approved" : action === "ban" ? "banned" : "suspended";
    const now = new Date().toISOString();
    const { error: updateError } = await admin.from("profiles").update({
      verification_status: newStatus,
      is_verified: restored,
      branch_status: profile.account_type === "branch" ? (restored ? "active" : "suspended") : profile.branch_status,
      moderated_at: now,
      moderated_by: caller.id,
    }).eq("id", accountId);
    if (updateError) throw updateError;

    if (profile.account_type === "branch") {
      await admin.from("brand_branches").update({ status: restored ? "active" : "suspended", updated_at: now }).eq("branch_id", accountId);
    }
    if (!restored) await admin.from("vendor_api_keys").update({ status: "revoked" }).eq("vendor_id", accountId).eq("status", "active");

    const { error: authError } = await admin.auth.admin.updateUserById(accountId, { ban_duration: restored ? "none" : "876000h" });
    if (authError) {
      await admin.from("profiles").update({
        verification_status: previousStatus,
        is_verified: Boolean(profile.is_verified),
        branch_status: profile.branch_status,
        moderated_at: profile.moderated_at,
        moderated_by: profile.moderated_by,
      }).eq("id", accountId);
      throw authError;
    }

    const event = {
      account_id: accountId,
      account_name: profile.business_name || profile.name || "Partner account",
      account_email: profile.email || null,
      account_type: profile.account_type || "vendor",
      action,
      previous_status: previousStatus,
      new_status: newStatus,
      reason_code: reasonCode,
      reason_details: reasonDetails,
      internal_notes: internalNotes || null,
      actor_id: caller.id,
      actor_email: caller.email || null,
    };
    const { error: eventError } = await admin.from("account_moderation_events").insert([event]);
    if (eventError) throw eventError;

    const emailSent = await sendModerationEmail(admin, profile, action, reasonCode, reasonDetails).catch(() => false);
    return json({ success: true, status: newStatus, event, email_sent: emailSent });
  } catch (error) {
    console.error("manage-account-moderation failed", error);
    return json({ error: error instanceof Error ? error.message : "Account moderation failed." }, 400);
  }
});
