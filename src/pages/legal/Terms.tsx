import { useState } from 'react';
import { Package, Users } from 'lucide-react';

type TabType = 'cargo' | 'passenger';

export default function Terms() {
  const [activeTab, setActiveTab] = useState<TabType>('cargo');

  return (
    <div className="min-h-screen bg-[#070f1c] text-slate-300 py-16 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Terms &amp; Conditions</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Please read these terms carefully before using our cargo or passenger services.
            By using our services, you agree to be bound by these terms.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-8 bg-[#0A1628] p-1.5 rounded-xl w-fit mx-auto border border-white/5">
          <button
            onClick={() => setActiveTab('cargo')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'cargo'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            Cargo Terms
          </button>
          <button
            onClick={() => setActiveTab('passenger')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'passenger'
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Passenger Terms
          </button>
        </div>

        {/* Content */}
        <div className="bg-[#0A1628] border border-white/8 rounded-2xl p-8 md:p-10 space-y-8 text-sm leading-relaxed">

          {/* ── CARGO TERMS ── */}
          {activeTab === 'cargo' && (
            <>
              <p className="text-slate-300">
                These Terms and Conditions govern the use of the cargo services provided by AFRIQUE-CON. By using our services,
                the customer agrees to these terms, whether this invoice is signed or not by the customer.
              </p>

              <Section accent="amber" title="1. Customer Responsibilities">
                <p className="font-semibold text-slate-200 mb-2">Customers must:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li>Provide accurate information.</li>
                  <li>Ensure the item is properly labelled and packaged.</li>
                  <li>Declare the correct content of the item.</li>
                  <li>Pay all service fees upon delivery.</li>
                </ul>
              </Section>

              <Section accent="amber" title="2. Prohibited Items">
                <p className="font-semibold text-slate-200 mb-2">The following items are not allowed for carriage:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400 mb-3">
                  <li>Illegal drugs or substances.</li>
                  <li>Weapons or ammunition.</li>
                  <li>Hazardous or explosive items.</li>
                  <li>Perishable goods without proper packaging.</li>
                  <li>Any item prohibited by local or international regulations.</li>
                </ul>
                <p><strong className="text-slate-200">Content Verification:</strong> We do not verify contents of goods; we believe and rely on descriptions/contents as declared by the shipper or customer.</p>
                <p className="mt-2"><strong className="text-slate-200">Legal Compliance:</strong> Goods/items that do not conform with the law may be withheld or seized, and we are not liable.</p>
              </Section>

              <Section accent="amber" title="3. Delivery Time">
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li>Delivery timelines are estimates and are not guaranteed.</li>
                  <li>Delays may occur due to customs, incorrect address, or unforeseen circumstances.</li>
                  <li>We will make reasonable efforts to keep you updated.</li>
                </ul>
              </Section>

              <Section accent="amber" title="4. Fees &amp; Payments">
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li>All fees must be paid upon delivery.</li>
                  <li>Additional fees may apply for overweight or under-declared packages, special handling, or additional customs fees at any point.</li>
                  <li>All charges are quoted in FCFA.</li>
                </ul>
              </Section>

              <Section accent="amber" title="5. Liability &amp; Insurance">
                <p className="font-semibold text-slate-200 mb-2">We are not responsible for loss or damage caused by:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400 mb-3">
                  <li>Poor or insecure packaging done by the customer.</li>
                  <li>Incorrect delivery information.</li>
                  <li>Items prohibited or undeclared.</li>
                </ul>
                <p>Limited compensation may be offered only if insurance is purchased.</p>
                <p className="mt-2">Without insurance, compensation for loss/damage is limited to <strong className="text-amber-400">5% of freight value</strong>, except where a true or high value of the goods is declared in advance.</p>
              </Section>

              <Section accent="amber" title="6. Proof for Delivery">
                <p className="font-semibold text-slate-200 mb-2">Conditions for delivery or cargo claim include:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li>Copy of customer's identification documents/signature.</li>
                  <li>Copy of the invoice.</li>
                  <li>Presentation of the receipt of payment.</li>
                </ul>
              </Section>

              <Section accent="amber" title="7. Unclaimed or Returned Items">
                <ul className="list-disc pl-5 space-y-2 text-slate-400">
                  <li>If within a period of 15 days from the date of arrival — and for which the customer was informed by WhatsApp message — goods are not claimed, a warehousing fee shall be charged per extra day calculated per space occupied.</li>
                  <li>Items left unclaimed after 90 days shall be disposed of.</li>
                </ul>
              </Section>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-4 text-slate-300">
                <strong className="text-amber-400">8. Legal Action &amp; Jurisdiction:</strong> With respect to any legal action, whether undertaken as plaintiff or defendant, only the competent courts in the South West Region of Cameroon shall arbitrate.
              </div>
            </>
          )}

          {/* ── PASSENGER TERMS ── */}
          {activeTab === 'passenger' && (
            <>
              <div className="bg-teal-500/10 border border-teal-400/20 rounded-xl p-4 text-sm text-teal-300 space-y-1">
                <p><strong>Issuer:</strong> Afrique-Con Plc Corporate Operations Department</p>
                <p><strong>Document:</strong> Standard Terms &amp; Conditions of Passenger &amp; Luggage Transit</p>
                <p><strong>Enforceability:</strong> Governed by the Federal Ministry of Aviation and Transport Regulations (Nigeria)</p>
              </div>

              <Section accent="teal" title="1. Statutory and Government Compliance">
                <p>Passengers shall comply with all Government travel requirements and must present formal exit, entry, health, and any other legally mandated documents upon request prior to embarkation or at any checkpoint during transit.</p>
              </Section>

              <Section accent="teal" title="2. Ticket Validity and Administrative Fees">
                <p>This passenger ticket is valid for a strict period of one (1) month from the date of issuance. No reimbursement of collected funds will be granted under standard circumstances. Any exceptional reimbursement is purely at the discretion of Afrique-Con Plc management, which reserves the absolute right to deduct <strong className="text-teal-400">35% of the ticket's gross value</strong> to satisfy administrative charges and processing costs.</p>
              </Section>

              <Section accent="teal" title="3. Terminal Check-In Requirements">
                <p>Passengers must be physically present at the Afrique-Con Plc agency or terminal at least <strong className="text-teal-400">2 hours (2H)</strong> before the scheduled departure time in order to successfully fulfill all administrative check-in, manifest entry, and embarkation formalities.</p>
              </Section>

              <Section accent="teal" title="4. Departure Re-confirmation">
                <p>Passengers are required to re-confirm their scheduled departure status exactly <strong className="text-teal-400">48 hours (48H)</strong> before the set time of vehicle movement.</p>
              </Section>

              <Section accent="teal" title="5. Code of Conduct and Safety">
                <p>No acts of disturbance, quarreling, verbal assault, physical fighting, or any form of rowdy behavior are permitted on board the vehicle. Afrique-Con Plc reserves the right to deny transit or remove any passenger violating this safety clause without any liability or refund.</p>
              </Section>

              <Section accent="teal" title="6. Ticket Maintenance and Verification">
                <p>No passenger will be allowed on board or permitted to remain in transit without a valid physical ticket. Passengers are mandated to keep their ticket safely on their person until the final end of the journey to avoid structural inconveniences or mandatory fare enforcement.</p>
              </Section>

              <Section accent="teal" title="7. Luggage and Cargo Liability Limits">
                <p>The Company's liability for documented loss or damage to registered cargo or luggage is strictly limited to <strong className="text-teal-400">10% of the freight value</strong>, except where a higher value is declared in writing in advance and additional premium charges are paid. Afrique-Con Plc bears absolutely no liability for fragile goods, perishables, or unchecked hand luggage.</p>
              </Section>

              <Section accent="teal" title="8. Asset Liability Exclusion">
                <p>No legal or financial liability whatsoever attaches to the specific bus or transport asset conveying the luggage in the event of accidental loss or unforeseen transit circumstances.</p>
              </Section>

              <Section accent="teal" title="9. Free Baggage Allowance">
                <p>Every ticketed passenger is entitled to a free maximum baggage allowance of <strong className="text-teal-400">20 kgs</strong>. Any extra weight beyond this 20 kg threshold will attract excess weight surcharges, which must be paid in full prior to boarding.</p>
              </Section>

              <Section accent="teal" title="10. Round Trip Allocations">
                <p>Passengers holding a Round Trip Ticket must formally confirm their return date and time at least <strong className="text-teal-400">48 hours (48H)</strong> prior to the departure date of that return leg to secure seat scheduling.</p>
              </Section>
            </>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-600 mt-8">
          Last updated: July 2026. For questions, contact <a href="mailto:support@afrique-con.com" className="text-amber-400 hover:underline">support@afrique-con.com</a>
        </p>
      </div>
    </div>
  );
}

// ── Small reusable section component ──────────────────────────────────────────
function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent: 'amber' | 'teal' }) {
  const border = accent === 'amber' ? 'border-amber-400' : 'border-teal-400';
  return (
    <div>
      <h3 className={`text-base font-bold text-white mb-3 border-l-4 ${border} pl-3`}>{title}</h3>
      <div className="text-slate-400 space-y-2">{children}</div>
    </div>
  );
}
