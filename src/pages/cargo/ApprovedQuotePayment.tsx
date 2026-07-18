import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePaystackPayment } from 'react-paystack';
import { CheckCircle, CreditCard, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

interface ApprovedBooking {
  booking_id: string;
  origin: string;
  destination: string;
  weight_kg: number;
  total_fcfa: number;
  status: string;
  payment_status: string;
  payment_reference: string;
}

export default function ApprovedQuotePayment() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [booking, setBooking] = useState<ApprovedBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [provider, setProvider] = useState<'paystack' | 'flutterwave'>('paystack');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate(`/login?next=/cargo/pay/${bookingId}`);
      return;
    }
    if (!bookingId) return;
    supabase
      .from('cargo_bookings')
      .select('booking_id, origin, destination, weight_kg, total_fcfa, status, payment_status, payment_reference')
      .eq('booking_id', bookingId)
      .eq('user_id', user.id)
      .single()
      .then(({ data, error: queryError }) => {
        if (queryError || !data) setError(t('cargoBooking.approvedQuoteUnavailable'));
        else setBooking(data);
        setLoading(false);
      });
  }, [bookingId, navigate, t, user]);

  const initializePaystack = usePaystackPayment({
    reference: booking?.payment_reference || 'AC-pending-reference',
    email: user?.email || '',
    amount: Math.round(Number(booking?.total_fcfa || 0) * 250),
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
  });

  const startPayment = async () => {
    if (!booking || !user) return;
    setSubmitting(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error(t('cargoBooking.sessionExpired'));
      const { data: intent, error: intentError } = await supabase.functions.invoke('create-payment-intent', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { provider, bookingType: 'cargo', reference: booking.payment_reference, bookingId: booking.booking_id },
      });
      if (intentError) throw intentError;
      if (provider === 'flutterwave') {
        if (!intent?.checkoutUrl) throw new Error(t('cargoBooking.paymentStartError'));
        window.location.assign(intent.checkoutUrl);
        return;
      }
      initializePaystack({
        onSuccess: () => setSubmitted(true),
        onClose: () => setSubmitting(false),
      });
    } catch (err: any) {
      setError(err.message || t('cargoBooking.paymentStartError'));
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-9 h-9 animate-spin text-amber-500" /></div>;

  if (submitted) {
    return <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center px-4"><div className="max-w-md rounded-3xl bg-white p-9 text-center shadow-xl"><CheckCircle className="mx-auto mb-4 h-12 w-12 text-teal-500" /><h1 className="text-2xl font-bold">{t('cargoBooking.paymentSubmitted')}</h1><p className="mt-3 text-slate-500">{t('cargoBooking.paymentSubmittedHint')}</p><button onClick={() => navigate('/profile')} className="mt-6 rounded-xl bg-[#0A1628] px-5 py-3 font-bold text-white">{t('cargoBooking.viewShipments')}</button></div></div>;
  }

  const eligible = booking?.status === 'confirmed' && booking.payment_status === 'pending' && Number(booking.total_fcfa) > 0;
  return (
    <div className="min-h-screen bg-[#F4F6FA] py-12 px-4">
      <div className="mx-auto max-w-xl">
        <button onClick={() => navigate('/profile')} className="mb-6 flex items-center gap-2 font-semibold text-slate-500"><ArrowLeft className="w-4 h-4" />{t('cargoBooking.backToShipments')}</button>
        <div className="rounded-3xl bg-white p-8 shadow-xl border border-slate-100">
          <h1 className="text-3xl font-bold text-slate-900">{t('cargoBooking.payApprovedQuote')}</h1>
          {error ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p> : !eligible ? <p className="mt-5 rounded-xl bg-amber-50 p-4 text-amber-800">{t('cargoBooking.approvedQuoteUnavailable')}</p> : <>
            <div className="mt-6 space-y-2 rounded-2xl bg-slate-50 p-5 text-sm"><p><strong>{t('cargoBooking.quoteRef')}:</strong> {booking.booking_id}</p><p><strong>{t('cargoBooking.route')}:</strong> {booking.origin} → {booking.destination}</p><p><strong>{t('cargoBooking.weight')}:</strong> {booking.weight_kg} kg</p><p className="pt-2 text-xl font-extrabold text-[#0A1628]">{booking.total_fcfa.toLocaleString()} FCFA</p></div>
            <div className="mt-6 grid grid-cols-2 gap-3"><button onClick={() => setProvider('paystack')} className={`rounded-xl border p-4 font-bold ${provider === 'paystack' ? 'border-amber-400 bg-amber-50' : 'border-slate-200'}`}>{t('cargoBooking.payPaystack')}</button><button onClick={() => setProvider('flutterwave')} className={`rounded-xl border p-4 font-bold ${provider === 'flutterwave' ? 'border-amber-400 bg-amber-50' : 'border-slate-200'}`}>{t('cargoBooking.payFlutterwave')}</button></div>
            <button disabled={submitting} onClick={startPayment} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A1628] py-4 font-bold text-white disabled:opacity-50">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}{t('cargoBooking.payApprovedQuote')}</button>
          </>}
        </div>
      </div>
    </div>
  );
}
