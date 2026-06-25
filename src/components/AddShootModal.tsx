import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { SHOOT_TYPE_DETAILS } from '../lib/invoices';
import { formatDateInput, formatMoney } from '../lib/format';
import { SHOOT_PRESETS, type ShootPreset } from '../lib/presets';
import { useApp, type ShootInput } from '../store/AppContext';
import type { ShootType } from '../types';

const TYPES: ShootType[] = ['Wedding', 'Engagement', 'Elopement', 'Portrait'];

function defaultTimes(now: number) {
  const start = new Date(now);
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return {
    start: formatDateInput(start.toISOString()),
    end: formatDateInput(end.toISOString()),
  };
}

export function AddShootModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addShoot, now, pushToast, settings } = useApp();

  const initial = useMemo(() => {
    const t = defaultTimes(now);
    return {
      clientName: '',
      clientEmail: '',
      type: 'Wedding' as ShootType,
      location: '',
      start: t.start,
      end: t.end,
      price: '',
      depositPaid: '',
      notes: '',
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(initial);
      setError('');
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const applyPreset = (preset: ShootPreset) => {
    const startDate = new Date(form.start);
    const end = new Date(startDate.getTime() + preset.durationHours * 3600_000);
    setForm((f) => ({
      ...f,
      type: preset.type,
      price: String(preset.price),
      end: formatDateInput(end.toISOString()),
    }));
  };

  const submit = () => {
    if (!form.clientName.trim()) return setError('Add a client name.');
    const price = Number(form.price);
    if (!price || price <= 0) return setError('Add a package price.');
    if (new Date(form.end) <= new Date(form.start))
      return setError('End time must be after the start time.');

    const input: ShootInput = {
      clientName: form.clientName.trim(),
      clientEmail: form.clientEmail.trim(),
      type: form.type,
      location: form.location.trim(),
      start: new Date(form.start).toISOString(),
      end: new Date(form.end).toISOString(),
      price,
      depositPaid: Number(form.depositPaid) || 0,
      notes: form.notes.trim() || undefined,
    };
    addShoot(input);
    pushToast({
      emoji: SHOOT_TYPE_DETAILS[form.type].emoji,
      tone: 'info',
      title: 'Shoot added to your day',
      body: `${input.clientName} · ${formatMoney(price, settings.currency)} — an invoice will auto-send when it wraps.`,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.4 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-4xl bg-ivory shadow-lift sm:rounded-4xl safe-bottom"
          >
            <div className="flex items-center justify-between border-b border-charcoal/5 px-6 pb-4 pt-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-champagne-dark">
                  New shoot
                </p>
                <h2 className="font-display text-2xl text-charcoal">
                  Plan your day
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-charcoal/40 transition-colors hover:bg-charcoal/5 hover:text-charcoal"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="mb-5">
                <p className="label flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-champagne" /> Quick presets
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {SHOOT_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => applyPreset(p)}
                      className="group shrink-0 rounded-2xl border border-champagne/30 bg-white/70 px-3.5 py-2 text-left transition-all hover:border-champagne hover:shadow-card active:scale-95"
                    >
                      <span className="block text-sm font-medium text-charcoal">
                        {p.emoji} {p.label}
                      </span>
                      <span className="block text-xs text-champagne-dark">
                        {formatMoney(p.price, settings.currency)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Shoot type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {TYPES.map((t) => {
                      const active = form.type === t;
                      return (
                        <button
                          key={t}
                          onClick={() => set('type', t)}
                          className={`rounded-2xl border px-2 py-2.5 text-center text-xs font-medium transition-all ${
                            active
                              ? 'border-champagne bg-champagne/10 text-champagne-dark shadow-card'
                              : 'border-charcoal/10 bg-white/60 text-charcoal/60 hover:border-champagne/40'
                          }`}
                        >
                          <span className="block text-base">
                            {SHOOT_TYPE_DETAILS[t].emoji}
                          </span>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Client name</label>
                    <input
                      className="input"
                      placeholder="Sarah &amp; Tom"
                      value={form.clientName}
                      onChange={(e) => set('clientName', e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="label">Client email</label>
                    <input
                      className="input"
                      type="email"
                      placeholder="couple@email.com"
                      value={form.clientEmail}
                      onChange={(e) => set('clientEmail', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Location</label>
                  <input
                    className="input"
                    placeholder="Cliffside Estate, Big Sur"
                    value={form.location}
                    onChange={(e) => set('location', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Starts</label>
                    <input
                      className="input"
                      type="datetime-local"
                      value={form.start}
                      onChange={(e) => set('start', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Ends</label>
                    <input
                      className="input"
                      type="datetime-local"
                      value={form.end}
                      onChange={(e) => set('end', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Package price</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40">
                        $
                      </span>
                      <input
                        className="input pl-7"
                        inputMode="decimal"
                        placeholder="4,500"
                        value={form.price}
                        onChange={(e) =>
                          set('price', e.target.value.replace(/[^0-9.]/g, ''))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Deposit already paid</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40">
                        $
                      </span>
                      <input
                        className="input pl-7"
                        inputMode="decimal"
                        placeholder="0"
                        value={form.depositPaid}
                        onChange={(e) =>
                          set(
                            'depositPaid',
                            e.target.value.replace(/[^0-9.]/g, ''),
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">Notes</label>
                  <textarea
                    className="input min-h-[72px] resize-none"
                    placeholder="Golden hour portraits, drone permitted…"
                    value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                  />
                </div>

                {error && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-charcoal/5 bg-white/40 px-6 py-4">
              <button onClick={submit} className="btn-primary w-full">
                Add shoot to day
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
