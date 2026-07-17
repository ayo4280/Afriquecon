import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')) setReady(true);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(t('auth.resetPasswordShort'));
      return;
    }
    if (password !== confirmation) {
      setError(t('auth.resetPasswordsMismatch'));
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(t('auth.resetExpired'));
      return;
    }
    await supabase.auth.signOut();
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="flex-grow flex items-center justify-center py-12 px-6 bg-[#F4F6FA]">
        <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-xl border border-slate-100 text-center">
          <div className="w-16 h-16 bg-teal-400/15 rounded-2xl flex items-center justify-center mx-auto mb-5"><CheckCircle2 className="w-9 h-9 text-teal-500" /></div>
          <h1 className="text-2xl font-display font-bold text-slate-900 mb-3">{t('auth.resetSuccessTitle')}</h1>
          <p className="text-slate-500 mb-6">{t('auth.resetSuccessMessage')}</p>
          <button onClick={() => navigate('/login')} className="w-full bg-[#0A1628] text-white py-3.5 rounded-xl font-bold">{t('auth.resetSuccessAction')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-6 bg-[#F4F6FA]">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-8"><ArrowLeft className="w-4 h-4" /> {t('auth.forgotBack')}</Link>
        <div className="w-14 h-14 bg-amber-400/15 rounded-2xl flex items-center justify-center mb-5"><KeyRound className="w-7 h-7 text-amber-500" /></div>
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">{t('auth.resetTitle')}</h1>
        <p className="text-slate-500 mb-7">{t('auth.resetSubtitle')}</p>

        {!ready && <div className="mb-5 p-4 bg-amber-50 text-amber-800 rounded-xl text-sm border border-amber-100">{t('auth.resetInvalidLink')}</div>}
        {error && <div className="mb-5 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {[t('auth.resetNewPassword'), t('auth.resetConfirmPassword')].map((label, index) => {
            const value = index === 0 ? password : confirmation;
            const setValue = index === 0 ? setPassword : setConfirmation;
            return (
              <div key={label}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type={showPassword ? 'text' : 'password'} required minLength={8} autoComplete={index === 0 ? 'new-password' : 'new-password'} value={value} onChange={event => setValue(event.target.value)} className="w-full px-4 py-3.5 pl-11 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 text-slate-800 font-medium" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                </div>
              </div>
            );
          })}
          <button type="submit" disabled={!ready || loading} className="w-full bg-[#0A1628] hover:bg-[#1a2d4e] disabled:opacity-60 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Updating password…</> : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
