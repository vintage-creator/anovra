import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { appLink, button, detailsCard, emailShell, escapeHtml, linkBox } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

function bodyFor(template: string, payload: any) {
  const name = escapeHtml(payload.name || "there");
  const brand = escapeHtml(payload.brand || payload.business_name || "your brand");
  const product = escapeHtml(payload.product || payload.product_name || "your product");
  const role = escapeHtml(payload.role || "member");
  const inviter = escapeHtml(payload.inviter || "A brand owner");
  const link = appLink(payload.link || "/");

  if (template === "team_invite" || payload.action === "invite") {
    return emailShell({
      eyebrow: "Team invitation",
      title: subjects.team_invite,
      preview: "You have been invited to join an Anovra workspace.",
      body: `<p style="margin:0 0 14px;">Hi,</p><p style="margin:0 0 14px;"><strong>${inviter}</strong> invited you to join their Anovra team as <strong>${role}</strong>.</p>${button("Accept invitation", link)}${linkBox("Invitation link", link)}`,
    });
  }
  if (template.startsWith("admin_")) {
    const metadata = payload.metadata || {};
    const rows = Object.entries(metadata).slice(0, 12).map(([key, value]) => ({
      label: key.replace(/_/g, " "),
      value: typeof value === "string" ? value : JSON.stringify(value),
    }));
    return emailShell({
      eyebrow: "Admin alert",
      title: subjects[template] || "Admin alert",
      preview: payload.message || "A new admin action needs attention.",
      body: `<p style="margin:0 0 14px;">${escapeHtml(payload.message || "A new admin action needs attention.")}</p>${rows.length ? detailsCard("Submitted details", rows) : ""}${button("Open Admin Dashboard", appLink("/#/admin"), "dark")}`,
      footerNote: "This alert was sent to the Anovra administration inbox.",
    });
  }
  if (template === "vendor_signup_trial_started") {
    return emailShell({
      eyebrow: "Trial started",
      title: subjects[template],
      preview: "Your 7-day Anovra trial is active.",
      body: `<p style="margin:0 0 14px;">Hi ${name},</p><p style="margin:0 0 14px;">Your 7-day Anovra trial for <strong>${brand}</strong> has started. During trial, you can test your storefront, scan link, catalogue, API preview, webhooks, and analytics workflows.</p>${button("Open your workspace", appLink("/#/vendorlogin"))}`,
    });
  }
  if (template === "product_submitted") {
    return emailShell({ eyebrow: "Product review", title: subjects[template], body: `<p style="margin:0 0 14px;">Hi ${name},</p><p style="margin:0;"><strong>${product}</strong> has been submitted for Anovra safety review. It will show publicly after approval by Anovra.</p>` });
  }
  if (template === "product_approved" || template === "product_rejected") {
    return emailShell({ eyebrow: "Product review", title: subjects[template], body: `<p style="margin:0 0 14px;">Hi ${name},</p><p style="margin:0;"><strong>${product}</strong> was ${template === "product_approved" ? "approved" : "not approved yet"}. ${escapeHtml(payload.message || "")}</p>${button("Open catalogue", appLink("/#/catalog"))}` });
  }
  if (template === "payment_success_receipt") {
    return emailShell({ eyebrow: "Payment", title: subjects[template], body: `<p style="margin:0 0 14px;">Hi ${name},</p><p style="margin:0 0 14px;">Your payment for the <strong>${escapeHtml(payload.plan || "selected")}</strong> plan was successful.</p>${detailsCard("Receipt summary", [{ label: "Amount", value: String(payload.amount || "Not provided") }, { label: "Plan", value: String(payload.plan || "Selected plan") }])}` });
  }
  if (template === "customer_scan_completed") {
    const reportLink = appLink(payload.link || "/#/userdashboard");
    return emailShell({ eyebrow: "Skin analysis", title: subjects[template], preview: "Your skin scan report is ready.", body: `<p style="margin:0 0 14px;">Hi ${name},</p><p style="margin:0 0 14px;">Your skin scan report is ready. Sign in to your dashboard to review your result, product matches, ingredients, and routine.</p>${button("View my report", reportLink)}${linkBox("Report link", reportLink)}` });
  }
  if (template === "review_submitted") {
    return emailShell({ eyebrow: "Storefront review", title: subjects[template], body: `<p style="margin:0 0 14px;">Hi ${name},</p><p style="margin:0;">Thanks for reviewing <strong>${brand}</strong>. Your review will appear after Anovra review.</p>` });
  }
  if (template === "customer_review_request") {
    return emailShell({ eyebrow: "Review request", title: subjects[template], body: `<p style="margin:0 0 14px;">Hi ${name},</p><p style="margin:0 0 14px;">If the product recommendation helped, please leave a storefront review so other customers can shop with more confidence.</p>${button("Leave a review", link)}` });
  }

  return emailShell({
    title: subjects[template] || payload.subject || "Anovra notification",
    body: `<p style="margin:0 0 14px;">Hi ${name},</p><p style="margin:0;">${escapeHtml(payload.message || "You have a new Anovra notification.")}</p>`,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  let recipient = "";
  let subject = "";
  let template = "";
  try {
    const payload = await req.json();
    const action = payload.action;

    // Handle team member registration directly via Admin API to avoid fragile SQL triggers
    if (action === "create_team_member") {
      return new Response(JSON.stringify({ error: "Team accounts must be created through the secure manage-platform-team function." }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    if (supabaseUrl && serviceKey) {
      const admin = createClient(supabaseUrl, serviceKey);
      await admin.from("email_delivery_logs").insert([{ recipient, subject, template, status: response.ok ? "sent" : "failed", provider_response: data, error_message: response.ok ? null : JSON.stringify(data) }]);
    }

    return new Response(JSON.stringify({ success: response.ok, data }), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
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
