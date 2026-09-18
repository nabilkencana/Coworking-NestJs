/**
 * Generates standardized booking code: BOOK-YYYYMMDD-XXXX
 * where XXXX is zero-padded ID.
 */
export function generateBookingCode(dateStr: string, reservationId: number): string {
  const cleanDate = dateStr.replace(/-/g, '');
  const paddedId = String(reservationId).padStart(4, '0');
  return `BOOK-${cleanDate}-${paddedId}`;
}

/**
 * Generates standardized E-Ticket Number: TICKET-<BRAND>-YYYYMMDD-XXXX
 */
export function generateETicketNumber(coworkingName: string, dateStr: string, reservationId: number): string {
  const brandCode = coworkingName
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 10);
  const cleanDate = dateStr.replace(/-/g, '');
  const paddedId = String(reservationId).padStart(4, '0');
  return `TICKET-${brandCode}-${cleanDate}-${paddedId}`;
}

/**
 * Generates verification QR payload
 */
export function generateQrPayload(reservationId: number, bookingCode: string): string {
  return `VERIFY-RESERVASI-${reservationId}-${bookingCode}`;
}
