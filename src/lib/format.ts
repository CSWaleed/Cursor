import {
  differenceInSeconds,
  format,
  formatDistanceToNowStrict,
} from 'date-fns';

export function formatMoney(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatTime(iso: string): string {
  return format(new Date(iso), 'h:mm a');
}

export function formatDate(iso: string): string {
  return format(new Date(iso), 'EEE, MMM d');
}

export function formatLongDate(iso: string | number): string {
  return format(new Date(iso), 'EEEE, MMMM d, yyyy');
}

export function formatDateInput(iso: string): string {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}

export function relativeFromNow(iso: string, now: number): string {
  const target = new Date(iso).getTime();
  if (target <= now) return 'just now';
  return formatDistanceToNowStrict(target, { addSuffix: false });
}

/** A compact "2h 14m 03s" countdown string. */
export function countdown(targetIso: string, now: number): string {
  const total = differenceInSeconds(new Date(targetIso), now);
  if (total <= 0) return 'now';
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (h > 0 || m > 0) parts.push(`${m}m`);
  parts.push(`${String(s).padStart(2, '0')}s`);
  return parts.join(' ');
}

export function greeting(now: number): string {
  const hour = new Date(now).getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function greetingEmoji(now: number): string {
  const hour = new Date(now).getHours();
  if (hour < 12) return '☀️';
  if (hour < 18) return '🌤️';
  return '🌙';
}
