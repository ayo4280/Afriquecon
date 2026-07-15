import { describe, expect, it } from 'vitest';
import { passengerService } from './passengerService';

describe('passenger pricing', () => {
  it('charges the Nigerian adult base fare with no discount', () => {
    expect(passengerService.calculatePricing({ baseFareFCFA: 20_000, ticketType: 'adult' })).toMatchObject({
      baseFareFCFA: 20_000,
      discountPercent: 0,
      extraLuggageFeeFCFA: 0,
      finalPriceFCFA: 20_000,
      finalPriceNGN: 50_000,
    });
  });

  it('uses the non-Nigerian fare when applicable', () => {
    const price = passengerService.calculatePricing({
      baseFareFCFA: 20_000,
      baseFareFCFANonNigerian: 25_000,
      ticketType: 'adult',
      isNigerian: false,
    });

    expect(price.baseFareFCFA).toBe(25_000);
    expect(price.finalPriceFCFA).toBe(25_000);
  });

  it('applies child and luggage rules together', () => {
    const price = passengerService.calculatePricing({
      baseFareFCFA: 20_000,
      ticketType: 'child_under_5',
      extraLuggageKg: 25,
    });

    expect(price.discountPercent).toBe(30);
    expect(price.discountAmountFCFA).toBe(6_000);
    expect(price.extraLuggageFeeFCFA).toBe(5_000);
    expect(price.finalPriceFCFA).toBe(19_000);
  });

  it('keeps a child under two free except for excess luggage', () => {
    const price = passengerService.calculatePricing({
      baseFareFCFA: 20_000,
      ticketType: 'child_under_2',
      extraLuggageKg: 22,
    });

    expect(price.finalPriceFCFA).toBe(2_000);
    expect(price.finalPriceNGN).toBe(5_000);
  });
});
