import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';
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
    
    // Pass profile data as metadata — the DB trigger reads this and
    // auto-inserts into public.profiles (bypasses RLS completely)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
          country,
          telegram_id: telegramId || null
        }
      }
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.user) {
      // If email confirmation is enabled, user needs to confirm before logging in.
      // The DB trigger already created the profile row automatically.
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    }
  };

  if (success) {
    return (
      <div className="flex-grow flex items-center justify-center py-12 bg-neutral">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-bold text-success mb-2">{t('auth.registerSuccess')}</h2>
          <p className="text-gray-600">{t('auth.checkEmail')}</p>
          <p className="text-sm text-gray-400 mt-2">{t('auth.redirecting')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 bg-neutral">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-3xl font-display font-bold text-center mb-6 text-gray-800">{t('auth.createAccount')}</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.fullName')}</label>
            <input 
              type="text" 
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('cargoBooking.phone')}</label>
            <input 
              type="tel" 
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. +237 6XX XXX XXX"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.country')}</label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="CM">🇨🇲 Cameroon</option>
              <option value="NG">🇳🇬 Nigeria</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
            <input 
              type="password" 
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('cargoBooking.telegramId')}</label>
            <input 
              type="text" 
              value={telegramId}
              onChange={e => setTelegramId(e.target.value)}
              placeholder="e.g. 123456789"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary" 
            />
            <p className="text-xs text-gray-500 mt-1">{t('cargoBooking.telegramHint')}</p>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded font-bold hover:bg-blue-600 transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('auth.creatingAccount')}</> : t('auth.registerBtn')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t('auth.haveAccount')} <Link to="/login" className="text-primary font-bold hover:underline">{t('auth.signIn')}</Link>
        </p>
      </div>
    </div>
  );
}
