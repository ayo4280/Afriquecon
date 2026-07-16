import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { supabase } from '../../lib/supabase';
import { passengerService } from '../../services/passengerService';
import type { TripSchedule, TicketType, PassengerPricingResponse } from '../../services/passengerService';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePaystackPayment } from 'react-paystack';
import TermsModal from '../../components/TermsModal';

export default function PassengerBooking() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  const trip = location.state?.trip as TripSchedule;
  const passengersCount = location.state?.passengers as number || 1;
  const adults = location.state?.adults as number || 1;
  const children = location.state?.children as number || 0;
  const selectedSeats = location.state?.selectedSeats as number[];

  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'flutterwave'>('paystack');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentReference] = useState(() => `AC-${crypto.randomUUID()}`);

  // Array of passenger details state
  const [passengerDetails, setPassengerDetails] = useState<{name: string, idNumber: string, ticketType: TicketType, extraLuggage: number, isNigerian: boolean, telegramId?: string}[]>([]);
  const [pricingResults, setPricingResults] = useState<PassengerPricingResponse[]>([]);

  useEffect(() => {
    if (!trip || !selectedSeats || selectedSeats.length === 0) {
      navigate('/');
      return;
    }
    
    // Initialize passenger details based on count
    if (passengerDetails.length === 0) {
      const initialDetails = Array.from({length: passengersCount}).map((_, index) => ({
        name: '',
        idNumber: '',
        ticketType: (index < adults ? 'adult' : 'child_under_5') as TicketType,
        extraLuggage: 0,
        isNigerian: true,
        telegramId: ''
      }));
      setPassengerDetails(initialDetails);
    }
  }, [trip, selectedSeats, passengersCount, adults, children, navigate, passengerDetails.length]);

  // Recalculate pricing whenever passenger details change
  useEffect(() => {
    if (passengerDetails.length === 0 || !trip) return;
    
    const newPricing = passengerDetails.map(p => passengerService.calculatePricing({
      baseFareFCFA: trip.baseFareFCFA,
      baseFareFCFANonNigerian: trip.baseFareFCFANonNigerian,
      ticketType: p.ticketType,
      isNigerian: p.isNigerian,
      extraLuggageKg: p.extraLuggage
    }));
    
    setPricingResults(newPricing);
  }, [passengerDetails, trip]);

  const handleDetailChange = (index: number, field: string, value: any) => {
    const updated = [...passengerDetails];
    updated[index] = { ...updated[index], [field]: value };
    setPassengerDetails(updated);
  };

  const totalFCFA = pricingResults.reduce((sum, res) => sum + res.finalPriceFCFA, 0);
  const totalNGN = pricingResults.reduce((sum, res) => sum + res.finalPriceNGN, 0);

  const paystackConfig = {
    reference: paymentReference,
    email: user?.email || '',
    amount: totalNGN * 100, // in kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
  };
  const initializePaystack = usePaystackPayment(paystackConfig);

  // Payment hooks must run on every render. Only render the booking UI after
  // they have been initialised, so a direct visit without route state is safe.
  if (!trip) return null;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to complete a booking.");
      return;
    }
    if (!acceptedTerms) {
      setError("You must accept the Terms and Conditions to proceed.");
      return;
    }

    // Validation
    for (let i = 0; i < passengerDetails.length; i++) {
      if (!passengerDetails[i].name) {
        setError(`Please enter the name for Passenger ${i+1}`);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create ticket records
      const recordsToInsert = passengerDetails.map((p, i) => {
        const ticketId = `TKT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        const pricing = pricingResults[i];
        
        return {
          ticket_id: ticketId,
          user_id: user.id,
          schedule_id: trip.scheduleId,
          passenger_name: p.name,
          passenger_telegram_id: p.telegramId ? p.telegramId.replace(/^@+/, '') : null, // Fix: save to DB so trigger can notify user
          id_number: p.idNumber || null,
          extra_luggage_kg: p.extraLuggage,
          ticket_type: p.ticketType,
          is_nigerian: p.isNigerian,
          seat_number: selectedSeats[i].toString(),
          base_fare_fcfa: pricing.baseFareFCFA,
          discount_fcfa: pricing.discountAmountFCFA,
          discount_percent: pricing.discountPercent,
          luggage_fee_fcfa: pricing.extraLuggageFeeFCFA,
          total_fcfa: pricing.finalPriceFCFA,
          final_price_fcfa: pricing.finalPriceFCFA,
          payment_status: 'pending',
          payment_reference: paymentReference,
        };
      });

      const { error: dbError } = await supabase.functions.invoke('create-passenger-reservation', {
        body: { paymentReference, tickets: recordsToInsert },
      });

      if (dbError) throw dbError;

      // ─── Payment Gateway Trigger ───
      const ticketIds = recordsToInsert.map(t => t.ticket_id);
      
      const onSuccess = async () => {
        setSuccess(true);
      };

      const onClose = () => {
        // Payment modal closed without success
        setIsSubmitting(false);
      };

      const { data: intent, error: intentError } = await supabase.functions.invoke('create-payment-intent', {
        body: { provider: paymentMethod, bookingType: 'passenger', reference: paymentReference, ticketIds },
      });
      if (intentError) throw intentError;

      if (paymentMethod === 'paystack') {
        initializePaystack({
          onSuccess,
          onClose
        });
      } else {
        if (!intent?.checkoutUrl) throw new Error('Unable to start Flutterwave checkout.');
        window.location.assign(intent.checkoutUrl);
      }

    } catch (err: any) {
      console.error("Booking Error:", err);
      const msg = err.message || t('cargoBooking.error', "An error occurred while saving the tickets.");
      setError(msg);
      alert("Error: " + msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsSubmitting(false);
    }
  };


  if (success) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-green-100">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('passengerBooking.bookingInitiated')}</h2>
          <p className="text-gray-600 mb-6">
            Your {passengersCount} ticket(s) are reserved. Your payment was submitted and will be confirmed automatically after verification.
          </p>

          <a href="https://t.me/AfriqueCon_Bot" target="_blank" rel="noopener noreferrer" className="block w-full bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold py-3 px-4 rounded-xl mb-4 transition-colors flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.674c.223-.198-.054-.309-.346-.116l-6.405 4.02-2.766-.86c-.6-.188-.614-.6.126-.89l10.816-4.17c.504-.18.948.112.787.89h-.001z"/></svg>
            Click here to get live tracking updates on Telegram!
          </a>

          <div className="flex gap-3">
            <button onClick={() => navigate('/profile')} className="flex-1 bg-[#0A1628] text-white py-3 rounded-xl font-bold hover:bg-[#1a2d4e] transition-colors">
              View E-Tickets
            </button>
            <button onClick={() => navigate('/')} className="flex-1 bg-slate-100 text-slate-800 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">
              {t('passengerBooking.returnHome')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary font-semibold mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4" /> {t('passengerBooking.back')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-display font-bold mb-6 text-gray-800">{t('passengerBooking.title')}</h2>
              
              {!user && (
                <div className="mb-6 p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg">
                  <p className="font-semibold">{t('passengerBooking.notLoggedIn')}</p>
                  <p className="text-sm mt-1">{t('passengerBooking.loginDetail')}</p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              <form onSubmit={handleBooking} className="space-y-8">
                {passengerDetails.map((p, index) => (
                  <div key={index} className="border p-6 rounded-lg bg-gray-50 border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      {t('passengerBooking.seat')} {selectedSeats[index]}
                    </div>
                    <h3 className="text-lg font-bold mb-4 border-b pb-2">{t('passengerBooking.passenger')} {index + 1}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('cargoBooking.fullName')}</label>
                        <input 
                          required
                          type="text" 
                          value={p.name}
                          onChange={e => handleDetailChange(index, 'name', e.target.value)}
                          className="w-full px-4 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('passengerBooking.idNumber')}</label>
                        <input 
                          type="text" 
                          value={p.idNumber}
                          onChange={e => handleDetailChange(index, 'idNumber', e.target.value)}
                          placeholder="National ID / Passport"
                          className="w-full px-4 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('passengerBooking.ticketType')}</label>
                        <select 
                          value={p.ticketType}
                          onChange={e => handleDetailChange(index, 'ticketType', e.target.value)}
                          className="w-full px-4 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="adult">Adult</option>
                          <option value="student">Student</option>
                          <option value="senior">Senior</option>
                          <option value="child_under_5">Child (2-5 years) - 30% Off</option>
                          <option value="child_under_2">Child (Under 2) - Free</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('passengerBooking.luggageKg', 'Luggage (kg)')}</label>
                        <input 
                          type="number"
                          min={0}
                          value={p.extraLuggage}
                          onChange={e => handleDetailChange(index, 'extraLuggage', parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary" 
                        />
                        <p className="text-xs text-gray-500 mt-1">20kg free, +1000 FCFA/kg above</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center">
                      <input 
                        type="checkbox"
                        id={`isNigerian-${index}`}
                        checked={p.isNigerian}
                        onChange={e => handleDetailChange(index, 'isNigerian', e.target.checked)}
                        className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor={`isNigerian-${index}`} className="text-sm font-medium text-gray-700">Passenger is a Nigerian Citizen</label>
                    </div>
                    
                    {index === 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        {/* Telegram Bot Notice */}
                        <div className="mb-3 flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl p-3.5">
                          <span className="text-2xl leading-none mt-0.5">📣</span>
                          <div>
                            <p className="text-sm font-bold text-amber-800">Action Required for Telegram Updates</p>
                            <p className="text-xs text-amber-700 mt-0.5">
                              To receive your booking confirmation and tracking updates on Telegram, you must first{' '}
                              <a href="https://t.me/Afriquecon_bot" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-amber-900 hover:text-amber-700">
                                open our Telegram bot (@Afriquecon_bot) and press Start
                              </a>{' '}
                              before booking.
                            </p>
                          </div>
                        </div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('passengerBooking.telegramOptional')}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                          <input 
                            type="text" 
                            value={p.telegramId || ''} 
                            onChange={(e) => handleDetailChange(index, 'telegramId', e.target.value)} 
                            placeholder="your_telegram_username" 
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary" 
                          />
                        </div>
                        <p className="text-xs text-primary mt-1 font-medium">{t('passengerBooking.telegramHint')}</p>
                      </div>
                    )}
                  </div>
                ))}

                <div>
                  <h3 className="text-lg font-semibold border-b pb-2 mb-4">{t('cargoBooking.paymentMethod')}</h3>
                  <div className="flex gap-4">
                    <label className={`flex-1 border p-4 rounded-lg cursor-pointer flex items-center gap-2 transition-colors ${paymentMethod === 'paystack' ? 'border-primary bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" name="payment" value="paystack" checked={paymentMethod === 'paystack'} onChange={() => setPaymentMethod('paystack')} className="text-primary" />
                      <span className="font-semibold">{t('cargoBooking.payPaystack')}</span>
                    </label>
                    <label className={`flex-1 border p-4 rounded-lg cursor-pointer flex items-center gap-2 transition-colors ${paymentMethod === 'flutterwave' ? 'border-primary bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" name="payment" value="flutterwave" checked={paymentMethod === 'flutterwave'} onChange={() => setPaymentMethod('flutterwave')} className="text-primary" />
                      <span className="font-semibold">{t('cargoBooking.payFlutterwave')}</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-start gap-3 mt-6">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    required
                    checked={acceptedTerms}
                    onChange={e => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    I have read and agree to the{' '}
                    <button type="button" onClick={() => setIsTermsModalOpen(true)} className="text-primary font-bold underline decoration-primary decoration-2 underline-offset-2">
                      Terms and Conditions
                    </button>
                    .
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={!user || isSubmitting || !acceptedTerms}
                  className="w-full mt-4 bg-primary text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t('cargoBooking.processing') : `${t('passengerBooking.pay')} ${totalFCFA.toLocaleString()} FCFA`}
                </button>
              </form>
            </div>
          </div>

          {/* Summary Section */}
          <div>
            <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg sticky top-24">
              <h3 className="text-xl font-display font-bold mb-4">{t('passengerBooking.tripSummary')}</h3>
              <div className="mb-6 pb-6 border-b border-gray-700">
                <p className="font-bold">{trip.origin} &rarr; {trip.destination}</p>
                <p className="text-sm text-gray-400">{new Date(trip.departureTime).toLocaleString()}</p>
              </div>

              <div className="space-y-4 text-sm text-gray-300">
                {pricingResults.map((pr, i) => (
                  <div key={i} className="mb-4">
                    <div className="font-bold text-white mb-1">{t('passengerBooking.passenger')} {i+1} ({t('passengerBooking.seat')} {selectedSeats[i]})</div>
                    <div className="flex justify-between">
                      <span>{t('passengerBooking.baseFare')}</span>
                      <span>{pr.baseFareFCFA.toLocaleString()}</span>
                    </div>
                    {pr.discountAmountFCFA > 0 && (
                      <div className="flex justify-between text-success">
                        <span>{t('passengerBooking.discount')} ({pr.discountPercent}%)</span>
                        <span>-{pr.discountAmountFCFA.toLocaleString()}</span>
                      </div>
                    )}
                    {pr.extraLuggageFeeFCFA > 0 && (
                      <div className="flex justify-between text-orange-400">
                        <span>{t('passengerBooking.extraLuggage')}</span>
                        <span>+{pr.extraLuggageFeeFCFA.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="border-t border-gray-700 pt-3 mt-3 flex justify-between font-bold text-xl text-white">
                  <span>{t('home.totalFCFA')}</span>
                  <span>{totalFCFA.toLocaleString()} FCFA</span>
                </div>
                <div className="text-right text-gray-400 text-sm mt-1 font-semibold">
                  ~ ₦ {totalNGN.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <TermsModal 
        isOpen={isTermsModalOpen} 
        onClose={() => setIsTermsModalOpen(false)} 
        type="passenger" 
      />
    </div>
  );
}
