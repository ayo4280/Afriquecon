export interface CargoQuoteRequest {
  origin: string;
  destination: string;
  weightKg: number;
  cargoType: 'general' | 'heavy_equipment';
  isExpress?: boolean;
  isCameroonShipper?: boolean;
  volumeDiscount?: boolean;
  loyaltyDiscount?: boolean;
}

export interface CargoQuoteResponse {
  quoteId: string;
  baseFCFA: number;
  surchargesFCFA: number;
  discountsFCFA: number;
  totalFCFA: number;
  totalNGN: number;
  isExpress: boolean;
  reservationRequired: string;
  expiresAt: string;
}

// Mock database for base rates (Origin-Destination -> Base Rate FCFA)
const baseRates: Record<string, number> = {
  'Yaoundé-Lagos': 95000,
  'Yaoundé-Abuja': 100000,
  'Douala-Lagos': 90000,
  'Douala-Abuja': 90000,
  'Buea-Lagos': 90000,
  'Kumba-Lagos': 85000,
  'Kumba-Abuja': 85000,
  'Ikom-Lagos': 40000,
};

export const cargoService = {
  calculateQuote: (request: CargoQuoteRequest): CargoQuoteResponse => {
    const routeKey = `${request.origin}-${request.destination}`;
    const baseFCFA = baseRates[routeKey];

    if (!baseFCFA) {
      throw new Error(`Route not supported: ${routeKey}`);
    }

    if (request.isExpress && request.weightKg > 50) {
      throw new Error('Express cargo weight cannot exceed 50kg.');
    }

    let surchargesFCFA = 0;

    // Weight surcharge: >20kg = +5000 FCFA per 10kg
    if (request.weightKg > 20) {
      const extraWeight = request.weightKg - 20;
      const extraBlocks = Math.ceil(extraWeight / 10);
      surchargesFCFA += extraBlocks * 5000;
    }

    // Heavy equipment surcharge: +15% of base
    if (request.cargoType === 'heavy_equipment') {
      surchargesFCFA += baseFCFA * 0.15;
    }

    // Cameroon Shipper markup: +5% of base
    if (request.isCameroonShipper) {
      surchargesFCFA += baseFCFA * 0.05;
    }

    // Express surcharge: +25000 FCFA
    if (request.isExpress) {
      surchargesFCFA += 25000;
    }

    const subtotalFCFA = baseFCFA + surchargesFCFA;
    let discountsFCFA = 0;

    // Volume discount: -10% of subtotal
    if (request.volumeDiscount) {
      discountsFCFA += subtotalFCFA * 0.10;
    }

    // Loyalty discount: -5% of subtotal
    if (request.loyaltyDiscount) {
      discountsFCFA += subtotalFCFA * 0.05;
    }

    const totalFCFA = subtotalFCFA - discountsFCFA;
    const totalNGN = totalFCFA * 2.5; // Fixed conversion rate

    // Generate random quote ID for MVP
    const quoteId = `QUOTE-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    // Expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return {
      quoteId,
      baseFCFA,
      surchargesFCFA,
      discountsFCFA,
      totalFCFA,
      totalNGN,
      isExpress: !!request.isExpress,
      reservationRequired: "48 hours before departure",
      expiresAt
    };
  }
};
