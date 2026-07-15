import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Search, Package, MapPin, Calendar, Clock, AlertCircle, CheckCircle, Truck, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CargoStatusLog {
  id: string;
  status: string;
  location: string;
  notes: string;
  timestamp: string;
}

interface CargoDetails {
  booking_id: string;
  origin: string;
  destination: string;
  weight_kg: number;
  cargo_type: string;
  status: string;
  payment_status: string;
  customer_name: string;
  recipient_name: string;
  created_at: string;
  logs: CargoStatusLog[];
}

const STATUS_META: Record<string, { colour: string; bg: string; border: string; glow: string; icon: React.ReactNode }> = {
  pending:    { colour: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200', glow: 'shadow-amber-200',  icon: <Clock className="w-5 h-5 text-amber-500" /> },
  in_transit: { colour: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',  glow: 'shadow-blue-200',   icon: <Truck className="w-5 h-5 text-blue-500" /> },
  delivered:  { colour: 'text-teal-700',   bg: 'bg-teal-50',   border: 'border-teal-200',  glow: 'shadow-teal-200',   icon: <CheckCircle className="w-5 h-5 text-teal-500" /> },
  cancelled:  { colour: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',   glow: 'shadow-red-200',    icon: <AlertCircle className="w-5 h-5 text-red-500" /> },
};

export default function TrackShipment() {
  const [searchParams] = useSearchParams();
  const [trackingId, setTrackingId] = useState(() => searchParams.get('id') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargo, setCargo] = useState<CargoDetails | null>(null);
  const { t } = useTranslation();

  const runTrack = useCallback(async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    setCargo(null);
    try {
      const { data, error: rpcError } = await supabase
        .rpc('track_cargo_shipment', { p_booking_id: id.trim() });
      if (rpcError) throw rpcError;
      if (!data || data.length === 0) {
        setError(t('track.notFound', 'No shipment found with that tracking ID.'));
      } else {
        setCargo(data[0] as CargoDetails);
      }
    } catch {
      setError(t('track.error', 'An error occurred while tracking the shipment.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Auto-track if ?id= is in the URL (deep-link from Profile page)
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam) runTrack(idParam);
  }, [searchParams, runTrack]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    runTrack(trackingId);
  };

  const statusMeta = cargo ? (STATUS_META[cargo.status] || STATUS_META['pending']) : null;

  return (
    <div className="bg-[#F4F6FA] min-h-screen py-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="w-16 h-16 bg-amber-400/15 rounded-2xl flex items-center justify-center mx-auto mb-5 animate-pulse-ring">
            <Search className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-extrabold text-slate-900 mb-2">{t('home.trackTitle')}</h1>
          <p className="text-slate-500">{t('home.trackSubtitle')}</p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleTrack} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 mb-8 flex gap-3 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <input
            type="text"
            value={trackingId}
            onChange={e => setTrackingId(e.target.value)}
            placeholder={t('home.trackPlaceholder')}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 font-mono text-slate-800 text-sm transition-all"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#0A1628] hover:bg-[#1a2d4e] text-white px-7 py-3 rounded-xl font-bold transition-all disabled:opacity-60 flex items-center gap-2 shadow-lg shadow-slate-900/15 group"
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t('cargoBooking.processing')}</>
              : <>{t('home.trackBtn')} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
            }
          </button>
        </form>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-100 flex items-center gap-3 mb-8 animate-fade-up">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Result card */}
        {cargo && statusMeta && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-fade-up">

            {/* Status header */}
            <div className="bg-gradient-to-r from-[#0A1628] to-[#1a2d4e] text-white p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Tracking ID</div>
                  <div className="text-xl font-mono font-bold text-amber-400">{cargo.booking_id}</div>
                </div>
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${statusMeta.bg} ${statusMeta.colour} ${statusMeta.border} border shadow-md ${statusMeta.glow}`}>
                  {statusMeta.icon}
                  {cargo.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-400 text-xs mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Route</div>
                  <div className="font-bold flex items-center gap-1 text-white">
                    {cargo.origin} <ArrowRight className="w-3 h-3 text-amber-400" /> {cargo.destination}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs mb-1 flex items-center gap-1"><Package className="w-3 h-3" /> Cargo Details</div>
                  <div className="font-semibold text-slate-200">{cargo.weight_kg} kg · {cargo.cargo_type.replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs mb-1">Sender</div>
                  <div className="font-semibold text-slate-200">{cargo.customer_name}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs mb-1">Recipient</div>
                  <div className="font-semibold text-slate-200">{cargo.recipient_name}</div>
                </div>
              </div>
            </div>

            {/* Tracking timeline */}
            <div className="p-7">
              <h3 className="text-lg font-display font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                {t('track.trackingHistory')}
              </h3>

              <div className="relative space-y-0">
                {/* Booked step */}
                <div className="relative flex gap-5 pb-8">
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 border-2 border-teal-300 flex items-center justify-center flex-shrink-0 z-10">
                      <CheckCircle className="w-4 h-4 text-teal-500" />
                    </div>
                    {(cargo.logs && cargo.logs.length > 0) && <div className="flex-1 w-0.5 bg-slate-200 mt-1" />}
                  </div>
                  <div className="pb-2 pt-1">
                    <div className="text-sm font-bold text-slate-900">{t('track.shipmentBooked')}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(cargo.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                {cargo.logs && cargo.logs.map((log, idx) => {
                  const meta = STATUS_META[log.status] || STATUS_META['pending'];
                  const isLast = idx === cargo.logs.length - 1;
                  return (
                    <div key={log.id} className="relative flex gap-5 pb-8">
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-xl ${meta.bg} border-2 ${meta.border} flex items-center justify-center flex-shrink-0 z-10`}>
                          {meta.icon}
                        </div>
                        {!isLast && <div className="flex-1 w-0.5 bg-slate-200 mt-1" />}
                      </div>
                      <div className="pb-2 pt-1">
                        <div className="text-sm font-bold text-slate-900 capitalize flex items-center gap-2">
                          {log.status.replace('_', ' ')}
                          {log.location && <span className="text-slate-400 font-normal text-xs">· {log.location}</span>}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                        {log.notes && (
                          <div className="mt-2 text-sm text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                            {log.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
