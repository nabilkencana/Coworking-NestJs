import { timeToMinutes } from './date-time.util';

/**
 * Checks if two time intervals [startA, endA) and [startB, endB) overlap.
 * Returns true if there is a collision.
 */
export function checkScheduleOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  const aStart = timeToMinutes(startA);
  let aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  let bEnd = timeToMinutes(endB);

  // If end is smaller than start (overnight shift), add 24 hours
  if (aEnd <= aStart) aEnd += 24 * 60;
  if (bEnd <= bStart) bEnd += 24 * 60;

  return aStart < bEnd && bStart < aEnd;
}

export interface PricingResult {
  hargaPerJam: number;
  durasiJam: number;
  totalHargaAwal: number;
  potonganDiskon: number;
  totalBayar: number;
}

/**
 * Calculates financial amounts for a reservation
 */
export function calculatePricing(
  hargaPerJam: number,
  durasiJam: number,
  persentaseDiskon: number = 0,
): PricingResult {
  const totalHargaAwal = hargaPerJam * durasiJam;
  const potonganDiskon = persentaseDiskon > 0
    ? Math.round((totalHargaAwal * persentaseDiskon) / 100)
    : 0;
  const totalBayar = totalHargaAwal - potonganDiskon;

  return {
    hargaPerJam,
    durasiJam,
    totalHargaAwal,
    potonganDiskon,
    totalBayar,
  };
}
