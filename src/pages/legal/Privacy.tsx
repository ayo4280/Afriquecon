import { Shield, Database, Users, Trash2, Mail, Lock, Globe } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#070f1c] text-slate-300 py-16 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/15 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Afrique-con PLC is committed to protecting your personal information and being transparent
            about what data we collect and how we use it.
          </p>
          <p className="text-xs text-slate-600 mt-4">Last updated: July 2026 &nbsp;|&nbsp; Effective immediately</p>
        </div>

        {/* Quick summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[
            { icon: <Lock className="w-5 h-5 text-green-400" />, title: 'Secure Storage', text: 'Your data is encrypted and stored on Supabase (EU-compliant cloud).' },
            { icon: <Globe className="w-5 h-5 text-blue-400" />, title: 'No Data Selling', text: 'We never sell or share your personal data with advertisers.' },
            { icon: <Trash2 className="w-5 h-5 text-red-400" />, title: 'Right to Delete', text: 'You can request full deletion of your account data at any time.' },
          ].map(card => (
            <div key={card.title} className="bg-[#0A1628] border border-white/5 rounded-xl p-5 flex gap-4">
              <div className="mt-0.5 flex-shrink-0">{card.icon}</div>
              <div>
                <p className="font-semibold text-white text-sm mb-1">{card.title}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{card.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Policy body */}
        <div className="bg-[#0A1628] border border-white/8 rounded-2xl p-8 md:p-10 space-y-10 text-sm leading-relaxed">

          <Section icon={<Database className="w-5 h-5 text-blue-400" />} title="1. Information We Collect">
            <p className="mb-4">We collect the following categories of personal data when you use our platform:</p>
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-2 pr-4 text-slate-300 font-semibold">Data Type</th>
                  <th className="py-2 text-slate-300 font-semibold">Examples</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-400">
                <tr>
                  <td className="py-2 pr-4 font-medium text-slate-300">Identity Data</td>
                  <td className="py-2">Full name, government ID type &amp; number</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-slate-300">Contact Data</td>
                  <td className="py-2">Email address, phone number, delivery address</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-slate-300">Account Data</td>
                  <td className="py-2">Login credentials, authentication provider (Email / Google), country</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-slate-300">Messaging Data</td>
                  <td className="py-2">Telegram username or chat ID (if provided for notifications)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-slate-300">Transaction Data</td>
                  <td className="py-2">Booking IDs, ticket IDs, payment references, amounts, currency</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-slate-300">Usage Data</td>
                  <td className="py-2">Pages visited, search queries (origin/destination), device type</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section icon={<Users className="w-5 h-5 text-amber-400" />} title="2. How We Use Your Information">
            <p className="mb-3">We use your personal data for the following legitimate business purposes:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li><strong className="text-slate-200">Booking & Ticketing:</strong> To process cargo and passenger bookings, generate booking IDs, and issue e-tickets.</li>
              <li><strong className="text-slate-200">Shipment Tracking:</strong> To provide real-time cargo status updates to the sender and recipient.</li>
              <li><strong className="text-slate-200">Notifications:</strong> To send booking confirmations, departure reminders (24h and 2h), and delivery alerts via Telegram or email.</li>
              <li><strong className="text-slate-200">Payment Processing:</strong> To complete transactions securely via our payment partners (Paystack and Flutterwave).</li>
              <li><strong className="text-slate-200">Customer Support:</strong> To respond to inquiries via Telegram bot (@Afriquecon_bot) or email.</li>
              <li><strong className="text-slate-200">Legal Compliance:</strong> To maintain records required by cross-border transport regulations in Cameroon and Nigeria.</li>
            </ul>
          </Section>

          <Section icon={<Globe className="w-5 h-5 text-teal-400" />} title="3. Third Parties We Share Data With">
            <p className="mb-4">We only share your data with trusted service providers who process it on our behalf. We do <strong className="text-white">not</strong> sell your data to any third party.</p>
            <div className="space-y-4">
              {[
                {
                  name: 'Supabase',
                  role: 'Database & Authentication',
                  detail: 'Stores your profile, bookings, tickets, and cargo records. EU-compliant with encryption at rest.',
                  color: 'text-green-400',
                },
                {
                  name: 'Paystack',
                  role: 'Payment Processing (NGN)',
                  detail: 'Processes Nigerian Naira payments. Receives your email and payment amount. PCI-DSS compliant.',
                  color: 'text-blue-400',
                },
                {
                  name: 'Flutterwave',
                  role: 'Payment Processing (FCFA)',
                  detail: 'Processes CFA Franc payments. Receives your email, name, phone, and payment amount. PCI-DSS compliant.',
                  color: 'text-orange-400',
                },
                {
                  name: 'Telegram',
                  role: 'Notifications & Support',
                  detail: 'Your Telegram chat ID is used to send you booking and tracking alerts via @Afriquecon_bot. Only used if you provide your Telegram username.',
                  color: 'text-teal-400',
                },
                {
                  name: 'Google',
                  role: 'Authentication (Optional)',
                  detail: 'If you sign in with Google, your name and email are shared with Supabase Auth. No other Google data is accessed.',
                  color: 'text-yellow-400',
                },
              ].map(tp => (
                <div key={tp.name} className="flex gap-4 p-4 bg-white/3 rounded-xl border border-white/5">
                  <div className={`font-bold text-sm w-32 flex-shrink-0 ${tp.color}`}>{tp.name}</div>
                  <div>
                    <p className="text-slate-300 font-medium text-xs mb-1">{tp.role}</p>
                    <p className="text-slate-500 text-xs">{tp.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={<Lock className="w-5 h-5 text-purple-400" />} title="4. Data Retention">
            <p className="mb-3">We retain your data for as long as necessary to provide our services and comply with legal obligations:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li><strong className="text-slate-200">Account data:</strong> Retained as long as your account is active. Deleted within 30 days of an account deletion request.</li>
              <li><strong className="text-slate-200">Booking & ticket records:</strong> Retained for 3 years to comply with transport and tax regulations.</li>
              <li><strong className="text-slate-200">Cargo status logs:</strong> Retained for 1 year after delivery confirmation.</li>
              <li><strong className="text-slate-200">Payment records:</strong> Retained for 5 years in accordance with financial regulatory requirements in Cameroon and Nigeria.</li>
              <li><strong className="text-slate-200">Telegram message logs:</strong> Retained for 90 days for support and debugging purposes.</li>
            </ul>
          </Section>

          <Section icon={<Trash2 className="w-5 h-5 text-red-400" />} title="5. Your Rights">
            <p className="mb-3">You have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li><strong className="text-slate-200">Right to Access:</strong> Request a copy of all personal data we hold about you.</li>
              <li><strong className="text-slate-200">Right to Rectification:</strong> Update inaccurate or incomplete information via your Profile page.</li>
              <li><strong className="text-slate-200">Right to Erasure:</strong> Request deletion of your account and all associated data, subject to legal retention obligations.</li>
              <li><strong className="text-slate-200">Right to Withdraw Consent:</strong> Opt out of Telegram notifications at any time by removing your Telegram ID from your profile.</li>
              <li><strong className="text-slate-200">Right to Complain:</strong> Lodge a complaint with the relevant data protection authority in your country (Nigeria or Cameroon).</li>
            </ul>
          </Section>

          <Section icon={<Shield className="w-5 h-5 text-green-400" />} title="6. Security">
            <p>We implement industry-standard technical and organisational measures to protect your personal data, including:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3 text-slate-400">
              <li>HTTPS encryption for all data transmitted between your browser and our servers.</li>
              <li>Row-Level Security (RLS) on our database — you can only access your own data.</li>
              <li>Passwords are never stored — authentication is managed by Supabase Auth using industry-standard hashing (bcrypt).</li>
              <li>Payment card data is never stored on our servers — all card processing is handled by Paystack and Flutterwave's secure vaults.</li>
            </ul>
          </Section>

          <Section icon={<Mail className="w-5 h-5 text-blue-400" />} title="7. Contact Us">
            <p>For any privacy-related questions, data access requests, or deletion requests, please contact our Data Protection team:</p>
            <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-xl px-5 py-4 space-y-2">
              <p><strong className="text-slate-200">Email:</strong> <a href="mailto:support@afrique-con.com" className="text-blue-400 hover:underline">support@afrique-con.com</a></p>
              <p><strong className="text-slate-200">Telegram:</strong> <a href="https://t.me/Afriquecon_bot" target="_blank" rel="noreferrer" className="text-teal-400 hover:underline">@Afriquecon_bot</a></p>
              <p><strong className="text-slate-200">Jurisdiction:</strong> Afrique-con PLC, South West Region, Cameroon.</p>
            </div>
            <p className="mt-4 text-slate-500 text-xs">We will respond to all data requests within <strong className="text-slate-400">30 days</strong> of receipt.</p>
          </Section>

        </div>

        <p className="text-center text-xs text-slate-600 mt-8">
          © 2026 Afrique-con PLC. All rights reserved. This policy may be updated periodically — check back for the latest version.
        </p>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="flex items-center gap-3 text-lg font-bold text-white mb-4 pb-3 border-b border-white/8">
        {icon}
        {title}
      </h2>
      <div className="text-slate-400 space-y-2 leading-relaxed">{children}</div>
    </div>
  );
}
