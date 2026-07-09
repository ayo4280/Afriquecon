export interface CargoQuoteRequest {
  origin: string;
  destination: string;
  weightKg: number;
  cargoType: 'general' | 'heavy_equipment';
  isExpress?: boolean;
}

export interface CargoQuoteResponse {
  quoteId: string;
  baseFCFA: number;
  totalFCFA: number;
  totalNGN: number;
  isExpress: boolean;
  reservationRequired: string;
  expiresAt: string;
  status: 'INSTANT_QUOTE' | 'PENDING_REVIEW';
  message?: string;
}

const cameroonCities = ['Yaoundé', 'Douala', 'Buea', 'Kumba', 'Mamfe'];
const nigeriaCities = ['Lagos', 'Abuja', 'Enugu', 'Onitsha', 'Abakaliki', 'Ikom'];

function isValidRoute(origin: string, destination: string) {
  return (cameroonCities.includes(origin) && nigeriaCities.includes(destination)) ||
         (nigeriaCities.includes(origin) && cameroonCities.includes(destination));
}

export const cargoService = {
  calculateQuote: (request: CargoQuoteRequest): CargoQuoteResponse => {
    const routeKey = `${request.origin}-${request.destination}`;
    
    if (!isValidRoute(request.origin, request.destination)) {
      throw new Error(`Route not supported: ${routeKey}`);
    }

    let status: 'INSTANT_QUOTE' | 'PENDING_REVIEW' = 'INSTANT_QUOTE';
    let message = '';
    let baseFCFA = 0;

    if (request.weightKg >= 100) {
      status = 'PENDING_REVIEW';
      message = 'Your quote >=100kg requires management approval. Expect response within 24hrs.';
      baseFCFA = 0; // Management will determine
    } else {
      // Below 100kg: 1,000 FCFA per kg
      baseFCFA = request.weightKg * 1000;
    }

    if (request.isExpress) {
      status = 'PENDING_REVIEW';
      message = message
        ? message + ' Also, express booking requires management approval.'
        : 'Your express booking requires management approval. Express surcharge will be determined based on urgency and capacity. Expect response within 24 hours.';
    }

    const totalFCFA = baseFCFA;
    const totalNGN = totalFCFA * 2.5; // Fixed conversion rate

    // Generate random quote ID for MVP
    const quoteId = `QUOTE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return {
      quoteId,
      baseFCFA,
      totalFCFA,
      totalNGN,
      isExpress: !!request.isExpress,
      reservationRequired: "48 hours before departure",
      expiresAt,
      status,
      ...(message && { message })
    };
  }
};
