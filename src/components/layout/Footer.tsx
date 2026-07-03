import { Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-gray-300 py-8 mt-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-display font-bold text-xl text-white mb-4">Afrique-con Plc</h3>
          <p className="text-sm">
            {t('footer.tagline')}
          </p>
        </div>
        <div>
          <h4 className="font-display font-bold text-lg text-white mb-4">{t('footer.services')}</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/cargo" className="hover:text-white">{t('footer.shipCargo')}</a></li>
            <li><a href="/passenger" className="hover:text-white">{t('footer.bookTravel')}</a></li>
            <li><a href="/track" className="hover:text-white">{t('footer.trackShipment')}</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-bold text-lg text-white mb-4">{t('footer.support')}</h4>
          <p className="text-sm mb-4">Get instant updates and support via Telegram.</p>
          <a href="https://t.me/Afriquecon" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-blue-600 transition-colors">
            <Navigation className="w-5 h-5" />
            @Afriquecon
          </a>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-8 pt-4 border-t border-gray-700 text-sm text-center">
        {t('footer.copyright')}
      </div>
    </footer>
  );
}
