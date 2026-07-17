import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Printer, ArrowLeft, Loader2, CheckCircle2, MapPin, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TicketDetails {
  ticket_id: string;
  passenger_name: string;
  seat_number: string;
  ticket_type: string;
  total_fcfa: number;
  payment_status: string;
  created_at: string;
  schedule_id: string;
}

export default function ETicket() {
  const { ticket_id } = useParams();
  const { t } = useTranslation();
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTicket() {
      if (!ticket_id) return;
      try {
        const { data, error } = await supabase
          .from('passenger_tickets')
          .select('*')
          .eq('ticket_id', ticket_id)
          .single();
        if (error) throw error;
        setTicket(data);
      } catch (err: any) {
        setError(err.message || t('passengerBooking.ticketNotFound'));
      } finally {
        setLoading(false);
      }
    }
    fetchTicket();
  }, [ticket_id, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
          <p className="text-slate-500 font-medium">{t('admin.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center">
        <div className="bg-white rounded-3xl p-10 text-center shadow-xl border border-slate-100 max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎫</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">{t('passengerBooking.ticketNotFound')}</h2>
          <p className="text-slate-500 mb-6">{t('passengerBooking.ticketNotFoundDescription')}</p>
          <Link to="/profile" className="bg-[#0A1628] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1a2d4e] transition-colors inline-block">
            {t('passengerBooking.returnProfile')}
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = ticket.payment_status === 'paid';
  const qrData = JSON.stringify({ id: ticket.ticket_id, name: ticket.passenger_name, seat: ticket.seat_number, status: ticket.payment_status });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&color=0A1628&bgcolor=FFFFFF`;

  return (
    <div className="min-h-screen bg-[#F4F6FA] py-10 px-4 print:bg-white print:p-0">

      {/* Action bar */}
      <div className="max-w-2xl mx-auto mb-6 flex justify-between items-center print:hidden animate-fade-up">
        <Link to="/profile" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t('passengerBooking.backToProfile')}
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#0A1628] hover:bg-[#1a2d4e] text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg group"
        >
          <Printer className="w-4 h-4" />
          {t('passengerBooking.printSave')}
        </button>
      </div>

      {/* Boarding pass card */}
      <div className="max-w-2xl mx-auto animate-fade-up print:max-w-full" style={{ animationDelay: '0.1s' }}>
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/15 border border-slate-100 print:shadow-none print:rounded-none print:border-0">

          {/* Header gradient band */}
          <div className="bg-gradient-to-r from-[#0A1628] via-[#1a2d4e] to-[#0d3354] p-8 relative overflow-hidden print:bg-[#0A1628]">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'radial-gradient(circle, rgba(245,158,11,0.4) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }} />
            <div className="relative flex justify-between items-start">
              <div className="flex items-center gap-4">
                <img src="/logo.png" alt="Afrique-con" className="h-10 object-contain bg-white px-2 py-1 rounded-lg" />
                <div>
                  <div className="text-amber-400 text-xs font-bold uppercase tracking-widest">{t('passengerBooking.boardingPass')}</div>
                  <div className="text-white text-xl font-display font-extrabold mt-0.5">Afrique-con PLC</div>
                </div>
              </div>
              {isPaid && (
                <div className="flex items-center gap-1.5 bg-teal-400/20 border border-teal-400/40 text-teal-300 px-3 py-1.5 rounded-xl text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('passengerBooking.confirmed')}
                </div>
              )}
            </div>

            {/* Route display */}
            <div className="relative mt-8 flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-display font-extrabold text-white">
                  {ticket.schedule_id.split('-')[0] || 'DLA'}
                </div>
                <div className="text-slate-400 text-xs mt-1 uppercase tracking-wider">{t('home.origin')}</div>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1 max-w-[120px]">
                <div className="text-amber-400 text-xs font-semibold">✈ Direct</div>
                <div className="w-full h-px bg-gradient-to-r from-amber-400/50 via-amber-400 to-teal-400/50" />
              </div>
              <div className="text-center">
                <div className="text-4xl font-display font-extrabold text-white">
                  {ticket.schedule_id.split('-')[1] || 'LOS'}
                </div>
                <div className="text-slate-400 text-xs mt-1 uppercase tracking-wider">{t('home.destination')}</div>
              </div>
            </div>
          </div>

          {/* Perforated divider */}
          <div className="flex items-center px-0 -my-0 relative z-10">
            <div className="w-7 h-7 bg-[#F4F6FA] rounded-full flex-shrink-0 -ml-3.5 print:bg-white" />
            <div className="flex-1 border-t-2 border-dashed border-slate-200" />
            <div className="w-7 h-7 bg-[#F4F6FA] rounded-full flex-shrink-0 -mr-3.5 print:bg-white" />
          </div>

          {/* Ticket body */}
          <div className="p-8 flex flex-col md:flex-row gap-8">
            {/* Details */}
            <div className="flex-1 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t('passengerBooking.passenger')}</p>
                  <p className="font-bold text-slate-900 text-lg">{ticket.passenger_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t('passengerBooking.seat')}</p>
                  <p className="font-extrabold text-amber-500 text-3xl font-display">{ticket.seat_number}</p>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t('passengerBooking.scheduleId')}</p>
                  <p className="font-mono font-bold text-slate-800 text-sm">{ticket.schedule_id}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t('passengerBooking.class')}</p>
                  <p className="font-bold text-slate-800 capitalize">{ticket.ticket_type}</p>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {t('passengerBooking.bookingDate')}
                  </p>
                  <p className="font-semibold text-slate-700 text-sm">{new Date(ticket.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t('profile.payment')}</p>
                  {isPaid ? (
                    <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 font-bold text-sm px-3 py-1 rounded-full border border-teal-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> PAID
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold capitalize">{ticket.payment_status}</span>
                  )}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-slate-500 text-sm font-medium">{t('passengerBooking.totalAmount')}</span>
                <span className="text-xl font-display font-extrabold text-[#0A1628]">{ticket.total_fcfa?.toLocaleString()} FCFA</span>
              </div>
            </div>

            {/* QR code section */}
            <div className="flex flex-col items-center justify-center gap-3 shrink-0">
              <div className="bg-white p-3 rounded-2xl border-2 border-slate-100 shadow-inner animate-pulse-ring">
                <img src={qrUrl} alt="Ticket QR Code" className="w-40 h-40 rounded-xl" crossOrigin="anonymous" />
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 font-mono">{t('passengerBooking.scanVerify')}</p>
                <p className="text-xs text-slate-300 font-mono mt-0.5">{ticket.ticket_id.slice(0, 12)}...</p>
              </div>
            </div>
          </div>

          {/* Ticket footer */}
          <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex items-center gap-3 print:bg-white">
            <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-slate-500">Please arrive 30 minutes before departure. This ticket is non-transferable. Present this QR code at boarding.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
