import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
const webhookSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
const appUrl = (Deno.env.get("APP_URL") ?? "https://afriquecon.vercel.app").replace(/\/$/, "");
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function sendMessage(chatId: number, text: string) {
  if (!botToken) throw new Error("Telegram bot is not configured");

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });

  if (!response.ok) throw new Error(`Telegram API returned ${response.status}`);
}

function helpMessage() {
  return `*Afrique-con Support*

/track [booking ID] - track a shipment
/quote - open the cargo calculator
/ticket - book passenger travel
/contact - speak to support
/help - show this menu`;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Telegram supplies this header only when secret_token was set with setWebhook.
  if (!webhookSecret || req.headers.get("x-telegram-bot-api-secret-token") !== webhookSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const update = await req.json();
    const message = update?.message;
    if (!message?.text) return Response.json({ ok: true });

    const chatId = message.chat?.id as number;
    const username = message.from?.username as string | undefined;
    const text = String(message.text).trim();
    if (!chatId) return Response.json({ ok: true });

    if (text.startsWith("/start")) {
      if (username) {
        const { error } = await supabase
          .from("telegram_users")
          .upsert({ username: username.replace(/^@/, ""), chat_id: chatId }, { onConflict: "username" });
        if (error) throw error;
        await sendMessage(chatId, "Your Telegram account is linked to Afrique-con. You will receive booking updates here.");
      } else {
        await sendMessage(chatId, "Please set a Telegram username, then send /start again so we can link your booking updates.");
      }
    } else if (text.startsWith("/help")) {
      await sendMessage(chatId, helpMessage());
    } else if (text.startsWith("/quote")) {
      await sendMessage(chatId, `Get an instant cargo quote at ${appUrl}/cargo`);
    } else if (text.startsWith("/ticket")) {
      await sendMessage(chatId, `Search and book passenger travel at ${appUrl}/passenger`);
    } else if (text.startsWith("/contact")) {
      await sendMessage(chatId, "Cameroon: +237 678197361\nNigeria: +234 9029072330\nEmail: support@afriquecon.com");
    } else if (text.startsWith("/track")) {
      const bookingId = text.split(/\s+/, 2)[1];
      if (!bookingId) {
        await sendMessage(chatId, "Please provide a booking ID. Example: `/track AFCON-20260710-1234`");
      } else {
        const { data, error } = await supabase.rpc("track_cargo_shipment", { p_booking_id: bookingId });
        const shipment = Array.isArray(data) ? data[0] : null;
        if (error || !shipment) {
          await sendMessage(chatId, `No shipment was found for *${bookingId}*.`);
        } else {
          const status = String(shipment.status ?? "pending").replaceAll("_", " ").toUpperCase();
          await sendMessage(chatId, `*${shipment.booking_id}*\n${shipment.origin} -> ${shipment.destination}\nStatus: *${status}*`);
        }
      }
    } else {
      await sendMessage(chatId, `I can help with Afrique-con cargo and passenger services.\n\n${helpMessage()}`);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error", error);
    return Response.json({ ok: false }, { status: 500 });
  }
});
