import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const allowedOrigins = new Set([
  "https://afriquecon.vercel.app",
  "https://afrique-con.com",
  "https://www.afrique-con.com",
  "http://localhost:5173",
  "http://localhost:4173",
]);

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

function headersFor(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://afriquecon.vercel.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json",
  };
}

function json(req: Request, body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: headersFor(req) });
}

async function hashClientKey(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || req.headers.get("x-real-ip") || "anonymous";
  const bytes = new TextEncoder().encode(ip);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function callGemini(apiKey: string, prompt: string) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!response.ok) throw new Error("Gemini request failed");
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callOpenRouter(apiKey: string, prompt: string) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://afriquecon.vercel.app",
      "X-Title": "Afrique-con PLC",
    },
    body: JSON.stringify({ model: "openrouter/auto", messages: [{ role: "user", content: prompt }] }),
  });
  if (!response.ok) throw new Error("OpenRouter request failed");
  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "";
}

serve(async (req) => {
  const headers = headersFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  const origin = req.headers.get("origin");
  if (origin && !allowedOrigins.has(origin)) return json(req, { error: "Origin not allowed" }, 403);

  try {
    const payload = await req.json();
    const prompt = typeof payload?.prompt === "string" ? payload.prompt.trim() : "";
    if (!prompt) return json(req, { error: "Missing prompt" }, 400);
    if (prompt.length > 1200) return json(req, { error: "Prompt is too long" }, 413);

    const key = `ai:${await hashClientKey(req)}`;
    const { data: allowed, error: rateError } = await supabase.rpc("consume_ai_rate_limit", {
      p_key: key,
      p_limit: 10,
      p_window_seconds: 600,
    });
    if (rateError) {
      console.error("AI rate-limit check failed", rateError);
      return json(req, { error: "AI service temporarily unavailable" }, 503);
    }
    if (!allowed) return new Response(JSON.stringify({ error: "Too many AI requests. Please try again later." }), {
      status: 429,
      headers: { ...headers, "Retry-After": "600" },
    });

    const keys = [Deno.env.get("GEMINI_3_5_FLASH_KEY"), Deno.env.get("GEMINI_3_FLASH_KEY")].filter(Boolean) as string[];
    for (const key of keys) {
      try {
        const text = await callGemini(key, prompt);
        if (text) return json(req, { text, provider: "Gemini" }, 200);
      } catch (error) { console.warn("Gemini provider failed", error); }
    }

    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
    if (openRouterKey) {
      const text = await callOpenRouter(openRouterKey, prompt);
      return json(req, { text, provider: "OpenRouter" }, 200);
    }
    return json(req, { error: "AI providers are not configured" }, 503);
  } catch (error) {
    console.error("AI request failed", error);
    return json(req, { error: "Unable to generate a response" }, 502);
  }
});
