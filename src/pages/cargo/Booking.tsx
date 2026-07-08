import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { CargoQuoteResponse } from '../../services/cargoService';
import {
  CheckCircle, AlertCircle, ArrowLeft, Package, MapPin,
  Truck, User, Phone, Home, CreditCard, Loader2, Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePaystackPayment } from 'react-paystack';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import TermsModal from '../../components/TermsModal';

export default function CargoBooking() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const quoteResult = location.state?.quote as CargoQuoteResponse;
  const requestDetails = location.state?.request;

  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderTelegram, setSenderTelegram] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'flutterwave'>('paystack');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);

  const paystackConfig = {
    reference: (new Date()).getTime().toString(),
    email: user?.email || '',
    amount: (quoteResult?.totalNGN || 0) * 100,
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
  };
  const initializePaystack = usePaystackPayment(paystackConfig);

  const flutterwaveConfig = {
    public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || '',
    tx_ref: Date.now().toString(),
    amount: quoteResult?.totalFCFA || 0,
    currency: 'XAF',
    payment_options: 'card,mobilemoney,ussd',
    customer: { email: user?.email || '', phone_number: senderPhone, name: senderName || user?.email || '' },
    customizations: { title: 'Afrique-con PLC', description: 'Payment for Cargo Booking', logo: 'https://via.placeholder.com/150' },
  };
  const handleFlutterwave = useFlutterwave(flutterwaveConfig);

  useEffect(() => {
    if (!quoteResult) { navigate('/'); return; }
    if (user) {
      supabase.from('profiles').select('full_name, phone, email, telegram_id').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) { setSenderName(data.full_name || ''); setSenderPhone(data.phone || ''); setSenderTelegram(data.telegram_id || ''); }
          setProfileLoading(false);
        });
    } else { setProfileLoading(false); }
  }, [quoteResult, navigate, user]);

  if (!quoteResult) return null;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !quoteResult || !requestDetails) return;
    if (!acceptedTerms) {
      setError('You must accept the Terms and Conditions to proceed.');
      return;
    }
    if (!senderName || !senderPhone) { setError('Please fill in the sender name and phone number.'); return; }
    if (!recipientName || !recipientPhone || !deliveryAddress) { setError('Please fill in all recipient details.'); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      const newBookingId = `AFCON-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      const { error: dbError } = await supabase.from('cargo_bookings').insert([{
        booking_id: newBookingId, user_id: user.id, quote_id: quoteResult.quoteId,
        origin: requestDetails?.origin || 'Unknown', destination: requestDetails?.destination || 'Unknown',
        weight_kg: requestDetails?.weightKg || 0, cargo_type: requestDetails?.cargoType || 'general',
        is_express: quoteResult.isExpress, base_rate_fcfa: quoteResult.baseFCFA,
        total_fcfa: quoteResult.totalFCFA, currency_used: 'FCFA',
        customer_name: senderName, customer_email: user.email, customer_phone: senderPhone,
        customer_telegram_id: senderTelegram, recipient_name: recipientName,
        recipient_phone: recipientPhone, delivery_address: deliveryAddress,
        status: 'pending', payment_status: 'pending',
      }]);
      if (dbError) throw dbError;

      const onSuccess = async () => {
        await supabase.from('cargo_bookings').update({ payment_status: 'paid' }).eq('booking_id', newBookingId);
        setBookingId(newBookingId);
        setSuccess(true);
      };
      const onClose = () => setIsSubmitting(false);

      if (paymentMethod === 'paystack') {
        initializePaystack({ onSuccess, onClose });
      } else {
        handleFlutterwave({
          callback: (response) => {
            if (response.status === 'successful') { onSuccess(); } else { onClose(); }
            closePaymentModal();
          },
          onClose,
        });
      }
    } catch (err: any) {
      setError(err.message || t('cargoBooking.error', 'An error occurred while saving the booking.'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-3xl p-10 shadow-2xl border border-teal-100 max-w-lg w-full text-center animate-fade-up">
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-ring">
            <CheckCircle className="w-12 h-12 text-teal-500" />
          </div>
          <h2 className="text-3xl font-display font-bold mb-2 text-slate-900">{t('cargoBooking.successTitle')}</h2>
          <p className="text-slate-500 mb-6">{t('cargoBooking.successMsg')}</p>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">{t('cargoBooking.quoteRef')}</span>
              <span className="font-mono font-bold text-amber-600">{bookingId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">{t('cargoBooking.route')}</span>
              <span className="font-semibold">{requestDetails?.origin} → {requestDetails?.destination}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">{t('cargoBooking.weight')}</span>
              <span className="font-semibold">{requestDetails?.weightKg} kg</span>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-100 pt-3 mt-1">
              <span className="text-slate-500 font-bold">{t('cargoBooking.totalPaid')}</span>
              <span className="font-bold text-xl text-[#0A1628]">{quoteResult.totalFCFA.toLocaleString()} FCFA</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate('/profile')} className="flex-1 bg-[#0A1628] text-white py-3 rounded-xl font-bold hover:bg-[#1a2d4e] transition-colors">
              {t('cargoBooking.viewShipments')}
            </button>
            <button onClick={() => navigate('/')} className="flex-1 bg-slate-100 text-slate-800 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">
              {t('cargoBooking.backHome')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const inputCls = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all text-slate-800 font-medium";
  const labelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="bg-[#F4F6FA] min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-[#0A1628] font-semibold mb-6 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> {t('cargoBooking.back')}
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8 animate-fade-up">
          {['Quote', 'Details', 'Payment'].map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold ${i === 1 ? 'bg-amber-400 text-[#0A1628]' : i < 1 ? 'bg-teal-400 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {i < 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm font-semibold ${i === 1 ? 'text-slate-900' : 'text-slate-400'}`}>{step}</span>
              {i < 2 && <div className="w-8 h-px bg-slate-300" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Form */}
          <div className="md:col-span-2 space-y-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
              </div>
            )}

            {!user && (
              <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl">
                <p className="font-bold">{t('cargoBooking.notLoggedIn')}</p>
                <p className="text-sm mt-1">{t('cargoBooking.loginToBook')}</p>
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-6">
              {/* Sender */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7">
                <h3 className="font-display font-bold text-lg text-slate-900 mb-5 flex items-center gap-2 pb-4 border-b border-slate-100">
                  <div className="w-8 h-8 bg-amber-400/15 rounded-xl flex items-center justify-center">
                    <User className="w-4 h-4 text-amber-500" />
                  </div>
                  {t('cargoBooking.senderDetails')}
                </h3>
                {profileLoading ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> Loading your profile...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>{t('cargoBooking.fullName')}</label>
                      <input required type="text" value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="Your full name" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>{t('cargoBooking.phone')}</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input required type="tel" value={senderPhone} onChange={e => setSenderPhone(e.target.value)} placeholder="+237 600 000 000" className={`${inputCls} pl-10`} />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>{t('cargoBooking.telegramId')}</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                        <input type="text" value={senderTelegram} onChange={e => setSenderTelegram(e.target.value)} placeholder="Afriquecon" className={`${inputCls} pl-9`} />
                      </div>
                      <p className="text-xs text-amber-600 font-medium mt-1.5">{t('cargoBooking.telegramHint')}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Recipient */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7">
                <h3 className="font-display font-bold text-lg text-slate-900 mb-5 flex items-center gap-2 pb-4 border-b border-slate-100">
                  <div className="w-8 h-8 bg-teal-400/15 rounded-xl flex items-center justify-center">
                    <Package className="w-4 h-4 text-teal-500" />
                  </div>
                  {t('cargoBooking.recipientDetails')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={labelCls}>{t('cargoBooking.recipientName')}</label>
                    <input required type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Recipient's full name" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t('cargoBooking.recipientPhone')}</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input required type="tel" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} placeholder="+234 800 000 0000" className={`${inputCls} pl-10`} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelCls}><Home className="inline w-3.5 h-3.5 mr-1" /> {t('cargoBooking.deliveryAddress')}</label>
                  <textarea required rows={3} value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder={t('cargoBooking.addressPlaceholder')} className={`${inputCls} resize-none`} />
                </div>
              </div>

              {/* Payment method */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7">
                <h3 className="font-display font-bold text-lg text-slate-900 mb-5 flex items-center gap-2 pb-4 border-b border-slate-100">
                  <div className="w-8 h-8 bg-amber-400/15 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-amber-500" />
                  </div>
                  {t('cargoBooking.paymentMethod')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'paystack',    label: t('cargoBooking.payPaystack'),    desc: 'Nigeria · NGN', flag: '🇳🇬' },
                    { value: 'flutterwave', label: t('cargoBooking.payFlutterwave'), desc: 'Cameroon · FCFA', flag: '🇨🇲' },
                  ].map(({ value, label, desc, flag }) => (
                    <label
                      key={value}
                      className={`relative cursor-pointer flex flex-col gap-1.5 p-4 rounded-2xl border-2 transition-all ${paymentMethod === value ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                    >
                      <input type="radio" name="payment" value={value} checked={paymentMethod === value} onChange={() => setPaymentMethod(value as any)} className="sr-only" />
                      <span className="text-2xl">{flag}</span>
                      <span className="font-bold text-slate-900 text-sm">{label}</span>
                      <span className="text-xs text-slate-500">{desc}</span>
                      {paymentMethod === value && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <input 
                  type="checkbox" 
                  id="terms" 
                  required
                  checked={acceptedTerms}
                  onChange={e => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
                />
                <label htmlFor="terms" className="text-sm text-slate-600">
                  I have read and agree to the{' '}
                  <button type="button" onClick={() => setIsTermsModalOpen(true)} className="text-[#0A1628] font-bold underline decoration-amber-400 decoration-2 underline-offset-2">
                    Terms and Conditions of Carriage
                  </button>
                  .
                </label>
              </div>

              <button
                type="submit"
                disabled={!user || isSubmitting || !acceptedTerms}
                className="w-full bg-[#0A1628] hover:bg-[#1a2d4e] text-white py-4 rounded-2xl font-bold text-base transition-all shadow-xl shadow-slate-900/15 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> {t('cargoBooking.processing')}</>
                ) : (
                  <><Truck className="w-5 h-5" /> {t('cargoBooking.confirmPay')} — {quoteResult.totalFCFA.toLocaleString()} FCFA</>
                )}
              </button>
            </form>
          </div>

          {/* Summary sidebar */}
          <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-[#0A1628] text-white p-7 rounded-3xl shadow-xl sticky top-24 space-y-5">
              <h3 className="text-xl font-display font-bold border-b border-white/10 pb-4">Shipment Summary</h3>

              <div className="bg-white/8 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <MapPin className="w-4 h-4" />
                  {requestDetails?.origin} → {requestDetails?.destination}
                </div>
                <div className="text-slate-400 text-xs">{requestDetails?.weightKg} kg · {requestDetails?.cargoType === 'heavy_equipment' ? t('home.heavyEquipment') : t('home.generalGoods')}</div>
                {quoteResult.isExpress && (
                  <span className="inline-flex items-center gap-1 mt-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs px-2 py-0.5 rounded-full font-bold">
                    <Zap className="w-3 h-3" /> Express
                  </span>
                )}
              </div>

              <div className="space-y-2.5 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span>{t('home.baseRate')}</span>
                  <span>{quoteResult.baseFCFA.toLocaleString()} FCFA</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between font-bold text-2xl">
                  <span>Total</span>
                  <span>{quoteResult.totalFCFA.toLocaleString()}</span>
                </div>
                <div className="text-right text-xs text-slate-500 mt-1">FCFA · ≈ ₦{quoteResult.totalNGN.toLocaleString()}</div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-slate-400 flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                Quote valid until {new Date(quoteResult.expiresAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <TermsModal 
        isOpen={isTermsModalOpen} 
        onClose={() => setIsTermsModalOpen(false)} 
        type="cargo" 
      />
    </div>
  );
}
