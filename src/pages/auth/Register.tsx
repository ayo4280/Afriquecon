import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, Mail, Lock, User, Phone, Globe, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('CM');
  const [telegramId, setTelegramId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
          country,
          telegram_id: telegramId || null,
        },
      },
    });

    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.user) {
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    }
  };

  const inputCls = "w-full px-4 py-3 pl-11 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all text-slate-800 font-medium";
  const labelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5";

  if (success) {
    return (
      <div className="flex-grow flex items-center justify-center py-12 px-4 bg-[#F4F6FA]">
        <div className="bg-white rounded-3xl p-10 shadow-2xl border border-green-100 max-w-md w-full text-center animate-fade-up">
          <div className="w-20 h-20 bg-teal-400/15 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-teal-500" />
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">{t('auth.registerSuccess')}</h2>
          <p className="text-slate-500">{t('auth.checkEmail')}</p>
          <p className="text-sm text-slate-400 mt-2">{t('auth.redirecting')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex min-h-0">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-2/5 hero-gradient flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-teal-400/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-15" style={{
            backgroundImage: 'radial-gradient(circle, rgba(245,158,11,0.3) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }} />
        </div>
        <div className="relative">
          <img src="/logo.png" alt="Afrique-con" className="h-12 object-contain bg-white px-3 py-1.5 rounded-xl shadow-lg" />
        </div>
        <div className="relative">
          <h2 className="text-3xl font-display font-extrabold text-white leading-tight mb-4">
            Join Thousands of<br />
            <span className="gradient-text">Happy Customers</span>
          </h2>
          <p className="text-slate-400 leading-relaxed">
            Create your Afrique-con account and get access to real-time shipment tracking, Telegram notifications, and seamless booking.
          </p>
          <div className="mt-8 space-y-3">
            {['Real-time cargo tracking', 'Telegram booking updates', 'Instant e-tickets', 'Secure payments'].map(f => (
              <div key={f} className="flex items-center gap-3 text-slate-300 text-sm">
                <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-slate-600">© {new Date().getFullYear()} Afrique-con PLC</div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center py-10 px-6 lg:px-12 bg-white overflow-y-auto">
        <div className="w-full max-w-lg animate-fade-up">
          <div className="lg:hidden mb-8 flex justify-center">
            <img src="/logo.png" alt="Afrique-con" className="h-12 object-contain bg-[#0A1628] px-3 py-1.5 rounded-xl" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-slate-900 mb-1">{t('auth.createAccount')}</h1>
            <p className="text-slate-500">Fill in your details to get started</p>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>{t('auth.fullName')}</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" className={inputCls} />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>{t('auth.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>{t('cargoBooking.phone')}</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+237 6XX XXX XXX" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>{t('auth.country')}</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <select value={country} onChange={e => setCountry(e.target.value)} className={`${inputCls} appearance-none`}>
                    <option value="CM">🇨🇲 Cameroon</option>
                    <option value="NG">🇳🇬 Nigeria</option>
                  </select>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>{t('auth.password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 characters" className={inputCls} />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>{t('cargoBooking.telegramId')}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">@</span>
                  <input type="text" value={telegramId} onChange={e => setTelegramId(e.target.value)} placeholder="your_telegram_id" className={`${inputCls} pl-8`} />
                </div>
                <p className="text-xs text-amber-600 font-medium mt-1.5 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-amber-500" />
                  {t('cargoBooking.telegramHint')}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A1628] hover:bg-[#1a2d4e] text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/15 disabled:opacity-60 group mt-2"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> {t('auth.creatingAccount')}</>
                : <>{t('auth.registerBtn')} <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" /></>
              }
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="text-amber-600 font-bold hover:text-amber-500 transition-colors">{t('auth.signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
