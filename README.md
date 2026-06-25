# ShutterPay 📸

**Get paid the day you shoot.**

ShutterPay is an automated invoicing tool built for wedding & portrait photographers who live in the field and forget to send invoices. Plan your shoots at the start of the day — the moment a shoot's end time passes, ShutterPay automatically generates and "sends" a branded invoice with a pay link, so you get paid the same day instead of days later.

> Built as a polished, demo-ready PWA: editorial wedding-photography aesthetic, smooth animations everywhere, and a one-tap "watch the automation happen" demo.

## ✨ Highlights

- **Dashboard — "Today's Shoots"** — warm greeting, live stats (shoots today, revenue scheduled, invoices auto-sent, amount collected), and a ticking **"next shoot wraps in 2h 14m → invoice auto-sends"** countdown card.
- **Auto-invoice engine** — a timer polls every second; when a shoot ends it generates a `Sent` invoice and fires a toast (`📸 Shoot with Sarah & Tom wrapped — invoice for $3,000 auto-sent!`). Use **Simulate end of shoot** or **Fast-forward time** to see it live.
- **Day & Week planner** — beautiful slide-up "Add Shoot" modal with quick presets (e.g. _Full-Day Wedding — $4,500_), client, location, times, package price, deposit, and notes.
- **Invoices** — filterable by status with elegant status pills (Draft / Scheduled / Sent / Viewed / Paid / Overdue).
- **Public invoice view** — a stationery-style invoice card with a Stripe-style checkout: a fake processing animation, then a **confetti** celebration + "Paid!" state that updates every dashboard stat.
- **Settings / Branding** — business name, logo initials, accent color, payment terms, tax rate, and thank-you message. Auto-invoices inherit all of it.
- **Bonus** — overdue auto-flagging + "Send reminder", animated revenue analytics, **QR code** + shareable pay link, and an email/SMS message preview mock.

## 🎨 Design

Editorial, romantic, premium — soft ivory (`#FBF8F4`), champagne gold (`#C8A96A`), deep charcoal (`#2B2B2B`), dusty rose (`#D9A6A0`). Cormorant Garamond / Playfair Display serif headings paired with Inter, generous whitespace, soft film grain, rounded cards, and framer-motion transitions throughout. Mobile-first with a thumb-reachable "Add shoot" button, beautiful on desktop.

## 🧱 Tech stack

- **React 19 + TypeScript + Vite**
- **Tailwind CSS** for styling
- **framer-motion** for animation
- **lucide-react** icons, **date-fns** time handling, **qrcode.react** for pay QR codes
- **vite-plugin-pwa** — installable, offline-capable PWA
- **localStorage** persistence behind a clean data layer that could swap to an API later

## 🏗️ Architecture

Business logic lives in pure, testable functions separate from the UI:

```
src/
  types.ts                 # Shoot, Invoice, Client, Settings, AppData
  lib/
    invoices.ts            # pure logic: invoice generation, status transitions,
                           #   auto-send checks, overdue rules, stats (no I/O)
    seed.ts                # lively first-run sample data anchored to "now"
    storage.ts             # localStorage data layer (the only place I/O lives)
    format.ts              # money / date / countdown formatting
    presets.ts             # quick-add shoot presets
  store/AppContext.tsx     # state, persistence, the ticking clock + auto-invoice engine
  components/              # StatusPill, Confetti, Toaster, AddShootModal, RevenueChart
  screens/                 # Dashboard, Planner, Invoices, InvoiceDetail, Settings
```

The simulated **clock** (real time + a persisted offset) powers both the countdown and the "Fast-forward time" demo, so the auto-invoice engine reacts exactly as it would in production.

## 🚀 Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
npm run lint     # oxlint
```

On first load the app seeds itself with realistic sample shoots — one already wrapped & paid, one ending in a few minutes, and upcoming sessions — so the dashboard looks alive immediately. Reset anytime from **Settings → Reset demo**.
