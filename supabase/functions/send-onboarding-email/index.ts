import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logo = "https://res.cloudinary.com/dcoxo8snb/image/upload/v1784749813/IMG_6932_umtukr.png";
const adminEmail = "admin@anovra.africa";

const subjects: Record<string, string> = {
  vendor_signup_trial_started: "Your Anovra trial has started",
  trial_day_7: "Your Anovra trial: 7 days in",
  trial_day_12: "Your Anovra trial ends soon",
  trial_expired: "Your Anovra trial has ended",
  payment_success_receipt: "Anovra payment receipt",
  payment_failed_retry: "Payment could not be completed",
  product_submitted: "Product submitted for Anovra safety review",
  product_approved: "Product approved by Anovra",
  product_rejected: "Product needs changes before approval",
  review_submitted: "Your review was submitted",
  review_approved: "Your review is now live",
  review_rejected: "Your review could not be published",
  team_invite: "Invitation to join an Anovra team",
  team_invite_accepted: "Team invitation accepted",
  team_member_removed: "Team access removed",
  admin_cac_submitted: "Admin alert: CAC document submitted",
  admin_product_review: "Admin alert: product pending safety review",
  admin_payment_success: "Admin alert: new payment received",
  admin_payment_failed: "Admin alert: payment failed",
  admin_review_submitted: "Admin alert: storefront review submitted",
  admin_onboarding_request: "Admin alert: onboarding request submitted",
  customer_scan_completed: "Your skin scan report is ready",
  customer_review_request: "How was your Anovra product experience?",
};

function escapeHtml(value: unknown) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function htmlShell(title: string, body: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 12px; background: #fff;">
      <div style="text-align:center; margin-bottom:24px;">
        <img src="${logo}" alt="Anovra" style="height:64px; max-width:100%; object-fit:contain;" />
      </div>
      <h2 style="color:#008236; margin:0 0 16px; font-size:22px;">${escapeHtml(title)}</h2>
      <div style="color:#253026; font-size:14px; line-height:1.6;">${body}</div>
      <hr style="border:0; border-top:1px solid #eee; margin:24px 0;" />
      <p style="font-size:11px; color:#777;">This is an automated Anovra notification.</p>
    </div>
  `;
}

function bodyFor(template: string, payload: any) {
  const name = escapeHtml(payload.name || "there");
  const brand = escapeHtml(payload.brand || payload.business_name || "your brand");
  const product = escapeHtml(payload.product || payload.product_name || "your product");
  const role = escapeHtml(payload.role || "member");
  const inviter = escapeHtml(payload.inviter || "A brand owner");
  const link = escapeHtml(payload.link || "https://anovra.africa");

  if (template === "team_invite" || payload.action === "invite") {
    return htmlShell(subjects.team_invite, `<p>Hi,</p><p><strong>${inviter}</strong> invited you to join their Anovra team as <strong>${role}</strong>.</p><p><a href="${link}" style="background:#008236;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:700;">Accept invitation</a></p>`);
  }
  if (template.startsWith("admin_")) {
    return htmlShell(subjects[template] || "Admin alert", `<p>${escapeHtml(payload.message || "A new admin action needs attention.")}</p><pre style="white-space:pre-wrap;background:#f6f7f5;border:1px solid #e5e7eb;border-radius:8px;padding:12px;font-size:12px;">${escapeHtml(JSON.stringify(payload.metadata || {}, null, 2))}</pre>`);
  }
  if (template === "vendor_signup_trial_started") {
    return htmlShell(subjects[template], `<p>Hi ${name},</p><p>Your 14-day Anovra trial for <strong>${brand}</strong> has started. During trial, you can test storefront, scan, team, API preview, webhooks, analytics, and catalog workflows.</p>`);
  }
  if (template === "product_submitted") {
    return htmlShell(subjects[template], `<p>Hi ${name},</p><p><strong>${product}</strong> has been submitted for Anovra safety review. It will show publicly after approval by Anovra.</p>`);
  }
  if (template === "product_approved" || template === "product_rejected") {
    return htmlShell(subjects[template], `<p>Hi ${name},</p><p><strong>${product}</strong> was ${template === "product_approved" ? "approved" : "not approved yet"}. ${escapeHtml(payload.message || "")}</p>`);
  }
  if (template === "payment_success_receipt") {
    return htmlShell(subjects[template], `<p>Hi ${name},</p><p>Your payment for the <strong>${escapeHtml(payload.plan || "selected")}</strong> plan was successful.</p><p>Amount: <strong>${escapeHtml(payload.amount || "")}</strong></p>`);
  }
  if (template === "customer_scan_completed") {
    return htmlShell(subjects[template], `<p>Hi ${name},</p><p>Your skin scan report is ready. Sign in to your dashboard to review your result and product matches.</p>`);
  }
  if (template === "review_submitted") {
    return htmlShell(subjects[template], `<p>Hi ${name},</p><p>Thanks for reviewing <strong>${brand}</strong>. Your review will appear after Anovra review.</p>`);
  }
  if (template === "customer_review_request") {
    return htmlShell(subjects[template], `<p>Hi ${name},</p><p>If the product recommendation helped, please leave a storefront review so other customers can shop with more confidence.</p>`);
  }

  return htmlShell(subjects[template] || payload.subject || "Anovra notification", `<p>Hi ${name},</p><p>${escapeHtml(payload.message || "You have a new Anovra notification.")}</p>`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let recipient = "";
  let subject = "";
  let template = "";
  try {
    const payload = await req.json();
    template = payload.template || (payload.action === "invite" ? "team_invite" : "vendor_signup_trial_started");
    recipient = template.startsWith("admin_") ? adminEmail : payload.email;
    subject = payload.subject || subjects[template] || "Anovra notification";

    if (!recipient) throw new Error("Email is required.");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("Missing RESEND_API_KEY environment variable on Supabase.");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: template.startsWith("admin_") ? "Anovra Alerts <alerts@anovra.africa>" : "Anovra <hello@anovra.africa>",
        to: [recipient],
        subject,
        html: bodyFor(template, payload),
      }),
    });
    const data = await response.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && serviceKey) {
      const admin = createClient(supabaseUrl, serviceKey);
      await admin.from("email_delivery_logs").insert([{ recipient, subject, template, status: response.ok ? "sent" : "failed", provider_response: data, error_message: response.ok ? null : JSON.stringify(data) }]);
    }

    return new Response(JSON.stringify({ success: response.ok, data }), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && serviceKey && recipient) {
      const admin = createClient(supabaseUrl, serviceKey);
      await admin.from("email_delivery_logs").insert([{ recipient, subject: subject || "Anovra notification", template, status: "failed", error_message: error.message }]).catch(() => {});
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
