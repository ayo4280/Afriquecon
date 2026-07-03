import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { CargoQuoteResponse } from '../../services/cargoService';
import {
  CheckCircle, AlertCircle, ArrowLeft, Package, MapPin,
  Truck, User, Phone, Home, CreditCard, Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePaystackPayment } from 'react-paystack';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';


export default function CargoBooking() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const quoteResult = location.state?.quote as CargoQuoteResponse;
  const requestDetails = location.state?.request;

  // Sender details (pre-filled from profile)
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderTelegram, setSenderTelegram] = useState('');

  // Recipient details
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'flutterwave'>('paystack');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);

  const paystackConfig = {
    reference: (new Date()).getTime().toString(),
    email: user?.email || '',
    amount: (quoteResult?.totalNGN || 0) * 100, // in kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
  };
  const initializePaystack = usePaystackPayment(paystackConfig);

  const flutterwaveConfig = {
    public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || '',
    tx_ref: Date.now().toString(),
    amount: quoteResult?.totalFCFA || 0,
    currency: 'XAF',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: user?.email || '',
      phone_number: senderPhone,
      name: senderName || user?.email || '',
    },
    customizations: {
      title: 'Afrique-con PLC',
      description: 'Payment for Cargo Booking',
      logo: 'https://via.placeholder.com/150',
    },
  };
  const handleFlutterwave = useFlutterwave(flutterwaveConfig);

  useEffect(() => {
    if (!quoteResult) {
      navigate('/');
      return;
    }
    // Pre-fill sender details from profile
    if (user) {
      supabase
        .from('profiles')
        .select('full_name, phone, email, telegram_id')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setSenderName(data.full_name || '');
            setSenderPhone(data.phone || '');
            setSenderTelegram(data.telegram_id || '');
          }
          setProfileLoading(false);
        });
    } else {
      setProfileLoading(false);
    }
  }, [quoteResult, navigate, user]);

  if (!quoteResult) return null;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to complete a booking.');
      return;
    }
    if (!senderName || !senderPhone) {
      setError('Please fill in the sender name and phone number.');
      return;
    }
    if (!recipientName || !recipientPhone || !deliveryAddress) {
      setError('Please fill in all recipient details.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newBookingId = `AFCON-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      const { error: dbError } = await supabase.from('cargo_bookings').insert([{
        booking_id: newBookingId,
        user_id: user.id,
        quote_id: quoteResult.quoteId,
        origin: requestDetails?.origin || 'Unknown',
        destination: requestDetails?.destination || 'Unknown',
        weight_kg: requestDetails?.weightKg || 0,
        cargo_type: requestDetails?.cargoType || 'general',
        is_express: quoteResult.isExpress,
        base_rate_fcfa: quoteResult.baseFCFA,
        surcharges_fcfa: quoteResult.surchargesFCFA,
        discounts_fcfa: quoteResult.discountsFCFA,
        total_fcfa: quoteResult.totalFCFA,
        currency_used: 'FCFA',
        customer_name: senderName,
        customer_email: user.email,
        customer_phone: senderPhone,
        customer_telegram_id: senderTelegram,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        delivery_address: deliveryAddress,
        status: 'pending',
        payment_status: 'pending',
      }]);

      if (dbError) throw dbError;

      // ─── Payment Gateway Trigger ───
      const onSuccess = async () => {
        // Update DB to paid
        await supabase.from('cargo_bookings').update({ payment_status: 'paid' }).eq('booking_id', newBookingId);
        setBookingId(newBookingId);
        setSuccess(true);
      };

      const onClose = () => {
        // Payment modal closed without success
        setIsSubmitting(false);
      };

      if (paymentMethod === 'paystack') {
        initializePaystack({
          onSuccess,
          onClose
        });
      } else {
        handleFlutterwave({
          callback: (response) => {
            if (response.status === 'successful') {
              onSuccess();
            } else {
              onClose();
            }
            closePaymentModal();
          },
          onClose: () => {
            onClose();
          }
        });
      }

    } catch (err: any) {
      console.error('Cargo Booking Error:', err);
      setError(err.message || t('cargoBooking.error', 'An error occurred while saving the booking.'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center px-4 py-16">
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-green-100 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>
          <h2 className="text-3xl font-display font-bold mb-2 text-gray-900">{t('cargoBooking.successTitle')}</h2>
          <p className="text-gray-500 mb-6">{t('cargoBooking.successMsg')}</p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('cargoBooking.quoteRef')}</span>
              <span className="font-mono font-bold text-primary">{bookingId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('cargoBooking.route')}</span>
              <span className="font-semibold">{requestDetails?.origin} → {requestDetails?.destination}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('cargoBooking.weight')}</span>
              <span className="font-semibold">{requestDetails?.weightKg} kg</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-3 mt-1">
              <span className="text-gray-500 font-bold">{t('cargoBooking.totalPaid')}</span>
              <span className="font-bold text-lg text-primary">{quoteResult.totalFCFA.toLocaleString()} FCFA</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-6">
            Payment completed successfully using {paymentMethod === 'paystack' ? 'Paystack' : 'Flutterwave'}.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="flex-1 bg-primary text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              {t('cargoBooking.viewShipments')}
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
            >
              {t('cargoBooking.backHome')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary font-semibold mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4" /> {t('cargoBooking.back')}
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="md:col-span-2 space-y-6">

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {!user && (
              <div className="p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg">
                <p className="font-semibold">{t('cargoBooking.notLoggedIn')}</p>
                <p className="text-sm mt-1">{t('cargoBooking.loginToBook')}</p>
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-6">
              {/* Sender Details */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 border-b pb-3">
                  <User className="w-5 h-5 text-primary" />
                  {t('cargoBooking.senderDetails')}
                </h3>
                {profileLoading ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading your profile...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('cargoBooking.fullName')}</label>
                      <input
                        required type="text"
                        value={senderName}
                        onChange={e => setSenderName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('cargoBooking.phone')}</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          required type="tel"
                          value={senderPhone}
                          onChange={e => setSenderPhone(e.target.value)}
                          placeholder="+237 600 000 000"
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('cargoBooking.telegramId')}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                        <input
                          type="text"
                          value={senderTelegram}
                          onChange={e => setSenderTelegram(e.target.value)}
                          placeholder="Afriquecon"
                          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <p className="text-xs text-primary font-medium mt-1">{t('cargoBooking.telegramHint')}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Recipient Details */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 border-b pb-3">
                  <Package className="w-5 h-5 text-primary" />
                  {t('cargoBooking.recipientDetails')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('cargoBooking.recipientName')}</label>
                    <input
                      required type="text"
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      placeholder="Recipient's full name"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('cargoBooking.recipientPhone')}</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        required type="tel"
                        value={recipientPhone}
                        onChange={e => setRecipientPhone(e.target.value)}
                        placeholder="+234 800 000 0000"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Home className="inline w-4 h-4 mr-1" /> {t('cargoBooking.deliveryAddress')}
                  </label>
                  <textarea
                    required rows={3}
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    placeholder={t('cargoBooking.addressPlaceholder')}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 border-b pb-3">
                  <CreditCard className="w-5 h-5 text-primary" />
                  {t('cargoBooking.paymentMethod')}
                </h3>
                <div className="flex gap-4">
                  <label className={`flex-1 border-2 p-4 rounded-xl cursor-pointer flex items-center gap-2 transition-colors ${paymentMethod === 'paystack' ? 'border-primary bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="payment" value="paystack" checked={paymentMethod === 'paystack'} onChange={() => setPaymentMethod('paystack')} className="text-primary" />
                    <span className="font-semibold">{t('cargoBooking.payPaystack')}</span>
                  </label>
                  <label className={`flex-1 border-2 p-4 rounded-xl cursor-pointer flex items-center gap-2 transition-colors ${paymentMethod === 'flutterwave' ? 'border-primary bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="payment" value="flutterwave" checked={paymentMethod === 'flutterwave'} onChange={() => setPaymentMethod('flutterwave')} className="text-primary" />
                    <span className="font-semibold">{t('cargoBooking.payFlutterwave')}</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={!user || isSubmitting}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> {t('cargoBooking.processing')}</>
                ) : (
                  <><Truck className="w-5 h-5" /> {t('cargoBooking.confirmPay')} — {quoteResult.totalFCFA.toLocaleString()} FCFA</>
                )}
              </button>
            </form>
          </div>

          {/* Summary Sidebar */}
          <div>
            <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg sticky top-24 space-y-4">
              <h3 className="text-xl font-display font-bold">Shipment Summary</h3>

              <div className="bg-gray-800 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 text-blue-300 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="font-semibold">{requestDetails?.origin} → {requestDetails?.destination}</span>
                </div>
                <div className="text-gray-400 text-xs">{requestDetails?.weightKg} kg · {requestDetails?.cargoType === 'heavy_equipment' ? t('home.heavyEquipment') : t('home.generalGoods')}</div>
                {quoteResult.isExpress && (
                  <span className="mt-2 inline-block bg-orange-500 text-white text-xs px-2 py-0.5 rounded font-bold">{t('home.express')}</span>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>{t('home.baseRate')}</span>
                  <span>{quoteResult.baseFCFA.toLocaleString()} FCFA</span>
                </div>
                {quoteResult.surchargesFCFA > 0 && (
                  <div className="flex justify-between text-orange-300">
                    <span>{t('home.surcharges')}</span>
                    <span>+ {quoteResult.surchargesFCFA.toLocaleString()} FCFA</span>
                  </div>
                )}
                {quoteResult.discountsFCFA > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>{t('home.discounts')}</span>
                    <span>- {quoteResult.discountsFCFA.toLocaleString()} FCFA</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between font-bold text-xl text-white">
                  <span>{t('home.totalFCFA')}</span>
                  <span>{quoteResult.totalFCFA.toLocaleString()} FCFA</span>
                </div>
                <div className="text-right text-gray-400 text-sm mt-1">~ ₦ {quoteResult.totalNGN.toLocaleString()}</div>
              </div>

              <div className="text-xs text-gray-500 bg-gray-800 p-3 rounded-lg">
                📦 Quote valid until {new Date(quoteResult.expiresAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
