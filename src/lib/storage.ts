import type { AppData } from '../types';
import { buildSeedData, DEFAULT_SETTINGS } from './seed';

/**
 * Thin persistence layer. Everything goes through `load` / `save` so the rest
 * of the app never touches `localStorage` directly — swapping this for a real
 * API client later means rewriting only this file.
 */

const STORAGE_KEY = 'shutterpay.v1';

export function load(now: number): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = buildSeedData(now);
      save(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as Partial<AppData>;
    // Defensive merge so older payloads stay forward-compatible.
    return {
      shoots: parsed.shoots ?? [],
      invoices: parsed.invoices ?? [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      clockOffset: parsed.clockOffset ?? 0,
      seededAt: parsed.seededAt ?? new Date(now).toISOString(),
      invoiceSeq: parsed.invoiceSeq ?? 1,
    };
  } catch {
    const seeded = buildSeedData(now);
    save(seeded);
    return seeded;
  }
}

export function save(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full / unavailable — fail silently in the demo.
  }
}

export function reset(now: number): AppData {
  const seeded = buildSeedData(now);
  save(seeded);
  return seeded;
}
