import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { supabase } from '../../lib/supabase';
import {
  Users, Package, Ticket, Bus, TrendingUp, LogOut,
  Loader2, ArrowRight, RefreshCw, Shield,
  MapPin, Calendar, Phone, Mail, Plus, Eye, EyeOff, BarChart3, Download, Settings
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

interface Route {
  id: string;
  origin: string;
  destination: string;
  base_rate_fcfa: number;
  active: boolean;
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  branch: string;
  active: boolean;
}

type Tab = 'overview' | 'users' | 'tickets' | 'cargo' | 'schedules' | 'reports' | 'settings';

// ─── Admin emails ─────────────────────────────────────────────────────────────

// ─── Role helpers ─────────────────────────────────────────────────────────────
type AdminRole = 'agent' | 'manager' | 'super_admin';
type AccountRole = 'client' | AdminRole;
const ROLE_LABELS: Record<AdminRole, string> = {
  agent: 'Agent',
  manager: 'Manager',
  super_admin: 'Super Admin',
};
const ROLE_COLORS: Record<AdminRole, string> = {
  agent: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  manager: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  super_admin: 'bg-red-500/15 text-red-400 border-red-500/30',
};

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
  const [routesList, setRoutesList] = useState<Route[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [currentAdminRole, setCurrentAdminRole] = useState<AdminRole | null>(null);
  const [authorizing, setAuthorizing] = useState(true);
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [showNewAccountPassword, setShowNewAccountPassword] = useState(false);
  const [newAccountPhone, setNewAccountPhone] = useState('');
  const [newAccountCountry, setNewAccountCountry] = useState<'CM' | 'NG'>('CM');
  const [newAccountRole, setNewAccountRole] = useState<AccountRole>('client');
  const [creatingAccount, setCreatingAccount] = useState(false);

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
  const [deleteScheduleLoading, setDeleteScheduleLoading] = useState<string | null>(null);
  const [deleteCargoLoading, setDeleteCargoLoading] = useState<string | null>(null);

  // Add Schedule Modal State
  const [addingSchedule, setAddingSchedule] = useState(false);
  const [newSchedOrigin, setNewSchedOrigin] = useState('Douala');
  const [newSchedDest, setNewSchedDest] = useState('Yaoundé');
  const [newSchedDep, setNewSchedDep] = useState('');
  const [newSchedArr, setNewSchedArr] = useState('');
  const [newSchedFare, setNewSchedFare] = useState('');
  const [addSchedLoading, setAddSchedLoading] = useState(false);

  const isAdmin = currentAdminRole !== null;

  // ─── Role permission helpers ──────────────────────────────────────────────
  const canManageSchedules = currentAdminRole === 'manager' || currentAdminRole === 'super_admin';
  const canNegotiatePrice  = currentAdminRole === 'manager' || currentAdminRole === 'super_admin';
  const isSuperAdmin       = currentAdminRole === 'super_admin';

  const fetchAll = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    const [profilesRes, ticketsRes, cargoRes, schedulesRes, routesRes, adminUsersRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('passenger_tickets').select('*').order('created_at', { ascending: false }),
      supabase.from('cargo_bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('bus_schedules').select('*').order('departure_time', { ascending: true }),
      supabase.from('routes').select('*').order('origin', { ascending: true }),
      supabase.from('admin_users').select('*').order('created_at', { ascending: false }),
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data);
    if (ticketsRes.data) setTickets(ticketsRes.data);
    if (cargoRes.data) setCargo(cargoRes.data);
    if (schedulesRes.data) setSchedules(schedulesRes.data);
    if (routesRes.data) setRoutesList(routesRes.data);
    if (adminUsersRes.data) setAdminUsers(adminUsersRes.data);

    setLoading(false);
    setRefreshing(false);
  };

  // The database resolves roles through a SECURITY DEFINER RPC. This keeps
  // authorization decisions out of the browser and works with RLS enabled.
  useEffect(() => {
    let active = true;

    async function resolveRole() {
      setAuthorizing(true);
      if (!user) {
        if (active) {
          setCurrentAdminRole(null);
          setAuthorizing(false);
        }
        return;
      }

      const { data, error } = await supabase.rpc('current_admin_role');
      const role = !error && ['agent', 'manager', 'super_admin'].includes(data)
        ? data as AdminRole
        : null;

      if (active) {
        setCurrentAdminRole(role);
        setAuthorizing(false);
      }
    }

    resolveRole();
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (authorizing) return;
    if (!user) { navigate('/login'); return; }
    if (!isAdmin) { navigate('/'); return; }
    fetchAll();
  }, [authorizing, user, isAdmin, navigate]);

  if (authorizing) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white"><Loader2 className="w-7 h-7 animate-spin" /></div>;
  }

  if (!user || !isAdmin || !currentAdminRole) return null;

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

  const handleDeleteCargo = async (cargo: CargoBooking) => {
    if (!window.confirm(`Permanently DELETE cargo booking ${cargo.booking_id}? This cannot be undone.`)) return;
    setDeleteCargoLoading(cargo.id);
    try {
      const { error } = await supabase
        .from('cargo_bookings')
        .delete()
        .eq('id', cargo.id);
      if (error) throw error;
      await fetchAll();
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete cargo: ' + err.message);
    } finally {
      setDeleteCargoLoading(null);
    }
  };

  const handleMarkAsPaid = async (booking: CargoBooking) => {
    if (!window.confirm(`Mark booking ${booking.booking_id} as PAID? This will send a confirmation email to ${booking.customer_email}.`)) return;
    setMarkPaidLoading(booking.id);
    try {
      const { error, count } = await supabase
        .from('cargo_bookings')
        .update({ payment_status: 'paid', status: booking.status === 'pending' ? 'confirmed' : booking.status })
        .eq('id', booking.id)
        .select();
      if (error) throw error;
      if (count === 0) throw new Error('Update blocked — admin RLS policy missing. Run the fix_admin_rls.sql in Supabase SQL Editor.');
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
      const { error, data } = await supabase
        .from('passenger_tickets')
        .update({ payment_status: 'paid', ticket_status: ticket.ticket_status === 'pending' ? 'confirmed' : ticket.ticket_status })
        .eq('id', ticket.id)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Update blocked — admin RLS policy missing. Run fix_admin_rls.sql in Supabase SQL Editor.');
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

  const handleDeleteSchedule = async (schedule: Schedule) => {
    if (!window.confirm(`Permanently DELETE schedule ${schedule.origin} → ${schedule.destination} on ${new Date(schedule.departure_time).toLocaleString()}? This cannot be undone.`)) return;
    setDeleteScheduleLoading(schedule.id);
    try {
      const { error } = await supabase
        .from('bus_schedules')
        .delete()
        .eq('id', schedule.id);
      if (error) throw error;
      await fetchAll();
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete schedule: ' + err.message);
    } finally {
      setDeleteScheduleLoading(null);
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

  const handlePrintManifest = (schedule: Schedule) => {
    const scheduleTickets = tickets.filter(t => t.schedule_id === schedule.id);
    const totalRevenue = scheduleTickets.reduce((sum, t) => sum + (t.total_fcfa || 0), 0);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = `
      <html>
        <head>
          <title>Bus Manifest - ${schedule.origin} to ${schedule.destination}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .header h1 { margin: 0 0 10px 0; font-size: 24px; text-transform: uppercase; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 30px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f8f9fa; font-weight: bold; text-transform: uppercase; font-size: 12px; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .summary { text-align: right; font-size: 18px; font-weight: bold; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AFRIQUE-CON - DRIVER'S MANIFEST</h1>
            <p>Route: ${schedule.origin} to ${schedule.destination}</p>
          </div>
          
          <div class="meta">
            <div>Departure: ${new Date(schedule.departure_time).toLocaleString()}</div>
            <div>Total Passengers: ${scheduleTickets.length}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Seat</th>
                <th>Passenger Name</th>
                <th>Ticket ID</th>
                <th>Type</th>
                <th>Phone/Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${scheduleTickets.length > 0 ? scheduleTickets.map(t => `
                <tr>
                  <td><strong>${t.seat_number || 'N/A'}</strong></td>
                  <td>${t.passenger_name}</td>
                  <td style="font-family: monospace;">${t.ticket_id}</td>
                  <td style="text-transform: capitalize;">${t.ticket_type}</td>
                  <td>N/A</td>
                  <td>${t.payment_status === 'paid' ? 'PAID' : 'PENDING'}</td>
                </tr>
              `).join('') : '<tr><td colspan="6" style="text-align: center;">No passengers booked yet.</td></tr>'}
            </tbody>
          </table>
          
          <div class="summary">
            Total Revenue: ${totalRevenue.toLocaleString()} FCFA
          </div>

          <div style="margin-top: 40px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #0A1628; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Print Manifest</button>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
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

  const allTabs: { id: Tab; label: string; icon: React.ReactNode; count?: number; minRole?: AdminRole }[] = [
    { id: 'overview',   label: t('admin.overview'),              icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'users',      label: t('admin.users'),                 icon: <Users className="w-5 h-5" />,      count: profiles.length },
    { id: 'tickets',    label: t('admin.tickets'),               icon: <Ticket className="w-5 h-5" />,     count: tickets.length },
    { id: 'cargo',      label: t('admin.cargo'),                 icon: <Package className="w-5 h-5" />,    count: cargo.length },
    { id: 'schedules',  label: t('admin.schedules'),             icon: <Bus className="w-5 h-5" />,        count: schedules.length, minRole: 'manager' },
    { id: 'reports',    label: t('admin.reports'),               icon: <BarChart3 className="w-5 h-5" />,                           minRole: 'manager' },
    { id: 'settings',   label: t('admin.settings', 'Settings'), icon: <Settings className="w-5 h-5" />,                            minRole: 'super_admin' },
  ];

  // Filter tabs by role
  const roleRank: Record<AdminRole, number> = { agent: 1, manager: 2, super_admin: 3 };
  const tabs = allTabs.filter(tab => {
    if (!tab.minRole) return true;
    return roleRank[currentAdminRole] >= roleRank[tab.minRole];
  });

  // Settings Handlers
  const handleUpdateRouteRate = async (routeId: string, newRate: string) => {
    try {
      const parsedRate = parseFloat(newRate);
      if (isNaN(parsedRate)) throw new Error('Invalid rate');
      const { error } = await supabase.from('routes').update({ base_rate_fcfa: parsedRate }).eq('id', routeId);
      if (error) throw error;
      alert('Rate updated successfully');
      fetchAll();
    } catch (err: any) {
      alert('Failed to update rate: ' + err.message);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAccount(true);
    try {
      const { error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: newAccountEmail,
          fullName: newAccountName,
          password: newAccountPassword,
          phone: newAccountPhone,
          country: newAccountCountry,
          role: newAccountRole,
        },
      });
      if (error) {
        // Supabase wraps non-2xx Edge Function responses in a FunctionsHttpError.
        // Read the response body so administrators see the actionable server error.
        const response = (error as { context?: Response }).context;
        if (response) {
          const body = await response.clone().json().catch(() => null) as { error?: string } | null;
          if (body?.error) throw new Error(body.error);
        }
        throw error;
      }
      alert('Account created successfully. Give the user their password securely.');
      setNewAccountEmail('');
      setNewAccountName('');
      setNewAccountPassword('');
      setNewAccountPhone('');
      setNewAccountCountry('CM');
      setNewAccountRole('client');
      fetchAll();
    } catch (err: any) {
      alert('Failed to create account: ' + err.message);
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleToggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('admin_users').update({ active: !currentStatus }).eq('id', adminId);
      if (error) throw error;
      fetchAll();
    } catch (err: any) {
      alert('Failed to update admin: ' + err.message);
    }
  };


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
            <span className="text-gray-400 text-xs ml-2">Afriquecon PLC</span>
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
          <span className={`hidden md:inline-flex items-center gap-1.5 border rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[currentAdminRole]}`}>
            {ROLE_LABELS[currentAdminRole]}
          </span>
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
        <aside className="w-72 bg-white border-r border-slate-200 py-6 flex-shrink-0 hidden md:block shadow-2xl z-10">
          <nav className="space-y-2 px-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-[1.02]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-3">
                  {tab.icon}
                  {tab.label}
                </span>
                {tab.count !== undefined && (
                  <span className={`text-sm px-2 py-0.5 rounded-full font-bold ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-200 text-slate-700'}`}>
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
                                {isSuperAdmin && (
                                  <button
                                    onClick={() => handleDeleteCargo(c)}
                                    disabled={deleteCargoLoading === c.id}
                                    className="px-3 py-1 bg-red-800 hover:bg-red-700 text-red-200 rounded text-xs font-semibold transition-colors disabled:opacity-50"
                                  >
                                    {deleteCargoLoading === c.id ? '...' : 'Delete'}
                                  </button>
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
                    {canManageSchedules && (
                      <button
                        onClick={() => setAddingSchedule(true)}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" /> {t('admin.addSchedule')}
                      </button>
                    )}
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
                          <div className="text-right flex flex-col items-end gap-2">
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusBadge(s.status)}`}>
                                {s.status}
                              </span>
                              <div className="text-lg font-bold text-green-400">{(s.base_fare_fcfa || 0).toLocaleString()} FCFA</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handlePrintManifest(s)}
                                className="px-3 py-1 bg-blue-800 hover:bg-blue-700 text-blue-200 rounded text-xs font-semibold transition-colors"
                              >
                                Print Manifest
                              </button>
                              {s.status !== 'cancelled' && canManageSchedules && (
                                <button
                                  onClick={() => handleCancelSchedule(s)}
                                  disabled={cancelScheduleLoading === s.id}
                                  className="px-3 py-1 bg-amber-800 hover:bg-amber-700 text-amber-200 rounded text-xs font-semibold transition-colors disabled:opacity-50"
                                >
                                  {cancelScheduleLoading === s.id ? '...' : t('admin.cancelSchedule')}
                                </button>
                              )}
                              {isSuperAdmin && (
                                <button
                                  onClick={() => handleDeleteSchedule(s)}
                                  disabled={deleteScheduleLoading === s.id}
                                  className="px-3 py-1 bg-red-800 hover:bg-red-700 text-red-200 rounded text-xs font-semibold transition-colors disabled:opacity-50"
                                >
                                  {deleteScheduleLoading === s.id ? '...' : 'Delete'}
                                </button>
                              )}
                            </div>
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
                            <div className="bg-red-500 h-2 rounded-full" style={{ width: `${totalRevenue === 0 ? 0 : (ticketRevenue / totalRevenue) * 100}%` }}></div>
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

              {/* ── SETTINGS ── */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">{t('admin.settings', 'Settings')}</h2>
                    {!isSuperAdmin && (
                      <span className="flex items-center gap-2 text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-4 py-2 text-sm">
                        <Shield className="w-4 h-4" />
                        Only Super Admins can modify settings
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Route Pricing — Super Admin only */}
                    {isSuperAdmin && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-amber-400" />
                        {t('admin.pricingManagement', 'Route Pricing Management')}
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-300">
                          <thead className="text-xs uppercase bg-gray-800 text-gray-400">
                            <tr>
                              <th className="px-4 py-3">Route</th>
                              <th className="px-4 py-3">{t('admin.baseRate', 'Base Rate (FCFA)')}</th>
                              <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800">
                            {routesList.map(route => (
                              <tr key={route.id} className="hover:bg-gray-800/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-white">{route.origin} → {route.destination}</td>
                                <td className="px-4 py-3">
                                  <input 
                                    type="number" 
                                    defaultValue={route.base_rate_fcfa}
                                    onBlur={(e) => {
                                      if (e.target.value !== route.base_rate_fcfa.toString()) {
                                        handleUpdateRouteRate(route.id, e.target.value);
                                      }
                                    }}
                                    className="w-24 bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 focus:ring-1 focus:ring-amber-500"
                                  />
                                </td>
                                <td className="px-4 py-3 text-right text-xs text-gray-500">
                                  Auto-saves on blur
                                </td>
                              </tr>
                            ))}
                            {routesList.length === 0 && (
                              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No routes found</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    )} {/* end isSuperAdmin: route pricing */}

                    {/* Staff Account Management — Super Admin only */}
                    {isSuperAdmin && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-teal-400" />
                        User Account Management
                      </h3>

                      {/* Add Admin Form */}
                      <p className="text-sm text-gray-400 mb-4">Create client or staff accounts. Accounts are confirmed immediately, so give each password to its user securely.</p>
                      <form onSubmit={handleCreateAccount} className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input 
                          type="email" required placeholder="Email"
                          value={newAccountEmail} onChange={e => setNewAccountEmail(e.target.value)}
                          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                        />
                        <input 
                          type="text" required placeholder="Full Name"
                          value={newAccountName} onChange={e => setNewAccountName(e.target.value)}
                          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                        />
                        <div className="relative">
                          <input
                            type={showNewAccountPassword ? 'text' : 'password'} required minLength={8} placeholder="Temporary password (8+ characters)"
                            value={newAccountPassword} onChange={e => setNewAccountPassword(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pr-10 text-sm text-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewAccountPassword(!showNewAccountPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            aria-label={showNewAccountPassword ? 'Hide password' : 'Show password'}
                          >
                            {showNewAccountPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <input
                          type="tel" placeholder="Phone (optional)"
                          value={newAccountPhone} onChange={e => setNewAccountPhone(e.target.value)}
                          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                        />
                        <select
                          value={newAccountRole} onChange={e => setNewAccountRole(e.target.value as AccountRole)}
                          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                        >
                          <option value="client">Client</option>
                          <option value="agent">Agent</option>
                          <option value="manager">Manager</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                        <select
                          value={newAccountCountry} onChange={e => setNewAccountCountry(e.target.value as 'CM' | 'NG')}
                          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                        >
                          <option value="CM">Cameroon</option>
                          <option value="NG">Nigeria</option>
                        </select>
                        <button type="submit" disabled={creatingAccount} className="bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 md:col-span-2">
                          {creatingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          Create account
                        </button>
                      </form>


                      {/* Admins Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-300">
                          <thead className="text-xs uppercase bg-gray-800 text-gray-400">
                            <tr>
                              <th className="px-4 py-3">Admin</th>
                              <th className="px-4 py-3">Role</th>
                              <th className="px-4 py-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800">
                            {adminUsers.map(admin => (
                              <tr key={admin.id} className="hover:bg-gray-800/50 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="font-medium text-white">{admin.full_name}</div>
                                  <div className="text-xs text-gray-500">{admin.email}</div>
                                </td>
                                <td className="px-4 py-3 capitalize">{admin.role}</td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => handleToggleAdminStatus(admin.id, admin.active)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                      admin.active 
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' 
                                        : 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                                    }`}
                                  >
                                    {admin.active ? t('admin.deactivate', 'Deactivate') : t('admin.activate', 'Activate')}
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {adminUsers.length === 0 && (
                              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No admins found</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    )} {/* end isSuperAdmin: staff management */}
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

              {/* Negotiated Price — shown for large shipments; Manager+ only */}
              {updatingCargo && (updatingCargo.weight_kg >= 100 || !updatingCargo.total_fcfa) && canNegotiatePrice && (
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
