import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useApp } from '../store/AppContext';

export function Toaster({
  onOpenInvoice,
}: {
  onOpenInvoice: (id: string) => void;
}) {
  const { toasts, dismissToast } = useApp();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex flex-col items-center gap-2 px-3 safe-top sm:top-5">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-lift backdrop-blur-md"
          >
            <div className="flex items-start gap-3 p-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-champagne/15 text-lg">
                {t.emoji ?? '📸'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-charcoal">
                  {t.title}
                </p>
                {t.body && (
                  <p className="mt-0.5 text-xs leading-snug text-charcoal/60">
                    {t.body}
                  </p>
                )}
                {t.invoiceId && (
                  <button
                    onClick={() => {
                      onOpenInvoice(t.invoiceId!);
                      dismissToast(t.id);
                    }}
                    className="mt-2 text-xs font-semibold text-champagne-dark underline-offset-2 hover:underline"
                  >
                    View invoice →
                  </button>
                )}
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                className="rounded-lg p-1 text-charcoal/30 transition-colors hover:bg-charcoal/5 hover:text-charcoal/60"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <motion.div
              className="h-0.5 bg-gradient-to-r from-champagne to-rose"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 6.5, ease: 'linear' }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
