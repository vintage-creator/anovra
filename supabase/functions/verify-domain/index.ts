import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeDomain(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

function getRecordHost(domain: string) {
  const parts = domain.split(".");
  return parts.length <= 2 ? "@" : parts.slice(0, -2).join(".");
}

function getRecommendedDomain(domain: string) {
  const parts = domain.split(".");
  if (parts.length <= 2) return `skin.${domain}`;
  return domain;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { domain } = await req.json();
    const normalized = normalizeDomain(String(domain || ""));
    if (!/^(?!-)([a-z0-9-]{1,63}\.)+[a-z]{2,}$/i.test(normalized)) {
      return json({ status: "invalid", domain: normalized, message: "Enter a valid domain such as skin.yourbrand.com." }, 400);
    }

    const [cnameRes, aRes] = await Promise.all([
      fetch(`https://dns.google/resolve?name=${encodeURIComponent(normalized)}&type=CNAME`).then((r) => r.json()).catch(() => null),
      fetch(`https://dns.google/resolve?name=${encodeURIComponent(normalized)}&type=A`).then((r) => r.json()).catch(() => null),
    ]);

    const cnameAnswers = Array.isArray(cnameRes?.Answer) ? cnameRes.Answer : [];
    const aAnswers = Array.isArray(aRes?.Answer) ? aRes.Answer : [];
    const cnameTarget = cnameAnswers.find((answer: any) => String(answer.data || "").replace(/\.$/, "").toLowerCase().includes("anovra.africa"));
    const aTarget = aAnswers.find((answer: any) => String(answer.data || "") === "198.54.115.240");

    if (cnameTarget || aTarget) {
      return json({
        status: "verified",
        domain: normalized,
        record: cnameTarget ? "CNAME" : "A",
        target: cnameTarget?.data || aTarget?.data,
        message: "Domain DNS is pointing to Anovra.",
      });
    }

    return json({
      status: "pending",
      domain: normalized,
      message: "Domain format is valid, but DNS is not pointing to Anovra yet.",
      expected: {
        cname: { type: "CNAME", host: getRecordHost(normalized), value: "anovra.africa" },
        a: { type: "A", host: getRecordHost(normalized), value: "198.54.115.240" },
        recommended_domain: getRecommendedDomain(normalized),
      },
    });
  } catch (error: any) {
    return json({ status: "error", message: error.message || "Could not verify domain." }, 400);
  }
});
