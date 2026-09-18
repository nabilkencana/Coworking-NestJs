import { calculateEndTime, formatToHHmm } from '../src/common/utils/date-time.util';
import { generateBookingCode, generateQrPayload } from '../src/common/utils/booking-code.util';
import { checkScheduleOverlap, calculatePricing } from '../src/common/utils/reservation-calc.util';

describe('Common Utilities', () => {
  describe('date-time.util', () => {
    it('should correctly calculate end time given start time and duration', () => {
      expect(calculateEndTime('09:00', 3)).toBe('12:00');
      expect(calculateEndTime('13:30', 2)).toBe('15:30');
      expect(calculateEndTime('22:00', 3)).toBe('01:00');
    });

    it('should format hours and minutes into HH:mm', () => {
      expect(formatToHHmm(9, 5)).toBe('09:05');
      expect(formatToHHmm(14, 30)).toBe('14:30');
    });
  });

  describe('booking-code.util', () => {
    it('should format booking code as BOOK-YYYYMMDD-XXXX', () => {
      const code = generateBookingCode('2026-08-30', 12);
      expect(code).toBe('BOOK-20260830-0012');
    });

    it('should generate QR code payload with verification schema', () => {
      const payload = generateQrPayload(12, 'BOOK-20260830-0012');
      expect(payload).toBe('VERIFY-RESERVASI-12-BOOK-20260830-0012');
    });
  });

  describe('reservation-calc.util', () => {
    it('should detect overlapping time intervals accurately', () => {
      // Slot 1: 09:00 - 12:00
      // Conflict: 10:00 - 11:00
      expect(checkScheduleOverlap('09:00', '12:00', '10:00', '11:00')).toBe(true);
      // Conflict: 08:00 - 10:00
      expect(checkScheduleOverlap('09:00', '12:00', '08:00', '10:00')).toBe(true);
      // Conflict: 11:00 - 13:00
      expect(checkScheduleOverlap('09:00', '12:00', '11:00', '13:00')).toBe(true);
      // No conflict: adjacent before 07:00 - 09:00
      expect(checkScheduleOverlap('09:00', '12:00', '07:00', '09:00')).toBe(false);
      // No conflict: adjacent after 12:00 - 14:00
      expect(checkScheduleOverlap('09:00', '12:00', '12:00', '14:00')).toBe(false);
    });

    it('should calculate initial price, discount amount, and total bayar', () => {
      const pricingNoPromo = calculatePricing(20000, 3);
      expect(pricingNoPromo).toEqual({
        hargaPerJam: 20000,
        durasiJam: 3,
        totalHargaAwal: 60000,
        potonganDiskon: 0,
        totalBayar: 60000,
      });

      const pricingWithPromo = calculatePricing(20000, 3, 20);
      expect(pricingWithPromo).toEqual({
        hargaPerJam: 20000,
        durasiJam: 3,
        totalHargaAwal: 60000,
        potonganDiskon: 12000,
        totalBayar: 48000,
      });
    });
  });
});
