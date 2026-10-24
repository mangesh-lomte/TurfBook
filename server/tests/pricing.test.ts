import { describe, it, expect } from 'vitest';
import { calculateBookingPrice } from '../src/common/utils/pricing.js';

describe('Authoritative Pricing Calculator Unit Tests', () => {
  it('correctly calculates subtotal for exact 1 hour slot', () => {
    const start = new Date('2026-10-25T10:00:00.000Z');
    const end = new Date('2026-10-25T11:00:00.000Z');
    const rate = 1200;

    const result = calculateBookingPrice(start, end, rate);
    expect(result.totalHours).toBe(1.0);
    expect(result.hourlyRate).toBe(1200);
    expect(result.subtotal).toBe(1200);
    expect(result.discount).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.totalPrice).toBe(1200);
  });

  it('correctly calculates price for 2.5 hours', () => {
    const start = new Date('2026-10-25T14:00:00.000Z');
    const end = new Date('2026-10-25T16:30:00.000Z');
    const rate = 1000;

    const result = calculateBookingPrice(start, end, rate);
    expect(result.totalHours).toBe(2.5);
    expect(result.subtotal).toBe(2500);
    expect(result.totalPrice).toBe(2500);
  });

  it('applies discount and tax properly', () => {
    const start = new Date('2026-10-25T18:00:00.000Z');
    const end = new Date('2026-10-25T20:00:00.000Z');
    const rate = 1000; // 2 hours = 2000
    const discountPercent = 10; // 200 off -> 1800
    const taxPercent = 18; // 18% of 1800 = 324 -> total 2124

    const result = calculateBookingPrice(start, end, rate, discountPercent, taxPercent);
    expect(result.subtotal).toBe(2000);
    expect(result.discount).toBe(200);
    expect(result.tax).toBe(324);
    expect(result.totalPrice).toBe(2124);
  });

  it('throws error when end time is before or equal to start time', () => {
    const start = new Date('2026-10-25T10:00:00.000Z');
    const end = new Date('2026-10-25T09:00:00.000Z');

    expect(() => calculateBookingPrice(start, end, 1000)).toThrow('End time must be after start time');
  });
});
