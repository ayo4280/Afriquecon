import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, Mail, Lock, ArrowRight, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate('/');
    }
  };

  const inputCls = "w-full px-4 py-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all text-slate-800 font-medium";

  return (
    <div className="flex-grow flex min-h-0">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
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

        <div className="relative space-y-6">
          <div>
            <h2 className="text-4xl font-display font-extrabold text-white leading-tight mb-4">
              Cross-Border Logistics,<br />
              <span className="gradient-text">Reimagined.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Ship cargo and book travel between Cameroon and Nigeria — fast, reliable, and affordable.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { v: '2,400+', l: 'Shipments' },
              { v: '98%',    l: 'On-Time Rate' },
              { v: '2',      l: 'Countries' },
              { v: '24/7',   l: 'Support' },
            ].map(s => (
              <div key={s.l} className="bg-white/8 backdrop-blur-sm border border-white/12 rounded-xl p-4">
                <div className="text-2xl font-display font-extrabold text-amber-400">{s.v}</div>
                <div className="text-xs text-slate-400 font-medium">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-slate-600">© {new Date().getFullYear()} Afrique-con PLC</div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center py-12 px-6 lg:px-12 bg-white">
        <div className="w-full max-w-md animate-fade-up">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <img src="/logo.png" alt="Afrique-con" className="h-12 object-contain bg-[#0A1628] px-3 py-1.5 rounded-xl" />
          </div>

          <div className="mb-8">
            <div className="w-12 h-12 bg-amber-400/15 rounded-2xl flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-amber-500" />
            </div>
            <h1 className="text-3xl font-display font-bold text-slate-900 mb-1">{t('auth.loginTitle')}</h1>
            <p className="text-slate-500">Welcome back — sign in to your account</p>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputCls}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A1628] hover:bg-[#1a2d4e] text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/15 disabled:opacity-60 group mt-2"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> {t('auth.signingIn')}</>
                : <>{t('auth.signIn')} <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" /></>
              }
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-amber-600 font-bold hover:text-amber-500 transition-colors">{t('auth.registerHere')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
