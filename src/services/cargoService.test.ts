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
    expect(quote.totalFCFA).toBe(0);
    expect(quote.message).toContain('express cargo booking requires management approval');
  });

  it('enforces the 50 kg express limit in the quote service', () => {
    expect(() => cargoService.calculateQuote({
      origin: 'Douala', destination: 'Lagos', weightKg: 51, cargoType: 'general', isExpress: true,
    })).toThrow('Express cargo weight cannot exceed 50kg.');
  });

  it('allows an express shipment at the 50 kg limit but still requires approval', () => {
    const quote = cargoService.calculateQuote({
      origin: 'Lagos', destination: 'Douala', weightKg: 50, cargoType: 'general', isExpress: true,
    });

    expect(quote.status).toBe('PENDING_REVIEW');
    expect(quote.isExpress).toBe(true);
  });

  it('rejects missing or non-positive cargo weights', () => {
    expect(() => cargoService.calculateQuote({
      origin: 'Lagos', destination: 'Douala', weightKg: 0, cargoType: 'general',
    })).toThrow('Cargo weight must be greater than 0kg.');

    expect(() => cargoService.calculateQuote({
      origin: 'Lagos', destination: 'Douala', weightKg: Number.NaN, cargoType: 'general',
    })).toThrow('Cargo weight must be greater than 0kg.');
  });

  it('rejects routes outside the supported countries', () => {
    expect(() => cargoService.calculateQuote({
      origin: 'Paris', destination: 'Lagos', weightKg: 10, cargoType: 'general',
    })).toThrow('Route not supported');
  });
});
