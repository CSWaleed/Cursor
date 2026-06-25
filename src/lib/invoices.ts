import type {
  Invoice,
  InvoiceLineItem,
  InvoiceStatus,
  Settings,
  Shoot,
} from '../types';

/**
 * Pure business logic for ShutterPay.
 *
 * Nothing in here touches the DOM, localStorage, or the network — every
 * function takes its inputs explicitly and returns new values, which keeps the
 * invoice lifecycle easy to reason about and unit-test, and makes it trivial to
 * later swap the persistence layer for a real API.
 */

export const SHOOT_TYPE_DETAILS: Record<
  Shoot['type'],
  { label: string; emoji: string }
> = {
  Wedding: { label: 'Wedding', emoji: '💍' },
  Engagement: { label: 'Engagement', emoji: '💛' },
  Elopement: { label: 'Elopement', emoji: '🌿' },
  Portrait: { label: 'Portrait', emoji: '📷' },
};

const STATUS_ORDER: InvoiceStatus[] = [
  'Draft',
  'Scheduled',
  'Sent',
  'Viewed',
  'Paid',
  'Overdue',
];

export function rank(status: InvoiceStatus): number {
  return STATUS_ORDER.indexOf(status);
}

/** Round to cents to avoid floating point drift. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface InvoiceTotals {
  subtotal: number;
  taxAmount: number;
  total: number;
  amountDue: number;
}

export function computeTotals(
  lineItems: InvoiceLineItem[],
  taxRate: number,
  depositPaid: number,
): InvoiceTotals {
  const subtotal = round2(lineItems.reduce((sum, li) => sum + li.amount, 0));
  const taxAmount = round2(subtotal * (taxRate / 100));
  const total = round2(subtotal + taxAmount);
  const amountDue = round2(Math.max(0, total - depositPaid));
  return { subtotal, taxAmount, total, amountDue };
}

export function buildLineItems(shoot: Shoot): InvoiceLineItem[] {
  return [
    {
      label: `${shoot.type} photography — ${shoot.location || 'on location'}`,
      amount: shoot.price,
    },
  ];
}

export function formatInvoiceNumber(seq: number): string {
  return `INV-${String(seq).padStart(4, '0')}`;
}

export interface GenerateInvoiceArgs {
  shoot: Shoot;
  settings: Settings;
  seq: number;
  now: number;
  autoSent: boolean;
  /** initial status — auto-sent invoices skip straight to "Sent" */
  status?: InvoiceStatus;
}

export function generateInvoice({
  shoot,
  settings,
  seq,
  now,
  autoSent,
  status = autoSent ? 'Sent' : 'Draft',
}: GenerateInvoiceArgs): Invoice {
  const lineItems = buildLineItems(shoot);
  const totals = computeTotals(lineItems, settings.taxRate, shoot.depositPaid);
  const issuedAt = status === 'Draft' ? undefined : new Date(now).toISOString();
  const dueAt = issuedAt
    ? new Date(now + settings.paymentTermsDays * 86_400_000).toISOString()
    : undefined;

  return {
    id: `inv_${shoot.id}_${seq}`,
    number: formatInvoiceNumber(seq),
    shootId: shoot.id,
    clientName: shoot.clientName,
    clientEmail: shoot.clientEmail,
    shootType: shoot.type,
    location: shoot.location,
    shootDate: shoot.start,
    lineItems,
    subtotal: totals.subtotal,
    taxRate: settings.taxRate,
    taxAmount: totals.taxAmount,
    depositPaid: shoot.depositPaid,
    total: totals.total,
    amountDue: totals.amountDue,
    status,
    message: settings.invoiceMessage,
    createdAt: new Date(now).toISOString(),
    issuedAt,
    dueAt,
    autoSent,
  };
}

/**
 * Returns the shoots whose end time has passed and that don't yet have an
 * invoice. This is the heart of the "auto-send" automation.
 */
export function findShootsToInvoice(
  shoots: Shoot[],
  now: number,
): Shoot[] {
  return shoots.filter(
    (s) => !s.invoiced && new Date(s.end).getTime() <= now,
  );
}

/** Flip Sent/Viewed invoices to Overdue once their due date has passed. */
export function applyOverdue(invoices: Invoice[], now: number): Invoice[] {
  let changed = false;
  const next = invoices.map((inv) => {
    const isOpen = inv.status === 'Sent' || inv.status === 'Viewed';
    if (isOpen && inv.dueAt && new Date(inv.dueAt).getTime() < now) {
      changed = true;
      return { ...inv, status: 'Overdue' as InvoiceStatus };
    }
    return inv;
  });
  return changed ? next : invoices;
}

export function markViewed(invoice: Invoice, now: number): Invoice {
  if (invoice.status !== 'Sent') return invoice;
  return {
    ...invoice,
    status: 'Viewed',
    viewedAt: new Date(now).toISOString(),
  };
}

export function markPaid(invoice: Invoice, now: number): Invoice {
  if (invoice.status === 'Paid') return invoice;
  return {
    ...invoice,
    status: 'Paid',
    paidAt: new Date(now).toISOString(),
    amountDue: 0,
  };
}

/** Re-issue an overdue invoice, pushing out a fresh due date (a reminder). */
export function sendReminder(
  invoice: Invoice,
  settings: Settings,
  now: number,
): Invoice {
  return {
    ...invoice,
    status: 'Sent',
    issuedAt: new Date(now).toISOString(),
    dueAt: new Date(now + settings.paymentTermsDays * 86_400_000).toISOString(),
  };
}

export interface DashboardStats {
  shootsToday: number;
  revenueScheduledToday: number;
  invoicesAutoSent: number;
  amountCollected: number;
  outstanding: number;
  totalInvoiced: number;
}

function isSameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function computeStats(
  shoots: Shoot[],
  invoices: Invoice[],
  now: number,
): DashboardStats {
  const todaysShoots = shoots.filter((s) =>
    isSameDay(new Date(s.start).getTime(), now),
  );
  const amountCollected = invoices
    .filter((i) => i.status === 'Paid')
    .reduce((sum, i) => sum + i.total, 0);
  const outstanding = invoices
    .filter((i) => i.status !== 'Paid' && i.status !== 'Draft')
    .reduce((sum, i) => sum + i.amountDue, 0);
  const totalInvoiced = invoices
    .filter((i) => i.status !== 'Draft')
    .reduce((sum, i) => sum + i.total, 0);

  return {
    shootsToday: todaysShoots.length,
    revenueScheduledToday: round2(
      todaysShoots.reduce((sum, s) => sum + s.price, 0),
    ),
    invoicesAutoSent: invoices.filter((i) => i.autoSent).length,
    amountCollected: round2(amountCollected),
    outstanding: round2(outstanding),
    totalInvoiced: round2(totalInvoiced),
  };
}

/** The next shoot that is still running / hasn't been invoiced yet. */
export function nextEndingShoot(shoots: Shoot[], now: number): Shoot | null {
  const upcoming = shoots
    .filter((s) => !s.invoiced && new Date(s.end).getTime() > now)
    .sort(
      (a, b) => new Date(a.end).getTime() - new Date(b.end).getTime(),
    );
  return upcoming[0] ?? null;
}
