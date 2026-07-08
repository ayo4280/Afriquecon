import { supabase } from '../lib/supabase';

export interface TripSchedule {
  scheduleId: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  durationHours: number;
  baseFareFCFA: number;
  baseFareFCFANonNigerian: number;
  availableSeats: number;
  busNumber: string;
}

export type TicketType = 'adult' | 'student' | 'senior' | 'child_under_5' | 'child_under_2';

export interface PassengerPricingRequest {
  baseFareFCFA: number;
  baseFareFCFANonNigerian?: number;
  ticketType: TicketType;
  isNigerian?: boolean;
  extraLuggageKg?: number;
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
          base_fare_fcfa_non_nigerian,
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
          baseFareFCFANonNigerian: schedule.base_fare_fcfa_non_nigerian || schedule.base_fare_fcfa,
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
    // Default to Nigerian price if isNigerian is undefined or true, else use Non-Nigerian price if provided
    let applicableBaseFare = request.baseFareFCFA;
    if (request.isNigerian === false && request.baseFareFCFANonNigerian) {
      applicableBaseFare = request.baseFareFCFANonNigerian;
    }

    let discountPercent = 0;
    
    switch (request.ticketType) {
      case 'child_under_5': discountPercent = 30; break;
      case 'child_under_2': discountPercent = 100; break;
      case 'adult': 
      case 'student': 
      case 'senior': 
      default: discountPercent = 0; break;
    }

    // Extra Luggage: >20kg = +1000 FCFA per kg
    let extraLuggageFeeFCFA = 0;
    if (request.extraLuggageKg && request.extraLuggageKg > 20) {
      const extraKg = request.extraLuggageKg - 20;
      extraLuggageFeeFCFA = extraKg * 1000; 
    }

    const discountAmountFCFA = (applicableBaseFare * discountPercent) / 100;
    let finalPriceFCFA = applicableBaseFare - discountAmountFCFA + extraLuggageFeeFCFA;

    // Free ticket logic for children under 2
    if (request.ticketType === 'child_under_2') {
      finalPriceFCFA = extraLuggageFeeFCFA; // Only charge for extra luggage
    }

    const finalPriceNGN = finalPriceFCFA * 2.5;

    return {
      baseFareFCFA: applicableBaseFare,
      discountPercent,
      discountAmountFCFA,
      extraLuggageFeeFCFA,
      finalPriceFCFA,
      finalPriceNGN
    };
  }
};
