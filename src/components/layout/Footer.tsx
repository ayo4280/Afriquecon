import { Navigation, Package, Users, Search, Mail, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="relative bg-[#070f1c] text-slate-400 overflow-hidden">
      {/* Top gradient accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-400/3 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-teal-400/4 rounded-full blur-3xl pointer-events-none" />

      <div className="relative container mx-auto px-4 lg:px-6 pt-14 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block group">
              <img
                src="/logo.png"
                alt="Afrique-con PLC"
                className="h-12 object-contain bg-white px-3 py-1.5 rounded-xl mb-5 shadow-lg group-hover:shadow-amber-400/20 transition-shadow"
              />
            </Link>
            <p className="text-sm leading-relaxed text-slate-500 mb-5">
              {t('footer.tagline')}
            </p>
            <a
              href="https://t.me/Afriquecon"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-teal-500/15 hover:bg-teal-400/25 border border-teal-500/30 text-teal-400 px-4 py-2 rounded-xl text-sm font-semibold transition-all group"
            >
              <Navigation className="w-4 h-4" />
              @Afriquecon
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -ml-1 group-hover:ml-0 transition-all" />
            </a>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              {t('footer.services')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { to: '/cargo',     label: t('footer.shipCargo'),     icon: <Package className="w-3.5 h-3.5" /> },
                { to: '/passenger', label: t('footer.bookTravel'),    icon: <Users className="w-3.5 h-3.5" /> },
                { to: '/track',     label: t('footer.trackShipment'), icon: <Search className="w-3.5 h-3.5" /> },
              ].map(({ to, label, icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center gap-2 text-slate-500 hover:text-amber-400 transition-colors"
                  >
                    {icon}
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Routes */}
          <div>
            <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-teal-400" />
              Routes
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              {[
                'Douala → Lagos',
                'Yaoundé → Abuja',
                'Buea → Lagos',
                'Kumba → Lagos',
                'Ikom → Douala',
              ].map(route => (
                <li key={route} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 flex-shrink-0" />
                  {route}
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400" />
              {t('footer.support')}
            </h4>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              Get instant shipment updates and 24/7 support via our Telegram channel.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                24/7 Telegram Support
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                🇨🇲 Cameroon &amp; 🇳🇬 Nigeria
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <span>{t('footer.copyright')}</span>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-2 sm:mt-0">
            <Link to="/terms" className="hover:text-amber-400 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link>
            <Link to="/#faqs" className="hover:text-amber-400 transition-colors">FAQs</Link>
          </div>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              All services operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
