import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { passengerService } from '../../services/passengerService';
import type { TripSchedule } from '../../services/passengerService';
import { ArrowRight, Clock, Users, ArrowLeft, Loader2, MapPin } from 'lucide-react';

export default function TripResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const origin      = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const date        = searchParams.get('date') || '';
  const passengers  = parseInt(searchParams.get('passengers') || '1', 10);
  const adults      = parseInt(searchParams.get('adults') || '1', 10);
  const children    = parseInt(searchParams.get('children') || '0', 10);

  const [trips, setTrips] = useState<TripSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!origin || !destination || !date) { navigate('/'); return; }
    setLoading(true);
    passengerService.searchTrips(origin, destination, date)
      .then(results => { setTrips(results); setLoading(false); });
  }, [origin, destination, date, navigate]);

  return (
    <div className="bg-[#F4F6FA] min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-[#0A1628] font-semibold mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Search
        </button>

        {/* Route header */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-5 animate-fade-up">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
                <MapPin className="w-3 h-3" /> From
              </div>
              <div className="text-2xl font-display font-extrabold text-slate-900">{origin}</div>
            </div>
            <div className="flex flex-col items-center gap-1 px-4">
              <div className="flex items-center gap-1">
                <div className="w-12 h-px bg-gradient-to-r from-amber-400 to-teal-400" />
                <ArrowRight className="w-5 h-5 text-amber-500" />
                <div className="w-12 h-px bg-gradient-to-r from-teal-400 to-amber-400" />
              </div>
              <span className="text-xs text-slate-400 font-medium">Direct</span>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
                <MapPin className="w-3 h-3" /> To
              </div>
              <div className="text-2xl font-display font-extrabold text-slate-900">{destination}</div>
            </div>
          </div>
          <div className="flex gap-5 text-slate-500 font-medium text-sm">
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <Clock className="w-4 h-4 text-amber-500" />
              {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <Users className="w-4 h-4 text-teal-500" />
              {passengers} Passenger{passengers > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 text-amber-400 animate-spin" />
            <p className="text-slate-500 font-medium">Searching for available trips...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-14 text-center animate-fade-up">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ArrowRight className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-2xl font-display font-bold text-slate-800 mb-2">No trips found</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              We couldn't find any routes from <strong>{origin}</strong> to <strong>{destination}</strong> on that date. Try another date or route.
            </p>
            <button onClick={() => navigate('/')} className="bg-[#0A1628] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1a2d4e] transition-colors">
              Modify Search
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-up">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-display font-bold text-slate-800">
                {trips.length} Available Trip{trips.length !== 1 ? 's' : ''}
              </h2>
              <span className="text-xs text-slate-400 font-medium">{passengers} passenger{passengers > 1 ? 's' : ''}</span>
            </div>

            {trips.map((trip, idx) => {
              const dep = new Date(trip.departureTime);
              const arr = new Date(trip.arrivalTime);
              const seatsLeft = trip.availableSeats;
              const isLow = seatsLeft <= 5;
              
              const totalFCFA = (trip.baseFareFCFA * adults) + (trip.baseFareFCFA * 0.7 * children);
              const totalNGN = totalFCFA * 2.5;

              return (
                <div
                  key={trip.scheduleId}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm card-hover overflow-hidden"
                  style={{ animationDelay: `${idx * 0.08}s` }}
                >
                  <div className="p-6 flex flex-col md:flex-row items-center gap-6">
                    {/* Timeline strip */}
                    <div className="flex-1 grid grid-cols-3 gap-4 items-center w-full">
                      <div className="text-center">
                        <div className="text-3xl font-display font-extrabold text-slate-900">
                          {dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-sm font-semibold text-slate-500 mt-0.5">{trip.origin}</div>
                        <div className="text-xs text-slate-400">{dep.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                      </div>

                      <div className="flex flex-col items-center justify-center">
                        <div className="relative w-full flex items-center">
                          <div className="w-3 h-3 rounded-full bg-teal-400 border-2 border-white shadow-sm flex-shrink-0" />
                          <div className="flex-1 h-0.5 bg-gradient-to-r from-teal-400 via-amber-400 to-amber-500 mx-1" />
                          <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow-sm flex-shrink-0" />
                        </div>
                        <div className="text-xs text-slate-400 mt-2">Direct</div>
                      </div>

                      <div className="text-center">
                        <div className="text-3xl font-display font-extrabold text-slate-900">
                          {arr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-sm font-semibold text-slate-500 mt-0.5">{trip.destination}</div>
                        <div className="text-xs text-slate-400">{arr.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-20 bg-slate-100" />

                    {/* Price + CTA */}
                    <div className="flex flex-col items-center md:items-end gap-3 min-w-[180px] w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                      <div className="text-right">
                        <div className="text-3xl font-display font-extrabold text-[#0A1628]">
                          {totalFCFA.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-400 font-medium">FCFA · ₦{totalNGN.toLocaleString()}</div>
                      </div>
                      <div className={`text-xs font-bold px-3 py-1 rounded-full ${isLow ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-teal-50 text-teal-700 border border-teal-100'}`}>
                        {isLow ? `🔥 Only ${seatsLeft} seats!` : `${seatsLeft} seats available`}
                      </div>
                      <button
                        onClick={() => navigate('/passenger/seats', { state: { trip, passengers, adults, children } })}
                        className="w-full bg-[#0A1628] hover:bg-[#1a2d4e] text-white py-2.5 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 group shadow-lg shadow-slate-900/10"
                      >
                        Select Seats
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
