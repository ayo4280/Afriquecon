import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, Mail, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const redirectTo = `${window.location.origin}/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

    setLoading(false);
    if (resetError) {
      setError('Unable to send a reset link right now. Please try again shortly.');
      return;
    }
    setSent(true);
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-6 bg-[#F4F6FA]">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-400/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-9 h-9 text-teal-500" />
            </div>
            <h1 className="text-2xl font-display font-bold text-slate-900 mb-3">Check your email</h1>
            <p className="text-slate-500 leading-relaxed">If an Afriquecon account uses that email address, a password-reset link has been sent. Check your inbox and spam folder.</p>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 bg-amber-400/15 rounded-2xl flex items-center justify-center mb-5">
              <Mail className="w-7 h-7 text-amber-500" />
            </div>
            <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Reset your password</h1>
            <p className="text-slate-500 mb-7">Enter your email address and we will send you a secure password-reset link.</p>

            {error && <div className="mb-5 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 text-slate-800 font-medium"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#0A1628] hover:bg-[#1a2d4e] disabled:opacity-60 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending link…</> : <><Send className="w-5 h-5" /> Send reset link</>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
