import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()

    if (!prompt) {
      throw new Error("Missing prompt")
    }

    const primaryKey = Deno.env.get('GEMINI_3_5_FLASH_KEY')
    const secondaryKey = Deno.env.get('GEMINI_3_FLASH_KEY')
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')

    let text = "";
    let provider = "";

    // Helper for Gemini
    const callGemini = async (apiKey: string) => {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.status}`);
      }
      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    };

    // Helper for OpenRouter
    const callOpenRouter = async (apiKey: string) => {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://afrique-con.com",
          "X-Title": "Afrique-con PLC",
        },
        body: JSON.stringify({
          model: "openrouter/auto",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API Error: ${response.status}`);
      }
      const data = await response.json();
      return data?.choices?.[0]?.message?.content || "";
    };

    let primaryGeminiError = "";
    let secondaryGeminiError = "";
    let openRouterError = "";

    // Try Primary Gemini
    try {
      if (!primaryKey) throw new Error("Missing primary key");
      text = await callGemini(primaryKey);
      provider = "Gemini (Primary Key)";
    } catch (err: any) {
      primaryGeminiError = err.message;
      // Try Secondary Gemini
      try {
         if (!secondaryKey) throw new Error("Missing secondary key");
         text = await callGemini(secondaryKey);
         provider = "Gemini (Secondary Key)";
      } catch (err2: any) {
         secondaryGeminiError = err2.message;
         // Try OpenRouter
         try {
           if (!openRouterKey) throw new Error("Missing OpenRouter key");
           text = await callOpenRouter(openRouterKey);
           provider = "OpenRouter (Fallback)";
         } catch (err3: any) {
           openRouterError = err3.message;
           throw new Error(`All providers failed. Primary: ${primaryGeminiError}, Secondary: ${secondaryGeminiError}, OpenRouter: ${openRouterError}`);
         }
      }
    }

    return new Response(
      JSON.stringify({ text, provider }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
