import { motion } from 'framer-motion';
import { ArrowUpRight, BellRing, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { rank, SHOOT_TYPE_DETAILS } from '../lib/invoices';
import { formatDate, formatMoney } from '../lib/format';
import { StatusPill } from '../components/StatusPill';
import type { Invoice, InvoiceStatus } from '../types';

type Filter = 'All' | InvoiceStatus;

const FILTERS: Filter[] = [
  'All',
  'Sent',
  'Viewed',
  'Paid',
  'Overdue',
  'Draft',
];

export function Invoices({
  onOpenInvoice,
}: {
  onOpenInvoice: (id: string) => void;
}) {
  const { data, settings, sendReminderFor } = useApp();
  const [filter, setFilter] = useState<Filter>('All');

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: data.invoices.length };
    for (const inv of data.invoices) c[inv.status] = (c[inv.status] ?? 0) + 1;
    return c;
  }, [data.invoices]);

  const filtered = useMemo(
    () =>
      data.invoices
        .filter((i) => (filter === 'All' ? true : i.status === filter))
        .sort((a, b) => {
          const ra = rank(a.status);
          const rb = rank(b.status);
          if (ra !== rb) return ra - rb;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }),
    [data.invoices, filter],
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-28 pt-4 sm:px-6 sm:pt-8">
      <div className="mb-5">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-champagne-dark">
          Billing
        </p>
        <h1 className="font-display text-4xl text-charcoal">Invoices</h1>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTERS.map((f) => {
          const active = filter === f;
          const count = counts[f] ?? 0;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                active
                  ? 'bg-charcoal text-white shadow-card'
                  : 'bg-white/70 text-charcoal/55 hover:text-charcoal'
              }`}
            >
              {f}
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                  active ? 'bg-white/20' : 'bg-charcoal/5'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <FileText className="h-10 w-10 text-champagne/60" />
          <p className="font-display text-2xl text-charcoal">
            No {filter === 'All' ? '' : filter.toLowerCase()} invoices
          </p>
          <p className="text-sm text-charcoal/50">
            Invoices appear here the moment a shoot wraps.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv, i) => (
            <InvoiceCard
              key={inv.id}
              invoice={inv}
              index={i}
              currency={settings.currency}
              onOpen={() => onOpenInvoice(inv.id)}
              onRemind={() => sendReminderFor(inv.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceCard({
  invoice,
  index,
  currency,
  onOpen,
  onRemind,
}: {
  invoice: Invoice;
  index: number;
  currency: string;
  onOpen: () => void;
  onRemind: () => void;
}) {
  const detail = SHOOT_TYPE_DETAILS[invoice.shootType];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className="card overflow-hidden"
    >
      <button
        onClick={onOpen}
        className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-white/40 sm:p-5"
      >
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-champagne/15 to-rose/15 text-xl">
          {detail.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium text-charcoal">
              {invoice.clientName}
            </p>
            <StatusPill status={invoice.status} />
            {invoice.autoSent && (
              <span className="pill bg-sage/15 text-sage">⚡ Auto</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-charcoal/50">
            {invoice.number} · {invoice.shootType} ·{' '}
            {formatDate(invoice.shootDate)}
            {invoice.dueAt && invoice.status !== 'Paid'
              ? ` · due ${formatDate(invoice.dueAt)}`
              : invoice.paidAt
                ? ` · paid ${formatDate(invoice.paidAt)}`
                : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-xl text-charcoal">
            {formatMoney(
              invoice.status === 'Paid' ? invoice.total : invoice.amountDue,
              currency,
            )}
          </p>
          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-champagne-dark">
            Open <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </button>
      {invoice.status === 'Overdue' && (
        <div className="flex items-center justify-between gap-3 border-t border-red-100 bg-red-50/60 px-4 py-2.5">
          <span className="text-xs font-medium text-red-600">
            Past due — a gentle nudge could help.
          </span>
          <button
            onClick={onRemind}
            className="btn bg-white px-3 py-1.5 text-xs text-red-600 shadow-card hover:bg-red-50"
          >
            <BellRing className="h-3.5 w-3.5" /> Send reminder
          </button>
        </div>
      )}
    </motion.div>
  );
}
