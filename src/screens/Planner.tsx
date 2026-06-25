import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  addDays,
  format,
  isSameDay,
  isToday,
  startOfWeek,
} from 'date-fns';
import { useApp } from '../store/AppContext';
import { SHOOT_TYPE_DETAILS } from '../lib/invoices';
import { formatMoney, formatTime } from '../lib/format';
import { StatusPill } from '../components/StatusPill';
import type { Invoice, Shoot } from '../types';

type View = 'day' | 'week';

export function Planner({
  onAddShoot,
  onOpenInvoice,
}: {
  onAddShoot: () => void;
  onOpenInvoice: (id: string) => void;
}) {
  const { data, now, simulateEndOfShoot, deleteShoot } = useApp();
  const [view, setView] = useState<View>('day');
  const [cursor, setCursor] = useState<number>(now);

  const invoiceByShoot = useMemo(() => {
    const map = new Map<string, Invoice>();
    for (const inv of data.invoices) map.set(inv.shootId, inv);
    return map;
  }, [data.invoices]);

  const shootsByDay = (day: Date) =>
    data.shoots
      .filter((s) => isSameDay(new Date(s.start), day))
      .sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
      );

  const step = (dir: number) =>
    setCursor((c) => addDays(new Date(c), dir * (view === 'week' ? 7 : 1)).getTime());

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(cursor), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const dayShoots = shootsByDay(new Date(cursor));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-4 sm:px-6 sm:pt-8">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-champagne-dark">
            Day Planner
          </p>
          <h1 className="font-display text-4xl text-charcoal">Your calendar</h1>
        </div>
        <button onClick={onAddShoot} className="btn-primary hidden sm:inline-flex">
          <Plus className="h-4 w-4" /> Add shoot
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => step(-1)}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/70 text-charcoal/60 shadow-card transition hover:text-charcoal active:scale-95"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => step(1)}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/70 text-charcoal/60 shadow-card transition hover:text-charcoal active:scale-95"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCursor(now)}
            className="btn-ghost ml-1 px-4 py-2 text-sm"
          >
            Today
          </button>
          <h2 className="ml-2 font-display text-2xl text-charcoal">
            {view === 'day'
              ? format(new Date(cursor), 'EEEE, MMM d')
              : `${format(weekDays[0], 'MMM d')} – ${format(
                  weekDays[6],
                  'MMM d',
                )}`}
          </h2>
        </div>

        <div className="flex rounded-full bg-white/70 p-1 shadow-card">
          {(['day', 'week'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`relative rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                view === v ? 'text-white' : 'text-charcoal/50'
              }`}
            >
              {view === v && (
                <motion.span
                  layoutId="viewPill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-champagne to-champagne-dark"
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                />
              )}
              <span className="relative">{v}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'day' ? (
          <motion.div
            key="day"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2 }}
          >
            {dayShoots.length === 0 ? (
              <EmptyDay onAddShoot={onAddShoot} />
            ) : (
              <div className="space-y-4">
                {dayShoots.map((s, i) => (
                  <DayCard
                    key={s.id}
                    shoot={s}
                    index={i}
                    now={now}
                    invoice={invoiceByShoot.get(s.id)}
                    currency={data.settings.currency}
                    onSimulate={() => simulateEndOfShoot(s.id)}
                    onDelete={() => deleteShoot(s.id)}
                    onOpenInvoice={onOpenInvoice}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="week"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7"
          >
            {weekDays.map((day) => {
              const shoots = shootsByDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`card flex min-h-[140px] flex-col p-3 ${
                    isToday(day) ? 'ring-1 ring-champagne/40' : ''
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-charcoal/40">
                      {format(day, 'EEE')}
                    </span>
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-full text-sm font-semibold ${
                        isToday(day)
                          ? 'bg-champagne text-white'
                          : 'text-charcoal/70'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    {shoots.length === 0 ? (
                      <button
                        onClick={() => {
                          setCursor(day.getTime());
                          onAddShoot();
                        }}
                        className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-charcoal/10 text-charcoal/25 transition hover:border-champagne/40 hover:text-champagne-dark"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    ) : (
                      shoots.map((s) => (
                        <button
                          key={s.id}
                          onClick={() =>
                            s.invoiceId
                              ? onOpenInvoice(s.invoiceId)
                              : (setCursor(day.getTime()), setView('day'))
                          }
                          className="rounded-xl bg-gradient-to-br from-champagne/12 to-rose/12 p-2 text-left transition hover:shadow-card"
                        >
                          <span className="block truncate text-xs font-medium text-charcoal">
                            {SHOOT_TYPE_DETAILS[s.type].emoji} {s.clientName}
                          </span>
                          <span className="block text-[10px] text-charcoal/50">
                            {formatTime(s.start)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DayCard({
  shoot,
  index,
  now,
  invoice,
  currency,
  onSimulate,
  onDelete,
  onOpenInvoice,
}: {
  shoot: Shoot;
  index: number;
  now: number;
  invoice?: Invoice;
  currency: string;
  onSimulate: () => void;
  onDelete: () => void;
  onOpenInvoice: (id: string) => void;
}) {
  const detail = SHOOT_TYPE_DETAILS[shoot.type];
  const ended = new Date(shoot.end).getTime() <= now;
  const amountDue = Math.max(0, shoot.price - shoot.depositPaid);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card overflow-hidden"
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="flex items-center gap-3 sm:w-28 sm:flex-col sm:items-start">
          <span className="font-display text-2xl text-charcoal">
            {formatTime(shoot.start)}
          </span>
          <span className="text-xs text-charcoal/40">
            to {formatTime(shoot.end)}
          </span>
        </div>

        <div className="hidden h-14 w-px bg-charcoal/10 sm:block" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xl">{detail.emoji}</span>
            <h3 className="font-display text-xl text-charcoal">
              {shoot.clientName}
            </h3>
            <span className="pill bg-champagne/12 text-champagne-dark">
              {shoot.type}
            </span>
            {invoice && <StatusPill status={invoice.status} />}
          </div>
          {shoot.location && (
            <p className="mt-1 flex items-center gap-1 text-sm text-charcoal/50">
              <MapPin className="h-3.5 w-3.5" /> {shoot.location}
            </p>
          )}
          {shoot.notes && (
            <p className="mt-1.5 text-sm italic text-charcoal/45">
              “{shoot.notes}”
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 sm:w-32">
          <span className="font-display text-2xl text-charcoal">
            {formatMoney(shoot.price, currency)}
          </span>
          {shoot.depositPaid > 0 && (
            <span className="text-xs text-charcoal/40">
              {formatMoney(amountDue, currency)} due
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-charcoal/5 bg-white/40 px-4 py-3">
        {invoice ? (
          <button
            onClick={() => onOpenInvoice(invoice.id)}
            className="btn-ghost px-4 py-2 text-sm"
          >
            View invoice {invoice.number}
          </button>
        ) : ended ? (
          <span className="text-sm text-champagne-dark">
            Wrapping up — invoice generating…
          </span>
        ) : (
          <button
            onClick={onSimulate}
            className="btn-ghost px-4 py-2 text-sm"
          >
            <Sparkles className="h-4 w-4 text-champagne-dark" />
            Simulate end of shoot
          </button>
        )}
        <button
          onClick={onDelete}
          className="ml-auto grid h-9 w-9 place-items-center rounded-full text-charcoal/30 transition hover:bg-red-50 hover:text-red-500"
          aria-label="Delete shoot"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

function EmptyDay({ onAddShoot }: { onAddShoot: () => void }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-champagne/10 text-3xl">
        <CalendarDays className="h-7 w-7 text-champagne-dark" />
      </div>
      <div>
        <p className="font-display text-2xl text-charcoal">Nothing scheduled</p>
        <p className="mt-1 text-sm text-charcoal/50">
          A clear day. Add a shoot to fill the frame.
        </p>
      </div>
      <button onClick={onAddShoot} className="btn-primary mt-1">
        <Plus className="h-4 w-4" /> Add shoot
      </button>
    </div>
  );
}
