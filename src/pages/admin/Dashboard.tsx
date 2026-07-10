import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Users, Package, Ticket, Bus, TrendingUp, LogOut,
  Loader2, ArrowRight, RefreshCw, Shield,
  MapPin, Calendar, Phone, Mail, Plus, BarChart3, Download
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  country: string;
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
  user_id: string;
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
  customer_name: string;
  customer_email: string;
  recipient_name: string;
  created_at: string;
  user_id: string;
}

interface Schedule {
  id: string;
  origin: string;
  destination: string;
  departure_time: string;
  base_fare_fcfa: number;
  available_seats: number;
  status: string;
}

type Tab = 'overview' | 'users' | 'tickets' | 'cargo' | 'schedules' | 'reports';

// ─── Admin emails ─────────────────────────────────────────────────────────────
const ADMIN_EMAILS = ['testuser3@afrique-con.com', 'admin@afrique-con.com', 'ayodelesodiya@gmail.com'];

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tickets, setTickets] = useState<PassengerTicket[]>([]);
  const [cargo, setCargo] = useState<CargoBooking[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Cargo Update Modal State
  const [updatingCargo, setUpdatingCargo] = useState<CargoBooking | null>(null);
  const [newStatus, setNewStatus] = useState('pending');
  const [statusLocation, setStatusLocation] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [negotiatedPrice, setNegotiatedPrice] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [markPaidLoading, setMarkPaidLoading] = useState<string | null>(null);
  const [markTicketPaidLoading, setMarkTicketPaidLoading] = useState<string | null>(null);
  const [cancelScheduleLoading, setCancelScheduleLoading] = useState<string | null>(null);

  // Add Schedule Modal State
  const [addingSchedule, setAddingSchedule] = useState(false);
  const [newSchedOrigin, setNewSchedOrigin] = useState('Douala');
  const [newSchedDest, setNewSchedDest] = useState('Yaoundé');
  const [newSchedDep, setNewSchedDep] = useState('');
  const [newSchedArr, setNewSchedArr] = useState('');
  const [newSchedFare, setNewSchedFare] = useState('');
  const [addSchedLoading, setAddSchedLoading] = useState(false);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email ?? '');

  const fetchAll = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    const [profilesRes, ticketsRes, cargoRes, schedulesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('passenger_tickets').select('*').order('created_at', { ascending: false }),
      supabase.from('cargo_bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('bus_schedules').select('*').order('departure_time', { ascending: true }),
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data);
    if (ticketsRes.data) setTickets(ticketsRes.data);
    if (cargoRes.data) setCargo(cargoRes.data);
    if (schedulesRes.data) setSchedules(schedulesRes.data);

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!isAdmin) { navigate('/'); return; }
    fetchAll();
  }, [user, navigate]);

  if (!user || !isAdmin) return null;

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const totalRevenue = [
    ...tickets.map(t => t.total_fcfa || 0),
    ...cargo.map(c => c.total_fcfa || 0),
  ].reduce((sum, v) => sum + v, 0);

  const cargoRevenue = cargo.reduce((sum, c) => sum + (c.total_fcfa || 0), 0);
  const ticketRevenue = tickets.reduce((sum, t) => sum + (t.total_fcfa || 0), 0);

  const pendingTickets = tickets.filter(t => t.payment_status === 'pending').length;
  const pendingCargo = cargo.filter(c => c.payment_status === 'pending').length;

  const exportToCSV = (filename: string, data: any[]) => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));
    for (const row of data) {
      const values = headers.map(header => {
        const escaped = ('' + (row[header] ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleUpdateCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingCargo) return;
    setUpdateLoading(true);
    try {
      // 1. Build update payload
      const updatePayload: Record<string, any> = { status: newStatus };
      if (negotiatedPrice && parseFloat(negotiatedPrice) > 0) {
        updatePayload.total_fcfa = parseFloat(negotiatedPrice);
      }

      // 2. Update cargo_bookings status (and price if provided)
      const { error: updateErr } = await supabase.from('cargo_bookings').update(updatePayload).eq('id', updatingCargo.id);
      if (updateErr) throw updateErr;

      // 3. Insert into cargo_status_log
      const { error: logErr } = await supabase.from('cargo_status_log').insert({
        booking_id: updatingCargo.id,
        status: newStatus,
        location: statusLocation,
        notes: statusNotes + (negotiatedPrice ? ` | Agreed price: ${parseFloat(negotiatedPrice).toLocaleString()} FCFA` : ''),
        updated_by: user?.email
      });
      if (logErr) throw logErr;

      // Refresh data and close modal
      await fetchAll();
      setUpdatingCargo(null);
      setNegotiatedPrice('');
    } catch (err: any) {
      console.error(err);
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleMarkAsPaid = async (booking: CargoBooking) => {
    if (!window.confirm(`Mark booking ${booking.booking_id} as PAID? This will send a confirmation email to ${booking.customer_email}.`)) return;
    setMarkPaidLoading(booking.id);
    try {
      const { error } = await supabase
        .from('cargo_bookings')
        .update({ payment_status: 'paid', status: booking.status === 'pending' ? 'confirmed' : booking.status })
        .eq('id', booking.id);
      if (error) throw error;
      await fetchAll();
      alert(`✅ Booking ${booking.booking_id} marked as paid!`);
    } catch (err: any) {
      console.error(err);
      alert('Failed to mark as paid: ' + err.message);
    } finally {
      setMarkPaidLoading(null);
    }
  };

  const handleMarkTicketAsPaid = async (ticket: PassengerTicket) => {
    if (!window.confirm(`Mark ticket ${ticket.ticket_id} as PAID?`)) return;
    setMarkTicketPaidLoading(ticket.id);
    try {
      const { error } = await supabase
        .from('passenger_tickets')
        .update({ payment_status: 'paid', ticket_status: ticket.ticket_status === 'pending' ? 'confirmed' : ticket.ticket_status })
        .eq('id', ticket.id);
      if (error) throw error;
      await fetchAll();
      alert(`✅ Ticket ${ticket.ticket_id} marked as paid!`);
    } catch (err: any) {
      console.error(err);
      alert('Failed to mark ticket as paid: ' + err.message);
    } finally {
      setMarkTicketPaidLoading(null);
    }
  };

  const handleCancelSchedule = async (schedule: Schedule) => {
    if (!window.confirm(`Cancel schedule ${schedule.origin} → ${schedule.destination} on ${new Date(schedule.departure_time).toLocaleString()}?`)) return;
    setCancelScheduleLoading(schedule.id);
    try {
      const { error } = await supabase
        .from('bus_schedules')
        .update({ status: 'cancelled' })
        .eq('id', schedule.id);
      if (error) throw error;
      await fetchAll();
    } catch (err: any) {
      console.error(err);
      alert('Failed to cancel schedule: ' + err.message);
    } finally {
      setCancelScheduleLoading(null);
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSchedLoading(true);
    try {
      const { error: insertErr } = await supabase.from('bus_schedules').insert({
        origin: newSchedOrigin,
        destination: newSchedDest,
        departure_time: newSchedDep,
        arrival_time: newSchedArr,
        base_fare_fcfa: parseFloat(newSchedFare) || 0,
        available_seats: 48,
        status: 'scheduled'
      });
      
      if (insertErr) throw insertErr;

      await fetchAll();
      setAddingSchedule(false);
      setNewSchedDep('');
      setNewSchedArr('');
      setNewSchedFare('');
    } catch (err: any) {
      console.error(err);
      alert('Failed to add schedule: ' + err.message);
    } finally {
      setAddSchedLoading(false);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const statusBadge = (status: string, type: 'payment' | 'status' = 'status') => {
    const paymentColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      paid: 'bg-green-100 text-green-800 border border-green-200',
      failed: 'bg-red-100 text-red-800 border border-red-200',
    };
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
      in_transit: 'bg-purple-100 text-purple-800 border border-purple-200',
      delivered: 'bg-green-100 text-green-800 border border-green-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200',
      scheduled: 'bg-blue-100 text-blue-800 border border-blue-200',
    };
    const colors = type === 'payment' ? paymentColors : statusColors;
    return colors[status] || 'bg-gray-100 text-gray-600 border border-gray-200';
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview', label: t('admin.overview'), icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'users', label: t('admin.users'), icon: <Users className="w-4 h-4" />, count: profiles.length },
    { id: 'tickets', label: t('admin.tickets'), icon: <Ticket className="w-4 h-4" />, count: tickets.length },
    { id: 'cargo', label: t('admin.cargo'), icon: <Package className="w-4 h-4" />, count: cargo.length },
    { id: 'schedules', label: t('admin.schedules'), icon: <Bus className="w-4 h-4" />, count: schedules.length },
    { id: 'reports', label: t('admin.reports'), icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Admin Topbar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm">{t('admin.dashboard')}</span>
            <span className="text-gray-400 text-xs ml-2">Afrique-con PLC</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? t('admin.refreshing') : t('admin.refresh')}
          </button>
          <span className="text-gray-500 text-xs hidden md:block">{user.email}</span>
          <button
            onClick={async () => { await signOut(); navigate('/'); }}
            className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t('profile.signOut')}
          </button>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-57px)]">
        {/* Sidebar */}
        <aside className="w-52 bg-gray-900 border-r border-gray-800 py-6 flex-shrink-0 hidden md:block">
          <nav className="space-y-1 px-3">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                </span>
                {tab.count !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-700 text-gray-300'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          ) : (
            <>
              {/* ── OVERVIEW ── */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white">{t('admin.platformOverview')}</h2>

                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: t('admin.totalUsers'), value: profiles.length, icon: <Users className="w-6 h-6" />, color: 'from-blue-600 to-blue-400' },
                      { label: t('admin.passengerTickets'), value: tickets.length, icon: <Ticket className="w-6 h-6" />, color: 'from-green-600 to-green-400' },
                      { label: t('admin.cargoBookings'), value: cargo.length, icon: <Package className="w-6 h-6" />, color: 'from-purple-600 to-purple-400' },
                      { label: t('admin.totalRevenue'), value: totalRevenue.toLocaleString(), icon: <TrendingUp className="w-6 h-6" />, color: 'from-orange-600 to-orange-400', wide: true },
                    ].map(stat => (
                      <div key={stat.label} className={`bg-gradient-to-br ${stat.color} p-5 rounded-xl shadow-lg`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="opacity-80">{stat.icon}</div>
                        </div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-white/70 text-sm mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Pending Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">{t('admin.pendingActions')}</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm flex items-center gap-2"><Ticket className="w-4 h-4 text-yellow-400" /> {t('admin.unpaidTickets')}</span>
                          <span className="font-bold text-yellow-400">{pendingTickets}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm flex items-center gap-2"><Package className="w-4 h-4 text-yellow-400" /> {t('admin.unpaidCargo')}</span>
                          <span className="font-bold text-yellow-400">{pendingCargo}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm flex items-center gap-2"><Bus className="w-4 h-4 text-blue-400" /> {t('admin.activeSchedules')}</span>
                          <span className="font-bold text-blue-400">{schedules.filter(s => s.status === 'scheduled').length}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">{t('admin.recentSignups')}</h3>
                      <div className="space-y-3">
                        {profiles.slice(0, 4).map(p => (
                          <div key={p.id} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                              {(p.full_name || p.email || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-white truncate">{p.full_name || 'Unknown'}</div>
                              <div className="text-xs text-gray-500 truncate">{p.email}</div>
                            </div>
                            <div className="text-xs text-gray-600 ml-auto flex-shrink-0">{new Date(p.created_at).toLocaleDateString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── USERS ── */}
              {activeTab === 'users' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">{t('admin.allUsers')} <span className="text-gray-500 text-lg font-normal">({profiles.length})</span></h2>
                  <div className="space-y-3">
                    {profiles.map(p => (
                      <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                          {(p.full_name || p.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div>
                            <div className="font-semibold text-white">{p.full_name || 'No name set'}</div>
                            <div className="text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" /> {p.email}</div>
                          </div>
                          <div className="text-gray-400">
                            {p.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {p.phone}</div>}
                            {p.country && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.country === 'CM' ? '🇨🇲 Cameroon' : p.country === 'NG' ? '🇳🇬 Nigeria' : p.country}</div>}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${p.user_type === 'admin' ? 'bg-red-900 text-red-300' : 'bg-gray-800 text-gray-300'}`}>
                              {p.user_type || 'passenger'}
                            </span>
                            <span className="text-xs text-gray-600">{new Date(p.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {profiles.length === 0 && (
                      <div className="text-center py-16 text-gray-500">{t('admin.noUsers')}</div>
                    )}
                  </div>
                </div>
              )}

              {/* ── TICKETS ── */}
              {activeTab === 'tickets' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">{t('admin.allPassengerTickets')} <span className="text-gray-500 text-lg font-normal">({tickets.length})</span></h2>
                  <div className="space-y-3">
                    {tickets.map(ticket => (
                      <div key={ticket.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <div className="font-mono text-xs text-primary mb-1">{ticket.ticket_id}</div>
                            <div className="font-semibold text-white">{ticket.passenger_name}</div>
                            <div className="text-gray-400 text-xs capitalize">{ticket.ticket_type} · {t('admin.seat')} {ticket.seat_number}</div>
                          </div>
                          <div className="text-gray-400">
                            <div className="text-xs text-gray-500 mb-1">{t('profile.schedule')}</div>
                            <div className="text-gray-300 font-mono text-xs truncate">{ticket.schedule_id}</div>
                          </div>
                          <div className="flex gap-2 flex-wrap items-start">
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusBadge(ticket.ticket_status)}`}>
                              {ticket.ticket_status}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusBadge(ticket.payment_status, 'payment')}`}>
                              💳 {ticket.payment_status}
                            </span>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            <div>
                              <div className="text-lg font-bold text-primary">{(ticket.total_fcfa || 0).toLocaleString()} FCFA</div>
                              <div className="text-xs text-gray-500">{new Date(ticket.created_at).toLocaleDateString()}</div>
                            </div>
                            {ticket.payment_status !== 'paid' && (
                              <button
                                onClick={() => handleMarkTicketAsPaid(ticket)}
                                disabled={markTicketPaidLoading === ticket.id}
                                className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                              >
                                {markTicketPaidLoading === ticket.id ? t('admin.markingPaid') : `✅ ${t('admin.markAsPaid')}`}
                              </button>
                            )}
                            {ticket.payment_status === 'paid' && (
                              <span className="px-3 py-1 bg-green-900/50 text-green-400 rounded text-xs font-semibold text-center">✅ {t('admin.paid')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {tickets.length === 0 && (
                      <div className="text-center py-16 text-gray-500">{t('admin.noData')}</div>
                    )}
                  </div>
                </div>
              )}

              {/* ── CARGO ── */}
              {activeTab === 'cargo' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">{t('admin.allCargoBookings')} <span className="text-gray-500 text-lg font-normal">({cargo.length})</span></h2>
                  <div className="space-y-3">
                    {cargo.map(c => (
                      <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <div className="font-mono text-xs text-purple-400 mb-1">{c.booking_id}</div>
                              <div className="font-semibold text-white">{c.customer_name}</div>
                              <div className="text-gray-400 text-xs">→ {c.recipient_name}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">{t('cargoBooking.route')}</div>
                              <div className="text-white flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                {c.origin} <ArrowRight className="w-3 h-3 text-gray-500" /> {c.destination}
                              </div>
                              <div className="text-gray-400 text-xs mt-1">{c.weight_kg} kg · {c.cargo_type?.replace('_', ' ')}</div>
                            </div>
                            <div className="flex gap-2 flex-wrap items-start">
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusBadge(c.status)}`}>
                                {c.status}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusBadge(c.payment_status, 'payment')}`}>
                                💳 {c.payment_status}
                              </span>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                              <div>
                                <div className="text-lg font-bold text-purple-400">{(c.total_fcfa || 0).toLocaleString()} FCFA</div>
                                <div className="text-xs text-gray-500">{new Date(c.created_at).toLocaleDateString()}</div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => {
                                    setUpdatingCargo(c);
                                    setNewStatus(c.status);
                                    setStatusLocation('');
                                    setStatusNotes('');
                                    setNegotiatedPrice('');
                                  }}
                                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs font-semibold transition-colors"
                                >
                                  {t('admin.updateStatus')}
                                </button>
                                {c.payment_status !== 'paid' && (
                                  <button
                                    onClick={() => handleMarkAsPaid(c)}
                                    disabled={markPaidLoading === c.id}
                                    className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                  >
                                    {markPaidLoading === c.id ? '...' : '✅ Mark as Paid'}
                                  </button>
                                )}
                                {c.payment_status === 'paid' && (
                                  <span className="px-3 py-1 bg-green-900/50 text-green-400 rounded text-xs font-semibold text-center">✅ Paid</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {cargo.length === 0 && (
                      <div className="text-center py-16 text-gray-500">{t('profile.noCargo')}</div>
                    )}
                  </div>
                </div>
              )}

              {/* ── SCHEDULES ── */}
              {activeTab === 'schedules' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">{t('admin.allBusSchedules')} <span className="text-gray-500 text-lg font-normal">({schedules.length})</span></h2>
                    <button 
                      onClick={() => setAddingSchedule(true)}
                      className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> {t('admin.addSchedule')}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {schedules.map(s => (
                      <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-blue-400" />
                              {s.origin} → {s.destination}
                            </div>
                            <div className="text-xs font-mono text-gray-500 mt-1">{s.id.slice(0, 12)}...</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">{t('admin.departure')}</div>
                            <div className="text-white flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              {new Date(s.departure_time).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">{t('admin.availability')}</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-800 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${(s.available_seats / 48) * 100}%` }}
                                />
                              </div>
                              <span className="text-white text-xs font-semibold">{s.available_seats}/48</span>
                            </div>
                          </div>
                          <div className="text-right flex items-center justify-end gap-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusBadge(s.status)}`}>
                              {s.status}
                            </span>
                            <div className="text-lg font-bold text-green-400">{(s.base_fare_fcfa || 0).toLocaleString()} FCFA</div>
                            {s.status !== 'cancelled' && (
                              <button
                                onClick={() => handleCancelSchedule(s)}
                                disabled={cancelScheduleLoading === s.id}
                                className="px-3 py-1 bg-red-800 hover:bg-red-700 text-red-200 rounded text-xs font-semibold transition-colors disabled:opacity-50"
                              >
                                {cancelScheduleLoading === s.id ? '...' : t('admin.cancelSchedule')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {schedules.length === 0 && (
                      <div className="text-center py-16 text-gray-500">{t('admin.noSchedules')}</div>
                    )}
                  </div>
                </div>
              )}

              {/* ── REPORTS ── */}
              {activeTab === 'reports' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">{t('admin.reportsAnalytics')}</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Revenue Breakdown */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                      <h3 className="text-gray-400 font-medium mb-4 text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        {t('admin.revenueBreakdown')}
                      </h3>
                      <div className="space-y-4">
                      <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">{t('admin.cargoShipping')}</span>
                            <span className="text-white font-semibold">{cargoRevenue.toLocaleString()} FCFA</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${totalRevenue === 0 ? 0 : (cargoRevenue / totalRevenue) * 100}%` }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">{t('admin.passengerTravel')}</span>
                            <span className="text-white font-semibold">{ticketRevenue.toLocaleString()} FCFA</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${totalRevenue === 0 ? 0 : (ticketRevenue / totalRevenue) * 100}%` }}></div>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
                          <span className="text-gray-400 text-sm">{t('admin.totalRevenue')}</span>
                          <span className="text-xl font-bold text-white">{totalRevenue.toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    </div>

                    {/* Data Export */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                      <h3 className="text-gray-400 font-medium mb-4 text-sm flex items-center gap-2">
                        <Download className="w-4 h-4 text-green-400" />
                        {t('admin.dataExports')}
                      </h3>
                      <div className="space-y-3">
                        <button 
                          onClick={() => exportToCSV('cargo_bookings.csv', cargo)}
                          className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-200 transition-colors"
                        >
                          <span className="flex items-center gap-2"><Package className="w-4 h-4" /> Export Cargo Bookings</span>
                          <Download className="w-4 h-4 text-gray-400" />
                        </button>
                        <button 
                          onClick={() => exportToCSV('passenger_tickets.csv', tickets)}
                          className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-200 transition-colors"
                        >
                          <span className="flex items-center gap-2"><Ticket className="w-4 h-4" /> Export Passenger Tickets</span>
                          <Download className="w-4 h-4 text-gray-400" />
                        </button>
                        <button 
                          onClick={() => exportToCSV('users.csv', profiles)}
                          className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-200 transition-colors"
                        >
                          <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Export User Data</span>
                          <Download className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      {/* ── UPDATE CARGO STATUS MODAL ── */}
      {updatingCargo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-2">{t('admin.updateCargoStatus')}</h3>
            <p className="text-gray-400 text-sm mb-6">Booking ID: <span className="font-mono text-purple-400">{updatingCargo.booking_id}</span></p>

            <form onSubmit={handleUpdateCargo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('admin.newStatus')}</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Negotiated Price — shown for large shipments or when price is 0 */}
              {(updatingCargo && (updatingCargo.weight_kg >= 100 || !updatingCargo.total_fcfa)) && (
                <div>
                  <label className="block text-sm font-medium text-amber-400 mb-1">⚖️ Negotiated Price (FCFA) <span className="text-gray-500 font-normal">— required for ≥100kg</span></label>
                  <input
                    type="number"
                    min="0"
                    value={negotiatedPrice}
                    onChange={(e) => setNegotiatedPrice(e.target.value)}
                    placeholder={`Current: ${(updatingCargo?.total_fcfa || 0).toLocaleString()} FCFA`}
                    className="w-full bg-gray-800 border border-amber-600/50 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter the agreed price after negotiation with customer.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('admin.locationOptional')}</label>
                <input
                  type="text"
                  value={statusLocation}
                  onChange={(e) => setStatusLocation(e.target.value)}
                  placeholder={t('admin.locationPlaceholder')}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('admin.notesOptional')}</label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder={t('admin.notesPlaceholder')}
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-800 mt-6">
                <button
                  type="button"
                  onClick={() => setUpdatingCargo(null)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {updateLoading ? t('admin.loading') : t('admin.saveUpdate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD SCHEDULE MODAL ── */}
      {addingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-6">{t('admin.addNewSchedule')}</h3>

            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Origin</label>
                  <input
                    required type="text" value={newSchedOrigin} onChange={e => setNewSchedOrigin(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Destination</label>
                  <input
                    required type="text" value={newSchedDest} onChange={e => setNewSchedDest(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Departure Time</label>
                <input
                  required type="datetime-local" value={newSchedDep} onChange={e => setNewSchedDep(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Arrival Time</label>
                <input
                  required type="datetime-local" value={newSchedArr} onChange={e => setNewSchedArr(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Base Fare (FCFA)</label>
                <input
                  required type="number" min="0" value={newSchedFare} onChange={e => setNewSchedFare(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-800 mt-6">
                <button
                  type="button"
                  onClick={() => setAddingSchedule(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSchedLoading}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {addSchedLoading ? t('admin.loading') : t('admin.addSchedule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
