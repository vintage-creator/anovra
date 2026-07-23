import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const areaGuidance: Record<string, string> = {
  face: [
    "Evaluate facial acne, clogged pores, comedones, oil distribution, T-zone shine, cheek dryness, redness, dark spots, post-inflammatory hyperpigmentation, melasma-like patches, fine lines, pore visibility, texture, and tone evenness.",
    "Pay close attention to forehead, cheeks, nose, chin, jawline, and under-eye areas if visible.",
    "Recommend benefits suitable for facial products such as cleanser, serum, moisturizer, sunscreen, spot treatment, or barrier repair."
  ].join(" "),
  neck: [
    "Evaluate neck and decolletage tone unevenness, dark folds, irritation, friction marks, dryness, crepey texture, fine lines, redness, and possible product sensitivity.",
    "Do not over-index on facial acne unless it is clearly visible on the neck area.",
    "Recommend benefits suitable for gentle exfoliation, hydration, tone evening, barrier support, and sunscreen use on the neck."
  ].join(" "),
  back: [
    "Evaluate back acne, folliculitis-like bumps, clogged pores, oiliness, post-acne marks, hyperpigmentation, rough texture, dryness, and irritation from sweat or friction.",
    "Pay attention to upper back, shoulders, and lower back if visible.",
    "Recommend benefits suitable for body wash, non-comedogenic moisturizer, exfoliating body treatment, and dark-mark care."
  ].join(" "),
  hands: [
    "Evaluate knuckle darkening, dryness, roughness, cracking, ashiness, irritation, sun spots, uneven tone, and hand barrier condition.",
    "Pay attention to knuckles, wrists, backs of hands, palms, and cuticle-adjacent skin if visible.",
    "Recommend benefits suitable for hand cream, barrier repair, gentle exfoliation, sunscreen, and tone-evening care."
  ].join(" "),
  legs: [
    "Evaluate leg dryness, strawberry-leg appearance, visible bumps, ingrown-hair marks, hyperpigmentation, rough texture, keratosis-pilaris-like texture, ashiness, and irritation from shaving or friction.",
    "Pay attention to thighs, shins, calves, knees, and ankles if visible.",
    "Recommend benefits suitable for body lotion, exfoliating body treatment, soothing care, and tone-evening products."
  ].join(" "),
  "whole body": [
    "Evaluate the visible body areas holistically. Compare face, neck, torso, arms, legs, and hands if visible for widespread dryness, uneven tone, inflammation, acne, hyperpigmentation, sun damage, and texture variation.",
    "Identify the dominant body-wide concern, but mention if the concern appears localized to one area.",
    "Recommend benefits suitable for a full routine, including cleanser or wash, treatment, moisturizer, and sunscreen where relevant."
  ].join(" "),
  "other area": [
    "Evaluate only the visible skin region in the image. Focus on dryness, redness, irritation, bumps, texture, uneven tone, pigmentation, blemishes, and visible barrier stress.",
    "If the body region is unclear, avoid pretending to know the exact anatomy. Describe the visible concern conservatively.",
    "Recommend general skincare benefits that are safe for localized skin care and barrier support."
  ].join(" ")
};

function normalizeSkinArea(value?: string) {
  const normalized = (value || "Face").trim().toLowerCase();
  return areaGuidance[normalized] ? normalized : "face";
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageBase64, imageUrl, mimeType, skinArea } = await req.json();
    const normalizedArea = normalizeSkinArea(skinArea);
    const displayArea = normalizedArea
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    if (!imageBase64 && !imageUrl) {
      return new Response(JSON.stringify({ error: "Image base64 data or imageUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let base64Data = "";
    let detectedMimeType = mimeType || "image/jpeg";
    if (imageUrl) {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error("Failed to fetch image from storage URL");
      detectedMimeType = imgRes.headers.get("content-type") || detectedMimeType;
      const arrayBuffer = await imgRes.arrayBuffer();
      // Convert ArrayBuffer to base64 in Deno
      const uint8 = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      base64Data = btoa(binary);
    } else if (imageBase64) {
      base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not configured for analyse-skin");
    }
    const models = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.0-flash"];

    const promptText = `You are Anovra's skincare analysis engine for African skin tones, including Fitzpatrick IV-VI. Analyze this skin photo for the selected area: ${displayArea}.

Area-specific analysis rules:
${areaGuidance[normalizedArea]}

General analysis rules:
- Analyze only visible skin. Do not claim certainty about non-visible areas.
- Identify visible skincare concerns such as acne, hyperpigmentation, dryness, uneven texture, blemishes, redness, oiliness, pore visibility, dark marks, fine lines, or barrier stress when present.
- If the image is too blurry, too dark, not skin, or not suitable for analysis, return a conservative result that says the image quality is insufficient.
- Do not diagnose medical disease. Use skincare assessment language, not medical certainty.
- Provide a primary concern title, a concise skin type/result summary, an overall skin health score from 0 to 100, and three practical product-matching benefits.
- Provide a severity array for common visible concerns. Each severity item must include label, level, and score. Use score 0-100 where 0 means not visible and 100 means highly visible. Use levels "Low", "Mild", "Moderate", or "Elevated".
- Output strict JSON only. No Markdown, no code fences, no surrounding explanation.

Return exactly this JSON shape:
{
  "concern": "Acne & Hyperpigmentation",
  "result": "Oily/Combination Skin (Barrier Level: 79%)",
  "score": 78,
  "severity": [
    { "label": "Hyperpigmentation", "level": "Moderate", "score": 62 },
    { "label": "Acne / Blemishes", "level": "Mild", "score": 38 },
    { "label": "T-Zone Oiliness", "level": "Elevated", "score": 70 },
    { "label": "Fine Lines", "level": "Low", "score": 22 },
    { "label": "Skin Hydration", "level": "Low", "score": 20 },
    { "label": "Pore Visibility", "level": "Mild", "score": 45 },
    { "label": "Redness", "level": "Low", "score": 18 },
    { "label": "Barrier Health", "level": "Low", "score": 15 },
    { "label": "Visible Texture", "level": "Mild", "score": 34 },
    { "label": "Skin Tone Evenness", "level": "Moderate", "score": 55 },
    { "label": "Dryness", "level": "Mild", "score": 28 },
    { "label": "Inflammation Signs", "level": "Low", "score": 12 }
  ],
  "benefits": [
    "Fades dark spots and post-acne marks in 4-6 weeks",
    "Unclogs pores and regulates excess oil production",
    "Strengthens the skin barrier against West African UV index"
  ]
}`;

    const geminiPayload = {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: detectedMimeType,
                data: base64Data
              }
            }
          ]
        }
      ]
    };

    let response: Response | null = null;
    let lastError = "";
    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(geminiPayload)
      });

      if (response.ok) break;
      lastError = await response.text();
      if (![429, 500, 502, 503, 504].includes(response.status)) break;
    }

    if (!response || !response.ok) {
      throw new Error(`Gemini API error: ${response?.status || "unknown"} - ${lastError}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!candidateText) {
      throw new Error("Empty candidate response from Gemini API");
    }

    // Clean any markdown formatting if returned (sometimes models return ```json ... ```)
    const cleanedText = candidateText.trim().replace(/^```json/, "").replace(/```$/, "").trim();
    const resultObj = JSON.parse(cleanedText);

    return new Response(JSON.stringify(resultObj), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("analyse-skin failed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
