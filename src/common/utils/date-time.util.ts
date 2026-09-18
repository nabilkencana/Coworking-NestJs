/**
 * Formats hour and minute into HH:mm format
 */
export function formatToHHmm(hours: number, minutes: number): string {
  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Calculates end time (HH:mm) given a start time (HH:mm) and duration in hours.
 * Handles crossing midnight cleanly.
 */
export function calculateEndTime(startTime: string, durationHours: number): string {
  const [hoursStr, minutesStr] = startTime.split(':');
  const startHours = parseInt(hoursStr, 10);
  const startMinutes = parseInt(minutesStr, 10);

  const totalMinutes = (startHours * 60 + startMinutes) + durationHours * 60;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;

  return formatToHHmm(endHours, endMinutes);
}

/**
 * Converts HH:mm to total minutes since midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [hoursStr, minutesStr] = timeStr.split(':');
  return parseInt(hoursStr, 10) * 60 + parseInt(minutesStr, 10);
}
