import { motion, type Variants } from 'framer-motion';
import {
  CalendarDays,
  CameraIcon,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FastForward,
  Plus,
  Send,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { useApp } from '../store/AppContext';
import {
  computeStats,
  nextEndingShoot,
  SHOOT_TYPE_DETAILS,
} from '../lib/invoices';
import {
  countdown,
  formatLongDate,
  formatMoney,
  formatTime,
  greeting,
  greetingEmoji,
} from '../lib/format';
import { RevenueChart } from '../components/RevenueChart';
import type { Shoot } from '../types';

const fade: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      type: 'spring',
      stiffness: 220,
      damping: 26,
    },
  }),
};

function StatCard({
  icon,
  label,
  value,
  sub,
  index,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  index: number;
  accent?: boolean;
}) {
  return (
    <motion.div
      custom={index}
      variants={fade}
      initial="hidden"
      animate="show"
      className={`card flex flex-col gap-2 p-4 sm:p-5 ${
        accent ? 'ring-1 ring-champagne/30' : ''
      }`}
    >
      <div className="flex items-center gap-2 text-charcoal/50">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-champagne/12 text-champagne-dark">
          {icon}
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>
      <p className="font-display text-3xl leading-none text-charcoal">{value}</p>
      {sub && <p className="text-xs text-charcoal/50">{sub}</p>}
    </motion.div>
  );
}

export function Dashboard({
  onAddShoot,
  onOpenInvoice,
  onGoPlanner,
}: {
  onAddShoot: () => void;
  onOpenInvoice: (id: string) => void;
  onGoPlanner: () => void;
}) {
  const { data, now, settings, simulateEndOfShoot, fastForwardToNextWrap } =
    useApp();

  const stats = useMemo(
    () => computeStats(data.shoots, data.invoices, now),
    [data.shoots, data.invoices, now],
  );

  const next = useMemo(
    () => nextEndingShoot(data.shoots, now),
    [data.shoots, now],
  );

  const todaysShoots = useMemo(
    () =>
      data.shoots
        .filter((s) => {
          const d = new Date(s.start);
          const n = new Date(now);
          return (
            d.getFullYear() === n.getFullYear() &&
            d.getMonth() === n.getMonth() &&
            d.getDate() === n.getDate()
          );
        })
        .sort(
          (a, b) =>
            new Date(a.start).getTime() - new Date(b.start).getTime(),
        ),
    [data.shoots, now],
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-4 sm:px-6 sm:pt-8">
      {/* Hero */}
      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="mb-6"
      >
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-champagne-dark">
          {formatLongDate(now)}
        </p>
        <h1 className="mt-1 font-display text-4xl text-charcoal sm:text-5xl">
          {greeting(now)}, {settings.ownerName} {greetingEmoji(now)}
        </h1>
        <p className="mt-2 max-w-xl text-charcoal/55">
          Plan your shoots — ShutterPay sends a beautiful invoice the moment each
          one wraps, so you get paid the same day.
        </p>
      </motion.header>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          index={0}
          icon={<CameraIcon className="h-4 w-4" />}
          label="Shoots today"
          value={String(stats.shootsToday)}
          sub={`${todaysShoots.length} on the calendar`}
        />
        <StatCard
          index={1}
          icon={<CalendarDays className="h-4 w-4" />}
          label="Scheduled"
          value={formatMoney(stats.revenueScheduledToday, settings.currency)}
          sub="revenue today"
        />
        <StatCard
          index={2}
          icon={<Send className="h-4 w-4" />}
          label="Auto-sent"
          value={String(stats.invoicesAutoSent)}
          sub="invoices, hands-free"
        />
        <StatCard
          index={3}
          accent
          icon={<Wallet className="h-4 w-4" />}
          label="Collected"
          value={formatMoney(stats.amountCollected, settings.currency)}
          sub={`${formatMoney(stats.outstanding, settings.currency)} outstanding`}
        />
      </div>

      {/* Countdown / auto-send card */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 26 }}
        className="relative mb-6 overflow-hidden rounded-4xl p-6 text-white shadow-lift sm:p-8"
        style={{
          background:
            'linear-gradient(135deg, #2B2B2B 0%, #4a3f33 55%, #6f5638 100%)',
        }}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-champagne/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-10 h-40 w-40 rounded-full bg-rose/20 blur-3xl" />
        {next ? (
          <div className="relative">
            <div className="flex items-center gap-2 text-champagne">
              <Clock3 className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-[0.18em]">
                Next shoot wraps in
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-1">
              <span className="font-display text-5xl tabular-nums sm:text-6xl">
                {countdown(next.end, now)}
              </span>
              <span className="pb-1.5 text-white/70">
                {SHOOT_TYPE_DETAILS[next.type].emoji} {next.clientName}
              </span>
            </div>
            <p className="mt-3 max-w-md text-sm text-white/70">
              When this shoot ends at{' '}
              <span className="font-semibold text-white">
                {formatTime(next.end)}
              </span>
              , an invoice for{' '}
              <span className="font-semibold text-champagne">
                {formatMoney(
                  Math.max(0, next.price - next.depositPaid),
                  settings.currency,
                )}
              </span>{' '}
              auto-sends to {next.clientName}.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <button
                onClick={() => simulateEndOfShoot(next.id)}
                className="btn bg-white text-charcoal shadow-card hover:bg-white/90"
              >
                <Sparkles className="h-4 w-4 text-champagne-dark" />
                Simulate end of shoot
              </button>
              <button
                onClick={() => fastForwardToNextWrap()}
                className="btn border border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20"
              >
                <FastForward className="h-4 w-4" />
                Fast-forward time
              </button>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-start gap-3">
            <CheckCircle2 className="h-8 w-8 text-champagne" />
            <div>
              <h3 className="font-display text-3xl">You're all wrapped up</h3>
              <p className="mt-1 max-w-md text-sm text-white/70">
                No shoots pending an invoice right now. Add the next one and
                ShutterPay will handle the billing automatically.
              </p>
            </div>
            <button
              onClick={onAddShoot}
              className="btn bg-white text-charcoal shadow-card hover:bg-white/90"
            >
              <Plus className="h-4 w-4" /> Add a shoot
            </button>
          </div>
        )}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Today's shoots */}
        <div className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl text-charcoal">
              Today's shoots
            </h2>
            <button
              onClick={onGoPlanner}
              className="flex items-center gap-1 text-sm font-medium text-champagne-dark hover:underline"
            >
              Open planner <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {todaysShoots.length === 0 ? (
            <EmptyToday onAddShoot={onAddShoot} />
          ) : (
            <div className="space-y-3">
              {todaysShoots.map((s, i) => (
                <ShootRow
                  key={s.id}
                  shoot={s}
                  now={now}
                  index={i}
                  currency={settings.currency}
                  onOpenInvoice={onOpenInvoice}
                />
              ))}
            </div>
          )}
        </div>

        {/* Analytics */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-champagne-dark" />
            <h2 className="font-display text-2xl text-charcoal">Revenue</h2>
          </div>
          <RevenueChart
            invoices={data.invoices}
            now={now}
            currency={settings.currency}
          />
        </div>
      </div>
    </div>
  );
}

