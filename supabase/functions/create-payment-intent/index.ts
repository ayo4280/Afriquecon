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
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return reply({ error: "Authentication required" }, 401);

    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return reply({ error: "Authentication required" }, 401);

    const { provider, bookingType, reference, bookingId, ticketIds } = await req.json();
    if (!['paystack', 'flutterwave'].includes(provider) || !['cargo', 'passenger'].includes(bookingType)) {
      return reply({ error: "Invalid payment request" }, 400);
    }
    if (typeof reference !== 'string' || !/^AC-[a-zA-Z0-9-]{10,80}$/.test(reference)) {
      return reply({ error: "Invalid payment reference" }, 400);
    }

    let totalFcfa = 0;
    if (bookingType === 'cargo') {
      const { data: booking, error } = await admin
        .from('cargo_bookings')
        .select('id, total_fcfa, payment_status, payment_reference')
        .eq('booking_id', bookingId)
        .eq('user_id', user.id)
        .single();
      if (error || !booking || booking.payment_status !== 'pending' || booking.payment_reference !== reference) {
        return reply({ error: "Cargo booking is not eligible for payment" }, 409);
      }
      totalFcfa = Number(booking.total_fcfa);
    } else {
      if (!Array.isArray(ticketIds) || ticketIds.length === 0 || ticketIds.length > 48) {
        return reply({ error: "Invalid ticket selection" }, 400);
      }
      const { data: tickets, error } = await admin
        .from('passenger_tickets')
        .select('ticket_id, total_fcfa, payment_status, payment_reference')
        .eq('user_id', user.id)
        .in('ticket_id', ticketIds);
      if (error || !tickets || tickets.length !== ticketIds.length || tickets.some((ticket) => ticket.payment_status !== 'pending' || ticket.payment_reference !== reference)) {
        return reply({ error: "Tickets are not eligible for payment" }, 409);
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
      return reply({ reference, amount, currency, checkoutUrl: checkout.data.link });
    }

    return reply({ reference, amount, currency });
  } catch (error) {
    console.error('create-payment-intent error', error);
    return reply({ error: 'Unable to initialize payment' }, 500);
  }
});
