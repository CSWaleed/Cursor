import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AppData, Invoice, Settings, Shoot, ShootType } from '../types';
import {
  applyOverdue,
  findShootsToInvoice,
  generateInvoice,
  markPaid,
  markViewed,
  sendReminder,
  SHOOT_TYPE_DETAILS,
} from '../lib/invoices';
import { formatMoney } from '../lib/format';
import * as storage from '../lib/storage';

export interface Toast {
  id: string;
  title: string;
  body?: string;
  emoji?: string;
  tone?: 'success' | 'info';
  invoiceId?: string;
}

export interface ShootInput {
  clientName: string;
  clientEmail: string;
  type: ShootType;
  location: string;
  start: string;
  end: string;
  price: number;
  depositPaid: number;
  notes?: string;
}

interface AppContextValue {
  data: AppData;
  settings: Settings;
  now: number;
  toasts: Toast[];
  addShoot: (input: ShootInput) => Shoot;
  updateShoot: (id: string, patch: Partial<Shoot>) => void;
  deleteShoot: (id: string) => void;
  payInvoice: (id: string) => void;
  viewInvoice: (id: string) => void;
  sendReminderFor: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  fastForwardToNextWrap: () => boolean;
  simulateEndOfShoot: (shootId: string) => void;
  resetDemo: () => void;
  pushToast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

let idCounter = 0;
function uid(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => storage.load(Date.now()));
  const [now, setNow] = useState<number>(
    () => Date.now() + (data.clockOffset ?? 0),
  );
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dataRef = useRef(data);
  dataRef.current = data;

