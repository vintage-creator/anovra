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
    const { contents } = await req.json();

    if (!contents || !Array.isArray(contents)) {
      return new Response(JSON.stringify({ error: "Chat contents array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitisedContents = contents
      .filter((item: any) => item?.role === "user" || item?.role === "model")
      .map((item: any) => ({
        role: item.role,
        parts: Array.isArray(item.parts) ? item.parts.filter((part: any) => typeof part?.text === "string" && part.text.trim()) : [],
      }))
      .filter((item: any) => item.parts.length > 0);

    while (sanitisedContents[0]?.role === "model") {
      sanitisedContents.shift();
    }

    if (sanitisedContents.length === 0) {
      return new Response(JSON.stringify({ error: "At least one user message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not configured for chat-advisor");
    }
    const models = [
      Deno.env.get("GEMINI_CHAT_MODEL") || "gemini-3-flash-preview",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
    ].filter((model, index, arr) => model && arr.indexOf(model) === index);

    const requestBody = JSON.stringify({
      contents: sanitisedContents,
      systemInstruction: {
        parts: [{
          text: "You are Anovra Care Guide, a skincare support assistant inside the Anovra customer dashboard. You do not perform the skin test or analyse images. The Anovra skin test engine does that before the user reaches you. Use the supplied dashboard context when available: latest skin test report area, skin type, score, concerns, severity notes, product matches, and routine steps. Help users understand their analysis report, define skin terms, explain cosmetic ingredients, compare recommended products, identify cautious next steps, and build simple AM/PM routines. Only answer questions about skin care, cosmetic ingredient safety, product matching, Anovra skin test reports, and Anovra routines. If the user asks unrelated questions such as sport, politics, celebrities, general trivia, finance, homework, or entertainment, politely say you can only help with Anovra skin and skincare questions, then suggest a relevant skincare question. Do not claim to be human or certified. Do not diagnose diseases, prescribe medication, or replace a dermatologist. For painful, rapidly spreading, infected, severe, or persistent symptoms, recommend consulting a qualified dermatologist or clinician. Keep replies concise, practical, warm, and formatted with short bullets where useful."
        }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000
      }
    });

    let response: Response | null = null;
    let lastError = "";
    let selectedModel = "";
    for (const model of models) {
      selectedModel = model;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      });

      if (response.ok) break;
      lastError = await response.text();
      console.warn(`chat-advisor Gemini model ${model} failed with ${response.status}: ${lastError}`);
      if (![429, 500, 502, 503, 504].includes(response.status)) break;
    }

    if (!response || !response.ok) {
      console.error(`chat-advisor Gemini fallback exhausted on ${selectedModel}: ${lastError}`);
      return new Response(JSON.stringify({
        reply: "Anovra Care Guide is temporarily busy. Please try again in a moment, or ask a simpler skincare question while the service catches up.",
        degraded: true,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that response. Please try again.";

    return new Response(JSON.stringify({ reply, model: selectedModel }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("chat-advisor failed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
