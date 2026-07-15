import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://afrique-con.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const admin = createClient(supabaseUrl, serviceRoleKey);

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return reply({ error: "Authentication required" }, 401);
    const client = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await client.auth.getUser();
    if (!user) return reply({ error: "Authentication required" }, 401);

    const { paymentReference, tickets } = await req.json();
    if (typeof paymentReference !== 'string' || !/^AC-[a-zA-Z0-9-]{10,80}$/.test(paymentReference) || !Array.isArray(tickets) || tickets.length < 1 || tickets.length > 48) {
      return reply({ error: "Invalid reservation request" }, 400);
    }
    const scheduleId = tickets[0]?.schedule_id;
    if (typeof scheduleId !== 'string' || tickets.some((ticket: any) => ticket.schedule_id !== scheduleId)) {
      return reply({ error: "Tickets must use one schedule" }, 400);
    }

    const { data: schedule, error: scheduleError } = await admin
      .from('bus_schedules')
      .select('base_fare_fcfa, base_fare_fcfa_non_nigerian, status, departure_time')
      .eq('id', scheduleId)
      .eq('status', 'scheduled')
      .single();
    if (scheduleError || !schedule || new Date(schedule.departure_time) <= new Date()) {
      return reply({ error: "This schedule is no longer available" }, 409);
    }

    const seats = tickets.map((ticket: any) => String(ticket.seat_number));
    if (new Set(seats).size !== seats.length || seats.some((seat) => !/^(?:[1-9]|[1-4][0-9])$/.test(seat))) {
      return reply({ error: "Invalid seat selection" }, 400);
    }

    // Clear expired holds before the unique schedule/seat index reserves seats.
    await admin.from('passenger_tickets').delete().eq('payment_status', 'pending').lt('reservation_expires_at', new Date().toISOString());

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const records = tickets.map((ticket: any) => {
      const ticketType = ticket.ticket_type;
      const extraLuggage = Math.max(0, Number(ticket.extra_luggage_kg) || 0);
      const baseFare = ticket.is_nigerian === false && Number(schedule.base_fare_fcfa_non_nigerian) > 0
        ? Number(schedule.base_fare_fcfa_non_nigerian)
        : Number(schedule.base_fare_fcfa);
      const discountPercent = ticketType === 'child_under_2' ? 100 : ticketType === 'child_under_5' ? 30 : 0;
      const luggageFee = Math.max(0, extraLuggage - 20) * 1000;
      const discount = baseFare * discountPercent / 100;
      const total = baseFare - discount + luggageFee;

      return {
        ticket_id: ticket.ticket_id,
        user_id: user.id,
        schedule_id: scheduleId,
        passenger_name: String(ticket.passenger_name ?? '').trim(),
        passenger_telegram_id: ticket.passenger_telegram_id ? String(ticket.passenger_telegram_id).replace(/^@+/, '') : null,
        id_number: ticket.id_number ? String(ticket.id_number) : null,
        ticket_type: ticketType,
        is_nigerian: ticket.is_nigerian !== false,
        seat_number: String(ticket.seat_number),
        base_fare_fcfa: baseFare,
        discount_fcfa: discount,
        discount_percent: discountPercent,
        luggage_fee_fcfa: luggageFee,
        total_fcfa: total,
        final_price_fcfa: total,
        payment_status: 'pending',
        payment_reference: paymentReference,
        reservation_expires_at: expiresAt,
      };
    });
    if (records.some((record) => !record.ticket_id || !record.passenger_name || !['adult', 'student', 'senior', 'child_under_5', 'child_under_2'].includes(record.ticket_type))) {
      return reply({ error: "Incomplete passenger details" }, 400);
    }

    const { data, error } = await admin.from('passenger_tickets').insert(records).select('ticket_id, total_fcfa');
    if (error) {
      if (error.code === '23505') return reply({ error: "One or more selected seats were just reserved. Please choose different seats." }, 409);
      throw error;
    }
    return reply({ tickets: data, expiresAt });
  } catch (error) {
    console.error('create-passenger-reservation error', error);
    return reply({ error: 'Unable to reserve seats' }, 500);
  }
});
