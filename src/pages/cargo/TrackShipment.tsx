import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Package, MapPin, Calendar, Clock, AlertCircle, CheckCircle, Truck } from 'lucide-react';
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

export default function TrackShipment() {
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargo, setCargo] = useState<CargoDetails | null>(null);
  const { t } = useTranslation();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;

    setLoading(true);
    setError(null);
    setCargo(null);

    try {
      // Use the custom RPC function to fetch by ID to bypass strict RLS
      const { data, error: rpcError } = await supabase
        .rpc('track_cargo_shipment', { p_booking_id: trackingId.trim() });

      if (rpcError) throw rpcError;

      if (!data || data.length === 0) {
        setError(t('track.notFound', 'No shipment found with that tracking ID.'));
      } else {
        setCargo(data[0] as CargoDetails);
      }
    } catch (err: any) {
      console.error('Tracking Error:', err);
      setError(t('track.error', 'An error occurred while tracking the shipment.'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'in_transit': return <Truck className="w-5 h-5 text-blue-500" />;
      case 'delivered': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Package className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-neutral flex flex-col items-center py-16 px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">{t('home.trackTitle')}</h1>
          <p className="text-gray-600">{t('home.trackSubtitle')}</p>
        </div>

        <form onSubmit={handleTrack} className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 mb-8 flex gap-3">
          <input
            type="text"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder={t('home.trackPlaceholder')}
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {loading ? t('cargoBooking.processing') : t('home.trackBtn')}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center gap-3 mb-8 animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {cargo && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-gray-900 text-white p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="text-gray-400 text-sm mb-1">{t('cargoBooking.quoteRef')}</div>
                  <div className="text-xl font-mono font-bold text-primary">{cargo.booking_id}</div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold w-fit ${getStatusColor(cargo.status)}`}>
                  {cargo.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 mb-1">{t('cargoBooking.route')}</div>
                  <div className="font-semibold flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    {cargo.origin} → {cargo.destination}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">{t('track.details')}</div>
                  <div className="font-semibold text-gray-200">
                    {cargo.weight_kg} kg · {cargo.cargo_type.replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">{t('track.sender')}</div>
                  <div className="font-semibold text-gray-200">{cargo.customer_name}</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">{t('track.recipient')}</div>
                  <div className="font-semibold text-gray-200">{cargo.recipient_name}</div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" /> {t('track.trackingHistory')}
              </h3>
              
              <div className="relative border-l-2 border-gray-200 ml-4 space-y-8 pb-4">
                {/* Always show the 'Created' log first */}
                <div className="relative pl-8">
                  <div className="absolute -left-[11px] top-1 w-5 h-5 bg-gray-200 rounded-full border-4 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-gray-500 rounded-full" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{t('track.shipmentBooked')}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" /> {new Date(cargo.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                {cargo.logs && cargo.logs.map((log) => (
                  <div key={log.id} className="relative pl-8">
                    <div className="absolute -left-[13px] top-0 bg-white p-1 rounded-full">
                      {getStatusIcon(log.status)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 capitalize">
                        {log.status.replace('_', ' ')}
                        {log.location && <span className="text-gray-500 font-normal"> · {log.location}</span>}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" /> {new Date(log.timestamp).toLocaleString()}
                      </div>
                      {log.notes && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                          {log.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
