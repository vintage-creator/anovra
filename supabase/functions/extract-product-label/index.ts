import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const prompts: Record<string, string> = {
  ingredients: `Extract the full ingredients list from this skincare product label image. Return the result strictly as a raw JSON block containing two string arrays: "keyIngredients" and "activeIngredients". Split out any prominent active ingredients into the activeIngredients array. Clean up spacing and spelling. Output strict raw JSON only with this shape:
{
  "keyIngredients": ["Aqua", "Glycerin", "Panthenol"],
  "activeIngredients": ["Niacinamide 5%", "Salicylic Acid 2%"]
}`,
  description: `Write a professional 2-3 sentence product marketing description based on the text and branding on this skincare product label image. Return strict raw JSON only with this shape:
{
  "description": "Your extracted description here."
}`,
  benefits: `Extract or summarize the top 3-5 product benefits from the text on this skincare label image. Return strict raw JSON only with this shape:
{
  "benefits": "Benefit 1\\nBenefit 2\\nBenefit 3"
}`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageBase64, mimeType, type } = await req.json();
    const promptText = prompts[type];

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!promptText) {
      return new Response(JSON.stringify({ error: "Unsupported extraction type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not configured for extract-product-label");
    }

    const base64Data = imageBase64.replace(/^data:image\/[a-z0-9.+-]+;base64,/, "");
    const models = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.0-flash"];

    const requestBody = JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: base64Data,
                },
              },
            ],
          },
        ],
      });

    let response: Response | null = null;
    let lastError = "";
    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      });

      if (response.ok) break;
      lastError = await response.text();
      if (![429, 500, 502, 503, 504].includes(response.status)) break;
    }

    if (!response || !response.ok) {
      throw new Error(`Gemini API error: ${response?.status || "unknown"} - ${lastError}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No text returned from Gemini API");

    const cleaned = text.trim().replace(/^```json/, "").replace(/```$/, "").trim();
    return new Response(cleaned, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("extract-product-label failed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
