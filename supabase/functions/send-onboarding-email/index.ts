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
    const { name, email } = await req.json();

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

    // Call Resend API to deliver onboarding email
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Anovra Onboarding <welcome@anovra.africa>",
        to: [email],
        subject: "Welcome to Anovra - Let's Launch Your Skincare Business!",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 8px;">
            <h2 style="color: #008236; font-weight: bold;">Welcome to Anovra, ${name || "Vendor"}!</h2>
            <p>We are absolutely thrilled to have you join our skincare intelligence ecosystem.</p>
            <p>With Anovra, you can now:</p>
            <ul>
              <li>Provide advanced skin diagnostics to your clients.</li>
              <li>Build and custom-brand your digital storefront.</li>
              <li>Sync product catalog items with skin scan matches.</li>
            </ul>
            <p>Get started by logging into your vendor dashboard to add your first catalog product!</p>
            <br />
            <p>Best regards,</p>
            <p><strong>The Anovra Team</strong></p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 11px; color: #888;">If you did not request this account, please ignore this email.</p>
          </div>
        `,
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
