import { supabase } from '../lib/supabase';

export interface TripSchedule {
  scheduleId: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  durationHours: number;
  baseFareFCFA: number;
  availableSeats: number;
  busNumber: string;
}

export type TicketType = 'adult' | 'student' | 'senior' | 'child';

export interface PassengerPricingRequest {
  baseFareFCFA: number;
  ticketType: TicketType;
  extraLuggageCount?: number;
}

export interface PassengerPricingResponse {
  baseFareFCFA: number;
  discountPercent: number;
  discountAmountFCFA: number;
  extraLuggageFeeFCFA: number;
  finalPriceFCFA: number;
  finalPriceNGN: number;
}

export const passengerService = {
  // Query real database for trips
  searchTrips: async (origin: string, destination: string, date: string): Promise<TripSchedule[]> => {
    try {
      const startOfDay = new Date(`${date}T00:00:00Z`).toISOString();
      const endOfDay = new Date(`${date}T23:59:59Z`).toISOString();

      const { data, error } = await supabase
        .from('bus_schedules')
        .select(`
          id,
          origin,
          destination,
          departure_time,
          arrival_time,
          base_fare_fcfa,
          available_seats,
          buses (
            bus_number
          )
        `)
        .eq('origin', origin)
        .eq('destination', destination)
        .gte('departure_time', startOfDay)
        .lte('departure_time', endOfDay)
        .eq('status', 'scheduled')
        .order('departure_time', { ascending: true });

      if (error) {
        console.error('Error fetching trips:', error);
        return [];
      }

      return (data || []).map(schedule => {
        const departure = new Date(schedule.departure_time);
        const arrival = new Date(schedule.arrival_time);
        const durationHours = Math.round((arrival.getTime() - departure.getTime()) / (1000 * 60 * 60) * 10) / 10;
        
        // Handle Supabase joining returning single object or array
        const busData: any = schedule.buses;
        const busNumber = Array.isArray(busData) ? busData[0]?.bus_number : busData?.bus_number;

        return {
          scheduleId: schedule.id,
          origin: schedule.origin,
          destination: schedule.destination,
          departureTime: schedule.departure_time,
          arrivalTime: schedule.arrival_time,
          durationHours: durationHours,
          baseFareFCFA: schedule.base_fare_fcfa,
          availableSeats: schedule.available_seats,
          busNumber: busNumber || 'Standard Bus'
        };
      });
    } catch (err) {
      console.error('Unexpected error searching trips:', err);
      return [];
    }
  },

  calculatePricing: (request: PassengerPricingRequest): PassengerPricingResponse => {
    let discountPercent = 0;
    
    switch (request.ticketType) {
      case 'student': discountPercent = 10; break;
      case 'senior': discountPercent = 15; break;
      case 'child': discountPercent = 20; break;
      case 'adult': default: discountPercent = 0; break;
    }

    const discountAmountFCFA = (request.baseFareFCFA * discountPercent) / 100;
    const subtotalFCFA = request.baseFareFCFA - discountAmountFCFA;

    // Extra Luggage: >2 items = +2000 NGN per item (which is 800 FCFA since NGN = FCFA * 2.5)
    let extraLuggageFeeFCFA = 0;
    if (request.extraLuggageCount && request.extraLuggageCount > 2) {
      const extraItems = request.extraLuggageCount - 2;
      extraLuggageFeeFCFA = extraItems * 800; 
    }

    const finalPriceFCFA = subtotalFCFA + extraLuggageFeeFCFA;
    const finalPriceNGN = finalPriceFCFA * 2.5;

    return {
      baseFareFCFA: request.baseFareFCFA,
      discountPercent,
      discountAmountFCFA,
      extraLuggageFeeFCFA,
      finalPriceFCFA,
      finalPriceNGN
    };
  }
};
