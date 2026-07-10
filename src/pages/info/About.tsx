import { useTranslation } from 'react-i18next';
import { Shield, Truck, MapPin } from 'lucide-react';

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#070f1c] text-slate-300 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('info.about.title')}</h1>
          <p className="text-xl text-amber-400">{t('info.about.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="bg-[#0A1628] p-8 rounded-2xl border border-white/10 shadow-xl shadow-black/20">
            <h2 className="text-2xl font-bold text-white mb-4">{t('info.about.storyTitle')}</h2>
            <p className="mb-4 leading-relaxed">{t('info.about.storyText1')}</p>
            <p className="leading-relaxed">{t('info.about.storyText2')}</p>
          </div>
          <div className="bg-[#0A1628] p-8 rounded-2xl border border-white/10 shadow-xl shadow-black/20">
            <h2 className="text-2xl font-bold text-white mb-4">{t('info.about.missionTitle')}</h2>
            <p className="leading-relaxed">{t('info.about.missionText')}</p>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white text-center mb-8">{t('info.about.whyChooseUs')}</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#0A1628] p-6 rounded-xl border border-white/5 flex flex-col items-center text-center group hover:bg-white/5 transition-colors">
            <div className="w-16 h-16 rounded-full bg-amber-400/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MapPin className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t('info.about.reason1Title')}</h3>
            <p className="text-sm text-slate-400">{t('info.about.reason1Text')}</p>
          </div>

          <div className="bg-[#0A1628] p-6 rounded-xl border border-white/5 flex flex-col items-center text-center group hover:bg-white/5 transition-colors">
            <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Shield className="w-8 h-8 text-teal-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t('info.about.reason2Title')}</h3>
            <p className="text-sm text-slate-400">{t('info.about.reason2Text')}</p>
          </div>

          <div className="bg-[#0A1628] p-6 rounded-xl border border-white/5 flex flex-col items-center text-center group hover:bg-white/5 transition-colors">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Truck className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t('info.about.reason3Title')}</h3>
            <p className="text-sm text-slate-400">{t('info.about.reason3Text')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
