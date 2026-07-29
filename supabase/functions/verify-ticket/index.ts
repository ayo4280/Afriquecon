import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const allowedOrigins = new Set([
  "https://afriquecon.com",
  "https://www.afriquecon.com",
  "https://afriquecon.vercel.app",
  "http://localhost:5173",
]);
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
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

function invalid(reason: string) {
  return { valid: false, reason };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: headers(req) });
  if (req.method !== "POST") return reply(req, { error: "Method not allowed" }, 405);

  try {
    const accessToken = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();
    if (!accessToken) return reply(req, { error: "Authentication required" }, 401);

    const { data: { user }, error: authError } = await admin.auth.getUser(accessToken);
    if (authError || !user) return reply(req, { error: "Authentication required" }, 401);

    const { data: staff, error: staffError } = await admin
      .from("admin_users")
      .select("role, active")
      .ilike("email", user.email ?? "")
      .maybeSingle();
    if (staffError || !staff?.active || !["agent", "manager", "super_admin"].includes(staff.role)) {
      return reply(req, { error: "Staff access required" }, 403);
    }

    const payload = await req.json().catch(() => ({}));
    const ticketId = typeof payload.ticketId === "string" ? payload.ticketId.trim().toUpperCase() : "";
    if (!/^(?:AFCON|TKT)-\d{8}-\d{4}$/i.test(ticketId)) {
      return reply(req, invalid("Ticket ID is not valid"));
    }

    const { data: ticket, error: ticketError } = await admin
      .from("passenger_tickets")
      .select("ticket_id, passenger_name, seat_number, ticket_type, total_fcfa, payment_status, ticket_status, schedule_id, created_at")
      .eq("ticket_id", ticketId)
      .maybeSingle();

    let result: { valid: boolean; reason?: string; ticket?: unknown };
    if (ticketError || !ticket) {
      result = invalid("Ticket not found");
    } else if (ticket.payment_status !== "paid") {
      result = invalid("Ticket payment is not complete");
    } else if (["cancelled", "refunded", "expired"].includes(String(ticket.ticket_status).toLowerCase())) {
      result = invalid(`Ticket is ${ticket.ticket_status}`);
    } else {
      const { data: schedule } = await admin
        .from("bus_schedules")
        .select("origin, destination, departure_time, arrival_time, status")
        .eq("id", ticket.schedule_id)
        .maybeSingle();
      if (!schedule) {
        result = invalid("Schedule not found");
      } else if (schedule.status === "cancelled") {
        result = invalid("The bus schedule is cancelled");
      } else if (new Date(schedule.departure_time) <= new Date()) {
        result = invalid("The departure time has passed");
      } else {
        result = {
          valid: true,
          ticket: { ...ticket, schedule },
        };
      }
    }

    await admin.from("ticket_scan_logs").insert({
      ticket_id: ticketId,
      scanned_by: user.id,
      result: result.valid ? "valid" : "invalid",
      reason: result.reason ?? null,
      metadata: { role: staff.role },
    });

    return reply(req, result);
  } catch (error) {
    console.error("verify-ticket error", error);
    return reply(req, { error: "Unable to verify ticket" }, 500);
  }
});
