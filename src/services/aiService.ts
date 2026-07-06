// src/services/aiService.ts

// NOTE: For production, you should move this logic to a backend server (e.g. Supabase Edge Functions).
// Exposing API keys in a frontend React app is a security risk because anyone can see them.
// To use these in Vite, they must be prefixed with VITE_ in your .env file.

interface AIResponse {
  text: string;
  provider: string;
}

export class AIService {
  // We expect these to be available as VITE_ prefixed environment variables.
  private keys = {
    geminiPrimary: import.meta.env.VITE_GEMINI_3_5_FLASH_KEY,
    geminiSecondary: import.meta.env.VITE_GEMINI_3_FLASH_KEY,
    openRouter: import.meta.env.VITE_OPENROUTER_API_KEY,
  };

  /**
   * Calls the Google Gemini API directly using a specific key.
   */
  private async callGeminiAPI(prompt: string, apiKey: string): Promise<string> {
    if (!apiKey) throw new Error("Gemini API key is missing");

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errData)}`);
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  /**
   * Calls the OpenRouter API as a fallback.
   * OpenRouter uses a unified chat completions format.
   */
  private async callOpenRouter(prompt: string): Promise<string> {
    if (!this.keys.openRouter) throw new Error("OpenRouter API key is missing");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.keys.openRouter}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin, // Required by OpenRouter
        "X-Title": "Afrique-con PLC", // Required by OpenRouter
      },
      body: JSON.stringify({
        // Using a fast, cheap model as a fallback (Llama 3 or similar)
        model: "meta-llama/llama-3-8b-instruct:free",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errData)}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "";
  }

  /**
   * Main function to generate text with automatic fallback logic.
   * Tries Primary Gemini -> Secondary Gemini -> OpenRouter.
   */
  public async generateText(prompt: string): Promise<AIResponse> {
    // 1. Try Primary Gemini Key
    try {
      console.log("[AIService] Attempting Primary Gemini Key...");
      const text = await this.callGeminiAPI(prompt, this.keys.geminiPrimary);
      return { text, provider: "Gemini (Primary Key)" };
    } catch (error: any) {
      console.warn("[AIService] Primary Gemini Key failed:", error.message);
    }

    // 2. Try Secondary Gemini Key (Fallback 1)
    try {
      console.log("[AIService] Attempting Secondary Gemini Key (Fallback 1)...");
      const text = await this.callGeminiAPI(prompt, this.keys.geminiSecondary);
      return { text, provider: "Gemini (Secondary Key)" };
    } catch (error: any) {
      console.warn("[AIService] Secondary Gemini Key failed:", error.message);
    }

    // 3. Try OpenRouter (Fallback 2)
    try {
      console.log("[AIService] Attempting OpenRouter (Fallback 2)...");
      const text = await this.callOpenRouter(prompt);
      return { text, provider: "OpenRouter" };
    } catch (error: any) {
      console.error("[AIService] All providers failed. Last error:", error.message);
      throw new Error("All AI providers failed to respond. Please try again later.");
    }
  }
}

export const aiService = new AIService();
