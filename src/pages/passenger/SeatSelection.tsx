import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { TripSchedule } from '../../services/passengerService';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function SeatSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const trip = location.state?.trip as TripSchedule;
  const passengers = location.state?.passengers as number || 1;

  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [occupiedSeats, setOccupiedSeats] = useState<number[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(true);

  useEffect(() => {
    if (!trip) {
      navigate('/');
      return;
    }
    
    const fetchOccupiedSeats = async () => {
      setLoadingSeats(true);
      const { data, error } = await supabase
        .from('passenger_tickets')
        .select('seat_number')
        .eq('schedule_id', trip.scheduleId);

      if (error) {
        console.error('Error fetching occupied seats:', error);
      } else if (data) {
        const occupied = data.map(t => parseInt(t.seat_number, 10)).filter(n => !isNaN(n));
        setOccupiedSeats(occupied);
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
        setSelectedSeats([...selectedSeats, seatNumber].sort((a,b) => a-b));
      } else {
        // If they click another seat but already have max, replace the last one
        setSelectedSeats([...selectedSeats.slice(0, passengers - 1), seatNumber].sort((a,b) => a-b));
      }
    }
  };

  const renderSeatRow = (rowNumber: number) => {
    const seatOffset = (rowNumber - 1) * 4;
    const seats = [
      seatOffset + 1,
      seatOffset + 2,
      null, // aisle
      seatOffset + 3,
      seatOffset + 4
    ];

    return (
      <div key={rowNumber} className="flex justify-center gap-2 md:gap-4 mb-4">
        <div className="w-8 text-center text-gray-400 font-bold self-center text-sm">{rowNumber}</div>
        {seats.map((seatNumber, idx) => {
          if (seatNumber === null) return <div key={`aisle-${idx}`} className="w-8 md:w-12"></div>;
          
          const isOccupied = occupiedSeats.includes(seatNumber);
          const isSelected = selectedSeats.includes(seatNumber);
          
          let seatClass = "w-10 h-10 md:w-12 md:h-12 rounded-t-lg rounded-b flex items-center justify-center font-bold text-sm transition-colors cursor-pointer border-2 ";
          
          if (isOccupied) {
            seatClass += "bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed";
          } else if (isSelected) {
            seatClass += "bg-primary border-primary text-white shadow-md scale-105 transform";
          } else {
            seatClass += "bg-green-50 border-green-400 text-green-700 hover:bg-green-100";
          }

          return (
            <button 
              key={seatNumber}
              disabled={isOccupied}
              onClick={() => handleSeatClick(seatNumber)}
              className={seatClass}
            >
              {seatNumber}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-neutral min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary font-semibold mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Results
        </button>

        <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{trip.origin} to {trip.destination}</h2>
            <p className="text-gray-500">{new Date(trip.departureTime).toLocaleString()} &bull; Bus: {trip.busNumber}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-primary">{passengers} Passenger{passengers > 1 ? 's' : ''}</div>
            <p className="text-gray-500">Select your seats</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Seat Map */}
          <div className="md:col-span-2 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-8 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-50 border-2 border-green-400 rounded"></div>
                <span className="text-sm font-medium">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-300 border-2 border-gray-400 rounded"></div>
                <span className="text-sm font-medium">Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary border-2 border-primary rounded"></div>
                <span className="text-sm font-medium">Selected</span>
              </div>
            </div>

            {loadingSeats ? (
              <div className="flex justify-center items-center h-64 text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin" />
              </div>
            ) : (
              <div className="bg-gray-100 p-6 rounded-2xl max-w-sm mx-auto border-4 border-gray-300">
                <div className="w-full flex justify-center mb-6">
                  <div className="bg-gray-400 text-white text-xs font-bold py-1 px-4 rounded-full">FRONT (DRIVER)</div>
                </div>
                
                {Array.from({length: 12}).map((_, i) => renderSeatRow(i + 1))}
                
                <div className="w-full flex justify-center mt-6">
                  <div className="bg-gray-400 text-white text-xs font-bold py-1 px-4 rounded-full">BACK</div>
                </div>
              </div>
            )}
          </div>

          {/* Summary Sidebar */}
          <div>
            <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg sticky top-24">
              <h3 className="text-xl font-display font-bold mb-4">Selected Seats</h3>
              
              {selectedSeats.length === 0 ? (
                <p className="text-gray-400 text-sm">Please select {passengers} seat(s) on the map to continue.</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {selectedSeats.map(seat => (
                      <span key={seat} className="bg-primary text-white font-bold w-10 h-10 rounded-lg flex items-center justify-center">
                        {seat}
                      </span>
                    ))}
                  </div>
                  
                  <div className="border-t border-gray-700 pt-4 mt-4 text-sm text-gray-300 space-y-2">
                    <div className="flex justify-between">
                      <span>Base Fare</span>
                      <span>{trip.baseFareFCFA.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Passengers</span>
                      <span>x {selectedSeats.length}</span>
                    </div>
                    <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between font-bold text-lg text-white">
                      <span>Subtotal</span>
                      <span>{(trip.baseFareFCFA * selectedSeats.length).toLocaleString()} FCFA</span>
                    </div>
                  </div>
                  
                  <button 
                    disabled={selectedSeats.length !== passengers}
                    onClick={() => navigate('/passenger/booking', { state: { trip, passengers, selectedSeats } })}
                    className="w-full bg-success text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedSeats.length === passengers ? 'Continue to Checkout' : `Select ${passengers - selectedSeats.length} more`}
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
