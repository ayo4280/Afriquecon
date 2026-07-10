import { useTranslation } from 'react-i18next';
import { Package, Users, CreditCard } from 'lucide-react';

export default function FAQ() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#070f1c] text-slate-300 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('info.faq.title')}</h1>
          <p className="text-xl text-amber-400">{t('info.faq.subtitle')}</p>
        </div>

        <div className="space-y-12">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
              <Package className="w-6 h-6 text-amber-400" />
              {t('info.faq.cargo')}
            </h2>
            <div className="space-y-6">
              <div className="bg-[#0A1628] p-6 rounded-xl border border-white/5 hover:border-amber-400/30 transition-colors">
                <h3 className="text-lg font-bold text-white mb-2">{t('info.faq.q1')}</h3>
                <p className="text-slate-400 leading-relaxed">{t('info.faq.a1')}</p>
              </div>
              <div className="bg-[#0A1628] p-6 rounded-xl border border-white/5 hover:border-amber-400/30 transition-colors">
                <h3 className="text-lg font-bold text-white mb-2">{t('info.faq.q2')}</h3>
                <p className="text-slate-400 leading-relaxed">{t('info.faq.a2')}</p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
              <Users className="w-6 h-6 text-teal-400" />
              {t('info.faq.passenger')}
            </h2>
            <div className="space-y-6">
              <div className="bg-[#0A1628] p-6 rounded-xl border border-white/5 hover:border-teal-400/30 transition-colors">
                <h3 className="text-lg font-bold text-white mb-2">{t('info.faq.q3')}</h3>
                <p className="text-slate-400 leading-relaxed">{t('info.faq.a3')}</p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
              <CreditCard className="w-6 h-6 text-blue-400" />
              {t('info.faq.payments')}
            </h2>
            <div className="space-y-6">
              <div className="bg-[#0A1628] p-6 rounded-xl border border-white/5 hover:border-blue-400/30 transition-colors">
                <h3 className="text-lg font-bold text-white mb-2">{t('info.faq.q4')}</h3>
                <p className="text-slate-400 leading-relaxed">{t('info.faq.a4')}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
