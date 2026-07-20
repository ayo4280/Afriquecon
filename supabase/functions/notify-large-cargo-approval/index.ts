import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const allowedOrigins = new Set([
  "https://afriquecon.vercel.app",
  "https://afrique-con.com",
  "https://www.afrique-con.com",
  "http://localhost:5173",
]);

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const managementChatId = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID") ?? "";
const admin = createClient(supabaseUrl, serviceRoleKey);

function headers(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://afriquecon.vercel.app",
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
    if (bookingError || !booking || !requiresApproval || Number(booking.total_fcfa) > 0) {
      return reply(req, { error: "Booking is not awaiting management approval" }, 409);
    }
    if (!botToken || !/^\d+$/.test(managementChatId)) {
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

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: managementChatId, text: message }),
    });
    if (!telegramResponse.ok) {
      console.error("Telegram management alert failed", await telegramResponse.text());
      return reply(req, { error: "Unable to notify management" }, 502);
    }

    return reply(req, { ok: true });
  } catch (error) {
    console.error("notify-large-cargo-approval error", error);
    return reply(req, { error: "Unable to notify management" }, 500);
  }
});
