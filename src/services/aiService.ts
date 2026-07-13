// src/services/aiService.ts

import { supabase } from '../lib/supabase';

interface AIResponse {
  text: string;
  provider: string;
}

export class AIService {
  /**
   * Main function to generate text with automatic fallback logic.
   * Securely calls the Supabase Edge Function 'generate-ai-text'.
   */
  public async generateText(prompt: string): Promise<AIResponse> {
    try {
      console.log("[AIService] Invoking secure Edge Function...");
      
      const { data, error } = await supabase.functions.invoke('generate-ai-text', {
        body: { prompt }
      });

      if (error) {
        throw new Error(`Edge Function Error: ${error.message}`);
      }

      if (!data || !data.text) {
        throw new Error("Invalid response from Edge Function");
      }

      return { text: data.text, provider: data.provider };
      
    } catch (error: any) {
      console.error("[AIService] Failed to invoke AI:", error.message);
      throw new Error("All AI providers failed to respond or secure connection failed. Please try again later.");
    }
  }
}

export const aiService = new AIService();
