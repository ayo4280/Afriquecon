import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navigation, UserCircle, LogOut, Shield, Menu, X, Package, Users, Search } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    let active = true;
    if (!user) {
      setIsAdmin(false);
      return () => { active = false; };
    }

    supabase.rpc('current_admin_role').then(({ data }) => {
      if (active) setIsAdmin(['agent', 'manager', 'super_admin'].includes(data));
    });

    return () => { active = false; };
  }, [user]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en');
  };

  const navLinks = [
    { to: '/cargo',     label: t('nav.shipCargo'),     icon: <Package className="w-4 h-4" /> },
    { to: '/passenger', label: t('nav.bookTravel'),    icon: <Users className="w-4 h-4" /> },
    { to: '/track',     label: t('nav.trackShipment'), icon: <Search className="w-4 h-4" /> },
  ];

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-blue-700/95 backdrop-blur-lg shadow-xl shadow-black/20'
            : 'bg-blue-700'
        }`}
      >
        <div className="container mx-auto px-4 lg:px-6 h-24 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center group flex-shrink-0" aria-label="Home">
            <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
              <div className="absolute inset-0 bg-amber-400/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <img
                src="/logo.png"
                alt="Afrique-con Logo"
                className="relative h-20 w-auto object-contain bg-white px-3 py-1.5 rounded-xl shadow-lg ring-1 ring-white/10 group-hover:shadow-amber-400/40 group-hover:ring-amber-400/50 transition-all duration-300"
              />
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon }) => {
              const active = location.pathname === to || location.pathname.startsWith(to + '/');
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-base font-bold transition-all duration-200 ${
                    active
                      ? 'bg-amber-400 text-blue-900 shadow-md scale-105'
                      : 'text-blue-100 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {icon}
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Telegram */}
            <a
              href="https://t.me/Afriquecon_bot"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-xl text-base font-bold transition-all shadow-md hover:shadow-lg"
            >
              <Navigation className="w-5 h-5" />
              {t('nav.telegramSupport')}
            </a>

            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl text-base font-bold transition-all"
              title={t('nav.switchLanguage')}
            >
              <span className="text-xl">{i18n.language === 'en' ? '🇫🇷' : '🇬🇧'}</span>
              <span className="hidden lg:inline">{i18n.language === 'en' ? 'Français' : 'English'}</span>
            </button>

            {/* Auth section */}
            <div className="flex items-center gap-2 pl-3 border-l border-white/15">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center group-hover:bg-amber-400/30 transition-colors">
                      <UserCircle className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="text-xs font-medium max-w-[100px] truncate">{user.email}</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      title={t('admin.title')}
                      className="flex items-center gap-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-400 px-2 py-1 rounded text-xs font-bold transition-colors border border-amber-400/30"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      {t('nav.admin')}
                    </Link>
                  )}
                  <button
                    onClick={signOut}
                    title={t('nav.signOut')}
                    className="text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-slate-300 hover:text-white text-sm font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-white/8"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/register"
                    className="bg-amber-400 hover:bg-amber-300 text-[#0A1628] px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-amber-400/20 hover:shadow-amber-400/40"
                  >
                    {t('nav.signup')}
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen(v => !v)}
            aria-label={t('nav.toggleMenu')}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-[#0d1f3c] border-t border-white/10 px-4 pb-6 pt-4 space-y-1">
            {navLinks.map(({ to, label, icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-amber-400/15 text-amber-400'
                      : 'text-slate-300 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  {icon}
                  {label}
                </Link>
              );
            })}

            <div className="pt-3 mt-3 border-t border-white/10 flex flex-col gap-3">
              <a
                href="https://t.me/Afriquecon_bot"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bg-teal-500/20 text-teal-300 px-4 py-3 rounded-xl text-sm font-semibold border border-teal-500/30"
              >
                <Navigation className="w-4 h-4" />
                {t('nav.telegramSupport')}
              </a>

              <div className="flex gap-2">
                <button
                  onClick={toggleLanguage}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/8 border border-white/15 text-white px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                >
                  <span>{i18n.language === 'en' ? '🇫🇷' : '🇬🇧'}</span>
                  {t('nav.language')}
                </button>
              </div>

              {user ? (
                <div className="flex gap-2">
                  <Link
                    to="/profile"
                    className="flex-1 flex items-center justify-center gap-2 bg-white/8 border border-white/15 text-slate-300 px-3 py-2.5 rounded-xl text-sm font-medium"
                  >
                    <UserCircle className="w-4 h-4 text-amber-400" />
                    {t('nav.profile')}
                  </Link>
                  <button
                    onClick={signOut}
                    className="flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('nav.signOut')}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="flex-1 text-center border border-white/20 text-white px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-white/8 transition-colors">
                    {t('nav.login')}
                  </Link>
                  <Link to="/register" className="flex-1 text-center bg-amber-400 text-[#0A1628] px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-300 transition-colors">
                    {t('nav.signup')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
