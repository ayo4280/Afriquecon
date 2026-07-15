import { describe, expect, it } from 'vitest';
import { cargoService } from './cargoService';

describe('cargo quoting', () => {
  it('returns an instant quote for a supported standard shipment', () => {
    const quote = cargoService.calculateQuote({
      origin: 'Douala', destination: 'Lagos', weightKg: 25, cargoType: 'general',
    });

    expect(quote).toMatchObject({
      baseFCFA: 25_000,
      totalFCFA: 25_000,
      totalNGN: 62_500,
      status: 'INSTANT_QUOTE',
      isExpress: false,
    });
    expect(quote.quoteId).toMatch(/^QUOTE-\d{8}-\d{3}$/);
  });

  it('routes large shipments to management review', () => {
    const quote = cargoService.calculateQuote({
      origin: 'Lagos', destination: 'Douala', weightKg: 100, cargoType: 'general',
    });

    expect(quote.status).toBe('PENDING_REVIEW');
    expect(quote.totalFCFA).toBe(0);
  });

  it('routes express shipments to management review', () => {
    const quote = cargoService.calculateQuote({
      origin: 'Douala', destination: 'Lagos', weightKg: 10, cargoType: 'general', isExpress: true,
    });

    expect(quote.status).toBe('PENDING_REVIEW');
    expect(quote.message).toContain('express booking requires management approval');
  });

  it('rejects routes outside the supported countries', () => {
    expect(() => cargoService.calculateQuote({
      origin: 'Paris', destination: 'Lagos', weightKg: 10, cargoType: 'general',
    })).toThrow('Route not supported');
  });
});
