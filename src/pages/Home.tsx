import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CoverageMap from '../components/CoverageMap';
import {
  ArrowRight, Package, Users, MapPin, Search,
  AlertCircle, CheckCircle, Star, Zap, Shield,
  Clock, TrendingUp, ChevronDown
} from 'lucide-react';
import { cargoService } from '../services/cargoService';
import type { CargoQuoteResponse } from '../services/cargoService';
import AIChatWidget from '../components/AIChatWidget';

const STATS = [
  { value: '2,400+', label: 'Shipments Delivered', icon: <Package className="w-5 h-5" /> },
  { value: '98%',    label: 'On-Time Rate',        icon: <Clock className="w-5 h-5" /> },
  { value: '2',      label: 'Countries Connected', icon: <TrendingUp className="w-5 h-5" /> },
  { value: '24/7',   label: 'Telegram Support',    icon: <Shield className="w-5 h-5" /> },
];

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const initialMode = location.pathname.includes('passenger') ? 'passenger' : 'cargo';
  const [serviceMode, setServiceMode] = useState<'cargo' | 'passenger'>(initialMode);

  useEffect(() => {
    if (location.pathname.includes('passenger')) setServiceMode('passenger');
    else if (location.pathname.includes('cargo')) setServiceMode('cargo');
  }, [location.pathname]);

  // Cargo state
  const [cargoOrigin, setCargoOrigin] = useState('Douala');
  const [cargoDestination, setCargoDestination] = useState('Lagos');
  const [cargoType, setCargoType] = useState<'general' | 'heavy_equipment'>('general');
  const [cargoWeight, setCargoWeight] = useState<string>('');
  const [isExpress, setIsExpress] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteResult, setQuoteResult] = useState<CargoQuoteResponse | null>(null);

  // Passenger state
  const [passengerOrigin, setPassengerOrigin] = useState('Douala');
  const [passengerDestination, setPassengerDestination] = useState('Lagos');
  const [passengerDate, setPassengerDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [adultCount, setAdultCount] = useState<number>(1);
  const [childCount, setChildCount] = useState<number>(0);
  const [passengerError, setPassengerError] = useState<string | null>(null);

  // Nigerian origin cities — departures to Cameroon only on Tuesdays (2) & Fridays (5)
  const NIGERIA_CITIES = ['Lagos', 'Abuja', 'Ikom', 'Enugu', 'Abakaliki', 'Onitsha'];
  const CAMEROON_CITIES = ['Yaoundé', 'Douala', 'Buea', 'Kumba', 'Mamfe'];

  const isNigeriaToCamera = NIGERIA_CITIES.includes(passengerOrigin) && CAMEROON_CITIES.includes(passengerDestination);

  // FAQ open state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handlePassengerSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPassengerError(null);
    if (!passengerOrigin || !passengerDestination || !passengerDate) return;

    if (isNigeriaToCamera) {
      // Use UTC date to avoid timezone shifting the day
      const [year, month, day] = passengerDate.split('-').map(Number);
      const dayOfWeek = new Date(year, month - 1, day).getDay(); // 0=Sun,2=Tue,5=Fri
      if (dayOfWeek !== 2 && dayOfWeek !== 5) {
        setPassengerError('Departures from Nigeria to Cameroon are only available on Tuesdays and Fridays. Please select a valid date.');
        return;
      }
    }

    const passengerCount = adultCount + childCount;
    navigate(`/passenger/results?origin=${passengerOrigin}&destination=${passengerDestination}&date=${passengerDate}&passengers=${passengerCount}&adults=${adultCount}&children=${childCount}`);
  };

  const handleCargoQuote = (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteError(null);
    setQuoteResult(null);
    const weightKg = parseFloat(cargoWeight);
    if (isNaN(weightKg) || weightKg <= 0) {
      setQuoteError(t('home.weight') + ': ' + t('errors.invalidWeight', 'Please enter a valid weight.') + (isExpress ? ' (Max 50kg for Express)' : ''));
      return;
    }
    if (isExpress && weightKg > 50) {
      setQuoteError(t('errors.expressWeight', 'Express cargo weight cannot exceed 50kg.'));
      return;
    }
    try {
      const quote = cargoService.calculateQuote({ origin: cargoOrigin, destination: cargoDestination, weightKg, cargoType, isExpress });
      setQuoteResult(quote);
    } catch (err: any) {
      setQuoteError(err.message || 'An error occurred while calculating the quote.');
    }
  };

  const inputCls = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all text-slate-800 font-medium appearance-none";
  const labelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col">

      {/* ─── HERO SECTION ─── */}
      <section className="relative overflow-hidden hero-gradient pt-16 pb-40">
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-amber-400/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-400/5 rounded-full blur-3xl" style={{ animationDelay: '1s' }} />
          {/* Dot grid pattern */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle, rgba(245,158,11,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
        </div>

        <div className="relative container mx-auto px-4 lg:px-6 text-center max-w-4xl">
          {/* Top badge */}
          <div className="inline-flex items-center gap-2 bg-teal-400/15 border border-teal-400/30 text-teal-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            {t('home.telegramBadge')}
          </div>

          <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white mb-5 leading-tight animate-fade-up" style={{ animationDelay: '0.1s' }}>
            {t('home.heroTitle').split(' ').slice(0, -2).join(' ')}{' '}
            <span className="gradient-text">{t('home.heroTitle').split(' ').slice(-2).join(' ')}</span>
          </h1>

          <p className="text-base md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.2s' }}>
            {t('home.heroSubtitle')}
          </p>

          {/* Service Switcher */}
          <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-1.5 max-w-xs mx-auto flex border border-white/15 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            {/* sliding indicator */}
            <div
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-3px)] rounded-xl bg-amber-400 transition-all duration-300 ease-in-out"
              style={{ left: serviceMode === 'cargo' ? '6px' : 'calc(50% + 0px)' }}
            />
            <button
              onClick={() => { setServiceMode('cargo'); setQuoteResult(null); }}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${serviceMode === 'cargo' ? 'text-[#0A1628]' : 'text-slate-300 hover:text-white'}`}
            >
              <Package className="w-4 h-4" />
              {t('home.shipCargo')}
            </button>
            <button
              onClick={() => setServiceMode('passenger')}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${serviceMode === 'passenger' ? 'text-[#0A1628]' : 'text-slate-300 hover:text-white'}`}
            >
              <Users className="w-4 h-4" />
              {t('home.bookTravel')}
            </button>
          </div>
        </div>
      </section>

      {/* ─── FLOATING FORM CARD ─── */}
      <section className="flex-grow container mx-auto px-4 lg:px-6">
        <div className="max-w-4xl mx-auto -mt-28 relative z-10">
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/15 overflow-hidden border border-slate-100 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <div className="p-8">
              {serviceMode === 'cargo' ? (
                <div>
                  <div className="flex items-center gap-3 mb-7">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/15 flex items-center justify-center">
                      <Package className="w-5 h-5 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-slate-900">{t('home.cargoTitle')}</h2>
                  </div>

                  {quoteResult ? (
                    <div className="animate-fade-up">
                      {/* Quote Result */}
                      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-amber-400/20">
                        <div className="flex justify-between items-start mb-5">
                          <div>
                            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">Quote Reference</p>
                            <h3 className="text-lg font-bold text-white font-mono">{quoteResult.quoteId}</h3>
                            <p className="text-xs text-slate-500 mt-1">Expires: {new Date(quoteResult.expiresAt).toLocaleString()}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${quoteResult.isExpress ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-teal-400/20 text-teal-300 border border-teal-400/30'}`}>
                            {quoteResult.isExpress ? <><Zap className="w-3 h-3 inline mr-1" />{t('home.express')}</> : t('home.standard')}
                          </span>
                        </div>

                        <div className="space-y-2.5 mb-6 text-sm">
                          <div className="flex justify-between text-slate-300">
                            <span>{t('home.baseRate')}</span>
                            <span>{quoteResult.baseFCFA.toLocaleString()} FCFA</span>
                          </div>
                          {quoteResult.status === 'PENDING_REVIEW' && (
                            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                              <p className="text-sm font-medium text-amber-800">{quoteResult.message}</p>
                            </div>
                          )}
                          <div className="border-t border-white/15 pt-3 mt-2 flex justify-between font-bold text-xl text-white">
                            <span>{t('home.totalFCFA')}</span>
                            <span>{quoteResult.totalFCFA.toLocaleString()} FCFA</span>
                          </div>
                          <div className="flex justify-between text-slate-500 text-xs">
                            <span>{t('home.equivalentNGN')}</span>
                            <span>₦ {quoteResult.totalNGN.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => setQuoteResult(null)}
                            className="flex-1 bg-white/10 hover:bg-white/15 text-white py-3 rounded-xl font-semibold transition-colors border border-white/15"
                          >
                            {t('home.recalculate')}
                          </button>
                          <button
                            onClick={() => navigate('/cargo/booking', { state: { quote: quoteResult, request: { origin: cargoOrigin, destination: cargoDestination, weightKg: parseFloat(cargoWeight), cargoType } } })}
                            className="flex-1 bg-amber-400 hover:bg-amber-300 text-[#0A1628] py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2 shadow-lg shadow-amber-400/30"
                          >
                            {t('home.bookNow')}
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleCargoQuote}>
                      {quoteError && (
                        <div className="mb-5 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 border border-red-100">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          {quoteError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className={labelCls}>{t('home.origin')}</label>
                          <div className="relative">
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500 w-4 h-4" />
                            <select value={cargoOrigin} onChange={e => setCargoOrigin(e.target.value)} className={`${inputCls} pl-10`}>
                              <optgroup label="Cameroon">
                                <option>Douala</option>
                                <option>Yaoundé</option>
                                <option>Buea</option>
                                <option>Kumba</option>
                                <option>Mamfe</option>
                              </optgroup>
                              <optgroup label="Nigeria">
                                <option>Lagos</option>
                                <option>Abuja</option>
                                <option>Ikom</option>
                                <option>Enugu</option>
                                <option>Abakaliki</option>
                                <option>Onitsha</option>
                              </optgroup>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>{t('home.destination')}</label>
                          <div className="relative">
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-500 w-4 h-4" />
                            <select value={cargoDestination} onChange={e => setCargoDestination(e.target.value)} className={`${inputCls} pl-10`}>
                              <optgroup label="Cameroon">
                                <option>Douala</option>
                                <option>Yaoundé</option>
                                <option>Buea</option>
                                <option>Kumba</option>
                                <option>Mamfe</option>
                              </optgroup>
                              <optgroup label="Nigeria">
                                <option>Lagos</option>
                                <option>Abuja</option>
                                <option>Ikom</option>
                                <option>Enugu</option>
                                <option>Abakaliki</option>
                                <option>Onitsha</option>
                              </optgroup>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>{t('home.cargoType')}</label>
                          <select value={cargoType} onChange={e => setCargoType(e.target.value as any)} className={inputCls}>
                            <option value="general">{t('home.generalGoods')}</option>
                            <option value="heavy_equipment">{t('home.heavyEquipment')}</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>
                            {t('home.weight')}
                            {isExpress && <span className="text-amber-600 ml-1 lowercase font-bold tracking-normal">(Max 50kg)</span>}
                          </label>
                          <input
                            type="number"
                            value={cargoWeight}
                            onChange={e => setCargoWeight(e.target.value)}
                            placeholder={t('home.weightPlaceholder')}
                            className={inputCls}
                          />
                        </div>
                      </div>

                      <div className="mt-5 flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer group" onClick={() => setIsExpress(!isExpress)}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isExpress ? 'bg-amber-400 border-amber-400' : 'bg-white border-slate-300 group-hover:border-amber-400'}`}>
                          {isExpress && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        <input type="checkbox" id="express" checked={isExpress} onChange={e => setIsExpress(e.target.checked)} className="sr-only" />
                        <div>
                          <label htmlFor="express" className="text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-amber-500" />
                            {t('home.expressBooking')}
                          </label>
                          <p className="text-xs text-slate-500">Priority handling &amp; faster delivery (Max 50kg)</p>
                        </div>
                      </div>

                      <button type="submit" className="mt-6 w-full bg-[#0A1628] hover:bg-[#1a2d4e] text-white py-4 rounded-xl font-bold text-base transition-all flex justify-center items-center gap-2 shadow-xl shadow-slate-900/20 group">
                        {t('home.calculateQuote')}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-7">
                    <div className="w-10 h-10 rounded-xl bg-teal-400/15 flex items-center justify-center">
                      <Users className="w-5 h-5 text-teal-500" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-slate-900">{t('home.passengerTitle')}</h2>
                  </div>
                  <form onSubmit={handlePassengerSearch}>
                    {passengerError && (
                      <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 border border-red-100 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {passengerError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={labelCls}>{t('home.from')}</label>
                        <div className="relative">
                          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-500 w-4 h-4" />
                          <select value={passengerOrigin} onChange={e => { setPassengerOrigin(e.target.value); setPassengerError(null); }} className={`${inputCls} pl-10`}>
                            <optgroup label="Cameroon">
                              <option>Douala</option>
                              <option>Yaoundé</option>
                              <option>Buea</option>
                              <option>Kumba</option>
                              <option>Mamfe</option>
                            </optgroup>
                            <optgroup label="Nigeria">
                              <option>Lagos</option>
                              <option>Abuja</option>
                              <option>Ikom</option>
                              <option>Enugu</option>
                              <option>Abakaliki</option>
                              <option>Onitsha</option>
                            </optgroup>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>{t('home.to')}</label>
                        <div className="relative">
                          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500 w-4 h-4" />
                          <select value={passengerDestination} onChange={e => { setPassengerDestination(e.target.value); setPassengerError(null); }} className={`${inputCls} pl-10`}>
                            <optgroup label="Cameroon">
                              <option>Douala</option>
                              <option>Yaoundé</option>
                              <option>Buea</option>
                              <option>Kumba</option>
                              <option>Mamfe</option>
                            </optgroup>
                            <optgroup label="Nigeria">
                              <option>Lagos</option>
                              <option>Abuja</option>
                              <option>Ikom</option>
                              <option>Enugu</option>
                              <option>Abakaliki</option>
                              <option>Onitsha</option>
                            </optgroup>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>
                          {t('home.date')}
                          {isNigeriaToCamera && <span className="ml-2 text-teal-600 font-bold normal-case tracking-normal">(Tue & Fri only)</span>}
                        </label>
                        <input type="date" required value={passengerDate} onChange={e => { setPassengerDate(e.target.value); setPassengerError(null); }} className={inputCls} />
                        {isNigeriaToCamera && (
                          <p className="mt-1.5 text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                            🗓️ Nigeria → Cameroon departures run every <strong>Tuesday</strong> and <strong>Friday</strong>.
                          </p>
                        )}
                      </div>
                      <div>
                        <label className={labelCls}>{t('home.passengers')}</label>
                        <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">Adult</span>
                            <div className="flex items-center gap-3">
                              <button type="button" onClick={() => setAdultCount(Math.max(1, adultCount - 1))} className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors">-</button>
                              <span className="w-4 text-center text-sm font-bold text-slate-800">{adultCount}</span>
                              <button type="button" onClick={() => setAdultCount(adultCount + 1)} className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors">+</button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">Child (2-5 yrs)</span>
                            <div className="flex items-center gap-3">
                              <button type="button" onClick={() => setChildCount(Math.max(0, childCount - 1))} className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors">-</button>
                              <span className="w-4 text-center text-sm font-bold text-slate-800">{childCount}</span>
                              <button type="button" onClick={() => setChildCount(childCount + 1)} className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors">+</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button type="submit" className="mt-6 w-full bg-teal-500 hover:bg-teal-400 text-white py-4 rounded-xl font-bold text-base transition-all flex justify-center items-center gap-2 shadow-xl shadow-teal-500/20 group">
                      <Search className="w-5 h-5" />
                      {t('home.searchTrips')}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Help strip */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-4 flex items-center justify-between border-t border-white/5">
              <div>
                <p className="text-sm font-semibold text-white">{t('home.needHelp')}</p>
                <p className="text-xs text-slate-400">{t('home.supportSubtitle')}</p>
              </div>
              <a href="https://t.me/Afriquecon_bot" target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-teal-400 hover:text-teal-300 font-bold text-sm transition-colors group">
                {t('home.openTelegram')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS STRIP ─── */}
      <section className="py-16 px-4 lg:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 text-center border border-slate-100 shadow-sm card-hover">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center mx-auto mb-3 text-amber-500">
                  {stat.icon}
                </div>
                <div className="text-2xl font-display font-extrabold text-slate-900">{stat.value}</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COVERAGE MAP ─── */}
      <section className="py-16 bg-white border-y border-slate-100 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 text-amber-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              <MapPin className="w-4 h-4" /> Coverage
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-slate-900 mb-4">{t('home.mapTitle')}</h2>
            <p className="text-slate-500 max-w-xl mx-auto">{t('home.mapSubtitle')}</p>
          </div>
          <CoverageMap />
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-20 px-4 sm:px-6 bg-[#F4F6FA]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-teal-400/10 border border-teal-400/20 text-teal-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              <Star className="w-4 h-4 fill-teal-500" /> Customer Stories
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-slate-900 mb-4">{t('home.testimonialsTitle')}</h2>
            <p className="text-slate-500 max-w-xl mx-auto">{t('home.testimonialsSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: t('home.t1name'), role: t('home.t1role'), text: t('home.t1text'), service: t('home.t1service'), initials: 'AE' },
              { name: t('home.t2name'), role: t('home.t2role'), text: t('home.t2text'), service: t('home.t2service'), initials: 'MC' },
              { name: t('home.t3name'), role: t('home.t3role'), text: t('home.t3text'), service: t('home.t3service'), initials: 'FO' },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm card-hover group">
                <div className="flex gap-1 mb-5">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-slate-600 mb-6 italic leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{testimonial.name}</p>
                    <p className="text-xs text-slate-500">{testimonial.role} · <span className="text-teal-600 font-medium">{testimonial.service}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faqs" className="py-20 bg-[#0A1628] text-white px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-30" style={{
          backgroundImage: 'radial-gradient(circle, rgba(245,158,11,0.15) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        <div className="relative max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/25 text-amber-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              FAQ
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold mb-3">{t('home.faqTitle')}</h2>
            <p className="text-slate-400">{t('home.faqSubtitle')}</p>
          </div>
          <div className="space-y-3">
            {[
              { q: t('home.faq1q'), a: t('home.faq1a') },
              { q: t('home.faq2q'), a: t('home.faq2a') },
              { q: t('home.faq3q'), a: t('home.faq3a') },
              { q: t('home.faq4q'), a: t('home.faq4a') },
            ].map((faq, i) => (
              <div key={i} className={`rounded-2xl border transition-all duration-200 overflow-hidden ${openFaq === i ? 'border-amber-400/40 bg-amber-400/5' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                <button
                  className="w-full flex items-center justify-between px-6 py-5 cursor-pointer font-semibold text-left text-slate-100"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-amber-400 flex-shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`transition-all duration-300 ${openFaq === i ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                  <div className="px-6 pb-5 text-slate-400 text-sm leading-relaxed border-t border-white/10 pt-4">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <AIChatWidget />
    </div>
  );
}
