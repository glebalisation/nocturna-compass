export const DAY_START = '06:00';
export const DAY_NIGHT_CUTOFF = '18:00';

/** Events with no start_time are ambiguous and pass either filter. */
export function isDaytime(start_time?: string | null): boolean {
  if (!start_time) return true;
  return start_time >= DAY_START && start_time < DAY_NIGHT_CUTOFF;
}
export function isNighttime(start_time?: string | null): boolean {
  if (!start_time) return true;
  return !isDaytime(start_time);
}
