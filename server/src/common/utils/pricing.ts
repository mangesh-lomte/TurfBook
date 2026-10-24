import { Decimal } from '@prisma/client/runtime/library';

export interface PriceCalculationResult {
  totalHours: number;
  hourlyRate: number;
  subtotal: number;
  discount: number;
  tax: number;
  totalPrice: number;
}

export function calculateBookingPrice(
  startTime: Date,
  endTime: Date,
  hourlyRateNumber: number | Decimal,
  discountPercentage = 0,
  taxPercentage = 0
): PriceCalculationResult {
  const rate = typeof hourlyRateNumber === 'number' ? hourlyRateNumber : Number(hourlyRateNumber);
  const diffMs = endTime.getTime() - startTime.getTime();
  if (diffMs <= 0) {
    throw new Error('End time must be after start time');
  }

  const totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  const rawSubtotal = totalHours * rate;
  const subtotal = Math.round(rawSubtotal * 100) / 100;

  const discount = Math.round((subtotal * (discountPercentage / 100)) * 100) / 100;
  const taxableAmount = subtotal - discount;
  const tax = Math.round((taxableAmount * (taxPercentage / 100)) * 100) / 100;
  const totalPrice = Math.round((taxableAmount + tax) * 100) / 100;

  return {
    totalHours,
    hourlyRate: rate,
    subtotal,
    discount,
    tax,
    totalPrice,
  };
}
