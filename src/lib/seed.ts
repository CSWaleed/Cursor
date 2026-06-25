import type { AppData, Invoice, Settings, Shoot } from '../types';
import { generateInvoice, markPaid } from './invoices';

export const DEFAULT_SETTINGS: Settings = {
  businessName: 'Matt Hayes Photography',
  ownerName: 'Matt',
  logoInitials: 'MH',
  accentColor: '#C8A96A',
  paymentTermsDays: 7,
  taxRate: 0,
  invoiceMessage: 'Thank you for letting me capture your day 💛',
  email: 'matt@matthayes.photo',
  phone: '(415) 555-0142',
  currency: 'USD',
};

function at(base: Date, hour: number, minute = 0): string {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

function fromNow(now: number, ms: number): string {
  return new Date(now + ms).toISOString();
}

/**
 * Builds a lively first-run dataset anchored around `now` so the dashboard is
 * never empty on first load:
 *  - one shoot that already ended and was paid,
 *  - one shoot ending very soon (so the auto-send countdown is ticking),
 *  - two upcoming shoots later today / this week.
 */
export function buildSeedData(now: number): AppData {
  const today = new Date(now);
  const settings = DEFAULT_SETTINGS;

  const shoots: Shoot[] = [];
  const invoices: Invoice[] = [];
  let seq = 1;

  // 1) Earlier today — already wrapped, invoice sent & paid.
  const paidShoot: Shoot = {
    id: 'shoot_olivia',
    clientName: 'Olivia & James',
    clientEmail: 'olivia.james@gmail.com',
    type: 'Wedding',
    location: 'The Ivory Barn, Sonoma',
    start: fromNow(now, -6 * HOUR),
    end: fromNow(now, -4 * HOUR),
    price: 4500,
    depositPaid: 1000,
    notes: 'First look, ceremony at noon. Golden hour portraits a must.',
    invoiced: true,
    invoiceId: '',
    createdAt: fromNow(now, -7 * HOUR),
  };
  const paidInvoiceBase = generateInvoice({
    shoot: paidShoot,
    settings,
    seq: seq++,
    now: new Date(paidShoot.end).getTime(),
    autoSent: true,
  });
  const paidInvoice = markPaid(paidInvoiceBase, now - 30 * 60 * 1000);
  paidShoot.invoiceId = paidInvoice.id;
  shoots.push(paidShoot);
  invoices.push(paidInvoice);

  // 2) Ending soon (~7 min from now) — countdown card + live auto-send demo.
  shoots.push({
    id: 'shoot_sarah_tom',
    clientName: 'Sarah & Tom',
    clientEmail: 'sarahtom.wedding@gmail.com',
    type: 'Wedding',
    location: 'Cliffside Estate, Big Sur',
    start: fromNow(now, -3 * HOUR),
    end: fromNow(now, 7 * MIN),
    price: 4500,
    depositPaid: 1500,
    notes: 'Coastal ceremony, reception under the oaks. Drone permitted.',
    invoiced: false,
    createdAt: fromNow(now, -4 * HOUR),
  });

  // 3) Later today — engagement session, still upcoming.
  shoots.push({
    id: 'shoot_mia',
    clientName: 'Mia & Daniel',
    clientEmail: 'mia.daniel@outlook.com',
    type: 'Engagement',
    location: 'Baker Beach, San Francisco',
    start: fromNow(now, 3 * HOUR),
    end: fromNow(now, 3 * HOUR + 90 * MIN),
    price: 650,
    depositPaid: 0,
    notes: 'Sunset session — bring the prism + the 85mm.',
    invoiced: false,
    createdAt: fromNow(now, -4 * HOUR),
  });

  // 4) Later this week — elopement.
  const inThreeDays = new Date(now + 3 * 86_400_000);
  shoots.push({
    id: 'shoot_aria',
    clientName: 'Aria & Noah',
    clientEmail: 'aria.noah@gmail.com',
    type: 'Elopement',
    location: 'Yosemite Valley, Glacier Point',
    start: at(inThreeDays, 16, 0),
    end: at(inThreeDays, 19, 0),
    price: 1800,
    depositPaid: 500,
    notes: 'Permit secured. Hike-in at 3:30, vows at sunset.',
    invoiced: false,
    createdAt: at(today, 7, 15),
  });

  // A second already-collected invoice from earlier this week for analytics.
  const lastWeekDate = new Date(now - 5 * 86_400_000);
  const pastShoot: Shoot = {
    id: 'shoot_emma',
    clientName: 'Emma & Lucas',
    clientEmail: 'emma.lucas@gmail.com',
    type: 'Portrait',
    location: 'Presidio, San Francisco',
    start: at(lastWeekDate, 10, 0),
    end: at(lastWeekDate, 11, 0),
    price: 450,
    depositPaid: 0,
    notes: 'Family of four, golden retriever included 🐕',
    invoiced: true,
    createdAt: at(lastWeekDate, 8, 0),
  };
  const pastInvoiceBase = generateInvoice({
    shoot: pastShoot,
    settings,
    seq: seq++,
    now: new Date(pastShoot.end).getTime(),
    autoSent: true,
  });
  const pastInvoice = markPaid(pastInvoiceBase, now - 4 * 86_400_000);
  pastShoot.invoiceId = pastInvoice.id;
  shoots.push(pastShoot);
  invoices.push(pastInvoice);

  return {
    shoots,
    invoices,
    settings,
    clockOffset: 0,
    seededAt: new Date(now).toISOString(),
    invoiceSeq: seq,
  };
}