  // Apply the persisted accent color to the document.
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--accent',
      data.settings.accentColor,
    );
  }, [data.settings.accentColor]);

  // Persist on every change.
  useEffect(() => {
    storage.save(data);
  }, [data]);

  // The ticking clock — real time plus any simulated offset.
  useEffect(() => {
    const tick = () =>
      setNow(Date.now() + (dataRef.current.clockOffset ?? 0));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const pushToast = useCallback((t: Omit<Toast, 'id'>) => {
    const toast: Toast = { id: uid('toast'), tone: 'success', ...t };
    setToasts((prev) => [...prev, toast]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== toast.id));
    }, 6500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  /**
   * The auto-invoice engine. Polls on every clock tick: any shoot whose end
   * time has passed and that hasn't been invoiced gets a fresh "Sent" invoice,
   * and any open invoice past its due date flips to "Overdue".
   */
  useEffect(() => {
    const current = dataRef.current;
    const due = findShootsToInvoice(current.shoots, now);
    const overdueApplied = applyOverdue(current.invoices, now);
    const overdueChanged = overdueApplied !== current.invoices;

    if (due.length === 0 && !overdueChanged) return;

    // Compute everything up front so the state updater stays pure and toasts
    // fire exactly once (React may double-invoke updaters in StrictMode).
    let seq = current.invoiceSeq;
    const newInvoices: Invoice[] = [];
    const invoicedIds = new Set<string>();

    for (const shoot of due) {
      const invoice = generateInvoice({
        shoot,
        settings: current.settings,
        seq,
        now,
        autoSent: true,
      });
      seq += 1;
      newInvoices.push(invoice);
      invoicedIds.add(shoot.id);
    }

    const shoots = current.shoots.map((s) =>
      invoicedIds.has(s.id)
        ? {
            ...s,
            invoiced: true,
            invoiceId: newInvoices.find((i) => i.shootId === s.id)?.id,
          }
        : s,
    );

    const withOverdue = applyOverdue(
      [...current.invoices, ...newInvoices],
      now,
    );

    setData((prev) => ({
      ...prev,
      shoots,
      invoices: withOverdue,
      invoiceSeq: seq,
    }));

    for (const invoice of newInvoices) {
      pushToast({
        emoji: '📸',
        title: `Shoot with ${invoice.clientName} wrapped`,
        body: `Invoice ${invoice.number} for ${formatMoney(
          invoice.amountDue,
          current.settings.currency,
        )} auto-sent.`,
        invoiceId: invoice.id,
      });
    }
  }, [now, pushToast]);

  const addShoot = useCallback((input: ShootInput): Shoot => {
    const shoot: Shoot = {
      id: uid('shoot'),
      ...input,
      invoiced: false,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, shoots: [...prev.shoots, shoot] }));
    return shoot;
  }, []);

  const updateShoot = useCallback((id: string, patch: Partial<Shoot>) => {
    setData((prev) => ({
      ...prev,
      shoots: prev.shoots.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, []);

  const deleteShoot = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      shoots: prev.shoots.filter((s) => s.id !== id),
      invoices: prev.invoices.filter((i) => i.shootId !== id),
    }));
  }, []);

  const payInvoice = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        invoices: prev.invoices.map((i) =>
          i.id === id ? markPaid(i, now) : i,
        ),
      }));
    },
    [now],
  );

  const viewInvoice = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        invoices: prev.invoices.map((i) =>
          i.id === id ? markViewed(i, now) : i,
        ),
      }));
    },
    [now],
  );

  const sendReminderFor = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        invoices: prev.invoices.map((i) =>
          i.id === id ? sendReminder(i, prev.settings, now) : i,
        ),
      }));
      const inv = dataRef.current.invoices.find((i) => i.id === id);
      pushToast({
        emoji: '✉️',
        tone: 'info',
        title: 'Reminder sent',
        body: inv
          ? `A friendly nudge went out to ${inv.clientName}.`
          : 'Reminder on its way.',
      });
    },
    [now, pushToast],
  );

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const fastForwardToNextWrap = useCallback((): boolean => {
    const current = dataRef.current;
    const upcoming = current.shoots
      .filter((s) => !s.invoiced && new Date(s.end).getTime() > now)
      .sort((a, b) => new Date(a.end).getTime() - new Date(b.end).getTime());
    const target = upcoming[0];
    if (!target) return false;
    const targetTime = new Date(target.end).getTime() + 1500;
    const offset = targetTime - Date.now();
    setData((prev) => ({ ...prev, clockOffset: offset }));
    setNow(Date.now() + offset);
    const { emoji } = SHOOT_TYPE_DETAILS[target.type];
    pushToast({
      emoji: '⏩',
      tone: 'info',
      title: 'Fast-forwarding to the next wrap…',
      body: `${emoji} ${target.clientName}'s shoot is ending now.`,
    });
    return true;
  }, [now, pushToast]);

  const simulateEndOfShoot = useCallback((shootId: string) => {
    setData((prev) => ({
      ...prev,
      shoots: prev.shoots.map((s) =>
        s.id === shootId
          ? { ...s, end: new Date(now - 1000).toISOString() }
          : s,
      ),
    }));
  }, [now]);

  const resetDemo = useCallback(() => {
    const fresh = storage.reset(Date.now());
    setData(fresh);
    setNow(Date.now());
    setToasts([]);
    pushToast({
      emoji: '✨',
      tone: 'info',
      title: 'Demo reset',
      body: 'Fresh sample shoots are ready to go.',
    });
  }, [pushToast]);

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      settings: data.settings,
      now,
      toasts,
      addShoot,
      updateShoot,
      deleteShoot,
      payInvoice,
      viewInvoice,
      sendReminderFor,
      updateSettings,
      fastForwardToNextWrap,
      simulateEndOfShoot,
      resetDemo,
      pushToast,
      dismissToast,
    }),
    [
      data,
      now,
      toasts,
      addShoot,
      updateShoot,
      deleteShoot,
      payInvoice,
      viewInvoice,
      sendReminderFor,
      updateSettings,
      fastForwardToNextWrap,
      simulateEndOfShoot,
      resetDemo,
      pushToast,
      dismissToast,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
