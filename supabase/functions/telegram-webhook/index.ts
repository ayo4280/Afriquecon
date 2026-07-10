import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");

    // Basic security check (you can set this when registering the webhook)
    if (secret !== Deno.env.get("TELEGRAM_WEBHOOK_SECRET") && secret !== "afriquecon2026") {
      return new Response("Unauthorized", { status: 401 });
    }

    const update = await req.json();

    // Only process messages
    if (update.message && update.message.text) {
      const message = update.message;
      const text = message.text;
      const chatId = message.chat.id;
      const username = message.chat.username;

      // When a user starts the bot
      if (text.startsWith("/start")) {
        // We need a username to link them. If they don't have one, we can't link via username on the site.
        if (username) {
          // Initialize Supabase Client (using Service Role to bypass RLS since this is a webhook)
          const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
          const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
          const supabase = createClient(supabaseUrl, supabaseServiceKey);

          // Upsert the username to chat_id mapping
          const { error } = await supabase
            .from("telegram_users")
            .upsert({ username: username, chat_id: chatId }, { onConflict: "username" });

          if (error) {
            console.error("Error upserting mapping:", error);
          } else {
            // Reply back to user
            const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                chat_id: chatId,
                text: "✅ Successfully linked! You will now receive booking updates from Afrique-con directly here.",
              }),
            });
          }
        } else {
            // Tell user they need a username
            const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                chat_id: chatId,
                text: "⚠️ We noticed you don't have a Telegram Username set. To receive booking updates on the website, please set a username in your Telegram Profile Settings, then type /start here again.",
              }),
            });
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
