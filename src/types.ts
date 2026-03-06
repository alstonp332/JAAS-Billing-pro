import { Type } from "@google/genai";

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'part payment' | 'full payment';

export interface NotificationPreferences {
  paymentReminders: boolean;
  newInvoiceAlerts: boolean;
  overdueAlerts: boolean;
  weeklySummary: boolean;
  deliveryMethods: {
    email: boolean;
    inApp: boolean;
  };
}

export interface UserProfile {
  businessName: string;
  email: string;
  address: string;
  logoUrl?: string;
  phone?: string;
  website?: string;
  currency: string;
  notificationPreferences: NotificationPreferences;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  date: string;
  read: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  address: string;
  totalBilled: number;
}

export interface PricingAnalysis {
  id: string;
  itemName: string;
  currentRate: number;
  suggestedRate: number;
  marketAverage: number;
  reasoning: string;
  potentialRevenueIncrease: number;
}

export interface CashflowData {
  month: string;
  income: number;
  expenses: number;
  forecast: number;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  date: string;
  dueDate: string;
  paymentTerms: string;
  from: string;
  customerId: string;
  billTo: string;
  shipTo: string;
  items: InvoiceItem[];
  notes: string;
  terms: string;
  taxRate: number;
  amountPaid: number;
  discount: number;
  shipping: number;
  currency: string;
}

export interface SmartInsight {
  id: string;
  type: 'optimization' | 'warning' | 'history';
  title: string;
  description: string;
  actionText?: string;
  suggestion?: string;
}

export const INSIGHT_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ['optimization', 'warning', 'history'] },
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      actionText: { type: Type.STRING },
      suggestion: { type: Type.STRING }
    },
    required: ['type', 'title', 'description']
  }
};
