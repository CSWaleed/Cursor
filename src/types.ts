export type ShootType = 'Wedding' | 'Engagement' | 'Elopement' | 'Portrait';

export type InvoiceStatus =
  | 'Draft'
  | 'Scheduled'
  | 'Sent'
  | 'Viewed'
  | 'Paid'
  | 'Overdue';

export interface Client {
  id: string;
  name: string;
  email: string;
}

export interface Shoot {
  id: string;
  clientName: string;
  clientEmail: string;
  type: ShootType;
  location: string;
  /** ISO timestamp */
  start: string;
  /** ISO timestamp */
  end: string;
  price: number;
  depositPaid: number;
  notes?: string;
  /** true once an invoice has been generated for this shoot */
  invoiced: boolean;
  invoiceId?: string;
  createdAt: string;
}

export interface InvoiceLineItem {
  label: string;
  amount: number;
}

export interface Invoice {
  id: string;
  number: string;
  shootId: string;
  clientName: string;
  clientEmail: string;
  shootType: ShootType;
  location: string;
  shootDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  depositPaid: number;
  total: number;
  amountDue: number;
  status: InvoiceStatus;
  message: string;
  createdAt: string;
  issuedAt?: string;
  dueAt?: string;
  viewedAt?: string;
  paidAt?: string;
  /** true when produced by the auto-invoice engine rather than by hand */
  autoSent: boolean;
}

export interface Settings {
  businessName: string;
  ownerName: string;
  logoInitials: string;
  accentColor: string;
  paymentTermsDays: number;
  taxRate: number;
  invoiceMessage: string;
  email: string;
  phone: string;
  currency: string;
}

export interface AppData {
  shoots: Shoot[];
  invoices: Invoice[];
  settings: Settings;
  /** ms offset added to the real clock so demos can fast-forward time */
  clockOffset: number;
  seededAt: string;
  invoiceSeq: number;
}
