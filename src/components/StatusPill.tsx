import {
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Send,
  TriangleAlert,
} from 'lucide-react';
import type { InvoiceStatus } from '../types';

const STYLES: Record<
  InvoiceStatus,
  { bg: string; text: string; dot: string; Icon: typeof Clock }
> = {
  Draft: {
    bg: 'bg-charcoal/5',
    text: 'text-charcoal/60',
    dot: 'bg-charcoal/40',
    Icon: FileText,
  },
  Scheduled: {
    bg: 'bg-sage/15',
    text: 'text-sage',
    dot: 'bg-sage',
    Icon: Clock,
  },
  Sent: {
    bg: 'bg-champagne/15',
    text: 'text-champagne-dark',
    dot: 'bg-champagne',
    Icon: Send,
  },
  Viewed: {
    bg: 'bg-rose/20',
    text: 'text-rose',
    dot: 'bg-rose',
    Icon: Eye,
  },
  Paid: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    Icon: CheckCircle2,
  },
  Overdue: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    dot: 'bg-red-500',
    Icon: TriangleAlert,
  },
};

export function StatusPill({
  status,
  withIcon = true,
}: {
  status: InvoiceStatus;
  withIcon?: boolean;
}) {
  const s = STYLES[status];
  return (
    <span className={`pill ${s.bg} ${s.text}`}>
      {withIcon ? (
        <s.Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      ) : (
        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      )}
      {status}
    </span>
  );
}
