import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function isPaystackSignatureValid(body: string, signature: string | null) {
  const secret = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!secret || !signature) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return toHex(digest) === signature;
}

async function isFlutterwaveSignatureValid(body: string, req: Request) {
  const secret = Deno.env.get('FLUTTERWAVE_WEBHOOK_HASH');
  if (!secret) return false;

  // Flutterwave's current webhook format signs the raw request body with the
  // dashboard Secret Hash. Keep the legacy `verif-hash` fallback so existing
  // dashboard configurations continue to work during the transition.
  const signature = req.headers.get('flutterwave-signature');
  if (signature) {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
    const expected = btoa(String.fromCharCode(...new Uint8Array(digest)));
    return expected === signature;
  }

  return req.headers.get('verif-hash') === secret;
}

async function verifyPayment(provider: string, reference: string, transactionId?: string) {
  if (provider === 'paystack') {
    const secret = Deno.env.get('PAYSTACK_SECRET_KEY');
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (!response.ok) throw new Error('Paystack verification failed');
    return await response.json();
  }

  const secret = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
  if (!transactionId) throw new Error('Flutterwave transaction ID missing');
  const response = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!response.ok) throw new Error('Flutterwave verification failed');
  return await response.json();
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const provider = new URL(req.url).searchParams.get('provider');
  if (provider !== 'paystack' && provider !== 'flutterwave') return new Response('Unknown provider', { status: 400 });

  const rawBody = await req.text();
  try {
    if (provider === 'paystack' && !await isPaystackSignatureValid(rawBody, req.headers.get('x-paystack-signature'))) {
      return new Response('Unauthorized', { status: 401 });
    }
    if (provider === 'flutterwave' && !await isFlutterwaveSignatureValid(rawBody, req)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    if (provider === 'paystack' && payload.event !== 'charge.success') return Response.json({ ok: true });

    const eventData = payload.data ?? {};
    const reference = provider === 'paystack' ? eventData.reference : eventData.tx_ref;
    const transactionId = String(eventData.id ?? '');
    if (!reference) return new Response('Missing reference', { status: 400 });

    const { data: payment, error } = await supabase.from('payments').select('*').eq('reference', reference).single();
    if (error || !payment) return new Response('Unknown payment', { status: 404 });
    if (payment.status === 'paid') return Response.json({ ok: true });
    if (payment.provider !== provider) return new Response('Provider mismatch', { status: 400 });

    const verification = await verifyPayment(provider, reference, transactionId);
    const verified = verification.data;
    const verifiedStatus = String(verified?.status ?? '').toLowerCase();
    const verifiedAmount = Number(verified?.amount ?? 0) / (provider === 'paystack' ? 100 : 1);
    const verifiedCurrency = verified?.currency;
    const verifiedReference = provider === 'paystack' ? verified?.reference : verified?.tx_ref;
    const successfulStatuses = provider === 'paystack' ? ['success'] : ['successful'];
    if (!successfulStatuses.includes(verifiedStatus) || verifiedReference !== reference || verifiedCurrency !== payment.currency || verifiedAmount !== Number(payment.amount)) {
      throw new Error('Payment verification mismatch');
    }

    const { error: updatePaymentError } = await supabase.from('payments').update({
      status: 'paid', provider_transaction_id: String(verified.id), provider_payload: verification,
      verified_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', payment.id).eq('status', 'pending');
    if (updatePaymentError) throw updatePaymentError;

    const table = payment.booking_type === 'cargo' ? 'cargo_bookings' : 'passenger_tickets';
    const bookingUpdate = payment.booking_type === 'passenger'
      ? { payment_status: 'paid', reservation_expires_at: null }
      : { payment_status: 'paid' };
    const { error: bookingError } = await supabase.from(table).update(bookingUpdate).eq('payment_reference', reference);
    if (bookingError) throw bookingError;

    return Response.json({ ok: true });
  } catch (error) {
    console.error('payment-webhook error', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
});
