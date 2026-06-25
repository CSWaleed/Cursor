import type { ShootType } from '../types';

export interface ShootPreset {
  label: string;
  type: ShootType;
  price: number;
  /** duration in hours */
  durationHours: number;
  emoji: string;
}

export const SHOOT_PRESETS: ShootPreset[] = [
  { label: 'Full-Day Wedding', type: 'Wedding', price: 4500, durationHours: 10, emoji: '💍' },
  { label: 'Half-Day Wedding', type: 'Wedding', price: 2800, durationHours: 5, emoji: '💒' },
  { label: 'Elopement', type: 'Elopement', price: 1800, durationHours: 3, emoji: '🌿' },
  { label: 'Engagement Session', type: 'Engagement', price: 650, durationHours: 1.5, emoji: '💛' },
  { label: 'Portrait Session', type: 'Portrait', price: 450, durationHours: 1, emoji: '📷' },
];
