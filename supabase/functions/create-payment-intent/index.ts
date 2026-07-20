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
const admin = createClient(supabaseUrl, serviceRoleKey);

function responseHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://afriquecon.vercel.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

function reply(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...responseHeaders(req), "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: responseHeaders(req) });
  if (req.method !== "POST") return reply(req, { error: "Method not allowed" }, 405);

  try {
    const accessToken = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();
    if (!accessToken) return reply(req, { error: "Authentication required" }, 401);

    const { data: { user }, error: authError } = await admin.auth.getUser(accessToken);
    if (authError || !user) return reply(req, { error: "Authentication required" }, 401);

    const { provider, bookingType, reference, bookingId, ticketIds } = await req.json();
    if (!['paystack', 'flutterwave'].includes(provider) || !['cargo', 'passenger'].includes(bookingType)) {
      return reply(req, { error: "Invalid payment request" }, 400);
    }
    if (typeof reference !== 'string' || !/^AC-[a-zA-Z0-9-]{10,80}$/.test(reference)) {
      return reply(req, { error: "Invalid payment reference" }, 400);
    }

    let totalFcfa = 0;
    if (bookingType === 'cargo') {
      const { data: booking, error } = await admin
        .from('cargo_bookings')
        .select('id, total_fcfa, weight_kg, is_express, status, payment_status, payment_reference')
        .eq('booking_id', bookingId)
        .eq('user_id', user.id)
        .single();
      if (error || !booking || Number(booking.total_fcfa) <= 0 || booking.payment_status !== 'pending' || booking.payment_reference !== reference || ((Number(booking.weight_kg) >= 100 || booking.is_express) && booking.status !== 'confirmed')) {
        return reply(req, { error: "Cargo booking is not eligible for payment" }, 409);
      }
      totalFcfa = Number(booking.total_fcfa);
    } else {
      if (!Array.isArray(ticketIds) || ticketIds.length === 0 || ticketIds.length > 48) {
        return reply(req, { error: "Invalid ticket selection" }, 400);
      }
      const { data: tickets, error } = await admin
        .from('passenger_tickets')
        .select('ticket_id, total_fcfa, payment_status, payment_reference')
        .eq('user_id', user.id)
        .in('ticket_id', ticketIds);
      if (error || !tickets || tickets.length !== ticketIds.length || tickets.some((ticket) => ticket.payment_status !== 'pending' || ticket.payment_reference !== reference)) {
        return reply(req, { error: "Tickets are not eligible for payment" }, 409);
      }
      totalFcfa = tickets.reduce((sum, ticket) => sum + Number(ticket.total_fcfa), 0);
    }

    const currency = provider === 'paystack' ? 'NGN' : 'XAF';
    const amount = provider === 'paystack' ? totalFcfa * 2.5 : totalFcfa;
    const { error: paymentError } = await admin.from('payments').insert({
      reference,
      provider,
      booking_type: bookingType,
      user_id: user.id,
      amount,
      currency,
    });

    if (paymentError && paymentError.code !== '23505') throw paymentError;

    if (provider === 'flutterwave') {
      const flutterwaveSecret = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
      const appUrl = Deno.env.get('APP_URL');
      if (!flutterwaveSecret || !appUrl) throw new Error('Flutterwave checkout is not configured');

      const checkoutResponse = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${flutterwaveSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: reference,
          amount,
          currency,
          redirect_url: `${appUrl.replace(/\/$/, '')}/profile?payment=flutterwave`,
          payment_options: 'card,mobilemoney,ussd',
          customer: {
            email: user.email,
            name: user.user_metadata?.full_name || user.email,
          },
          customizations: {
            title: 'Afrique-con PLC',
            description: bookingType === 'cargo' ? 'Cargo booking payment' : 'Passenger ticket payment',
          },
          configurations: { session_duration: 15, max_retry_attempt: 5 },
        }),
      });
      const checkout = await checkoutResponse.json();
      if (!checkoutResponse.ok || !checkout?.data?.link) throw new Error('Flutterwave checkout could not be created');
      return reply(req, { reference, amount, currency, checkoutUrl: checkout.data.link });
    }

    return reply(req, { reference, amount, currency });
  } catch (error) {
    console.error('create-payment-intent error', error);
    return reply(req, { error: 'Unable to initialize payment' }, 500);
  }
});
