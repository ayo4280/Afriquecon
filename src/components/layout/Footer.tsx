import { Navigation, Package, Users, Search, Mail, ArrowRight, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Agency {
  id: string;
  country: string;
  city: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export default function Footer() {
  const { t } = useTranslation();
  const [agencies, setAgencies] = useState<Agency[]>([]);

  useEffect(() => {
    async function fetchAgencies() {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .order('country', { ascending: true })
        .order('city', { ascending: true });
      if (data && !error) {
        setAgencies(data);
      }
    }
    fetchAgencies();
  }, []);

  const cameroonAgencies = agencies.filter(a => a.country === 'Cameroon');
  const nigeriaAgencies = agencies.filter(a => a.country === 'Nigeria');

  return (
    <footer className="relative bg-[#070f1c] text-slate-400 overflow-hidden">
      {/* Top gradient accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-400/3 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-teal-400/4 rounded-full blur-3xl pointer-events-none" />

      <div className="relative container mx-auto px-4 lg:px-6 pt-14 pb-8">

        {/* TOP ROW: Brand + Services + Support */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-10">

          {/* Brand column */}
          <div>
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
              href="https://t.me/Afriquecon_bot"
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

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400" />
              {t('footer.support')}
            </h4>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              {t('footer.supportDescription')}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                {t('footer.supportAvailability')}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                🇨🇲 Cameroon &amp; 🇳🇬 Nigeria
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <a href="mailto:afriquecon@afriquecon.com" className="hover:text-amber-400 transition-colors">
                  afriquecon@afriquecon.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="h-px w-full bg-white/5 mb-10" />

        {/* BRANCHES SECTION */}
        <div className="mb-10">
          <h4 className="font-semibold text-white mb-6 flex items-center gap-2 text-base">
            <MapPin className="w-5 h-5 text-amber-400" />
            {t('footer.branches')}
          </h4>

          {agencies.length === 0 ? (
            <p className="text-slate-600 text-sm italic">{t('footer.loadingBranches')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Cameroon */}
              <div>
                <h5 className="text-sm font-bold text-teal-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  🇨🇲 Cameroon
                </h5>
                <div className="space-y-4">
                  {cameroonAgencies.map(agency => (
                    <div key={agency.id} className="border border-white/5 bg-white/2 rounded-xl p-3 hover:border-amber-400/20 transition-colors">
                      <p className="text-white text-sm font-semibold mb-1">{agency.name}</p>
                      {agency.address && (
                        <p className="text-xs text-slate-500 flex items-start gap-1.5 mb-1">
                          <MapPin className="w-3 h-3 text-slate-600 flex-shrink-0 mt-0.5" />
                          {agency.address}
                        </p>
                      )}
                      {agency.phone && (
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-amber-400/70 flex-shrink-0" />
                          <a href={`tel:${agency.phone}`} className="hover:text-amber-400 transition-colors">{agency.phone}</a>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Nigeria */}
              <div>
                <h5 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  🇳🇬 Nigeria
                </h5>
                <div className="space-y-4">
                  {nigeriaAgencies.map(agency => (
                    <div key={agency.id} className="border border-white/5 bg-white/2 rounded-xl p-3 hover:border-teal-400/20 transition-colors">
                      <p className="text-white text-sm font-semibold mb-1">{agency.name}</p>
                      {agency.address && (
                        <p className="text-xs text-slate-500 flex items-start gap-1.5 mb-1">
                          <MapPin className="w-3 h-3 text-slate-600 flex-shrink-0 mt-0.5" />
                          {agency.address}
                        </p>
                      )}
                      {agency.phone && (
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-amber-400/70 flex-shrink-0" />
                          <a href={`tel:${agency.phone}`} className="hover:text-amber-400 transition-colors">{agency.phone}</a>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <span>{t('footer.copyright')}</span>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-2 sm:mt-0">
            <Link to="/about" className="hover:text-amber-400 transition-colors">{t('footer.about')}</Link>
            <Link to="/contact" className="hover:text-amber-400 transition-colors">{t('footer.contact')}</Link>
            <Link to="/terms" className="hover:text-amber-400 transition-colors">{t('footer.terms')}</Link>
            <Link to="/privacy" className="hover:text-amber-400 transition-colors">{t('footer.privacy')}</Link>
            <Link to="/faq" className="hover:text-amber-400 transition-colors">{t('footer.faqs')}</Link>
          </div>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {t('footer.operational')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
