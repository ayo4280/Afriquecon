import { X } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'cargo' | 'passenger';
}

export default function TermsModal({ isOpen, onClose, type }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-up">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-display font-bold text-slate-900">
            {type === 'cargo' ? 'Cargo Terms & Conditions' : 'Passenger Terms & Conditions'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow text-sm text-slate-600 space-y-6">
          {type === 'cargo' ? (
            <>
              <p>These Terms and Conditions govern the use of the cargo services provided by AFRIQUE-CON. By using our services, the customer agrees to these terms, whether this invoice is signed or not by the customer.</p>
              
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-amber-400 pl-3">1. CUSTOMER RESPONSIBILITIES</h3>
                <p className="font-semibold text-slate-700 mb-2">Customers must:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Provide accurate information.</li>
                  <li>Ensure the item is properly labelled and packaged.</li>
                  <li>Declare the correct content of the item.</li>
                  <li>Pay all service fees upon delivery.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-amber-400 pl-3">2. PROHIBITED ITEMS</h3>
                <p className="font-semibold text-slate-700 mb-2">The following items are not allowed for carriage:</p>
                <ul className="list-disc pl-5 space-y-1 mb-3">
                  <li>Illegal drugs or substances.</li>
                  <li>Weapons or ammunition.</li>
                  <li>Hazardous or explosive items.</li>
                  <li>Perishable goods without proper packaging.</li>
                  <li>Any item prohibited by local or international regulations.</li>
                </ul>
                <p><strong>Content Verification:</strong> We do not verify contents of goods; we believe and rely on descriptions/contents as declared by the shipper or customer.</p>
                <p className="mt-2"><strong>Legal Compliance:</strong> Goods/items that do not conform with the law may be withheld or seized, and we are not liable.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-amber-400 pl-3">3. DELIVERY TIME</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Delivery timelines are estimates and are not guaranteed.</li>
                  <li>Delays may occur due to customs, incorrect address, or unforeseen circumstances.</li>
                  <li>We will make reasonable efforts to keep you updated.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-amber-400 pl-3">4. FEES & PAYMENTS</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>All fees must be paid upon delivery.</li>
                  <li>Additional fees may apply for overweight or under-declared (weight) packages, special handling, or additional customs fees at any point.</li>
                  <li>All charges are quoted in FCFA.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-amber-400 pl-3">5. LIABILITY & INSURANCE</h3>
                <p className="font-semibold text-slate-700 mb-2">We are not responsible for loss or damage caused by:</p>
                <ul className="list-disc pl-5 space-y-1 mb-3">
                  <li>Poor or insecure packaging done by the customer.</li>
                  <li>Incorrect delivery information.</li>
                  <li>Items prohibited or undeclared.</li>
                </ul>
                <p>Limited compensation may be offered only if insurance is purchased.</p>
                <p className="mt-2">Without insurance, compensation for loss/damage is limited to <strong>5% of freight value</strong>, except where a true or high value of the goods is declared in advance and before the freight value is determined.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-amber-400 pl-3">6. PROOF FOR DELIVERY</h3>
                <p className="font-semibold text-slate-700 mb-2">Conditions for delivery or cargo claim include:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Copy of customer's identification documents/signature.</li>
                  <li>Copy of the invoice.</li>
                  <li>Presentation of the receipt of payment.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-amber-400 pl-3">7. UNCLAIMED OR RETURNED ITEMS</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>If within a period of 15 days dating from the date of arrival of items—and for which the customer was informed by WhatsApp message—goods or items are not claimed, there shall be a fee charged for warehousing per every extra day calculated per space occupied.</li>
                  <li>Items left unclaimed after 90 days shall be disposed of.</li>
                </ul>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800">
                <strong>8. Legal Action & Jurisdiction:</strong> With respect to any legal action, whether undertaken as plaintiff or defendant, only the competent courts in the South West Region of Cameroon shall arbitrate.
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 text-xs bg-teal-50 p-3 rounded-lg border border-teal-100 text-teal-800">
                <p><strong>Issuer:</strong> Afrique-Con Plc Corporate Operations Department</p>
                <p><strong>Document:</strong> Standard Terms & Conditions of Passenger & Luggage Transit</p>
                <p><strong>Enforceability:</strong> Governed by the Federal Ministry of Aviation and Transport Regulations (Nigeria)</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-teal-400 pl-3">1. Statutory and Government Compliance</h3>
                <p>Passengers shall comply with all Government travel requirements and must present formal exit, entry, health, and any other legally mandated documents upon request prior to embarkation or at any checkpoint during transit.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-teal-400 pl-3">2. Ticket Validity and Administrative Fees</h3>
                <p>This passenger ticket is valid for a strict period of one (1) month from the date of issuance. No reimbursement of collected funds will be granted under standard circumstances. Any exceptional reimbursement is purely at the discretion of Afrique-Con Plc management, which reserves the absolute right to deduct 35% of the ticket's gross value to satisfy administrative charges and processing costs.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-teal-400 pl-3">3. Terminal Check-In Requirements</h3>
                <p>Passengers must be physically present at the Afrique-Con Plc agency or terminal at least 2 hours (2H) before the scheduled departure time in order to successfully fulfill all administrative check-in, manifest entry, and embarkation formalities.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-teal-400 pl-3">4. Departure Re-confirmation</h3>
                <p>Passengers are required to re-confirm their scheduled departure status exactly 48 hours (48H) before the set time of vehicle movement.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-teal-400 pl-3">5. Code of Conduct and Safety</h3>
                <p>No acts of disturbance, quarreling, verbal assault, physical fighting, or any form of rowdy behavior are permitted on board the vehicle. Afrique-Con Plc reserves the right to deny transit or remove any passenger violating this safety clause without any liability or refund.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-teal-400 pl-3">6. Ticket Maintenance and Verification</h3>
                <p>No passenger will be allowed on board or permitted to remain in transit without a valid physical ticket. Passengers are mandated to keep their ticket safely on their person until the final end of the journey to avoid structural inconveniences or mandatory fare enforcement.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-teal-400 pl-3">7. Luggage and Cargo Liability Limits</h3>
                <p>The Company's liability for documented loss or damage to registered cargo or luggage is strictly limited to 10% of the freight value, except where a higher value is declared in writing in advance and additional premium charges are paid. Afrique-Con Plc bears absolutely no liability for fragile goods, perishables, or unchecked hand luggage.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-teal-400 pl-3">8. Asset Liability Exclusion</h3>
                <p>No legal or financial liability whatsoever attaches to the specific bus or transport asset conveying the luggage in the event of accidental loss or unforeseen transit circumstances.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-teal-400 pl-3">9. Free Baggage Allowance</h3>
                <p>Every ticketed passenger is entitled to a free maximum baggage allowance of 20 kgs. Any extra weight beyond this 20 kg threshold will attract excess weight surcharges, which must be paid in full prior to boarding.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-teal-400 pl-3">10. Round Trip Allocations</h3>
                <p>Passengers holding a Round Trip Ticket must formally confirm their return date and time at least 48 hours (48H) prior to the departure date of that return leg to secure seat scheduling.</p>
              </div>
            </>
          )}
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className={`px-6 py-2.5 rounded-xl font-bold text-white transition-all shadow-md ${type === 'cargo' ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20' : 'bg-teal-500 hover:bg-teal-400 shadow-teal-500/20'}`}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
