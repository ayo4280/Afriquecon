import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { UserCircle, Package, Bus, LogOut, Loader2, Ticket, ArrowRight } from 'lucide-react';
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
    if (!user) {
      navigate('/login');
      return;
    }

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      paid: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      in_transit: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (!user) return null;

  return (
    <div className="bg-neutral min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-5xl">

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <UserCircle className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            {loading ? (
              <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            ) : (
              <h1 className="text-2xl font-display font-bold text-gray-900">
                {profile?.full_name || 'Afrique-con User'}
              </h1>
            )}
            <p className="text-gray-500 text-sm">{user.email}</p>
            <div className="flex gap-3 mt-2 text-sm text-gray-500">
              {profile?.country && <span>{profile.country === 'CM' ? '🇨🇲 Cameroon' : '🇳🇬 Nigeria'}</span>}
              {profile?.phone && <span>📞 {profile.phone}</span>}
              {profile?.telegram_id && <span>✈️ Telegram: {profile.telegram_id}</span>}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-red-500 hover:text-red-700 font-semibold transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {t('profile.signOut')}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 shadow-sm">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${activeTab === 'tickets' ? 'bg-primary text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Bus className="w-5 h-5" />
            {t('profile.myTickets')} ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('cargo')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${activeTab === 'cargo' ? 'bg-primary text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Package className="w-5 h-5" />
            {t('profile.cargoShipments')} ({cargoBookings.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20 text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
        ) : activeTab === 'tickets' ? (
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
                <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-700 mb-1">{t('profile.noTickets')}</h3>
                <p className="text-gray-500 text-sm mb-4">{t('profile.bookFirstTrip')}</p>
                <Link to="/" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors">
                  {t('profile.bookTripBtn')} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              tickets.map(ticket => (
                <div key={ticket.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-gray-400">{ticket.ticket_id}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusBadge(ticket.ticket_status)}`}>
                        {ticket.ticket_status?.toUpperCase()}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusBadge(ticket.payment_status)}`}>
                        💳 {ticket.payment_status?.toUpperCase()}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-800">
                      {ticket.passenger_name} — Seat {ticket.seat_number}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">{ticket.ticket_type} {t('profile.ticket')} · {t('profile.schedule')}: {ticket.schedule_id}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div>
                      <div className="text-xl font-bold text-primary">{ticket.total_fcfa?.toLocaleString()} FCFA</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(ticket.created_at).toLocaleDateString()}</div>
                    </div>
                    {ticket.payment_status === 'paid' && (
                      <Link 
                        to={`/ticket/${ticket.ticket_id}`}
                        className="text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 mt-1"
                      >
                        <Ticket className="w-3 h-3" /> {t('profile.viewETicket')}
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {cargoBookings.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-700 mb-1">{t('profile.noCargo')}</h3>
                <p className="text-gray-500 text-sm mb-4">{t('profile.shipFirstCargo')}</p>
                <Link to="/" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors">
                  {t('profile.shipCargoBtn')} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              cargoBookings.map(booking => (
                <div key={booking.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-gray-400">{booking.booking_id}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusBadge(booking.status)}`}>
                        {booking.status?.toUpperCase()}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusBadge(booking.payment_status)}`}>
                        💳 {booking.payment_status?.toUpperCase()}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-800">
                      {booking.origin} <ArrowRight className="w-4 h-4 inline text-gray-400" /> {booking.destination}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {booking.weight_kg} kg · {booking.cargo_type?.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">{booking.total_fcfa?.toLocaleString()} FCFA</div>
                    <div className="text-xs text-gray-400 mt-1">{new Date(booking.created_at).toLocaleDateString()}</div>
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
