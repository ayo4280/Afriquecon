import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const allowedOrigins = new Set([
  "https://afriquecon.vercel.app",
  "https://afriquecon.com",
  "https://www.afriquecon.com",
  "http://localhost:5173",
]);

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
// TELEGRAM_ADMIN_CHAT_ID may hold one or several numeric chat IDs,
// separated by commas or semicolons, so every configured admin is alerted.
const managementChatIds = (Deno.env.get("TELEGRAM_ADMIN_CHAT_ID") ?? "")
  .split(/[,;]/)
  .map((id) => id.trim())
  .filter((id) => /^-?\d+$/.test(id));
const admin = createClient(supabaseUrl, serviceRoleKey);

function headers(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://www.afriquecon.com",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
    "Vary": "Origin",
  };
}

function reply(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: headers(req) });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: headers(req) });
  if (req.method !== "POST") return reply(req, { error: "Method not allowed" }, 405);

  try {
    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();
    if (!token) return reply(req, { error: "Authentication required" }, 401);

    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) return reply(req, { error: "Authentication required" }, 401);

    const { bookingId } = await req.json();
    if (typeof bookingId !== "string" || !/^AFCON-\d{8}-\d{4}$/.test(bookingId)) {
      return reply(req, { error: "Invalid booking" }, 400);
    }

    const { data: booking, error: bookingError } = await admin
      .from("cargo_bookings")
      .select("booking_id, origin, destination, weight_kg, is_express, total_fcfa, customer_name, customer_phone, status")
      .eq("booking_id", bookingId)
      .eq("user_id", user.id)
      .single();

    const requiresApproval = Boolean(booking?.is_express) || Number(booking?.weight_kg) >= 100;
    if (bookingError || !booking || !requiresApproval || (!booking.is_express && Number(booking.total_fcfa) > 0)) {
      return reply(req, { error: "Booking is not awaiting management approval" }, 409);
    }
    if (!botToken || managementChatIds.length === 0) {
      console.error("Management Telegram alert is not configured", {
        hasBotToken: Boolean(botToken),
        adminChatIdCount: managementChatIds.length,
      });
      return reply(req, { error: "Management Telegram alerts are not configured" }, 500);
    }

    const approvalTitle = booking.is_express ? "Express cargo approval required" : "Large cargo approval required";
    const message = `${approvalTitle}\n\n` +
      `Booking: ${booking.booking_id}\n` +
      `Route: ${booking.origin} -> ${booking.destination}\n` +
      `Weight: ${booking.weight_kg} kg\n` +
      (booking.is_express ? "Service: Express\n" : "") +
      `Customer: ${booking.customer_name}\n` +
      `Phone: ${booking.customer_phone}\n\n` +
      "Open the Afriquecon dashboard to set the negotiated price and confirm.";

    const telegramResponses = await Promise.all(managementChatIds.map((chatId) =>
      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      })
    ));

    const failures = await Promise.all(
      telegramResponses
        .filter((r) => !r.ok)
        .map((r) => r.text())
    );
    if (failures.length > 0) {
      console.error("Telegram management alert failed for some admins", failures);
    }
    if (failures.length === telegramResponses.length) {
      return reply(req, { error: "Unable to notify management" }, 502);
    }

    return reply(req, { ok: true });
  } catch (error) {
    console.error("notify-large-cargo-approval error", error);
    return reply(req, { error: "Unable to notify management" }, 500);
  }
});
