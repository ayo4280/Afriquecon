import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { passengerService } from '../../services/passengerService';
import type { TripSchedule } from '../../services/passengerService';
import { ArrowRight, Clock, Users, ArrowLeft } from 'lucide-react';

export default function TripResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const date = searchParams.get('date') || '';
  const passengers = parseInt(searchParams.get('passengers') || '1', 10);

  const [trips, setTrips] = useState<TripSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!origin || !destination || !date) {
      navigate('/');
      return;
    }

    setLoading(true);
    passengerService.searchTrips(origin, destination, date)
      .then(results => {
        setTrips(results);
        setLoading(false);
      });
  }, [origin, destination, date, navigate]);

  return (
    <div className="bg-neutral min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-primary font-semibold mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Search
        </button>

        <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-xl font-bold text-gray-800">
            <span>{origin}</span>
            <ArrowRight className="w-6 h-6 text-gray-400" />
            <span>{destination}</span>
          </div>
          <div className="flex gap-6 text-gray-600 font-medium">
            <div className="flex items-center gap-2"><Clock className="w-5 h-5" /> {new Date(date).toLocaleDateString()}</div>
            <div className="flex items-center gap-2"><Users className="w-5 h-5" /> {passengers} Passenger{passengers > 1 ? 's' : ''}</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500 font-medium">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            Searching for available trips...
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm text-center border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No trips found</h3>
            <p className="text-gray-600">We couldn't find any direct routes from {origin} to {destination} on {date}. Please try another date or route.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold text-gray-800 mb-4">{trips.length} Available Trips</h2>
            {trips.map(trip => (
              <div key={trip.scheduleId} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-md transition-shadow">
                <div className="flex-1 w-full grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{new Date(trip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="text-sm text-gray-500">{trip.origin}</div>
                  </div>
                  <div className="text-center flex flex-col items-center">
                    <div className="text-xs font-semibold text-gray-400 mb-1">{trip.durationHours} hrs</div>
                    <div className="w-full h-px bg-gray-300 relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary"></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{new Date(trip.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="text-sm text-gray-500">{trip.destination}</div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3 min-w-[200px] border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{trip.baseFareFCFA.toLocaleString()} FCFA</div>
                    <div className="text-sm text-gray-500">₦ {(trip.baseFareFCFA * 2.5).toLocaleString()}</div>
                  </div>
                  <div className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">{trip.availableSeats} seats left</div>
                  <button 
                    onClick={() => navigate('/passenger/seats', { state: { trip, passengers } })}
                    className="w-full bg-primary text-white py-2 px-6 rounded font-bold hover:bg-blue-600 transition-colors"
                  >
                    Select Seats
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
