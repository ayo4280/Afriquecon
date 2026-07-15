import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { TripSchedule } from '../../services/passengerService';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

export default function SeatSelection() {
  const location = useLocation();
  const navigate = useNavigate();

  const trip = location.state?.trip as TripSchedule;
  const passengers = location.state?.passengers as number || 1;
  const adults = location.state?.adults as number || 1;
  const children = location.state?.children as number || 0;

  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [occupiedSeats, setOccupiedSeats] = useState<number[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(true);

  useEffect(() => {
    if (!trip) { navigate('/'); return; }
    const fetchOccupiedSeats = async () => {
      setLoadingSeats(true);
      const { data, error } = await supabase
        .from('passenger_tickets')
        .select('seat_number')
        .eq('schedule_id', trip.scheduleId)
        .or(`payment_status.eq.paid,reservation_expires_at.gt.${new Date().toISOString()}`);
      if (!error && data) {
        setOccupiedSeats(data.map(t => parseInt(t.seat_number, 10)).filter(n => !isNaN(n)));
      }
      setLoadingSeats(false);
    };
    fetchOccupiedSeats();
  }, [trip, navigate]);

  if (!trip) return null;

  const handleSeatClick = (seatNumber: number) => {
    if (occupiedSeats.includes(seatNumber)) return;
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatNumber));
    } else {
      if (selectedSeats.length < passengers) {
        setSelectedSeats([...selectedSeats, seatNumber].sort((a, b) => a - b));
      } else {
        setSelectedSeats([...selectedSeats.slice(0, passengers - 1), seatNumber].sort((a, b) => a - b));
      }
    }
  };

  const renderSeatRow = (rowNumber: number) => {
    const seatOffset = (rowNumber - 1) * 4;
    const seats = [seatOffset + 1, seatOffset + 2, null, seatOffset + 3, seatOffset + 4];
    return (
      <div key={rowNumber} className="flex justify-center gap-2 mb-3 items-center">
        <div className="w-6 text-center text-slate-400 font-bold text-xs">{rowNumber}</div>
        {seats.map((seatNumber, idx) => {
          if (seatNumber === null) return <div key={`aisle-${idx}`} className="w-8" />;
          const isOccupied = occupiedSeats.includes(seatNumber);
          const isSelected = selectedSeats.includes(seatNumber);
          return (
            <button
              key={seatNumber}
              disabled={isOccupied}
              onClick={() => handleSeatClick(seatNumber)}
              title={isOccupied ? 'Occupied' : `Seat ${seatNumber}`}
              className={`w-10 h-10 rounded-t-xl rounded-b-md flex items-center justify-center font-bold text-xs transition-all duration-200 border-2 relative ${
                isOccupied
                  ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                  : isSelected
                  ? 'bg-amber-400 border-amber-500 text-[#0A1628] shadow-lg shadow-amber-400/40 scale-110'
                  : 'bg-teal-50 border-teal-300 text-teal-700 hover:bg-teal-100 hover:scale-105 cursor-pointer'
              }`}
            >
              {isSelected && <CheckCircle className="w-3 h-3 absolute -top-1 -right-1 text-[#0A1628] bg-amber-300 rounded-full" />}
              {seatNumber}
            </button>
          );
        })}
      </div>
    );
  };

  const remaining = passengers - selectedSeats.length;
  const total = (adults * trip.baseFareFCFA) + (children * trip.baseFareFCFA * 0.7);

  return (
    <div className="bg-[#F4F6FA] min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-[#0A1628] font-semibold mb-6 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Results
        </button>

        {/* Trip header */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 animate-fade-up">
          <div>
            <h1 className="text-xl font-display font-bold text-slate-900">{trip.origin} → {trip.destination}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{new Date(trip.departureTime).toLocaleString()} · Bus: {trip.busNumber}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-xl text-sm font-bold ${remaining === 0 ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              {remaining === 0 ? `✓ All ${passengers} seat${passengers > 1 ? 's' : ''} selected!` : `Select ${remaining} more seat${remaining !== 1 ? 's' : ''}`}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Seat map */}
          <div className="md:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-8 animate-fade-up">
            {/* Legend */}
            <div className="flex justify-center gap-6 mb-8 bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-teal-50 border-2 border-teal-300 rounded-lg" />
                <span className="text-xs font-semibold text-slate-600">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-slate-200 border-2 border-slate-300 rounded-lg" />
                <span className="text-xs font-semibold text-slate-600">Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-amber-400 border-2 border-amber-500 rounded-lg" />
                <span className="text-xs font-semibold text-slate-600">Selected</span>
              </div>
            </div>

            {loadingSeats ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-6 max-w-sm mx-auto border-2 border-slate-200 relative">
                {/* Bus windshield */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 w-24 h-8 bg-slate-200 rounded-t-full border-2 border-slate-300" />
                <div className="flex justify-center mb-5 mt-2">
                  <div className="bg-[#0A1628] text-white text-xs font-bold py-1.5 px-5 rounded-full tracking-widest">DRIVER</div>
                </div>
                {Array.from({ length: 12 }).map((_, i) => renderSeatRow(i + 1))}
                <div className="flex justify-center mt-5">
                  <div className="bg-slate-400 text-white text-xs font-bold py-1.5 px-5 rounded-full tracking-widest">BACK</div>
                </div>
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <div>
            <div className="bg-[#0A1628] text-white p-7 rounded-3xl shadow-xl sticky top-24 animate-fade-up">
              <h3 className="text-xl font-display font-bold mb-5 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-amber-400" />
                Your Selection
              </h3>

              {selectedSeats.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-white/8 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">💺</span>
                  </div>
                  <p className="text-slate-400 text-sm">Select {passengers} seat{passengers > 1 ? 's' : ''} from the map to continue</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-2">
                    {selectedSeats.map(seat => (
                      <span key={seat} className="w-10 h-10 bg-amber-400 text-[#0A1628] font-extrabold rounded-xl flex items-center justify-center text-sm shadow-lg shadow-amber-400/30">
                        {seat}
                      </span>
                    ))}
                  </div>

                  <div className="border-t border-white/10 pt-5 space-y-2.5 text-sm text-slate-300">
                    <div className="flex justify-between">
                      <span>Adults</span>
                      <span>{adults} × {trip.baseFareFCFA.toLocaleString()} FCFA</span>
                    </div>
                    {children > 0 && (
                      <div className="flex justify-between">
                        <span>Children (2-5)</span>
                        <span>{children} × {(trip.baseFareFCFA * 0.7).toLocaleString()} FCFA</span>
                      </div>
                    )}
                    <div className="border-t border-white/10 pt-2 mt-2 flex justify-between font-bold text-xl text-white">
                      <span>Subtotal</span>
                      <span>{total.toLocaleString()} FCFA</span>
                    </div>
                    <div className="text-right text-xs text-slate-500">≈ ₦{(total * 2.5).toLocaleString()}</div>
                  </div>

                  <button
                    disabled={selectedSeats.length !== passengers}
                    onClick={() => navigate('/passenger/booking', { state: { trip, passengers, adults, children, selectedSeats } })}
                    className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-[#0A1628] py-3.5 rounded-xl font-extrabold transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 group"
                  >
                    {selectedSeats.length === passengers
                       ? <><CheckCircle className="w-5 h-5" /> Proceed to Checkout</>
                       : `Select ${passengers - selectedSeats.length} more seat${passengers - selectedSeats.length !== 1 ? 's' : ''}`
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
