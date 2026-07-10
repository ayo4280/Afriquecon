import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Package, Bus, LogOut, Loader2, Ticket, ArrowRight, MapPin, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Profile {
  full_name: string;
  email: string;
  phone: string;
  country: string;
  telegram_id: string;
  user_type: string;
  created_at: string;
}

interface PassengerTicket {
  id: string;
  ticket_id: string;
  schedule_id: string;
  passenger_name: string;
  seat_number: string;
  ticket_type: string;
  total_fcfa: number;
  payment_status: string;
  ticket_status: string;
  created_at: string;
}

interface CargoBooking {
  id: string;
  booking_id: string;
  origin: string;
  destination: string;
  weight_kg: number;
  cargo_type: string;
  total_fcfa: number;
  status: string;
  payment_status: string;
  created_at: string;
}

const STATUS_COLOURS: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-800 border-amber-200',
  confirmed:  'bg-teal-100 text-teal-800 border-teal-200',
  paid:       'bg-teal-100 text-teal-800 border-teal-200',
  cancelled:  'bg-red-100 text-red-800 border-red-200',
  in_transit: 'bg-blue-100 text-blue-800 border-blue-200',
  delivered:  'bg-green-100 text-green-800 border-green-200',
};

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [tickets, setTickets] = useState<PassengerTicket[]>([]);
  const [cargoBookings, setCargoBookings] = useState<CargoBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tickets' | 'cargo'>('tickets');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const fetchData = async () => {
      setLoading(true);
      const [profileRes, ticketsRes, cargoRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('passenger_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('cargo_bookings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      if (ticketsRes.data) setTickets(ticketsRes.data);
      if (cargoRes.data) setCargoBookings(cargoRes.data);
      setLoading(false);
    };
    fetchData();
  }, [user, navigate]);

  const handleSignOut = async () => { await signOut(); navigate('/'); };
  const initials = profile?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AC';

  if (!user) return null;

  const statusBadge = (status: string) => (
    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${STATUS_COLOURS[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
      {status?.toUpperCase()}
    </span>
  );

  return (
    <div className="bg-[#F4F6FA] min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-5xl">

        {/* Profile header card */}
        <div className="relative bg-gradient-to-r from-[#0A1628] to-[#1a2d4e] rounded-3xl p-8 mb-8 overflow-hidden animate-fade-up">
          {/* Dot pattern */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle, rgba(245,158,11,0.4) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />
          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[#0A1628] text-2xl font-extrabold font-display shadow-xl shadow-amber-400/30 flex-shrink-0">
              {loading ? '…' : initials}
            </div>

            <div className="flex-1">
              {loading
                ? <div className="h-7 w-48 bg-white/10 rounded-lg animate-pulse mb-2" />
                : <h1 className="text-2xl font-display font-extrabold text-white mb-1">{profile?.full_name || 'Afrique-con User'}</h1>
              }
              <p className="text-slate-400 text-sm mb-3">{user.email}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {profile?.country && (
                  <span className="flex items-center gap-1.5 bg-white/10 border border-white/15 text-slate-300 px-3 py-1.5 rounded-xl">
                    {profile.country === 'CM' ? '🇨🇲 Cameroon' : '🇳🇬 Nigeria'}
                  </span>
                )}
                {profile?.phone && (
                  <span className="flex items-center gap-1.5 bg-white/10 border border-white/15 text-slate-300 px-3 py-1.5 rounded-xl">
                    📞 {profile.phone}
                  </span>
                )}
                {profile?.telegram_id && (
                  <span className="flex items-center gap-1.5 bg-teal-400/15 border border-teal-400/25 text-teal-300 px-3 py-1.5 rounded-xl">
                    ✈ @{profile.telegram_id}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 bg-red-400/10 hover:bg-red-400/20 border border-red-400/25 text-red-400 px-4 py-2.5 rounded-xl font-semibold transition-all text-sm"
            >
              <LogOut className="w-4 h-4" />
              {t('profile.signOut')}
            </button>
          </div>

          {/* Quick stats */}
          <div className="relative mt-6 grid grid-cols-2 gap-4">
            <div className="bg-white/8 border border-white/10 rounded-2xl p-4">
              <div className="text-2xl font-display font-extrabold text-amber-400">{tickets.length}</div>
              <div className="text-xs text-slate-400 font-medium">Tickets Booked</div>
            </div>
            <div className="bg-white/8 border border-white/10 rounded-2xl p-4">
              <div className="text-2xl font-display font-extrabold text-teal-400">{cargoBookings.length}</div>
              <div className="text-xs text-slate-400 font-medium">Cargo Shipments</div>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5 mb-6 flex gap-1 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'tickets' ? 'bg-[#0A1628] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Bus className="w-4 h-4" />
            {t('profile.myTickets')} ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('cargo')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'cargo' ? 'bg-[#0A1628] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Package className="w-4 h-4" />
            {t('profile.cargoShipments')} ({cargoBookings.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <span className="font-medium">Loading your history...</span>
          </div>
        ) : activeTab === 'tickets' ? (
          <div className="space-y-4 animate-fade-up">
            {tickets.length === 0 ? (
              <div className="bg-white rounded-3xl p-14 text-center border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Ticket className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-700 mb-2">{t('profile.noTickets')}</h3>
                <p className="text-slate-400 text-sm mb-5">{t('profile.bookFirstTrip')}</p>
                <Link to="/" className="inline-flex items-center gap-2 bg-[#0A1628] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1a2d4e] transition-colors">
                  {t('profile.bookTripBtn')} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              tickets.map(ticket => (
                <div key={ticket.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm card-hover overflow-hidden">
                  <div className="p-5 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2.5">
                        <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">{ticket.ticket_id}</span>
                        {statusBadge(ticket.ticket_status)}
                        {statusBadge(ticket.payment_status)}
                      </div>
                      <p className="font-bold text-slate-900 text-base">{ticket.passenger_name} — Seat <span className="text-amber-500">{ticket.seat_number}</span></p>
                      <p className="text-sm text-slate-500 capitalize mt-0.5">{ticket.ticket_type} ticket · Schedule: {ticket.schedule_id}</p>
                    </div>
                    <div className="flex flex-col items-end justify-between gap-3">
                      <div className="text-right">
                        <div className="text-xl font-display font-extrabold text-[#0A1628]">{ticket.total_fcfa?.toLocaleString()} FCFA</div>
                        <div className="text-xs text-slate-400 mt-0.5">{new Date(ticket.created_at).toLocaleDateString()}</div>
                      </div>
                      {ticket.payment_status === 'paid' && (
                        <Link
                          to={`/ticket/${ticket.ticket_id}`}
                          className="flex items-center gap-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-2 rounded-xl transition-colors"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          {t('profile.viewETicket')}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-fade-up">
            {cargoBookings.length === 0 ? (
              <div className="bg-white rounded-3xl p-14 text-center border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-700 mb-2">{t('profile.noCargo')}</h3>
                <p className="text-slate-400 text-sm mb-5">{t('profile.shipFirstCargo')}</p>
                <Link to="/" className="inline-flex items-center gap-2 bg-[#0A1628] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1a2d4e] transition-colors">
                  {t('profile.shipCargoBtn')} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              cargoBookings.map(booking => (
                <div key={booking.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm card-hover overflow-hidden">
                  <div className="p-5 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2.5">
                        <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">{booking.booking_id}</span>
                        {statusBadge(booking.status)}
                        {statusBadge(booking.payment_status)}
                      </div>
                      <p className="font-bold text-slate-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-500" />
                        {booking.origin} <ArrowRight className="w-4 h-4 text-slate-300" /> {booking.destination}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">{booking.weight_kg} kg · {booking.cargo_type?.replace('_', ' ')}</p>
                    </div>
                    <div className="flex flex-col items-end justify-between gap-3">
                      <div className="text-right">
                        <div className="text-xl font-display font-extrabold text-[#0A1628]">{booking.total_fcfa?.toLocaleString()} FCFA</div>
                        <div className="text-xs text-slate-400 mt-0.5">{new Date(booking.created_at).toLocaleDateString()}</div>
                      </div>
                      <Link
                        to={`/track?id=${booking.booking_id}`}
                        className="flex items-center gap-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-2 rounded-xl transition-colors"
                      >
                        <Search className="w-3.5 h-3.5" />
                        {t('profile.track')}
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
