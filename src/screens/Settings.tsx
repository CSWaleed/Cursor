import { motion } from 'framer-motion';
import { Check, Palette, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { useApp } from '../store/AppContext';
import { formatMoney } from '../lib/format';

const ACCENTS = ['#C8A96A', '#D9A6A0', '#9CAE9C', '#B08968', '#A78BFA', '#2B2B2B'];

export function Settings() {
  const { settings, updateSettings, resetDemo, pushToast } = useApp();

  function field<K extends keyof typeof settings>(key: K) {
    return (value: (typeof settings)[K]) =>
      updateSettings({ [key]: value } as Partial<typeof settings>);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4 sm:px-6 sm:pt-8">
      <div className="mb-5">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-champagne-dark">
          Branding
        </p>
        <h1 className="font-display text-4xl text-charcoal">Settings</h1>
        <p className="mt-1 text-charcoal/55">
          Your brand flows into every auto-sent invoice.
        </p>
      </div>

      <div className="space-y-5">
        {/* Brand preview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex items-center gap-4 p-5"
        >
          <div
            className="grid h-16 w-16 place-items-center rounded-2xl font-display text-2xl text-white shadow-glow"
            style={{
              background: `linear-gradient(135deg, ${settings.accentColor}, #A8884B)`,
            }}
          >
            {settings.logoInitials || '✦'}
          </div>
          <div>
            <p className="font-display text-2xl text-charcoal">
              {settings.businessName || 'Your studio'}
            </p>
            <p className="text-sm text-charcoal/50">
              Invoices due net {settings.paymentTermsDays} days · tax{' '}
              {settings.taxRate}%
            </p>
          </div>
        </motion.div>

        <Section title="Business">
          <Group>
            <Field label="Business name">
              <input
                className="input"
                value={settings.businessName}
                onChange={(e) => field('businessName')(e.target.value)}
              />
            </Field>
            <Field label="Your name">
              <input
                className="input"
                value={settings.ownerName}
                onChange={(e) => field('ownerName')(e.target.value)}
              />
            </Field>
          </Group>
          <Group>
            <Field label="Logo initials">
              <input
                className="input"
                maxLength={3}
                value={settings.logoInitials}
                onChange={(e) =>
                  field('logoInitials')(e.target.value.toUpperCase())
                }
              />
            </Field>
            <Field label="Currency">
              <select
                className="input"
                value={settings.currency}
                onChange={(e) => field('currency')(e.target.value)}
              >
                {['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </Group>
          <Group>
            <Field label="Email">
              <input
                className="input"
                value={settings.email}
                onChange={(e) => field('email')(e.target.value)}
              />
            </Field>
            <Field label="Phone">
              <input
                className="input"
                value={settings.phone}
                onChange={(e) => field('phone')(e.target.value)}
              />
            </Field>
          </Group>
        </Section>

        <Section title="Accent color" icon={<Palette className="h-4 w-4" />}>
          <div className="flex flex-wrap items-center gap-3">
            {ACCENTS.map((c) => (
              <button
                key={c}
                onClick={() => field('accentColor')(c)}
                className="relative h-11 w-11 rounded-2xl shadow-card transition active:scale-90"
                style={{ background: c }}
                aria-label={`Accent ${c}`}
              >
                {settings.accentColor === c && (
                  <Check className="absolute inset-0 m-auto h-5 w-5 text-white" />
                )}
              </button>
            ))}
            <label className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-charcoal/10 bg-white/70 px-3 text-sm text-charcoal/60">
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => field('accentColor')(e.target.value)}
                className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              Custom
            </label>
          </div>
        </Section>

        <Section title="Invoicing">
          <Group>
            <Field label="Payment terms (days)">
              <input
                className="input"
                type="number"
                min={0}
                value={settings.paymentTermsDays}
                onChange={(e) =>
                  field('paymentTermsDays')(Number(e.target.value) || 0)
                }
              />
            </Field>
            <Field label="Tax rate (%)">
              <input
                className="input"
                type="number"
                min={0}
                step={0.1}
                value={settings.taxRate}
                onChange={(e) =>
                  field('taxRate')(Number(e.target.value) || 0)
                }
              />
            </Field>
          </Group>
          <Field label="Invoice thank-you message">
            <textarea
              className="input min-h-[80px] resize-none"
              value={settings.invoiceMessage}
              onChange={(e) => field('invoiceMessage')(e.target.value)}
            />
          </Field>
          <p className="text-xs text-charcoal/45">
            Example: a {formatMoney(4500, settings.currency)} package becomes a{' '}
            {formatMoney(
              4500 * (1 + settings.taxRate / 100),
              settings.currency,
            )}{' '}
            invoice after tax.
          </p>
        </Section>

        <div className="card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-xl text-charcoal">Demo data</h3>
            <p className="text-sm text-charcoal/50">
              Restore the original sample shoots and invoices.
            </p>
          </div>
          <button
            onClick={() => {
              resetDemo();
              pushToast({
                emoji: '✨',
                tone: 'info',
                title: 'Settings saved',
              });
            }}
            className="btn-ghost"
          >
            <RotateCcw className="h-4 w-4" /> Reset demo
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="card p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-xl text-charcoal">
        {icon}
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Group({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