function ShootRow({
  shoot,
  now,
  index,
  currency,
  onOpenInvoice,
}: {
  shoot: Shoot;
  now: number;
  index: number;
  currency: string;
  onOpenInvoice: (id: string) => void;
}) {
  const detail = SHOOT_TYPE_DETAILS[shoot.type];
  const ended = new Date(shoot.end).getTime() <= now;
  return (
    <motion.div
      custom={index}
      variants={fade}
      initial="hidden"
      animate="show"
      className="card flex items-center gap-4 p-4"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-champagne/15 to-rose/15 text-xl">
        {detail.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-charcoal">
            {shoot.clientName}
          </p>
        </div>
        <p className="truncate text-xs text-charcoal/50">
          {formatTime(shoot.start)} – {formatTime(shoot.end)} · {shoot.location}
        </p>
      </div>
      <div className="text-right">
        <p className="font-display text-lg text-charcoal">
          {formatMoney(shoot.price, currency)}
        </p>
        {shoot.invoiced && shoot.invoiceId ? (
          <button
            onClick={() => onOpenInvoice(shoot.invoiceId!)}
            className="text-xs font-medium text-champagne-dark hover:underline"
          >
            View invoice →
          </button>
        ) : (
          <p
            className={`text-xs ${
              ended ? 'text-champagne-dark' : 'text-charcoal/40'
            }`}
          >
            {ended ? 'invoicing…' : 'upcoming'}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function EmptyToday({ onAddShoot }: { onAddShoot: () => void }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-champagne/10 text-2xl">
        📷
      </div>
      <div>
        <p className="font-display text-xl text-charcoal">
          No shoots planned yet
        </p>
        <p className="mt-1 text-sm text-charcoal/50">
          Add your first shoot and your day comes alive.
        </p>
      </div>
      <button onClick={onAddShoot} className="btn-primary mt-1">
        <Plus className="h-4 w-4" /> Add shoot
      </button>
    </div>
  );
}
