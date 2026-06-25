import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { eachDayOfInterval, format, isSameDay, subDays } from 'date-fns';
import type { Invoice } from '../types';
import { formatMoney } from '../lib/format';

export function RevenueChart({
  invoices,
  now,
  currency,
}: {
  invoices: Invoice[];
  now: number;
  currency: string;
}) {
  const { collected, outstanding, days, maxDay } = useMemo(() => {
    const collected = invoices
      .filter((i) => i.status === 'Paid')
      .reduce((s, i) => s + i.total, 0);
    const outstanding = invoices
      .filter((i) => i.status !== 'Paid' && i.status !== 'Draft')
      .reduce((s, i) => s + i.amountDue, 0);

    const interval = eachDayOfInterval({
      start: subDays(now, 6),
      end: new Date(now),
    });
    const days = interval.map((d) => {
      const amount = invoices
        .filter(
          (i) =>
            i.status === 'Paid' &&
            i.paidAt &&
            isSameDay(new Date(i.paidAt), d),
        )
        .reduce((s, i) => s + i.total, 0);
      return { date: d, amount };
    });
    const maxDay = Math.max(1, ...days.map((d) => d.amount));
    return { collected, outstanding, days, maxDay };
  }, [invoices, now]);

  const total = collected + outstanding;
  const collectedPct = total > 0 ? (collected / total) * 100 : 0;

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="font-display text-xl text-charcoal">This month</h3>
          <p className="text-xs text-charcoal/50">Collected vs. outstanding</p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl text-charcoal">
            {formatMoney(collected, currency)}
          </p>
          <p className="text-xs text-charcoal/50">collected</p>
        </div>
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded-full bg-charcoal/5">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #C8A96A, #A8884B)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${collectedPct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-charcoal/60">
          <span className="h-2.5 w-2.5 rounded-full bg-champagne" /> Collected
        </span>
        <span className="flex items-center gap-1.5 text-charcoal/60">
          <span className="h-2.5 w-2.5 rounded-full bg-charcoal/15" />
          Outstanding {formatMoney(outstanding, currency)}
        </span>
      </div>

      <div className="mt-6 flex items-end justify-between gap-2">
        {days.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-24 w-full items-end justify-center">
              <motion.div
                className="w-full max-w-[28px] rounded-lg bg-gradient-to-t from-rose/40 to-champagne"
                initial={{ height: 0 }}
                animate={{
                  height: `${Math.max(4, (d.amount / maxDay) * 100)}%`,
                }}
                transition={{ duration: 0.7, delay: i * 0.06, ease: 'easeOut' }}
                title={formatMoney(d.amount, currency)}
              />
            </div>
            <span className="text-[10px] uppercase tracking-wide text-charcoal/40">
              {format(d.date, 'EEEEE')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
