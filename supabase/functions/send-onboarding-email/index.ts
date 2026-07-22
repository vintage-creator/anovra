// Supabase Edge Function to send onboarding email via Resend API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email, action, inviter, role } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY environment variable on Supabase" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isInvite = action === "invite";
    const mailSubject = isInvite 
      ? `Invitation to join ${inviter || "brand"} team`
      : "Welcome - Let's Launch Your Skincare Business!";
      
    const mailHtml = isInvite 
      ? `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://res.cloudinary.com/dcoxo8snb/image/upload/v1784749813/IMG_6932_umtukr.png" alt="Logo" style="height: 64px; max-width: 100%; object-fit: contain;" />
          </div>
          <h2 style="color: #008236; font-weight: bold; text-align: center; margin-top: 0; font-family: sans-serif;">You've been invited!</h2>
          <p>Hi,</p>
          <p><strong>${inviter || "A colleague"}</strong> has invited you to join their vendor management team as a <strong>${role || "member"}</strong>.</p>
          <p>Click the button below to accept the invitation and sign up to your account dashboard:</p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="https://anovra.africa/signup" style="background-color: #008236; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invitation</a>
          </div>
          <br />
          <p>Best regards,</p>
          <p><strong>The Team</strong></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 11px; color: #888;">If you did not request this invitation, please ignore this email.</p>
        </div>
      `
      : `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://res.cloudinary.com/dcoxo8snb/image/upload/v1784749813/IMG_6932_umtukr.png" alt="Logo" style="height: 64px; max-width: 100%; object-fit: contain;" />
          </div>
          <h2 style="color: #008236; font-weight: bold; text-align: center; margin-top: 0; font-family: sans-serif;">Welcome, ${name || "Vendor"}!</h2>
          <p>We are absolutely thrilled to have you join our skincare intelligence ecosystem.</p>
          <p>With our platform, you can now:</p>
          <ul>
            <li>Provide advanced skin diagnostics to your clients.</li>
            <li>Build and custom-brand your digital storefront.</li>
            <li>Sync product catalog items with skin scan matches.</li>
          </ul>
          <p>Get started by logging into your vendor dashboard to add your first catalog product!</p>
          <br />
          <p>Best regards,</p>
          <p><strong>The Team</strong></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 11px; color: #888;">If you did not request this account, please ignore this email.</p>
        </div>
      `;

    // Call Resend API to deliver email
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: isInvite ? "Partnership Team <invite@anovra.africa>" : "Onboarding <welcome@anovra.africa>",
        to: [email],
        subject: mailSubject,
        html: mailHtml,
      }),
    });

    const data = await response.json();

    return new Response(JSON.stringify({ success: true, data }), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
