import { Link } from 'react-router-dom';
import { Navigation, UserCircle, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const ADMIN_EMAILS = ['testuser3@afrique-con.com', 'admin@afrique-con.com'];

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en');
  };

  return (
    <nav className="bg-primary text-white p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <img src="/logo.png" alt="Afrique-con" className="h-12 object-contain bg-white px-2 py-1 rounded-md" />
        </Link>
        <div className="hidden md:flex gap-6 items-center">
          <Link to="/cargo" className="hover:text-neutral transition-colors">{t('nav.shipCargo')}</Link>
          <Link to="/passenger" className="hover:text-neutral transition-colors">{t('nav.bookTravel')}</Link>
          <Link to="/track" className="hover:text-neutral transition-colors">{t('nav.trackShipment')}</Link>
          <a href="https://t.me/Afriquecon" target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-white text-primary px-3 py-1 rounded-full font-semibold hover:bg-neutral transition-colors">
            <Navigation className="w-4 h-4" />
            {t('nav.telegramSupport')}
          </a>

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/30 border border-white/30 text-white px-3 py-1.5 rounded-lg font-bold text-sm transition-all"
            title="Switch Language / Changer de langue"
          >
            <span>{i18n.language === 'en' ? '🇫🇷' : '🇬🇧'}</span>
            {t('nav.language')}
          </button>
          
          <div className="ml-2 pl-4 border-l border-blue-400 flex items-center gap-4">
            {user ? (
              <>
                <Link to="/profile" className="flex items-center gap-1 hover:text-neutral transition-colors">
                  <UserCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{user.email}</span>
                </Link>
                {ADMIN_EMAILS.includes(user.email ?? '') && (
                  <Link to="/admin" className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded text-xs font-bold transition-colors" title="Admin Dashboard">
                    <Shield className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                )}
                <button onClick={signOut} className="hover:text-red-300 transition-colors" title={t('nav.signOut')}>
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-neutral transition-colors font-medium">{t('nav.login')}</Link>
                <Link to="/register" className="bg-white text-primary px-4 py-2 rounded font-semibold hover:bg-gray-100 transition-colors">{t('nav.signup')}</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

