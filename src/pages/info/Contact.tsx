import { useTranslation } from 'react-i18next';
import { Navigation, Mail, MapPin, Phone } from 'lucide-react';

export default function Contact() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#070f1c] text-slate-300 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('info.contact.title')}</h1>
          <p className="text-xl text-teal-400">{t('info.contact.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Telegram Support Block */}
          <div className="bg-gradient-to-br from-[#0A1628] to-[#0A1628]/50 p-8 rounded-2xl border border-teal-500/20 shadow-xl flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-teal-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(45,212,191,0.2)]">
              <Navigation className="w-10 h-10 text-teal-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{t('info.contact.telegramSupport')}</h2>
            <p className="text-slate-400 mb-8">{t('info.contact.telegramDesc')}</p>
            <a 
              href="https://t.me/Afriquecon_bot" 
              target="_blank" 
              rel="noreferrer"
              className="mt-auto w-full bg-teal-500 hover:bg-teal-400 text-[#070f1c] py-3 rounded-xl font-bold transition-colors shadow-lg shadow-teal-500/30 flex justify-center items-center gap-2"
            >
              <Navigation className="w-5 h-5" />
              {t('info.contact.messageBot')}
            </a>
          </div>

          <div className="space-y-8">
            {/* Office Locations */}
            <div className="bg-[#0A1628] p-6 rounded-2xl border border-white/5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-amber-400" />
                {t('info.contact.cameroonOffice')}
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-400 mt-1" />
                  <div>
                    <p className="text-white">Douala</p>
                    <p className="text-amber-400 font-mono">+237 678197346</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-400 mt-1" />
                  <div>
                    <p className="text-white">Yaoundé</p>
                    <p className="text-amber-400 font-mono">+237 678197361</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-[#0A1628] p-6 rounded-2xl border border-white/5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-green-400" />
                {t('info.contact.nigeriaOffice')}
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-400 mt-1" />
                  <div>
                    <p className="text-white">Lagos</p>
                    <p className="text-green-400 font-mono">+234 902 9072330</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-400 mt-1" />
                  <div>
                    <p className="text-white">Abuja</p>
                    <p className="text-green-400 font-mono">+234 810 4292492</p>
                  </div>
                </li>
              </ul>
            </div>
            
            {/* Email Support */}
            <div className="bg-[#0A1628] p-6 rounded-2xl border border-white/5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-blue-400" />
                {t('info.contact.emailSupport')}
              </h3>
              <a href="mailto:support@afrique-con.com" className="text-blue-400 hover:text-blue-300 font-medium">
                {t('info.contact.emailAddress')}
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
