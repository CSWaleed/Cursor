import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  FastForward,
  FileText,
  Home,
  Plus,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { Dashboard } from './screens/Dashboard';
import { Planner } from './screens/Planner';
import { Invoices } from './screens/Invoices';
import { InvoiceDetail } from './screens/InvoiceDetail';
import { Settings } from './screens/Settings';
import { AddShootModal } from './components/AddShootModal';
import { Toaster } from './components/Toaster';

type Tab = 'dashboard' | 'planner' | 'invoices' | 'settings';
type Route = { name: Tab } | { name: 'invoice'; id: string };

const NAV: { id: Tab; label: string; Icon: typeof Home }[] = [
  { id: 'dashboard', label: 'Today', Icon: Home },
  { id: 'planner', label: 'Planner', Icon: CalendarDays },
  { id: 'invoices', label: 'Invoices', Icon: FileText },
  { id: 'settings', label: 'Settings', Icon: SettingsIcon },
];

function Shell() {
  const { settings, viewInvoice, fastForwardToNextWrap } = useApp();
  const [route, setRoute] = useState<Route>({ name: 'dashboard' });
  const [lastTab, setLastTab] = useState<Tab>('dashboard');
  const [addOpen, setAddOpen] = useState(false);

  const go = useCallback((tab: Tab) => {
    setLastTab(tab);
    setRoute({ name: tab });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openInvoice = useCallback(
    (id: string) => {
      viewInvoice(id);
      setRoute({ name: 'invoice', id });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [viewInvoice],
  );

  const back = useCallback(() => {
    setRoute({ name: lastTab });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [lastTab]);

  const activeTab: Tab | null = route.name === 'invoice' ? null : route.name;

  return (
    <div className="grain min-h-[100dvh]">
      <Toaster onOpenInvoice={openInvoice} />

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-charcoal/5 bg-ivory/80 backdrop-blur-md safe-top">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={() => go('dashboard')}
            className="flex items-center gap-2.5"
          >
            <span
              className="grid h-9 w-9 place-items-center rounded-xl font-display text-base text-white shadow-glow"
              style={{
                background: `linear-gradient(135deg, ${settings.accentColor}, #A8884B)`,
              }}
            >
              {settings.logoInitials || '✦'}
            </span>
            <span className="font-display text-xl tracking-tight text-charcoal">
              ShutterPay
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => go(n.id)}
                className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === n.id
                    ? 'text-charcoal'
                    : 'text-charcoal/45 hover:text-charcoal/80'
                }`}
              >
                {activeTab === n.id && (
                  <motion.span
                    layoutId="navPill"
                    className="absolute inset-0 rounded-full bg-white shadow-card"
                    transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                  />
                )}
                <span className="relative">{n.label}</span>
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => fastForwardToNextWrap()}
              className="hidden items-center gap-1.5 rounded-full bg-charcoal/5 px-3 py-2 text-xs font-medium text-charcoal/60 transition hover:bg-charcoal/10 sm:flex"
              title="Jump to the next shoot's end so you can watch an invoice auto-send"
            >
              <FastForward className="h-3.5 w-3.5" /> Fast-forward
            </button>
            <button
              onClick={() => setAddOpen(true)}
              className="btn-primary px-4 py-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add shoot</span>
            </button>
          </div>
        </div>
      </header>

      {/* Screens */}
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={route.name === 'invoice' ? `invoice-${route.id}` : route.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {route.name === 'dashboard' && (
              <Dashboard
                onAddShoot={() => setAddOpen(true)}
                onOpenInvoice={openInvoice}
                onGoPlanner={() => go('planner')}
              />
            )}
            {route.name === 'planner' && (
              <Planner
                onAddShoot={() => setAddOpen(true)}
                onOpenInvoice={openInvoice}
              />
            )}
            {route.name === 'invoices' && (
              <Invoices onOpenInvoice={openInvoice} />
            )}
            {route.name === 'settings' && <Settings />}
            {route.name === 'invoice' && (
              <InvoiceDetail invoiceId={route.id} onBack={back} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-charcoal/5 bg-ivory/90 backdrop-blur-md safe-bottom md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
          {NAV.slice(0, 2).map((n) => (
            <NavButton
              key={n.id}
              {...n}
              active={activeTab === n.id}
              onClick={() => go(n.id)}
            />
          ))}
          <button
            onClick={() => setAddOpen(true)}
            className="btn-primary -mt-6 h-14 w-14 rounded-full p-0 shadow-lift"
            aria-label="Add shoot"
          >
            <Plus className="h-6 w-6" />
          </button>
          {NAV.slice(2).map((n) => (
            <NavButton
              key={n.id}
              {...n}
              active={activeTab === n.id}
              onClick={() => go(n.id)}
            />
          ))}
        </div>
      </nav>

      <AddShootModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function NavButton({
  label,
  Icon,
  active,
  onClick,
}: {
  label: string;
  Icon: typeof Home;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-16 flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-medium transition-colors ${
        active ? 'text-champagne-dark' : 'text-charcoal/40'
      }`}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
      {label}
    </button>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
