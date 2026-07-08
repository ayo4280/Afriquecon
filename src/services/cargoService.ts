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

// Route base rates (Origin-Destination -> min base rate FCFA)
// Pricing is symmetric: same rate applies in both directions
const baseRates: Record<string, number> = {
  // Cameroon → Nigeria
  'Yaoundé-Lagos': 95000,
  'Yaoundé-Abuja': 100000,
  'Yaoundé-Enugu': 65000,
  'Yaoundé-Onitsha': 65000,
  'Yaoundé-Abakaliki': 65000,
  'Yaoundé-Ikom': 60000,
  'Douala-Lagos': 90000,
  'Douala-Abuja': 90000,
  'Douala-Enugu': 55000,
  'Douala-Onitsha': 55000,
  'Douala-Abakaliki': 55000,
  'Douala-Ikom': 50000,
  'Buea-Lagos': 90000,
  'Buea-Abuja': 90000,
  'Buea-Enugu': 55000,
  'Buea-Onitsha': 55000,
  'Buea-Abakaliki': 55000,
  'Buea-Ikom': 50000,
  'Kumba-Lagos': 85000,
  'Kumba-Abuja': 85000,
  'Kumba-Enugu': 50000,
  'Kumba-Onitsha': 50000,
  'Kumba-Abakaliki': 50000,
  'Kumba-Ikom': 40000,
  'Mamfe-Lagos': 60000,
  'Mamfe-Abuja': 65000,
  'Mamfe-Enugu': 55000,
  'Mamfe-Onitsha': 55000,
  'Mamfe-Abakaliki': 50000,
  'Mamfe-Ikom': 30000,
  // Nigeria → Cameroon (symmetric)
  'Lagos-Yaoundé': 95000,
  'Abuja-Yaoundé': 100000,
  'Enugu-Yaoundé': 65000,
  'Onitsha-Yaoundé': 65000,
  'Abakaliki-Yaoundé': 65000,
  'Ikom-Yaoundé': 60000,
  'Lagos-Douala': 90000,
  'Abuja-Douala': 90000,
  'Enugu-Douala': 55000,
  'Onitsha-Douala': 55000,
  'Abakaliki-Douala': 55000,
  'Ikom-Douala': 50000,
  'Lagos-Buea': 90000,
  'Abuja-Buea': 90000,
  'Enugu-Buea': 55000,
  'Onitsha-Buea': 55000,
  'Abakaliki-Buea': 55000,
  'Ikom-Buea': 50000,
  'Lagos-Kumba': 85000,
  'Abuja-Kumba': 85000,
  'Enugu-Kumba': 50000,
  'Onitsha-Kumba': 50000,
  'Abakaliki-Kumba': 50000,
  'Ikom-Kumba': 40000,
  'Lagos-Mamfe': 60000,
  'Abuja-Mamfe': 65000,
  'Enugu-Mamfe': 55000,
  'Onitsha-Mamfe': 55000,
  'Abakaliki-Mamfe': 50000,
  'Ikom-Mamfe': 30000,
};

export const cargoService = {
  calculateQuote: (request: CargoQuoteRequest): CargoQuoteResponse => {
    const routeKey = `${request.origin}-${request.destination}`;
    let baseFCFA = baseRates[routeKey];
    let status: 'INSTANT_QUOTE' | 'PENDING_REVIEW' = 'INSTANT_QUOTE';
    let message = '';

    if (!baseFCFA) {
      throw new Error(`Route not supported: ${routeKey}`);
    }

    if (request.weightKg >= 100) {
      status = 'PENDING_REVIEW';
      message = 'Your quote >=100kg requires management approval. Expect response within 24hrs.';
      baseFCFA = 0; // Management will determine
    } else {
      // Below 100kg: 1,000 FCFA per kg, with minimum being the route base rate
      baseFCFA = Math.max(request.weightKg * 1000, baseFCFA);
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
    const quoteId = `QUOTE-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
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
