import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Shield, Printer, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

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
        setError(err.message || 'Ticket not found');
      } finally {
        setLoading(false);
      }
    }
    fetchTicket();
  }, [ticket_id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Ticket Not Found</h2>
          <p className="text-gray-400 mb-6">We couldn't find a ticket with that ID.</p>
          <Link to="/profile" className="text-primary hover:underline">Return to Profile</Link>
        </div>
      </div>
    );
  }

  const qrData = JSON.stringify({
    id: ticket.ticket_id,
    name: ticket.passenger_name,
    seat: ticket.seat_number,
    status: ticket.payment_status
  });

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&color=0ea5e9&bgcolor=030712`;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-primary/30 py-8 px-4 sm:px-6 print:bg-white print:text-black print:p-0">
      
      {/* Hide on print */}
      <div className="max-w-2xl mx-auto mb-8 flex justify-between items-center print:hidden">
        <Link to="/profile" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Profile
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20"
        >
          <Printer className="w-5 h-5" />
          Print / Download PDF
        </button>
      </div>

      {/* Ticket Container */}
      <div className="max-w-2xl mx-auto bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl print:bg-white print:border-gray-300 print:shadow-none print:rounded-none">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-8 border-b border-gray-800 flex justify-between items-center print:bg-white print:border-b-2 print:border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center print:bg-black">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight print:text-black">Afrique-con</h1>
              <p className="text-primary font-medium print:text-gray-600">Boarding Pass</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400 uppercase tracking-widest font-semibold print:text-gray-500">Ticket No.</p>
            <p className="text-xl font-mono font-bold text-white print:text-black">{ticket.ticket_id}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 flex flex-col md:flex-row gap-8 items-center justify-between">
          
          {/* Details */}
          <div className="flex-1 space-y-6 w-full">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1 print:text-gray-600">Passenger Name</p>
                <p className="text-lg font-bold print:text-black">{ticket.passenger_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1 print:text-gray-600">Seat Number</p>
                <p className="text-2xl font-black text-primary print:text-black">{ticket.seat_number}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-800 print:border-gray-200">
              <div>
                <p className="text-sm text-gray-500 mb-1 print:text-gray-600">Trip Schedule</p>
                <p className="text-md font-bold print:text-black">{ticket.schedule_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1 print:text-gray-600">Ticket Type</p>
                <p className="text-md font-semibold capitalize print:text-black">{ticket.ticket_type}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-800 print:border-gray-200">
              <div>
                <p className="text-sm text-gray-500 mb-1 print:text-gray-600">Booking Date</p>
                <p className="text-md font-medium print:text-black">{new Date(ticket.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1 print:text-gray-600">Payment Status</p>
                <div className="flex items-center gap-1">
                  {ticket.payment_status === 'paid' ? (
                    <span className="flex items-center gap-1 text-green-500 font-bold print:text-green-700">
                      <CheckCircle2 className="w-5 h-5" /> Paid
                    </span>
                  ) : (
                    <span className="text-yellow-500 font-bold capitalize print:text-gray-800">{ticket.payment_status}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 flex flex-col items-center justify-center shrink-0 print:border-none print:p-0">
            <img 
              src={qrUrl} 
              alt="Ticket QR Code" 
              className="w-40 h-40 rounded-lg mb-3 print:w-48 print:h-48"
              crossOrigin="anonymous" 
            />
            <p className="text-xs text-gray-500 font-mono text-center print:text-black">Scan to verify</p>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-950 px-8 py-6 text-center border-t border-gray-800 print:bg-white print:border-t-2 print:border-gray-200">
          <p className="text-sm text-gray-500 print:text-gray-600">Please arrive 30 minutes before departure time. This ticket is non-transferable.</p>
        </div>
      </div>
    </div>
  );
}
