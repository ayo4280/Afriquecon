import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CoverageMap from '../components/CoverageMap';
import { ArrowRight, Package, Users, MapPin, Search, AlertCircle, CheckCircle, Star } from 'lucide-react';
import { cargoService } from '../services/cargoService';
import type { CargoQuoteResponse } from '../services/cargoService';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [serviceMode, setServiceMode] = useState<'cargo' | 'passenger'>('cargo');

  const [cargoOrigin, setCargoOrigin] = useState('Douala');
  const [cargoDestination, setCargoDestination] = useState('Lagos');
  const [cargoType, setCargoType] = useState<'general' | 'heavy_equipment'>('general');
  const [cargoWeight, setCargoWeight] = useState<string>('');
  const [isExpress, setIsExpress] = useState(false);
  
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteResult, setQuoteResult] = useState<CargoQuoteResponse | null>(null);

  // Passenger Form State
  const [passengerOrigin, setPassengerOrigin] = useState('Douala');
  const [passengerDestination, setPassengerDestination] = useState('Lagos');
  const [passengerDate, setPassengerDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [passengerCount, setPassengerCount] = useState<number>(1);

  const handlePassengerSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerOrigin || !passengerDestination || !passengerDate) return;
    navigate(`/passenger/results?origin=${passengerOrigin}&destination=${passengerDestination}&date=${passengerDate}&passengers=${passengerCount}`);
  };

  const handleCargoQuote = (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteError(null);
    setQuoteResult(null);

    const weightKg = parseFloat(cargoWeight);
    if (isNaN(weightKg) || weightKg <= 0) {
      setQuoteError(t('home.weight') + ': ' + t('errors.invalidWeight', 'Please enter a valid weight.'));
      return;
    }

    try {
      const quote = cargoService.calculateQuote({
        origin: cargoOrigin,
        destination: cargoDestination,
        weightKg,
        cargoType,
        isExpress
      });
      setQuoteResult(quote);
    } catch (err: any) {
      setQuoteError(err.message || "An error occurred while calculating the quote.");
    }
  };

  return (
    <div className="min-h-screen bg-neutral flex flex-col">
      {/* Hero Section */}
      <section className="bg-primary text-white py-16 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
            {t('home.heroTitle')}
          </h1>
          <p className="text-lg md:text-xl mb-6 text-blue-100">
            {t('home.heroSubtitle')}
          </p>
          <span className="inline-block mb-10 text-primary text-sm bg-blue-100 font-bold px-4 py-1.5 rounded-full border border-blue-200">
            {t('home.telegramBadge')}
          </span>
          
          {/* Dual Service Switcher */}
          <div className="bg-white rounded-lg p-1 max-w-md mx-auto flex shadow-lg">
            <button 
              onClick={() => { setServiceMode('cargo'); setQuoteResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-semibold transition-all ${serviceMode === 'cargo' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Package className="w-5 h-5" />
              {t('home.shipCargo')}
            </button>
            <button 
              onClick={() => setServiceMode('passenger')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-semibold transition-all ${serviceMode === 'passenger' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Users className="w-5 h-5" />
              {t('home.bookTravel')}
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden -mt-16 border border-gray-100">
          <div className="p-8">
            {serviceMode === 'cargo' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-display font-bold mb-6 text-gray-800">{t('home.cargoTitle')}</h2>
                
                {quoteResult ? (
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-primary">Quote: {quoteResult.quoteId}</h3>
                        <p className="text-sm text-gray-600">Expires: {new Date(quoteResult.expiresAt).toLocaleString()}</p>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold">
                        {quoteResult.isExpress ? t('home.express') : t('home.standard')}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-6 text-gray-700">
                      <div className="flex justify-between">
                        <span>{t('home.baseRate')}:</span>
                        <span>{quoteResult.baseFCFA.toLocaleString()} FCFA</span>
                      </div>
                      {quoteResult.surchargesFCFA > 0 && (
                        <div className="flex justify-between text-orange-600">
                          <span>{t('home.surcharges')}:</span>
                          <span>+ {quoteResult.surchargesFCFA.toLocaleString()} FCFA</span>
                        </div>
                      )}
                      {quoteResult.discountsFCFA > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>{t('home.discounts')}:</span>
                          <span>- {quoteResult.discountsFCFA.toLocaleString()} FCFA</span>
                        </div>
                      )}
                      <div className="border-t pt-2 mt-2 font-bold text-lg flex justify-between">
                        <span>{t('home.totalFCFA')}:</span>
                        <span>{quoteResult.totalFCFA.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold text-gray-500">
                        <span>{t('home.equivalentNGN')}:</span>
                        <span>₦ {quoteResult.totalNGN.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button onClick={() => setQuoteResult(null)} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors">
                        {t('home.recalculate')}
                      </button>
                      <button 
                        onClick={() => navigate('/cargo/booking', { state: { quote: quoteResult, request: { origin: cargoOrigin, destination: cargoDestination, weightKg: parseFloat(cargoWeight), cargoType } } })}
                        className="flex-1 bg-success text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors flex justify-center items-center gap-2 shadow-lg"
                      >
                        {t('home.bookNow')}
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCargoQuote}>
                    {quoteError && (
                      <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {quoteError}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('home.origin')}</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <select 
                            value={cargoOrigin} 
                            onChange={(e) => setCargoOrigin(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                          >
                            <option>Douala</option>
                            <option>Yaoundé</option>
                            <option>Buea</option>
                            <option>Kumba</option>
                            <option>Ikom</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('home.destination')}</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <select 
                            value={cargoDestination} 
                            onChange={(e) => setCargoDestination(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                          >
                            <option>Lagos</option>
                            <option>Abuja</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('home.cargoType')}</label>
                        <select 
                          value={cargoType} 
                          onChange={(e) => setCargoType(e.target.value as any)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="general">{t('home.generalGoods')}</option>
                          <option value="heavy_equipment">{t('home.heavyEquipment')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('home.weight')}</label>
                        <input 
                          type="number" 
                          value={cargoWeight}
                          onChange={(e) => setCargoWeight(e.target.value)}
                          placeholder={t('home.weightPlaceholder')} 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="express" 
                        checked={isExpress}
                        onChange={(e) => setIsExpress(e.target.checked)}
                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                      />
                      <label htmlFor="express" className="text-sm font-medium text-gray-700">
                        {t('home.expressBooking')}
                      </label>
                    </div>

                    <button type="submit" className="mt-8 w-full bg-primary text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-600 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-blue-500/30">
                      {t('home.calculateQuote')}
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-display font-bold mb-6 text-gray-800">{t('home.passengerTitle')}</h2>
                <form onSubmit={handlePassengerSearch}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('home.from')}</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select value={passengerOrigin} onChange={e => setPassengerOrigin(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none">
                          <option>Douala</option>
                          <option>Yaoundé</option>
                          <option>Lagos</option>
                          <option>Abuja</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('home.to')}</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select value={passengerDestination} onChange={e => setPassengerDestination(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none">
                          <option>Lagos</option>
                          <option>Abuja</option>
                          <option>Douala</option>
                          <option>Yaoundé</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('home.date')}</label>
                      <input type="date" required value={passengerDate} onChange={e => setPassengerDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('home.passengers')}</label>
                      <select value={passengerCount} onChange={e => setPassengerCount(Number(e.target.value))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                        <option value={1}>{t('home.adult1')}</option>
                        <option value={2}>{t('home.adult2')}</option>
                        <option value={3}>{t('home.adult3')}</option>
                        <option value={4}>{t('home.adult4')}</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="mt-8 w-full bg-primary text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-600 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-blue-500/30">
                    <Search className="w-5 h-5" />
                    {t('home.searchTrips')}
                  </button>
                </form>
              </div>
            )}
          </div>
          
          <div className="bg-blue-50 p-6 flex items-center justify-between border-t border-blue-100">
            <div>
              <h4 className="font-semibold text-primary">{t('home.needHelp')}</h4>
              <p className="text-sm text-gray-600">{t('home.supportSubtitle')}</p>
            </div>
            <a href="https://t.me/Afriquecon" target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">
              {t('home.openTelegram')}&rarr;
            </a>
          </div>
        </div>
      </section>

      {/* Coverage Map Section */}
      <section className="py-20 bg-gray-50 border-t border-gray-200 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">{t('home.mapTitle')}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
              {t('home.mapSubtitle')}
              <span className="block mt-4 text-blue-600 text-sm bg-blue-100 w-fit mx-auto px-5 py-2 rounded-full border border-blue-200 shadow-inner">
                {t('home.telegramBadge')}
              </span>
            </p>
          </div>
          <CoverageMap />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white border-t border-gray-200 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">{t('home.testimonialsTitle')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('home.testimonialsSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: t('home.t1name'), role: t('home.t1role'), text: t('home.t1text'), service: t('home.t1service') },
              { name: t('home.t2name'), role: t('home.t2role'), text: t('home.t2text'), service: t('home.t2service') },
              { name: t('home.t3name'), role: t('home.t3role'), text: t('home.t3text'), service: t('home.t3service') }
            ].map((testimonial, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-primary/30 transition-colors shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role} • <span className="text-primary font-medium">{testimonial.service}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-900 text-white px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold mb-4">{t('home.faqTitle')}</h2>
            <p className="text-gray-400">{t('home.faqSubtitle')}</p>
          </div>
          <div className="space-y-4">
            {[
              { q: t('home.faq1q'), a: t('home.faq1a') },
              { q: t('home.faq2q'), a: t('home.faq2a') },
              { q: t('home.faq3q'), a: t('home.faq3a') },
              { q: t('home.faq4q'), a: t('home.faq4a') }
            ].map((faq, i) => (
              <details key={i} className="group bg-gray-800 rounded-xl border border-gray-700 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer font-semibold text-lg text-gray-100">
                  {faq.q}
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-gray-400 border-t border-gray-700 pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
