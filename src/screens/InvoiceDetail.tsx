import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BellRing,
  Check,
  Copy,
  Lock,
  Mail,
  MessageSquare,
  QrCode,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { SHOOT_TYPE_DETAILS } from '../lib/invoices';
import {
  formatDate,
  formatLongDate,
  formatMoney,
  formatTime,
} from '../lib/format';
import { StatusPill } from '../components/StatusPill';
import { Confetti } from '../components/Confetti';

type PayState = 'idle' | 'processing' | 'done';

export function InvoiceDetail({
  invoiceId,
  onBack,
}: {
  invoiceId: string;
  onBack: () => void;
}) {
  const { data, settings, payInvoice, sendReminderFor, now } = useApp();
  const invoice = data.invoices.find((i) => i.id === invoiceId);

  const [payState, setPayState] = useState<PayState>('idle');
  const [confetti, setConfetti] = useState(false);
  const [copied, setCopied] = useState(false);
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [showQr, setShowQr] = useState(false);

  const payLink = useMemo(
    () =>
      invoice
        ? `https://pay.shutterpay.app/i/${invoice.number.toLowerCase()}`
        : '',
    [invoice],
  );

  if (!invoice) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="font-display text-2xl text-charcoal">Invoice not found</p>
        <button onClick={onBack} className="btn-ghost mt-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>
    );
  }

  const detail = SHOOT_TYPE_DETAILS[invoice.shootType];
  const isPaid = invoice.status === 'Paid' || payState === 'done';

  const handlePay = () => {
    if (isPaid) return;
    setPayState('processing');
    window.setTimeout(() => {
      payInvoice(invoice.id);
      setPayState('done');
      setConfetti(true);
      window.setTimeout(() => setConfetti(false), 3500);
    }, 2200);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(payLink);
    } catch {
      /* clipboard blocked — ignore in demo */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const messagePreview =
    channel === 'email'
      ? `Hi ${invoice.clientName}, thank you for letting ${settings.businessName} capture your ${invoice.shootType.toLowerCase()}! Your invoice ${invoice.number} for ${formatMoney(invoice.amountDue, settings.currency)} is ready. Pay securely here: ${payLink}`
      : `${settings.businessName}: Your ${invoice.shootType.toLowerCase()} invoice (${formatMoney(invoice.amountDue, settings.currency)}) is ready 💛 Pay here: ${payLink}`;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4 sm:px-6 sm:pt-8">
      {confetti && <Confetti />}

      <div className="mb-5 flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost px-4 py-2 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <StatusPill status={isPaid ? 'Paid' : invoice.status} />
          <button
            onClick={copyLink}
            className="btn-ghost px-3 py-2 text-sm"
            aria-label="Share invoice link"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {copied ? 'Copied' : 'Share'}
            </span>
          </button>
        </div>
      </div>

      {/* The stationery-style invoice card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 24 }}
        className="relative overflow-hidden rounded-4xl border border-white/70 bg-white shadow-lift"
      >
        {/* Letterhead */}
        <div
          className="relative px-6 py-8 text-center sm:px-10 sm:py-10"
          style={{
            background:
              'linear-gradient(135deg, rgba(200,169,106,0.12), rgba(217,166,160,0.14))',
          }}
        >
          {isPaid && (
            <motion.div
              initial={{ scale: 0.4, opacity: 0, rotate: -18 }}
              animate={{ scale: 1, opacity: 1, rotate: -14 }}
              transition={{ type: 'spring', stiffness: 220, damping: 14 }}
              className="absolute right-5 top-5 rounded-xl border-2 border-emerald-500/70 px-3 py-1 font-display text-lg uppercase tracking-widest text-emerald-600/80 sm:right-8 sm:top-8"
            >
              Paid
            </motion.div>
          )}
          <div
            className="mx-auto grid h-16 w-16 place-items-center rounded-2xl font-display text-2xl text-white shadow-glow"
            style={{
              background: `linear-gradient(135deg, ${settings.accentColor}, #A8884B)`,
            }}
          >
            {settings.logoInitials}
          </div>
          <h2 className="mt-4 font-display text-3xl text-charcoal">
            {settings.businessName}
          </h2>
          <p className="mt-1 text-sm text-charcoal/50">
            {settings.email} · {settings.phone}
          </p>
        </div>

        <div className="px-6 py-7 sm:px-10 sm:py-9">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-charcoal/40">
                Invoice
              </p>
              <p className="font-display text-2xl text-charcoal">
                {invoice.number}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-charcoal/40">
                Billed to
              </p>
              <p className="font-medium text-charcoal">{invoice.clientName}</p>
              {invoice.clientEmail && (
                <p className="text-sm text-charcoal/50">
                  {invoice.clientEmail}
                </p>
              )}
            </div>
          </div>

          {/* Shoot summary */}
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-ivory px-4 py-3">
            <span className="text-2xl">{detail.emoji}</span>
            <div>
              <p className="font-medium text-charcoal">
                {invoice.shootType} photography
              </p>
              <p className="text-sm text-charcoal/50">
                {formatLongDate(invoice.shootDate)} ·{' '}
                {formatTime(invoice.shootDate)}
                {invoice.location ? ` · ${invoice.location}` : ''}
              </p>
            </div>
          </div>

          {/* Line items */}
          <div className="mt-6 divide-y divide-charcoal/5">
            {invoice.lineItems.map((li, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span className="text-charcoal/80">{li.label}</span>
                <span className="font-medium text-charcoal">
                  {formatMoney(li.amount, settings.currency)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 space-y-2 border-t border-charcoal/5 pt-4 text-sm">
            <Row
              label="Subtotal"
              value={formatMoney(invoice.subtotal, settings.currency)}
            />
            {invoice.taxRate > 0 && (
              <Row
                label={`Tax (${invoice.taxRate}%)`}
                value={formatMoney(invoice.taxAmount, settings.currency)}
              />
            )}
            {invoice.depositPaid > 0 && (
              <Row
                label="Deposit paid"
                value={`– ${formatMoney(invoice.depositPaid, settings.currency)}`}
                muted
              />
            )}
            <div className="flex items-center justify-between border-t border-charcoal/10 pt-3">
              <span className="font-display text-lg text-charcoal">
                {isPaid ? 'Total paid' : 'Amount due'}
              </span>
              <span className="font-display text-2xl text-charcoal">
                {formatMoney(
                  isPaid ? invoice.total : invoice.amountDue,
                  settings.currency,
                )}
              </span>
            </div>
            {invoice.dueAt && !isPaid && (
              <p className="pt-1 text-right text-xs text-charcoal/45">
                Due {formatDate(invoice.dueAt)} · Terms net{' '}
                {settings.paymentTermsDays} days
              </p>
            )}
          </div>

          {/* Message */}
          <p className="mt-6 rounded-2xl bg-rose-soft/40 px-4 py-3 text-center font-serif text-lg italic text-charcoal/70">
            {invoice.message}
          </p>

          {/* Pay action */}
          <div className="mt-6">
            {isPaid ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 py-4 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
                <span className="font-medium">
                  Paid{invoice.paidAt ? ` on ${formatDate(invoice.paidAt)}` : ''}{' '}
                  — thank you!
                </span>
              </div>
            ) : (
              <PayButton state={payState} onPay={handlePay} amount={
                formatMoney(invoice.amountDue, settings.currency)
              } />
            )}
            {!isPaid && (
              <p className="mt-2 flex items-center justify-center gap-1 text-xs text-charcoal/40">
                <Lock className="h-3 w-3" /> Secured checkout · powered by
                ShutterPay
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Share / QR / reminder tools */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-xl text-charcoal">
              Shareable pay link
            </h3>
            <button
              onClick={() => setShowQr((v) => !v)}
              className="btn-ghost px-3 py-1.5 text-xs"
            >
              <QrCode className="h-4 w-4" /> {showQr ? 'Hide' : 'QR'}
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-ivory px-3 py-2.5">
            <span className="truncate text-sm text-charcoal/60">{payLink}</span>
            <button
              onClick={copyLink}
              className="ml-auto shrink-0 rounded-lg p-1.5 text-charcoal/40 hover:bg-white hover:text-charcoal"
              aria-label="Copy link"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          <AnimatePresence>
            {showQr && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 flex flex-col items-center gap-2">
                  <div className="rounded-2xl bg-white p-3 shadow-card">
                    <QRCodeSVG
                      value={payLink}
                      size={148}
                      fgColor="#2B2B2B"
                      bgColor="#ffffff"
                      level="M"
                    />
                  </div>
                  <p className="text-xs text-charcoal/45">
                    Show the couple — they can pay on the spot.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Message preview mock */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-xl text-charcoal">
              Message preview
            </h3>
            <div className="flex rounded-full bg-ivory p-0.5">
              <ChannelBtn
                active={channel === 'email'}
                onClick={() => setChannel('email')}
                icon={<Mail className="h-3.5 w-3.5" />}
                label="Email"
              />
              <ChannelBtn
                active={channel === 'sms'}
                onClick={() => setChannel('sms')}
                icon={<MessageSquare className="h-3.5 w-3.5" />}
                label="SMS"
              />
            </div>
          </div>
          <div className="rounded-2xl bg-ivory p-4">
            <p className="text-xs font-medium text-charcoal/40">
              To: {invoice.clientEmail || invoice.clientName}
            </p>
            {channel === 'email' && (
              <p className="mt-1 text-sm font-medium text-charcoal">
                Your invoice from {settings.businessName}
              </p>
            )}
            <p className="mt-2 text-sm leading-relaxed text-charcoal/70">
              {messagePreview}
            </p>
          </div>
          {invoice.status === 'Overdue' && (
            <button
              onClick={() => sendReminderFor(invoice.id)}
              className="btn-primary mt-3 w-full"
            >
              <BellRing className="h-4 w-4" /> Send payment reminder
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-charcoal/35">
        {invoice.autoSent
          ? `Auto-sent by ShutterPay when the shoot wrapped at ${formatTime(invoice.issuedAt ?? invoice.createdAt)}.`
          : `Created ${formatDate(invoice.createdAt)}.`}{' '}
        Viewed at {formatTime(new Date(now).toISOString())}.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-charcoal/50">{label}</span>
      <span className={muted ? 'text-charcoal/50' : 'text-charcoal'}>
        {value}
      </span>
    </div>
  );
}

function ChannelBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
        active ? 'bg-white text-charcoal shadow-card' : 'text-charcoal/45'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function PayButton({
  state,
  onPay,
  amount,
}: {
  state: PayState;
  onPay: () => void;
  amount: string;
}) {
  return (
    <button
      onClick={onPay}
      disabled={state === 'processing'}
      className="btn-primary w-full overflow-hidden py-4 text-base"
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === 'processing' ? (
          <motion.span
            key="processing"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2"
          >
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Processing payment…
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2"
          >
            <Lock className="h-4 w-4" /> Pay {amount} now
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
