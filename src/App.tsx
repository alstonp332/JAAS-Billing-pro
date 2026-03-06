/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Download, 
  Send, 
  Settings, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  History, 
  Image as ImageIcon,
  X,
  ChevronDown,
  MapPin,
  CheckCircle2,
  Users,
  FileText,
  LayoutDashboard,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Printer,
  Receipt,
  Search,
  Bell,
  Facebook,
  Youtube,
  PlayCircle,
  DollarSign,
  BarChart3,
  User,
  Globe,
  Trash2,
  Save,
  Upload,
  MessageCircle,
  ShieldCheck,
  FileLock,
  Cookie
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  InvoiceData, 
  InvoiceItem, 
  SmartInsight, 
  Customer, 
  InvoiceStatus, 
  Notification, 
  UserProfile, 
  PricingAnalysis, 
  CashflowData 
} from './types';
import { generateSmartInsights, analyzePricing, forecastCashflow } from './services/geminiService';

type View = 'dashboard' | 'editor' | 'preview' | 'customers' | 'cashflow' | 'pricing' | 'settings' | 'profile' | 'legal';
type LegalPage = 'terms' | 'privacy' | 'cookies';

const CURRENCIES = [
  { code: 'SLE', symbol: 'Le', name: 'Sierra Leone Leone' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
];
const initialCustomers: Customer[] = [
  { id: 'c1', name: 'Acme Corp', email: 'billing@acme.com', address: '123 Industrial Way, CA', totalBilled: 4500 },
  { id: 'c2', name: 'Global Tech', email: 'finance@globaltech.io', address: '456 Innovation Blvd, NY', totalBilled: 12000 },
  { id: 'c3', name: 'Local Bakery', email: 'hello@localbakery.com', address: '789 Main St, TX', totalBilled: 850 }
];

const initialInvoices: InvoiceData[] = [
  {
    id: 'inv1',
    invoiceNumber: 'INV-001',
    status: 'paid',
    date: '2024-03-01',
    dueDate: '2024-03-15',
    paymentTerms: 'Net 15',
    from: 'My Small Business LLC\n123 My St, City, ST 12345',
    customerId: 'c1',
    billTo: 'Acme Corp\n123 Industrial Way, CA',
    shipTo: '',
    items: [{ id: 'i1', description: 'Web Design Services', quantity: 1, rate: 2500 }],
    notes: 'Thank you for your business!',
    terms: 'Payment is due within 15 days.',
    taxRate: 8,
    amountPaid: 2700,
    discount: 0,
    shipping: 0,
    currency: 'USD ($)'
  },
  {
    id: 'inv2',
    invoiceNumber: 'INV-002',
    status: 'overdue',
    date: '2024-02-15',
    dueDate: '2024-03-01',
    paymentTerms: 'Net 15',
    from: 'My Small Business LLC\n123 My St, City, ST 12345',
    customerId: 'c2',
    billTo: 'Global Tech\n456 Innovation Blvd, NY',
    shipTo: '',
    items: [{ id: 'i2', description: 'Consulting', quantity: 10, rate: 150 }],
    notes: '',
    terms: '',
    taxRate: 0,
    amountPaid: 0,
    discount: 0,
    shipping: 0,
    currency: 'USD ($)'
  }
];

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [invoices, setInvoices] = useState<InvoiceData[]>(initialInvoices);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New State
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'Payment Received', message: 'Acme Corp paid INV-001', type: 'success', date: '2024-03-05', read: false },
    { id: '2', title: 'Invoice Overdue', message: 'Global Tech is 5 days late', type: 'warning', date: '2024-03-01', read: false }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    businessName: 'My Small Business LLC',
    email: 'mike@mybiz.com',
    address: '123 My St, City, ST 12345',
    logoUrl: '',
    currency: 'SLE (Le)',
    notificationPreferences: {
      paymentReminders: true,
      newInvoiceAlerts: true,
      overdueAlerts: true,
      weeklySummary: false,
      deliveryMethods: {
        email: true,
        inApp: true
      }
    }
  });
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [cashflowData, setCashflowData] = useState<CashflowData[]>([]);
  const [pricingAnalysis, setPricingAnalysis] = useState<PricingAnalysis[]>([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', address: '' });
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomerHistory, setViewingCustomerHistory] = useState<Customer | null>(null);
  const [showConfirmSaveCustomer, setShowConfirmSaveCustomer] = useState(false);
  const [legalPage, setLegalPage] = useState<LegalPage>('terms');
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  const addNotification = (title: string, message: string, type: 'info' | 'warning' | 'success') => {
    const { notificationPreferences } = userProfile;
    
    // Check if in-app notifications are enabled
    if (notificationPreferences.deliveryMethods.inApp) {
      const newNotification: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        message,
        type,
        date: new Date().toISOString().split('T')[0],
        read: false
      };
      setNotifications([newNotification, ...notifications]);
    }

    // Simulate email notification
    if (notificationPreferences.deliveryMethods.email) {
      console.log(`[Email Simulation] Sending to ${userProfile.email}: ${title} - ${message}`);
    }
  };

  // Dashboard Stats
  const stats = useMemo(() => {
    const totalBilled = invoices.reduce((acc, inv) => {
      const sub = inv.items.reduce((a, i) => a + (i.quantity * i.rate), 0);
      return acc + sub + (sub * (inv.taxRate / 100)) - inv.discount + inv.shipping;
    }, 0);
    const pending = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length;
    const overdue = invoices.filter(i => i.status === 'overdue').length;
    return { totalBilled, pending, overdue };
  }, [invoices]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearchQuery.toLowerCase())
    );
  }, [customers, customerSearchQuery]);

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.billTo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateInvoice = () => {
    // Auto-increment invoice number
    const lastInvoiceNumber = invoices.reduce((max, inv) => {
      const num = parseInt(inv.invoiceNumber.replace('INV-', ''));
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);

    const newInv: InvoiceData = {
      id: Math.random().toString(36).substr(2, 9),
      invoiceNumber: `INV-${(lastInvoiceNumber + 1).toString().padStart(3, '0')}`,
      status: 'draft',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      paymentTerms: 'Net 30',
      from: 'My Small Business LLC\n123 My St, City, ST 12345',
      customerId: '',
      billTo: '',
      shipTo: '',
      items: [{ id: '1', description: '', quantity: 1, rate: 0 }],
      notes: '',
      terms: '',
      taxRate: 0,
      amountPaid: 0,
      discount: 0,
      shipping: 0,
      currency: 'USD ($)'
    };
    setCurrentInvoice(newInv);
    setView('editor');
  };

  const handleEditInvoice = (inv: InvoiceData) => {
    setCurrentInvoice(inv);
    setView('editor');
  };

  const handlePreview = () => {
    if (currentInvoice) setView('preview');
  };

  const handleSave = () => {
    if (currentInvoice) {
      setInvoices(prev => {
        const exists = prev.find(i => i.id === currentInvoice.id);
        if (exists) return prev.map(i => i.id === currentInvoice.id ? currentInvoice : i);
        return [currentInvoice, ...prev];
      });
      setView('dashboard');
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid': return <span className="badge bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Paid</span>;
      case 'full payment': return <span className="badge bg-emerald-100 text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Full Payment</span>;
      case 'part payment': return <span className="badge bg-amber-100 text-amber-700 flex items-center gap-1"><Clock className="w-3 h-3" /> Part Payment</span>;
      case 'overdue': return <span className="badge bg-red-100 text-red-700 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Overdue</span>;
      case 'sent': return <span className="badge bg-blue-100 text-blue-700 flex items-center gap-1"><Send className="w-3 h-3" /> Sent</span>;
      default: return <span className="badge bg-slate-100 text-slate-700 flex items-center gap-1"><Clock className="w-3 h-3" /> Draft</span>;
    }
  };

  // AI Insights Trigger
  useEffect(() => {
    if (view === 'editor' && currentInvoice) {
      const timer = setTimeout(async () => {
        setIsGenerating(true);
        const newInsights = await generateSmartInsights(currentInvoice);
        setInsights(newInsights);
        setIsGenerating(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentInvoice?.items, currentInvoice?.taxRate, view]);

  useEffect(() => {
    if (view === 'cashflow' && cashflowData.length === 0) {
      setIsGenerating(true);
      forecastCashflow(invoices).then(data => {
        setCashflowData(data);
        setIsGenerating(false);
      });
    }
    if (view === 'pricing' && pricingAnalysis.length === 0) {
      setIsGenerating(true);
      const allItems = invoices.flatMap(inv => inv.items);
      analyzePricing(allItems).then(data => {
        setPricingAnalysis(data);
        setIsGenerating(false);
      });
    }
  }, [view, invoices]);

  const handleAddCustomer = () => {
    if (newCustomer.name && newCustomer.email) {
      setShowConfirmSaveCustomer(true);
    }
  };

  const confirmSaveCustomer = () => {
    if (editingCustomer) {
      setCustomers(customers.map(c => c.id === editingCustomer.id ? { ...c, ...newCustomer } : c));
      addNotification('Customer Updated', `${newCustomer.name}'s details have been updated.`, 'success');
    } else {
      const customer: Customer = {
        id: Math.random().toString(36).substr(2, 9),
        name: newCustomer.name,
        email: newCustomer.email,
        address: newCustomer.address,
        totalBilled: 0
      };
      setCustomers([...customers, customer]);
      addNotification('Customer Added', `${newCustomer.name} has been added to your list.`, 'success');
    }
    setNewCustomer({ name: '', email: '', address: '' });
    setEditingCustomer(null);
    setShowAddCustomer(false);
    setShowConfirmSaveCustomer(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile({ ...userProfile, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-40 w-full glass border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('dashboard')}>
              <Sparkles className="text-primary w-8 h-8" />
              <span className="font-bold text-xl tracking-tight flex items-center">
                JAAS Billing Pro
                <span className="text-primary text-xs font-semibold ml-1.5 px-2 py-0.5 rounded-full bg-sky-50">AI</span>
              </span>
            </div>
            
            <nav className="hidden md:flex space-x-6">
              <button 
                onClick={() => setView('dashboard')}
                className={`flex items-center gap-2 font-medium transition-colors ${view === 'dashboard' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>
              <button 
                onClick={() => setView('customers')}
                className={`flex items-center gap-2 font-medium transition-colors ${view === 'customers' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
              >
                <Users className="w-4 h-4" /> Customers
              </button>
              <button 
                onClick={() => setView('cashflow')}
                className={`flex items-center gap-2 font-medium transition-colors ${view === 'cashflow' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
              >
                <BarChart3 className="w-4 h-4" /> Cashflow
              </button>
              <button 
                onClick={() => setView('pricing')}
                className={`flex items-center gap-2 font-medium transition-colors ${view === 'pricing' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
              >
                <DollarSign className="w-4 h-4" /> Pricing
              </button>
            </nav>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.some(n => !n.read) && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
                </button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center">
                        <span className="font-bold text-sm">Notifications</span>
                        <button onClick={() => setNotifications(n => n.map(x => ({...x, read: true})))} className="text-[10px] text-primary font-bold hover:underline">Mark all as read</button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs">No notifications</div>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-sky-50/30' : ''}`}>
                              <p className="text-xs font-bold text-slate-800">{n.title}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{n.message}</p>
                              <p className="text-[8px] text-slate-400 mt-1">{n.date}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <button onClick={() => setView('settings')} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div 
                onClick={() => setView('profile')}
                className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
              >
                {userProfile.businessName[0]}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Dashboard View */}
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Free Invoice Template</h1>
                  <p className="text-slate-500 mt-2 max-w-2xl">
                    Make beautiful Invoices with one click! Welcome to the original JAAS Billing Pro AI Invoice Generator. 
                    Instantly make Invoices with our attractive template straight from your browser. 
                    Generate an unlimited number of Invoices for free.
                  </p>
                </div>
                <button onClick={handleCreateInvoice} className="btn-primary">
                  <Plus className="w-4 h-4" /> New Invoice
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-sm font-medium text-slate-500">Total Billed</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">${stats.totalBilled.toLocaleString()}</h3>
                  <div className="mt-4 flex items-center text-xs text-green-600 font-bold">
                    <TrendingUp className="w-3 h-3 mr-1" /> +12% from last month
                  </div>
                </div>
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-sm font-medium text-slate-500">Pending Invoices</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.pending}</h3>
                  <p className="mt-4 text-xs text-slate-400">Awaiting payment from 4 customers</p>
                </div>
                <div className="glass p-6 rounded-2xl border border-red-100 bg-red-50/10">
                  <p className="text-sm font-medium text-slate-500">Overdue</p>
                  <h3 className="text-3xl font-bold text-red-600 mt-2">{stats.overdue}</h3>
                  <div className="mt-4 flex items-center text-xs text-red-600 font-bold">
                    <AlertCircle className="w-3 h-3 mr-1" /> Action required
                  </div>
                </div>
              </div>

              {/* Recent Invoices */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-900">Recent Invoices</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search invoices..." 
                      className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 w-64"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="glass rounded-2xl overflow-hidden border border-slate-100">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Invoice</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                          <td className="px-6 py-4 text-slate-600">{inv.billTo.split('\n')[0]}</td>
                          <td className="px-6 py-4 text-slate-500 text-sm">{inv.date}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">
                            ${(inv.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + inv.taxRate/100)).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleEditInvoice(inv)}
                              className="text-primary hover:text-sky-600 font-bold text-sm"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Editor View */}
          {view === 'editor' && currentInvoice && (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col lg:flex-row gap-8"
            >
              <div className="flex-grow lg:w-2/3 space-y-6">
                <div className="flex items-center gap-4 mb-2">
                  <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                  </button>
                  <h1 className="text-2xl font-bold text-slate-900">Edit Invoice</h1>
                </div>

                <div className="glass rounded-2xl p-8 border border-slate-100">
                  {/* Form Header */}
                  <div className="flex justify-between items-start mb-12">
                    <div className="space-y-4">
                      <div 
                        onClick={() => logoInputRef.current?.click()}
                        className="w-40 h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer overflow-hidden"
                      >
                        {userProfile.logoUrl ? (
                          <img src={userProfile.logoUrl} className="w-full h-full object-contain" />
                        ) : (
                          <>
                            <ImageIcon className="w-6 h-6 mb-1" />
                            <span className="text-[10px] font-bold uppercase">Logo</span>
                          </>
                        )}
                      </div>
                      <textarea 
                        className="w-full bg-transparent border-none p-0 focus:ring-0 resize-none placeholder-slate-300 text-sm font-medium"
                        placeholder="Your Business Details..."
                        rows={3}
                        value={currentInvoice.from}
                        onChange={e => setCurrentInvoice({...currentInvoice, from: e.target.value})}
                      />
                    </div>
                    <div className="text-right space-y-4">
                      <h2 className="text-4xl font-light text-primary tracking-tighter">INVOICE</h2>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center justify-end">
                          <span className="text-slate-400 mr-2 text-sm font-bold">#</span>
                          <input 
                            className="w-24 text-right bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 font-bold"
                            value={currentInvoice.invoiceNumber}
                            onChange={e => setCurrentInvoice({...currentInvoice, invoiceNumber: e.target.value})}
                          />
                        </div>
                        <div className="flex items-center justify-end">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Status</label>
                          <select 
                            className="text-xs font-bold bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 p-1"
                            value={currentInvoice.status}
                            onChange={e => setCurrentInvoice({...currentInvoice, status: e.target.value as InvoiceStatus})}
                          >
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="paid">Paid</option>
                            <option value="part payment">Part Payment</option>
                            <option value="full payment">Full Payment</option>
                            <option value="overdue">Overdue</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bill To</label>
                      <select 
                        className="input-base"
                        onChange={e => {
                          const c = customers.find(cust => cust.id === e.target.value);
                          if (c) setCurrentInvoice({...currentInvoice, customerId: c.id, billTo: `${c.name}\n${c.address}`});
                        }}
                        value={currentInvoice.customerId}
                      >
                        <option value="">Select a customer...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <textarea 
                        className="input-base h-24 resize-none"
                        placeholder="Customer details..."
                        value={currentInvoice.billTo}
                        onChange={e => setCurrentInvoice({...currentInvoice, billTo: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Date', type: 'date', key: 'date' },
                        { label: 'Due Date', type: 'date', key: 'dueDate' },
                        { label: 'Terms', type: 'text', key: 'paymentTerms' }
                      ].map(f => (
                        <div key={f.key} className="flex items-center justify-end gap-4">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{f.label}</label>
                          <input 
                            type={f.type}
                            className="w-40 input-base"
                            value={(currentInvoice as any)[f.key]}
                            onChange={e => setCurrentInvoice({...currentInvoice, [f.key]: e.target.value})}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="mb-8">
                    <div className="overflow-hidden rounded-xl border border-slate-100">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                          <tr>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3 text-right">Qty</th>
                            <th className="px-4 py-3 text-right">Rate</th>
                            <th className="px-4 py-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentInvoice.items.map(item => (
                            <tr key={item.id}>
                              <td className="p-2">
                                <input 
                                  className="w-full bg-transparent border-none focus:ring-0 text-sm"
                                  placeholder="Item description..."
                                  value={item.description}
                                  onChange={e => {
                                    const items = currentInvoice.items.map(i => i.id === item.id ? {...i, description: e.target.value} : i);
                                    setCurrentInvoice({...currentInvoice, items});
                                  }}
                                />
                              </td>
                              <td className="p-2">
                                <input 
                                  type="number"
                                  className="w-full text-right bg-transparent border-none focus:ring-0 text-sm"
                                  value={item.quantity}
                                  onChange={e => {
                                    const items = currentInvoice.items.map(i => i.id === item.id ? {...i, quantity: parseFloat(e.target.value) || 0} : i);
                                    setCurrentInvoice({...currentInvoice, items});
                                  }}
                                />
                              </td>
                              <td className="p-2">
                                <input 
                                  type="number"
                                  className="w-full text-right bg-transparent border-none focus:ring-0 text-sm"
                                  value={item.rate}
                                  onChange={e => {
                                    const items = currentInvoice.items.map(i => i.id === item.id ? {...i, rate: parseFloat(e.target.value) || 0} : i);
                                    setCurrentInvoice({...currentInvoice, items});
                                  }}
                                />
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                                ${(item.quantity * item.rate).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button 
                      onClick={() => {
                        const items = [...currentInvoice.items, { id: Math.random().toString(), description: '', quantity: 1, rate: 0 }];
                        setCurrentInvoice({...currentInvoice, items});
                      }}
                      className="mt-4 flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-widest hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Add Item
                    </button>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end pt-8 border-t border-slate-100">
                    <div className="w-64 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-bold">${currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Tax (%)</span>
                        <input 
                          type="number"
                          className="w-16 text-right bg-slate-50 border-none rounded p-1 text-sm font-bold"
                          value={currentInvoice.taxRate}
                          onChange={e => setCurrentInvoice({...currentInvoice, taxRate: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div className="flex justify-between pt-3 border-t border-slate-100">
                        <span className="font-bold text-slate-900">Total</span>
                        <span className="text-2xl font-black text-primary">
                          ${(currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + currentInvoice.taxRate/100)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editor Sidebar */}
              <div className="lg:w-1/3 space-y-6">
                <div className="glass p-4 rounded-2xl flex gap-3">
                  <button onClick={handlePreview} className="flex-1 btn-primary">
                    <Printer className="w-4 h-4" /> Preview
                  </button>
                  <button onClick={handleSave} className="btn-secondary">
                    Save
                  </button>
                </div>

                {/* AI Insights */}
                <div className="glass bg-gradient-to-br from-primary/5 to-white rounded-2xl overflow-hidden border border-primary/10">
                  <div className="p-5 border-b border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <h3 className="font-bold text-slate-800">AI Assistant</h3>
                    </div>
                    {isGenerating && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles className="w-4 h-4 text-primary/50" /></motion.div>}
                  </div>
                  <div className="p-5 space-y-4">
                    {insights.map(insight => (
                      <div key={insight.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex gap-3">
                          {insight.type === 'optimization' ? <TrendingUp className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                          <div>
                            <p className="text-xs font-bold text-slate-800">{insight.title}</p>
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{insight.description}</p>
                            {insight.actionText && <button className="text-[10px] font-bold text-primary mt-2 hover:underline">{insight.actionText}</button>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Preview View */}
          {view === 'preview' && currentInvoice && (
            <motion.div 
              key="preview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex justify-between items-center">
                <button onClick={() => setView('editor')} className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-primary transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Editor
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      const isReceipt = ['paid', 'part payment', 'full payment'].includes(currentInvoice.status);
                      addNotification(isReceipt ? 'Receipt Generating' : 'PDF Generating', `Preparing your high-quality ${isReceipt ? 'receipt' : 'invoice'} document...`, 'info');
                      setTimeout(() => {
                        window.print();
                        addNotification(isReceipt ? 'Receipt Downloaded' : 'PDF Downloaded', `${isReceipt ? 'Receipt' : 'Invoice'} PDF has been generated successfully.`, 'success');
                      }, 1500);
                    }}
                    className="btn-secondary"
                  >
                    <Download className="w-4 h-4" /> {['paid', 'part payment', 'full payment'].includes(currentInvoice.status) ? 'Download Receipt' : 'Download PDF'}
                  </button>
                  <button 
                    onClick={() => {
                      const isReceipt = ['paid', 'part payment', 'full payment'].includes(currentInvoice.status);
                      addNotification('Sending Email', `Sending ${isReceipt ? 'receipt' : 'invoice'} to ${customers.find(c => c.id === currentInvoice.customerId)?.email || 'client'}...`, 'info');
                      setTimeout(() => {
                        addNotification('Email Sent', `${isReceipt ? 'Receipt' : 'Invoice'} ${currentInvoice.invoiceNumber} has been sent to the client and a copy to ${userProfile.email}.`, 'success');
                      }, 2000);
                    }}
                    className="btn-primary"
                  >
                    <Send className="w-4 h-4" /> {['paid', 'part payment', 'full payment'].includes(currentInvoice.status) ? 'Send Receipt' : 'Send to Client'}
                  </button>
                  <button 
                    onClick={() => {
                      const total = (currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + currentInvoice.taxRate/100)).toFixed(2);
                      const text = `Hi, here is your invoice ${currentInvoice.invoiceNumber} from ${userProfile.businessName}.\n\nTotal: $${total}\n\nYou can view and download the PDF here: ${window.location.origin}/invoice/${currentInvoice.id}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="btn-secondary bg-green-50 text-green-600 border-green-100 hover:bg-green-100"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </button>
                </div>
              </div>

              <div className="bg-white shadow-2xl rounded-3xl p-16 border border-slate-100 min-h-[1000px] relative overflow-hidden">
                {/* Decorative Element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32" />
                
                {currentInvoice.status === 'paid' && (
                  <div className="absolute top-20 right-20 rotate-12 border-4 border-green-500 text-green-500 px-6 py-2 rounded-xl font-black text-4xl opacity-20 pointer-events-none">
                    PAID
                  </div>
                )}

                <div className="flex justify-between items-start relative">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      {userProfile.logoUrl ? (
                        <img src={userProfile.logoUrl} className="w-12 h-12 object-contain" />
                      ) : (
                        <Sparkles className="w-10 h-10 text-primary" />
                      )}
                      <span className="text-2xl font-black tracking-tighter">{userProfile.businessName.toUpperCase()}</span>
                    </div>
                    <div className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">
                      {currentInvoice.from}
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-4">
                      {['paid', 'part payment', 'full payment'].includes(currentInvoice.status) ? 'RECEIPT' : 'INVOICE'}
                    </h1>
                    <p className="text-slate-400 font-bold tracking-widest text-xs">NO. {currentInvoice.invoiceNumber}</p>
                    <div className="mt-4 flex justify-end">
                      {getStatusBadge(currentInvoice.status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-16 mt-20">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Billed To</h4>
                    <div className="text-slate-900 font-bold leading-relaxed whitespace-pre-line">
                      {currentInvoice.billTo}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</h4>
                      <div className="text-slate-900 font-bold">{currentInvoice.date}</div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Due Date</h4>
                      <div className="text-slate-900 font-bold">{currentInvoice.dueDate || 'Upon Receipt'}</div>
                    </div>
                  </div>
                </div>

                <table className="w-full mt-20">
                  <thead>
                    <tr className="border-b-2 border-slate-900 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <th className="py-4">Description</th>
                      <th className="py-4 text-right">Qty</th>
                      <th className="py-4 text-right">Rate</th>
                      <th className="py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentInvoice.items.map(item => (
                      <tr key={item.id}>
                        <td className="py-6 font-bold text-slate-900">{item.description}</td>
                        <td className="py-6 text-right text-slate-600">{item.quantity}</td>
                        <td className="py-6 text-right text-slate-600">${item.rate.toFixed(2)}</td>
                        <td className="py-6 text-right font-black text-slate-900">${(item.quantity * item.rate).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-20 flex justify-end">
                  <div className="w-80 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-widest">Subtotal</span>
                      <span className="font-bold text-slate-900">${currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-widest">Tax ({currentInvoice.taxRate}%)</span>
                      <span className="font-bold text-slate-900">
                        ${(currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (currentInvoice.taxRate/100)).toFixed(2)}
                      </span>
                    </div>
                    <div className="pt-6 border-t-4 border-slate-900 flex justify-between items-baseline">
                      <span className="text-xl font-black text-slate-900 uppercase tracking-tighter">Total Due</span>
                      <span className="text-4xl font-black text-primary">
                        ${(currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + currentInvoice.taxRate/100)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-40 pt-10 border-t border-slate-100 grid grid-cols-2 gap-16">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Notes</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{currentInvoice.notes || 'No additional notes.'}</p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Terms</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{currentInvoice.terms || 'Standard terms apply.'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Customers View */}
          {view === 'customers' && (
            <motion.div 
              key="customers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
                  <p className="text-slate-500 mt-1">Manage your client relationships and billing history.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search customers..." 
                      className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 w-64"
                      value={customerSearchQuery}
                      onChange={e => setCustomerSearchQuery(e.target.value)}
                    />
                  </div>
                  <button onClick={() => {
                    setEditingCustomer(null);
                    setNewCustomer({ name: '', email: '', address: '' });
                    setShowAddCustomer(true);
                  }} className="btn-primary">
                    <Plus className="w-4 h-4" /> Add Customer
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredCustomers.map(c => (
                  <div key={c.id} className="glass p-6 rounded-2xl border border-slate-100 hover:border-primary/20 transition-all group">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-primary font-black text-xl group-hover:bg-primary group-hover:text-white transition-colors">
                        {c.name[0]}
                      </div>
                      <button 
                        onClick={() => {
                          setEditingCustomer(c);
                          setNewCustomer({ name: c.name, email: c.email, address: c.address });
                          setShowAddCustomer(true);
                        }}
                        className="text-slate-300 hover:text-primary transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-4">{c.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{c.email}</p>
                    <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Billed</p>
                        <p className="text-xl font-black text-slate-900 mt-1">${c.totalBilled.toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => setViewingCustomerHistory(c)}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <History className="w-3 h-3" /> History
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Cashflow View */}
          {view === 'cashflow' && (
            <motion.div 
              key="cashflow"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Cashflow Forecast</h1>
                  <p className="text-slate-500 mt-1">AI-powered projections based on your billing history.</p>
                </div>
                {isGenerating && <div className="flex items-center gap-2 text-primary text-sm font-bold"><Sparkles className="w-4 h-4 animate-spin" /> Analyzing...</div>}
              </div>

              <div className="glass p-8 rounded-3xl border border-slate-100 h-[400px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} aspect={2.5}>
                  <AreaChart data={cashflowData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10ade6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10ade6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="income" stroke="#10ade6" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                    <Line type="monotone" dataKey="forecast" stroke="#94a3b8" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Next Month Forecast</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">${cashflowData[0]?.forecast?.toLocaleString() || '0'}</h3>
                </div>
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg. Monthly Income</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">${(cashflowData.reduce((a, b) => a + b.income, 0) / (cashflowData.length || 1)).toFixed(0)}</h3>
                </div>
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Growth Trend</p>
                  <h3 className="text-2xl font-black text-green-500 mt-2">+8.4%</h3>
                </div>
              </div>
            </motion.div>
          )}

          {/* Pricing View */}
          {view === 'pricing' && (
            <motion.div 
              key="pricing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Smart Pricing</h1>
                  <p className="text-slate-500 mt-1">AI analysis of your rates compared to market standards.</p>
                </div>
                {isGenerating && <div className="flex items-center gap-2 text-primary text-sm font-bold"><Sparkles className="w-4 h-4 animate-spin" /> Researching...</div>}
              </div>

              <div className="grid grid-cols-1 gap-6">
                {pricingAnalysis.map(item => (
                  <div key={item.id} className="glass p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-grow">
                      <h3 className="text-lg font-bold text-slate-900">{item.itemName}</h3>
                      <p className="text-sm text-slate-500 mt-1">{item.reasoning}</p>
                      <div className="mt-4 flex gap-4">
                        <div className="bg-slate-50 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">Market Avg: ${item.marketAverage}</div>
                        <div className="bg-green-50 px-3 py-1 rounded-full text-[10px] font-bold text-green-600 uppercase tracking-widest">Potential: +${item.potentialRevenueIncrease}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current</p>
                        <p className="text-xl font-black text-slate-400">${item.currentRate}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <ArrowLeft className="w-4 h-4 text-primary rotate-180" />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Suggested</p>
                        <p className="text-2xl font-black text-primary">${item.suggestedRate}</p>
                      </div>
                      <button 
                        onClick={() => {
                          const updated = pricingAnalysis.map(p => p.id === item.id ? { ...p, currentRate: p.suggestedRate } : p);
                          setPricingAnalysis(updated);
                          alert('Rate applied successfully!');
                        }}
                        className="btn-primary ml-4"
                      >
                        Apply Rate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Settings View */}
          {view === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
              
              <div className="space-y-6">
                <div className="glass p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center gap-3 text-slate-900 font-bold">
                    <Globe className="w-5 h-5 text-primary" />
                    Localization
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Currency</label>
                      <select 
                        className="input-base"
                        value={currency.code}
                        onChange={(e) => {
                          const newCurrency = CURRENCIES.find(c => c.code === e.target.value) || CURRENCIES[0];
                          setCurrency(newCurrency);
                          setUserProfile({ ...userProfile, currency: `${newCurrency.code} (${newCurrency.symbol})` });
                        }}
                      >
                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date Format</label>
                      <select className="input-base">
                        <option>YYYY-MM-DD</option>
                        <option>DD/MM/YYYY</option>
                        <option>MM/DD/YYYY</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="glass p-6 rounded-2xl border border-slate-100 space-y-6">
                  <div className="flex items-center gap-3 text-slate-900 font-bold">
                    <Bell className="w-5 h-5 text-primary" />
                    Notification Types
                  </div>
                  <div className="space-y-4">
                    {[
                      { key: 'paymentReminders', label: 'Payment Reminders' },
                      { key: 'newInvoiceAlerts', label: 'New Invoice Alerts' },
                      { key: 'overdueAlerts', label: 'Overdue Invoice Alerts' },
                      { key: 'weeklySummary', label: 'Weekly Summary Report' }
                    ].map((item) => (
                      <div key={item.key} className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">{item.label}</span>
                        <div 
                          onClick={() => setUserProfile({
                            ...userProfile,
                            notificationPreferences: {
                              ...userProfile.notificationPreferences,
                              [item.key]: !userProfile.notificationPreferences[item.key as keyof NotificationPreferences]
                            }
                          })}
                          className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${userProfile.notificationPreferences[item.key as keyof NotificationPreferences] ? 'bg-primary' : 'bg-slate-200'} relative`}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${userProfile.notificationPreferences[item.key as keyof NotificationPreferences] ? 'right-1' : 'left-1'}`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-3 text-slate-900 font-bold mb-4">
                      <Send className="w-5 h-5 text-primary" />
                      Delivery Methods
                    </div>
                    <div className="space-y-4">
                      {[
                        { key: 'email', label: 'Email Notifications' },
                        { key: 'inApp', label: 'In-App Notifications' }
                      ].map((item) => (
                        <div key={item.key} className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">{item.label}</span>
                          <div 
                            onClick={() => setUserProfile({
                              ...userProfile,
                              notificationPreferences: {
                                ...userProfile.notificationPreferences,
                                deliveryMethods: {
                                  ...userProfile.notificationPreferences.deliveryMethods,
                                  [item.key]: !userProfile.notificationPreferences.deliveryMethods[item.key as keyof NotificationPreferences['deliveryMethods']]
                                }
                              }
                            })}
                            className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${userProfile.notificationPreferences.deliveryMethods[item.key as keyof NotificationPreferences['deliveryMethods']] ? 'bg-primary' : 'bg-slate-200'} relative`}
                          >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${userProfile.notificationPreferences.deliveryMethods[item.key as keyof NotificationPreferences['deliveryMethods']] ? 'right-1' : 'left-1'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Profile View */}
          {view === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="flex justify-between items-end">
                <h1 className="text-3xl font-bold text-slate-900">Business Profile</h1>
                <button 
                  onClick={() => alert('Profile saved successfully!')}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>

              <div className="glass p-8 rounded-3xl border border-slate-100 space-y-8">
                <div className="flex items-center gap-8">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 overflow-hidden">
                      {userProfile.logoUrl ? <img src={userProfile.logoUrl} className="w-full h-full object-contain" /> : <ImageIcon className="w-8 h-8" />}
                    </div>
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      onChange={handleLogoUpload} 
                      className="hidden" 
                      accept="image/*" 
                    />
                    <button 
                      onClick={() => logoInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-primary hover:bg-primary hover:text-white transition-all"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Business Logo</h3>
                    <p className="text-xs text-slate-500 mt-1">Recommended size: 512x512px. PNG or JPG.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Business Name</label>
                    <input 
                      className="input-base" 
                      value={userProfile.businessName}
                      onChange={e => setUserProfile({...userProfile, businessName: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email</label>
                      <input 
                        className="input-base" 
                        value={userProfile.email}
                        onChange={e => setUserProfile({...userProfile, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone</label>
                      <input className="input-base" placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Address</label>
                    <textarea 
                      className="input-base h-24 resize-none" 
                      value={userProfile.address}
                      onChange={e => setUserProfile({...userProfile, address: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Legal View */}
          {view === 'legal' && (
            <motion.div 
              key="legal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex items-center gap-4">
                <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <h1 className="text-3xl font-bold text-slate-900">
                  {legalPage === 'terms' ? 'Terms of Service' : legalPage === 'privacy' ? 'Privacy Policy' : 'Cookie Settings'}
                </h1>
              </div>

              <div className="glass p-12 rounded-3xl border border-slate-100 prose prose-slate max-w-none">
                {legalPage === 'terms' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
                    <p>By accessing and using JAAS Billing Pro AI, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.</p>
                    <h2 className="text-2xl font-bold">2. Use of Service</h2>
                    <p>You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You agree to use the service only for lawful purposes.</p>
                    <h2 className="text-2xl font-bold">3. Intellectual Property</h2>
                    <p>All content and software used in the service are the property of JAAS Billing Pro AI or its suppliers and are protected by copyright and other laws.</p>
                    <h2 className="text-2xl font-bold">4. Limitation of Liability</h2>
                    <p>JAAS Billing Pro AI shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the service.</p>
                  </div>
                )}
                {legalPage === 'privacy' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">1. Information We Collect</h2>
                    <p>We collect information you provide directly to us, such as when you create an account, generate an invoice, or contact us for support.</p>
                    <h2 className="text-2xl font-bold">2. How We Use Information</h2>
                    <p>We use the information we collect to provide, maintain, and improve our services, and to communicate with you about your account and our services.</p>
                    <h2 className="text-2xl font-bold">3. Data Security</h2>
                    <p>We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.</p>
                    <h2 className="text-2xl font-bold">4. Your Choices</h2>
                    <p>You may update or correct information about yourself at any time by logging into your account or contacting us.</p>
                  </div>
                )}
                {legalPage === 'cookies' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">1. What are Cookies?</h2>
                    <p>Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work or work more efficiently.</p>
                    <h2 className="text-2xl font-bold">2. How We Use Cookies</h2>
                    <p>We use cookies to understand how you use our service and to improve your experience. This includes remembering your preferences and settings.</p>
                    <h2 className="text-2xl font-bold">3. Managing Cookies</h2>
                    <p>Most web browsers allow you to control cookies through their settings. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Customer Modal */}
      <AnimatePresence>
        {showAddCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddCustomer(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-100"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input 
                    className="input-base" 
                    placeholder="e.g. John Doe"
                    value={newCustomer.name}
                    onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input 
                    className="input-base" 
                    placeholder="john@example.com"
                    value={newCustomer.email}
                    onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Address</label>
                  <textarea 
                    className="input-base h-24 resize-none" 
                    placeholder="123 Business Way..."
                    value={newCustomer.address}
                    onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => {
                    setShowAddCustomer(false);
                    setEditingCustomer(null);
                  }} className="flex-1 btn-secondary">Cancel</button>
                  <button onClick={handleAddCustomer} className="flex-1 btn-primary">
                    {editingCustomer ? 'Update Customer' : 'Create Customer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customer History Modal */}
      <AnimatePresence>
        {viewingCustomerHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingCustomerHistory(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 border border-slate-100 max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Billing History</h2>
                  <p className="text-sm text-slate-500">{viewingCustomerHistory.name}</p>
                </div>
                <button onClick={() => setViewingCustomerHistory(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                {invoices.filter(inv => inv.customerId === viewingCustomerHistory.id).length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No invoices found for this customer.</p>
                  </div>
                ) : (
                  invoices
                    .filter(inv => inv.customerId === viewingCustomerHistory.id)
                    .map(inv => (
                      <div key={inv.id} className="flex justify-between items-center p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="font-bold text-slate-900">{inv.invoiceNumber}</p>
                          <p className="text-xs text-slate-500">{inv.date}</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="font-bold text-slate-900">
                              ${(inv.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + inv.taxRate/100)).toFixed(2)}
                            </p>
                            <div className="mt-1">{getStatusBadge(inv.status)}</div>
                          </div>
                          <button 
                            onClick={() => {
                              setCurrentInvoice(inv);
                              setView('preview');
                              setViewingCustomerHistory(null);
                            }}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <PlayCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-slate-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary w-6 h-6" />
              <span className="font-bold text-lg tracking-tight">JAAS Billing Pro AI</span>
            </div>
            
            <nav className="flex flex-wrap justify-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <button onClick={() => { setLegalPage('terms'); setView('legal'); }} className="hover:text-primary transition-colors">Terms of Service</button>
              <button onClick={() => { setLegalPage('privacy'); setView('legal'); }} className="hover:text-primary transition-colors">Privacy Policy</button>
              <button onClick={() => { setLegalPage('cookies'); setView('legal'); }} className="hover:text-primary transition-colors">Cookie Settings</button>
            </nav>

            <div className="flex items-center gap-4">
              <a href="https://www.facebook.com/Alston332" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-primary transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="https://www.youtube.com/@Alston332" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-primary transition-colors"><Youtube className="w-5 h-5" /></a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium">© 2026 JAAS Billing Pro AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Confirm Save Customer Modal */}
      <AnimatePresence>
        {showConfirmSaveCustomer && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmSaveCustomer(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 border border-slate-100 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Save className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Save Changes?</h2>
              <p className="text-slate-500 mb-8">Are you sure you want to save the changes for this customer?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmSaveCustomer(false)} className="flex-1 btn-secondary">Cancel</button>
                <button onClick={confirmSaveCustomer} className="flex-1 btn-primary">Yes, Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

            <div className="flex items-center space-x-4">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.some(n => !n.read) && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
                </button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center">
                        <span className="font-bold text-sm">Notifications</span>
                        <button onClick={() => setNotifications(n => n.map(x => ({...x, read: true})))} className="text-[10px] text-primary font-bold hover:underline">Mark all as read</button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs">No notifications</div>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-sky-50/30' : ''}`}>
                              <p className="text-xs font-bold text-slate-800">{n.title}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{n.message}</p>
                              <p className="text-[8px] text-slate-400 mt-1">{n.date}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <button onClick={() => setView('settings')} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div 
                onClick={() => setView('profile')}
                className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
              >
                {userProfile.businessName[0]}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Dashboard View */}
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Free Invoice Template</h1>
                  <p className="text-slate-500 mt-2 max-w-2xl">
                    Make beautiful Invoices with one click! Welcome to the original JAAS Billing Pro AI Invoice Generator. 
                    Instantly make Invoices with our attractive template straight from your browser. 
                    Generate an unlimited number of Invoices for free.
                  </p>
                </div>
                <button onClick={handleCreateInvoice} className="btn-primary">
                  <Plus className="w-4 h-4" /> New Invoice
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-sm font-medium text-slate-500">Total Billed</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">${stats.totalBilled.toLocaleString()}</h3>
                  <div className="mt-4 flex items-center text-xs text-green-600 font-bold">
                    <TrendingUp className="w-3 h-3 mr-1" /> +12% from last month
                  </div>
                </div>
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-sm font-medium text-slate-500">Pending Invoices</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.pending}</h3>
                  <p className="mt-4 text-xs text-slate-400">Awaiting payment from 4 customers</p>
                </div>
                <div className="glass p-6 rounded-2xl border border-red-100 bg-red-50/10">
                  <p className="text-sm font-medium text-slate-500">Overdue</p>
                  <h3 className="text-3xl font-bold text-red-600 mt-2">{stats.overdue}</h3>
                  <div className="mt-4 flex items-center text-xs text-red-600 font-bold">
                    <AlertCircle className="w-3 h-3 mr-1" /> Action required
                  </div>
                </div>
              </div>

              {/* Recent Invoices */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-900">Recent Invoices</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search invoices..." 
                      className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 w-64"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="glass rounded-2xl overflow-hidden border border-slate-100">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Invoice</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                          <td className="px-6 py-4 text-slate-600">{inv.billTo.split('\n')[0]}</td>
                          <td className="px-6 py-4 text-slate-500 text-sm">{inv.date}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">
                            ${(inv.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + inv.taxRate/100)).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleEditInvoice(inv)}
                              className="text-primary hover:text-sky-600 font-bold text-sm"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Editor View */}
          {view === 'editor' && currentInvoice && (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col lg:flex-row gap-8"
            >
              <div className="flex-grow lg:w-2/3 space-y-6">
                <div className="flex items-center gap-4 mb-2">
                  <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                  </button>
                  <h1 className="text-2xl font-bold text-slate-900">Edit Invoice</h1>
                </div>

                <div className="glass rounded-2xl p-8 border border-slate-100">
                  {/* Form Header */}
                  <div className="flex justify-between items-start mb-12">
                    <div className="space-y-4">
                      <div 
                        onClick={() => logoInputRef.current?.click()}
                        className="w-40 h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer overflow-hidden"
                      >
                        {userProfile.logoUrl ? (
                          <img src={userProfile.logoUrl} className="w-full h-full object-contain" />
                        ) : (
                          <>
                            <ImageIcon className="w-6 h-6 mb-1" />
                            <span className="text-[10px] font-bold uppercase">Logo</span>
                          </>
                        )}
                      </div>
                      <textarea 
                        className="w-full bg-transparent border-none p-0 focus:ring-0 resize-none placeholder-slate-300 text-sm font-medium"
                        placeholder="Your Business Details..."
                        rows={3}
                        value={currentInvoice.from}
                        onChange={e => setCurrentInvoice({...currentInvoice, from: e.target.value})}
                      />
                    </div>
                    <div className="text-right space-y-4">
                      <h2 className="text-4xl font-light text-primary tracking-tighter">INVOICE</h2>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center justify-end">
                          <span className="text-slate-400 mr-2 text-sm font-bold">#</span>
                          <input 
                            className="w-24 text-right bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 font-bold"
                            value={currentInvoice.invoiceNumber}
                            onChange={e => setCurrentInvoice({...currentInvoice, invoiceNumber: e.target.value})}
                          />
                        </div>
                        <div className="flex items-center justify-end">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Status</label>
                          <select 
                            className="text-xs font-bold bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 p-1"
                            value={currentInvoice.status}
                            onChange={e => setCurrentInvoice({...currentInvoice, status: e.target.value as InvoiceStatus})}
                          >
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="paid">Paid</option>
                            <option value="part payment">Part Payment</option>
                            <option value="full payment">Full Payment</option>
                            <option value="overdue">Overdue</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bill To</label>
                      <select 
                        className="input-base"
                        onChange={e => {
                          const c = customers.find(cust => cust.id === e.target.value);
                          if (c) setCurrentInvoice({...currentInvoice, customerId: c.id, billTo: `${c.name}\n${c.address}`});
                        }}
                        value={currentInvoice.customerId}
                      >
                        <option value="">Select a customer...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <textarea 
                        className="input-base h-24 resize-none"
                        placeholder="Customer details..."
                        value={currentInvoice.billTo}
                        onChange={e => setCurrentInvoice({...currentInvoice, billTo: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Date', type: 'date', key: 'date' },
                        { label: 'Due Date', type: 'date', key: 'dueDate' },
                        { label: 'Terms', type: 'text', key: 'paymentTerms' }
                      ].map(f => (
                        <div key={f.key} className="flex items-center justify-end gap-4">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{f.label}</label>
                          <input 
                            type={f.type}
                            className="w-40 input-base"
                            value={(currentInvoice as any)[f.key]}
                            onChange={e => setCurrentInvoice({...currentInvoice, [f.key]: e.target.value})}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="mb-8">
                    <div className="overflow-hidden rounded-xl border border-slate-100">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                          <tr>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3 text-right">Qty</th>
                            <th className="px-4 py-3 text-right">Rate</th>
                            <th className="px-4 py-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentInvoice.items.map(item => (
                            <tr key={item.id}>
                              <td className="p-2">
                                <input 
                                  className="w-full bg-transparent border-none focus:ring-0 text-sm"
                                  placeholder="Item description..."
                                  value={item.description}
                                  onChange={e => {
                                    const items = currentInvoice.items.map(i => i.id === item.id ? {...i, description: e.target.value} : i);
                                    setCurrentInvoice({...currentInvoice, items});
                                  }}
                                />
                              </td>
                              <td className="p-2">
                                <input 
                                  type="number"
                                  className="w-full text-right bg-transparent border-none focus:ring-0 text-sm"
                                  value={item.quantity}
                                  onChange={e => {
                                    const items = currentInvoice.items.map(i => i.id === item.id ? {...i, quantity: parseFloat(e.target.value) || 0} : i);
                                    setCurrentInvoice({...currentInvoice, items});
                                  }}
                                />
                              </td>
                              <td className="p-2">
                                <input 
                                  type="number"
                                  className="w-full text-right bg-transparent border-none focus:ring-0 text-sm"
                                  value={item.rate}
                                  onChange={e => {
                                    const items = currentInvoice.items.map(i => i.id === item.id ? {...i, rate: parseFloat(e.target.value) || 0} : i);
                                    setCurrentInvoice({...currentInvoice, items});
                                  }}
                                />
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                                ${(item.quantity * item.rate).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button 
                      onClick={() => {
                        const items = [...currentInvoice.items, { id: Math.random().toString(), description: '', quantity: 1, rate: 0 }];
                        setCurrentInvoice({...currentInvoice, items});
                      }}
                      className="mt-4 flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-widest hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Add Item
                    </button>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end pt-8 border-t border-slate-100">
                    <div className="w-64 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-bold">${currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Tax (%)</span>
                        <input 
                          type="number"
                          className="w-16 text-right bg-slate-50 border-none rounded p-1 text-sm font-bold"
                          value={currentInvoice.taxRate}
                          onChange={e => setCurrentInvoice({...currentInvoice, taxRate: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div className="flex justify-between pt-3 border-t border-slate-100">
                        <span className="font-bold text-slate-900">Total</span>
                        <span className="text-2xl font-black text-primary">
                          ${(currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + currentInvoice.taxRate/100)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editor Sidebar */}
              <div className="lg:w-1/3 space-y-6">
                <div className="glass p-4 rounded-2xl flex gap-3">
                  <button onClick={handlePreview} className="flex-1 btn-primary">
                    <Printer className="w-4 h-4" /> Preview
                  </button>
                  <button onClick={handleSave} className="btn-secondary">
                    Save
                  </button>
                </div>

                {/* AI Insights */}
                <div className="glass bg-gradient-to-br from-primary/5 to-white rounded-2xl overflow-hidden border border-primary/10">
                  <div className="p-5 border-b border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <h3 className="font-bold text-slate-800">AI Assistant</h3>
                    </div>
                    {isGenerating && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles className="w-4 h-4 text-primary/50" /></motion.div>}
                  </div>
                  <div className="p-5 space-y-4">
                    {insights.map(insight => (
                      <div key={insight.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex gap-3">
                          {insight.type === 'optimization' ? <TrendingUp className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                          <div>
                            <p className="text-xs font-bold text-slate-800">{insight.title}</p>
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{insight.description}</p>
                            {insight.actionText && <button className="text-[10px] font-bold text-primary mt-2 hover:underline">{insight.actionText}</button>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Preview View */}
          {view === 'preview' && currentInvoice && (
            <motion.div 
              key="preview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex justify-between items-center">
                <button onClick={() => setView('editor')} className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-primary transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Editor
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      const isReceipt = ['paid', 'part payment', 'full payment'].includes(currentInvoice.status);
                      addNotification(isReceipt ? 'Receipt Generating' : 'PDF Generating', `Preparing your high-quality ${isReceipt ? 'receipt' : 'invoice'} document...`, 'info');
                      setTimeout(() => {
                        window.print();
                        addNotification(isReceipt ? 'Receipt Downloaded' : 'PDF Downloaded', `${isReceipt ? 'Receipt' : 'Invoice'} PDF has been generated successfully.`, 'success');
                      }, 1500);
                    }}
                    className="btn-secondary"
                  >
                    <Download className="w-4 h-4" /> {['paid', 'part payment', 'full payment'].includes(currentInvoice.status) ? 'Download Receipt' : 'Download PDF'}
                  </button>
                  <button 
                    onClick={() => {
                      const isReceipt = ['paid', 'part payment', 'full payment'].includes(currentInvoice.status);
                      addNotification('Sending Email', `Sending ${isReceipt ? 'receipt' : 'invoice'} to ${customers.find(c => c.id === currentInvoice.customerId)?.email || 'client'}...`, 'info');
                      setTimeout(() => {
                        addNotification('Email Sent', `${isReceipt ? 'Receipt' : 'Invoice'} ${currentInvoice.invoiceNumber} has been sent to the client and a copy to ${userProfile.email}.`, 'success');
                      }, 2000);
                    }}
                    className="btn-primary"
                  >
                    <Send className="w-4 h-4" /> {['paid', 'part payment', 'full payment'].includes(currentInvoice.status) ? 'Send Receipt' : 'Send to Client'}
                  </button>
                  <button 
                    onClick={() => {
                      const total = (currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + currentInvoice.taxRate/100)).toFixed(2);
                      const text = `Hi, here is your invoice ${currentInvoice.invoiceNumber} from ${userProfile.businessName}.\n\nTotal: $${total}\n\nYou can view and download the PDF here: ${window.location.origin}/invoice/${currentInvoice.id}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="btn-secondary bg-green-50 text-green-600 border-green-100 hover:bg-green-100"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </button>
                </div>
              </div>

              <div className="bg-white shadow-2xl rounded-3xl p-16 border border-slate-100 min-h-[1000px] relative overflow-hidden">
                {/* Decorative Element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32" />
                
                {currentInvoice.status === 'paid' && (
                  <div className="absolute top-20 right-20 rotate-12 border-4 border-green-500 text-green-500 px-6 py-2 rounded-xl font-black text-4xl opacity-20 pointer-events-none">
                    PAID
                  </div>
                )}

                <div className="flex justify-between items-start relative">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      {userProfile.logoUrl ? (
                        <img src={userProfile.logoUrl} className="w-12 h-12 object-contain" />
                      ) : (
                        <Sparkles className="w-10 h-10 text-primary" />
                      )}
                      <span className="text-2xl font-black tracking-tighter">{userProfile.businessName.toUpperCase()}</span>
                    </div>
                    <div className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">
                      {currentInvoice.from}
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-4">
                      {['paid', 'part payment', 'full payment'].includes(currentInvoice.status) ? 'RECEIPT' : 'INVOICE'}
                    </h1>
                    <p className="text-slate-400 font-bold tracking-widest text-xs">NO. {currentInvoice.invoiceNumber}</p>
                    <div className="mt-4 flex justify-end">
                      {getStatusBadge(currentInvoice.status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-16 mt-20">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Billed To</h4>
                    <div className="text-slate-900 font-bold leading-relaxed whitespace-pre-line">
                      {currentInvoice.billTo}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</h4>
                      <div className="text-slate-900 font-bold">{currentInvoice.date}</div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Due Date</h4>
                      <div className="text-slate-900 font-bold">{currentInvoice.dueDate || 'Upon Receipt'}</div>
                    </div>
                  </div>
                </div>

                <table className="w-full mt-20">
                  <thead>
                    <tr className="border-b-2 border-slate-900 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <th className="py-4">Description</th>
                      <th className="py-4 text-right">Qty</th>
                      <th className="py-4 text-right">Rate</th>
                      <th className="py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentInvoice.items.map(item => (
                      <tr key={item.id}>
                        <td className="py-6 font-bold text-slate-900">{item.description}</td>
                        <td className="py-6 text-right text-slate-600">{item.quantity}</td>
                        <td className="py-6 text-right text-slate-600">${item.rate.toFixed(2)}</td>
                        <td className="py-6 text-right font-black text-slate-900">${(item.quantity * item.rate).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-20 flex justify-end">
                  <div className="w-80 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-widest">Subtotal</span>
                      <span className="font-bold text-slate-900">${currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-widest">Tax ({currentInvoice.taxRate}%)</span>
                      <span className="font-bold text-slate-900">
                        ${(currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (currentInvoice.taxRate/100)).toFixed(2)}
                      </span>
                    </div>
                    <div className="pt-6 border-t-4 border-slate-900 flex justify-between items-baseline">
                      <span className="text-xl font-black text-slate-900 uppercase tracking-tighter">Total Due</span>
                      <span className="text-4xl font-black text-primary">
                        ${(currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + currentInvoice.taxRate/100)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-40 pt-10 border-t border-slate-100 grid grid-cols-2 gap-16">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Notes</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{currentInvoice.notes || 'No additional notes.'}</p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Terms</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{currentInvoice.terms || 'Standard terms apply.'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Customers View */}
          {view === 'customers' && (
            <motion.div 
              key="customers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
                  <p className="text-slate-500 mt-1">Manage your client relationships and billing history.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search customers..." 
                      className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 w-64"
                      value={customerSearchQuery}
                      onChange={e => setCustomerSearchQuery(e.target.value)}
                    />
                  </div>
                  <button onClick={() => {
                    setEditingCustomer(null);
                    setNewCustomer({ name: '', email: '', address: '' });
                    setShowAddCustomer(true);
                  }} className="btn-primary">
                    <Plus className="w-4 h-4" /> Add Customer
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredCustomers.map(c => (
                  <div key={c.id} className="glass p-6 rounded-2xl border border-slate-100 hover:border-primary/20 transition-all group">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-primary font-black text-xl group-hover:bg-primary group-hover:text-white transition-colors">
                        {c.name[0]}
                      </div>
                      <button 
                        onClick={() => {
                          setEditingCustomer(c);
                          setNewCustomer({ name: c.name, email: c.email, address: c.address });
                          setShowAddCustomer(true);
                        }}
                        className="text-slate-300 hover:text-primary transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-4">{c.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{c.email}</p>
                    <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Billed</p>
                        <p className="text-xl font-black text-slate-900 mt-1">${c.totalBilled.toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => setViewingCustomerHistory(c)}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <History className="w-3 h-3" /> History
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Cashflow View */}
          {view === 'cashflow' && (
            <motion.div 
              key="cashflow"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Cashflow Forecast</h1>
                  <p className="text-slate-500 mt-1">AI-powered projections based on your billing history.</p>
                </div>
                {isGenerating && <div className="flex items-center gap-2 text-primary text-sm font-bold"><Sparkles className="w-4 h-4 animate-spin" /> Analyzing...</div>}
              </div>

              <div className="glass p-8 rounded-3xl border border-slate-100 h-[400px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} aspect={2.5}>
                  <AreaChart data={cashflowData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10ade6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10ade6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="income" stroke="#10ade6" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                    <Line type="monotone" dataKey="forecast" stroke="#94a3b8" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Next Month Forecast</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">${cashflowData[0]?.forecast?.toLocaleString() || '0'}</h3>
                </div>
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg. Monthly Income</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">${(cashflowData.reduce((a, b) => a + b.income, 0) / (cashflowData.length || 1)).toFixed(0)}</h3>
                </div>
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Growth Trend</p>
                  <h3 className="text-2xl font-black text-green-500 mt-2">+8.4%</h3>
                </div>
              </div>
            </motion.div>
          )}

          {/* Pricing View */}
          {view === 'pricing' && (
            <motion.div 
              key="pricing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Smart Pricing</h1>
                  <p className="text-slate-500 mt-1">AI analysis of your rates compared to market standards.</p>
                </div>
                {isGenerating && <div className="flex items-center gap-2 text-primary text-sm font-bold"><Sparkles className="w-4 h-4 animate-spin" /> Researching...</div>}
              </div>

              <div className="grid grid-cols-1 gap-6">
                {pricingAnalysis.map(item => (
                  <div key={item.id} className="glass p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-grow">
                      <h3 className="text-lg font-bold text-slate-900">{item.itemName}</h3>
                      <p className="text-sm text-slate-500 mt-1">{item.reasoning}</p>
                      <div className="mt-4 flex gap-4">
                        <div className="bg-slate-50 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">Market Avg: ${item.marketAverage}</div>
                        <div className="bg-green-50 px-3 py-1 rounded-full text-[10px] font-bold text-green-600 uppercase tracking-widest">Potential: +${item.potentialRevenueIncrease}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current</p>
                        <p className="text-xl font-black text-slate-400">${item.currentRate}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <ArrowLeft className="w-4 h-4 text-primary rotate-180" />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Suggested</p>
                        <p className="text-2xl font-black text-primary">${item.suggestedRate}</p>
                      </div>
                      <button 
                        onClick={() => {
                          const updated = pricingAnalysis.map(p => p.id === item.id ? { ...p, currentRate: p.suggestedRate } : p);
                          setPricingAnalysis(updated);
                          alert('Rate applied successfully!');
                        }}
                        className="btn-primary ml-4"
                      >
                        Apply Rate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Settings View */}
          {view === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
              
              <div className="space-y-6">
                <div className="glass p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center gap-3 text-slate-900 font-bold">
                    <Globe className="w-5 h-5 text-primary" />
                    Localization
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Currency</label>
                      <select 
                        className="input-base"
                        value={currency.code}
                        onChange={(e) => setCurrency(CURRENCIES.find(c => c.code === e.target.value) || CURRENCIES[0])}
                      >
                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date Format</label>
                      <select className="input-base">
                        <option>YYYY-MM-DD</option>
                        <option>DD/MM/YYYY</option>
                        <option>MM/DD/YYYY</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="glass p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center gap-3 text-slate-900 font-bold">
                    <Bell className="w-5 h-5 text-primary" />
                    Notifications
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Email on payment received', enabled: true },
                      { label: 'Alert on overdue invoices', enabled: true },
                      { label: 'Weekly financial summary', enabled: false }
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">{item.label}</span>
                        <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${item.enabled ? 'bg-primary' : 'bg-slate-200'} relative`}>
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.enabled ? 'right-1' : 'left-1'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Profile View */}
          {view === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="flex justify-between items-end">
                <h1 className="text-3xl font-bold text-slate-900">Business Profile</h1>
                <button 
                  onClick={() => alert('Profile saved successfully!')}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>

              <div className="glass p-8 rounded-3xl border border-slate-100 space-y-8">
                <div className="flex items-center gap-8">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 overflow-hidden">
                      {userProfile.logoUrl ? <img src={userProfile.logoUrl} className="w-full h-full object-contain" /> : <ImageIcon className="w-8 h-8" />}
                    </div>
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      onChange={handleLogoUpload} 
                      className="hidden" 
                      accept="image/*" 
                    />
                    <button 
                      onClick={() => logoInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-primary hover:bg-primary hover:text-white transition-all"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Business Logo</h3>
                    <p className="text-xs text-slate-500 mt-1">Recommended size: 512x512px. PNG or JPG.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Business Name</label>
                    <input 
                      className="input-base" 
                      value={userProfile.businessName}
                      onChange={e => setUserProfile({...userProfile, businessName: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email</label>
                      <input 
                        className="input-base" 
                        value={userProfile.email}
                        onChange={e => setUserProfile({...userProfile, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone</label>
                      <input className="input-base" placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Address</label>
                    <textarea 
                      className="input-base h-24 resize-none" 
                      value={userProfile.address}
                      onChange={e => setUserProfile({...userProfile, address: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Legal View */}
          {view === 'legal' && (
            <motion.div 
              key="legal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex items-center gap-4">
                <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <h1 className="text-3xl font-bold text-slate-900">
                  {legalPage === 'terms' ? 'Terms of Service' : legalPage === 'privacy' ? 'Privacy Policy' : 'Cookie Settings'}
                </h1>
              </div>

              <div className="glass p-12 rounded-3xl border border-slate-100 prose prose-slate max-w-none">
                {legalPage === 'terms' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
                    <p>By accessing and using JAAS Billing Pro AI, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.</p>
                    <h2 className="text-2xl font-bold">2. Use of Service</h2>
                    <p>You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You agree to use the service only for lawful purposes.</p>
                    <h2 className="text-2xl font-bold">3. Intellectual Property</h2>
                    <p>All content and software used in the service are the property of JAAS Billing Pro AI or its suppliers and are protected by copyright and other laws.</p>
                    <h2 className="text-2xl font-bold">4. Limitation of Liability</h2>
                    <p>JAAS Billing Pro AI shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the service.</p>
                  </div>
                )}
                {legalPage === 'privacy' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">1. Information We Collect</h2>
                    <p>We collect information you provide directly to us, such as when you create an account, generate an invoice, or contact us for support.</p>
                    <h2 className="text-2xl font-bold">2. How We Use Information</h2>
                    <p>We use the information we collect to provide, maintain, and improve our services, and to communicate with you about your account and our services.</p>
                    <h2 className="text-2xl font-bold">3. Data Security</h2>
                    <p>We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.</p>
                    <h2 className="text-2xl font-bold">4. Your Choices</h2>
                    <p>You may update or correct information about yourself at any time by logging into your account or contacting us.</p>
                  </div>
                )}
                {legalPage === 'cookies' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">1. What are Cookies?</h2>
                    <p>Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work or work more efficiently.</p>
                    <h2 className="text-2xl font-bold">2. How We Use Cookies</h2>
                    <p>We use cookies to understand how you use our service and to improve your experience. This includes remembering your preferences and settings.</p>
                    <h2 className="text-2xl font-bold">3. Managing Cookies</h2>
                    <p>Most web browsers allow you to control cookies through their settings. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Customer Modal */}
      <AnimatePresence>
        {showAddCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddCustomer(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-100"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input 
                    className="input-base" 
                    placeholder="e.g. John Doe"
                    value={newCustomer.name}
                    onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input 
                    className="input-base" 
                    placeholder="john@example.com"
                    value={newCustomer.email}
                    onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Address</label>
                  <textarea 
                    className="input-base h-24 resize-none" 
                    placeholder="123 Business Way..."
                    value={newCustomer.address}
                    onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => {
                    setShowAddCustomer(false);
                    setEditingCustomer(null);
                  }} className="flex-1 btn-secondary">Cancel</button>
                  <button onClick={handleAddCustomer} className="flex-1 btn-primary">
                    {editingCustomer ? 'Update Customer' : 'Create Customer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customer History Modal */}
      <AnimatePresence>
        {viewingCustomerHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingCustomerHistory(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 border border-slate-100 max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Billing History</h2>
                  <p className="text-sm text-slate-500">{viewingCustomerHistory.name}</p>
                </div>
                <button onClick={() => setViewingCustomerHistory(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                {invoices.filter(inv => inv.customerId === viewingCustomerHistory.id).length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No invoices found for this customer.</p>
                  </div>
                ) : (
                  invoices
                    .filter(inv => inv.customerId === viewingCustomerHistory.id)
                    .map(inv => (
                      <div key={inv.id} className="flex justify-between items-center p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="font-bold text-slate-900">{inv.invoiceNumber}</p>
                          <p className="text-xs text-slate-500">{inv.date}</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="font-bold text-slate-900">
                              ${(inv.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + inv.taxRate/100)).toFixed(2)}
                            </p>
                            <div className="mt-1">{getStatusBadge(inv.status)}</div>
                          </div>
                          <button 
                            onClick={() => {
                              setCurrentInvoice(inv);
                              setView('preview');
                              setViewingCustomerHistory(null);
                            }}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <PlayCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-slate-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary w-6 h-6" />
              <span className="font-bold text-lg tracking-tight">JAAS Billing Pro AI</span>
            </div>
            
            <nav className="flex flex-wrap justify-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <button onClick={() => { setLegalPage('terms'); setView('legal'); }} className="hover:text-primary transition-colors">Terms of Service</button>
              <button onClick={() => { setLegalPage('privacy'); setView('legal'); }} className="hover:text-primary transition-colors">Privacy Policy</button>
              <button onClick={() => { setLegalPage('cookies'); setView('legal'); }} className="hover:text-primary transition-colors">Cookie Settings</button>
            </nav>

            <div className="flex items-center gap-4">
              <a href="https://www.facebook.com/Alston332" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-primary transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="https://www.youtube.com/@Alston332" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-primary transition-colors"><Youtube className="w-5 h-5" /></a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium">© 2026 JAAS Billing Pro AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Confirm Save Customer Modal */}
      <AnimatePresence>
        {showConfirmSaveCustomer && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmSaveCustomer(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 border border-slate-100 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Save className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Save Changes?</h2>
              <p className="text-slate-500 mb-8">Are you sure you want to save the changes for this customer?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmSaveCustomer(false)} className="flex-1 btn-secondary">Cancel</button>
                <button onClick={confirmSaveCustomer} className="flex-1 btn-primary">Yes, Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
, name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C
const initialCustomers: Customer[] = [
  { id: 'c1', name: 'Acme Corp', email: 'billing@acme.com', address: '123 Industrial Way, CA', totalBilled: 4500 },
  { id: 'c2', name: 'Global Tech', email: 'finance@globaltech.io', address: '456 Innovation Blvd, NY', totalBilled: 12000 },
  { id: 'c3', name: 'Local Bakery', email: 'hello@localbakery.com', address: '789 Main St, TX', totalBilled: 850 }
];

const initialInvoices: InvoiceData[] = [
  {
    id: 'inv1',
    invoiceNumber: 'INV-001',
    status: 'paid',
    date: '2024-03-01',
    dueDate: '2024-03-15',
    paymentTerms: 'Net 15',
    from: 'My Small Business LLC\n123 My St, City, ST 12345',
    customerId: 'c1',
    billTo: 'Acme Corp\n123 Industrial Way, CA',
    shipTo: '',
    items: [{ id: 'i1', description: 'Web Design Services', quantity: 1, rate: 2500 }],
    notes: 'Thank you for your business!',
    terms: 'Payment is due within 15 days.',
    taxRate: 8,
    amountPaid: 2700,
    discount: 0,
    shipping: 0,
    currency: 'USD ($)'
  },
  {
    id: 'inv2',
    invoiceNumber: 'INV-002',
    status: 'overdue',
    date: '2024-02-15',
    dueDate: '2024-03-01',
    paymentTerms: 'Net 15',
    from: 'My Small Business LLC\n123 My St, City, ST 12345',
    customerId: 'c2',
    billTo: 'Global Tech\n456 Innovation Blvd, NY',
    shipTo: '',
    items: [{ id: 'i2', description: 'Consulting', quantity: 10, rate: 150 }],
    notes: '',
    terms: '',
    taxRate: 0,
    amountPaid: 0,
    discount: 0,
    shipping: 0,
    currency: 'USD ($)'
  }
];

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [invoices, setInvoices] = useState<InvoiceData[]>(initialInvoices);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New State
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'Payment Received', message: 'Acme Corp paid INV-001', type: 'success', date: '2024-03-05', read: false },
    { id: '2', title: 'Invoice Overdue', message: 'Global Tech is 5 days late', type: 'warning', date: '2024-03-01', read: false }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    businessName: 'My Small Business LLC',
    email: 'mike@mybiz.com',
    address: '123 My St, City, ST 12345',
    logoUrl: ''
  });
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [cashflowData, setCashflowData] = useState<CashflowData[]>([]);
  const [pricingAnalysis, setPricingAnalysis] = useState<PricingAnalysis[]>([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', address: '' });
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomerHistory, setViewingCustomerHistory] = useState<Customer | null>(null);
  const [showConfirmSaveCustomer, setShowConfirmSaveCustomer] = useState(false);
  const [legalPage, setLegalPage] = useState<LegalPage>('terms');
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  const addNotification = (title: string, message: string, type: 'info' | 'warning' | 'success') => {
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      date: new Date().toISOString().split('T')[0],
      read: false
    };
    setNotifications([newNotification, ...notifications]);
  };

  // Dashboard Stats
  const stats = useMemo(() => {
    const totalBilled = invoices.reduce((acc, inv) => {
      const sub = inv.items.reduce((a, i) => a + (i.quantity * i.rate), 0);
      return acc + sub + (sub * (inv.taxRate / 100)) - inv.discount + inv.shipping;
    }, 0);
    const pending = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length;
    const overdue = invoices.filter(i => i.status === 'overdue').length;
    return { totalBilled, pending, overdue };
  }, [invoices]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearchQuery.toLowerCase())
    );
  }, [customers, customerSearchQuery]);

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.billTo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateInvoice = () => {
    // Auto-increment invoice number
    const lastInvoiceNumber = invoices.reduce((max, inv) => {
      const num = parseInt(inv.invoiceNumber.replace('INV-', ''));
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);

    const newInv: InvoiceData = {
      id: Math.random().toString(36).substr(2, 9),
      invoiceNumber: `INV-${(lastInvoiceNumber + 1).toString().padStart(3, '0')}`,
      status: 'draft',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      paymentTerms: 'Net 30',
      from: 'My Small Business LLC\n123 My St, City, ST 12345',
      customerId: '',
      billTo: '',
      shipTo: '',
      items: [{ id: '1', description: '', quantity: 1, rate: 0 }],
      notes: '',
      terms: '',
      taxRate: 0,
      amountPaid: 0,
      discount: 0,
      shipping: 0,
      currency: 'USD ($)'
    };
    setCurrentInvoice(newInv);
    setView('editor');
  };

  const handleEditInvoice = (inv: InvoiceData) => {
    setCurrentInvoice(inv);
    setView('editor');
  };

  const handlePreview = () => {
    if (currentInvoice) setView('preview');
  };

  const handleSave = () => {
    if (currentInvoice) {
      setInvoices(prev => {
        const exists = prev.find(i => i.id === currentInvoice.id);
        if (exists) return prev.map(i => i.id === currentInvoice.id ? currentInvoice : i);
        return [currentInvoice, ...prev];
      });
      setView('dashboard');
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid': return <span className="badge bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Paid</span>;
      case 'full payment': return <span className="badge bg-emerald-100 text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Full Payment</span>;
      case 'part payment': return <span className="badge bg-amber-100 text-amber-700 flex items-center gap-1"><Clock className="w-3 h-3" /> Part Payment</span>;
      case 'overdue': return <span className="badge bg-red-100 text-red-700 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Overdue</span>;
      case 'sent': return <span className="badge bg-blue-100 text-blue-700 flex items-center gap-1"><Send className="w-3 h-3" /> Sent</span>;
      default: return <span className="badge bg-slate-100 text-slate-700 flex items-center gap-1"><Clock className="w-3 h-3" /> Draft</span>;
    }
  };

  // AI Insights Trigger
  useEffect(() => {
    if (view === 'editor' && currentInvoice) {
      const timer = setTimeout(async () => {
        setIsGenerating(true);
        const newInsights = await generateSmartInsights(currentInvoice);
        setInsights(newInsights);
        setIsGenerating(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentInvoice?.items, currentInvoice?.taxRate, view]);

  useEffect(() => {
    if (view === 'cashflow' && cashflowData.length === 0) {
      setIsGenerating(true);
      forecastCashflow(invoices).then(data => {
        setCashflowData(data);
        setIsGenerating(false);
      });
    }
    if (view === 'pricing' && pricingAnalysis.length === 0) {
      setIsGenerating(true);
      const allItems = invoices.flatMap(inv => inv.items);
      analyzePricing(allItems).then(data => {
        setPricingAnalysis(data);
        setIsGenerating(false);
      });
    }
  }, [view, invoices]);

  const handleAddCustomer = () => {
    if (newCustomer.name && newCustomer.email) {
      setShowConfirmSaveCustomer(true);
    }
  };

  const confirmSaveCustomer = () => {
    if (editingCustomer) {
      setCustomers(customers.map(c => c.id === editingCustomer.id ? { ...c, ...newCustomer } : c));
      addNotification('Customer Updated', `${newCustomer.name}'s details have been updated.`, 'success');
    } else {
      const customer: Customer = {
        id: Math.random().toString(36).substr(2, 9),
        name: newCustomer.name,
        email: newCustomer.email,
        address: newCustomer.address,
        totalBilled: 0
      };
      setCustomers([...customers, customer]);
      addNotification('Customer Added', `${newCustomer.name} has been added to your list.`, 'success');
    }
    setNewCustomer({ name: '', email: '', address: '' });
    setEditingCustomer(null);
    setShowAddCustomer(false);
    setShowConfirmSaveCustomer(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile({ ...userProfile, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-40 w-full glass border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('dashboard')}>
              <Sparkles className="text-primary w-8 h-8" />
              <span className="font-bold text-xl tracking-tight flex items-center">
                JAAS Billing Pro
                <span className="text-primary text-xs font-semibold ml-1.5 px-2 py-0.5 rounded-full bg-sky-50">AI</span>
              </span>
            </div>
            
            <nav className="hidden md:flex space-x-6">
              <button 
                onClick={() => setView('dashboard')}
                className={`flex items-center gap-2 font-medium transition-colors ${view === 'dashboard' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>
              <button 
                onClick={() => setView('customers')}
                className={`flex items-center gap-2 font-medium transition-colors ${view === 'customers' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
              >
                <Users className="w-4 h-4" /> Customers
              </button>
              <button 
                onClick={() => setView('cashflow')}
                className={`flex items-center gap-2 font-medium transition-colors ${view === 'cashflow' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
              >
                <BarChart3 className="w-4 h-4" /> Cashflow
              </button>
              <button 
                onClick={() => setView('pricing')}
                className={`flex items-center gap-2 font-medium transition-colors ${view === 'pricing' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
              >
                <DollarSign className="w-4 h-4" /> Pricing
              </button>
            </nav>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.some(n => !n.read) && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
                </button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center">
                        <span className="font-bold text-sm">Notifications</span>
                        <button onClick={() => setNotifications(n => n.map(x => ({...x, read: true})))} className="text-[10px] text-primary font-bold hover:underline">Mark all as read</button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs">No notifications</div>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-sky-50/30' : ''}`}>
                              <p className="text-xs font-bold text-slate-800">{n.title}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{n.message}</p>
                              <p className="text-[8px] text-slate-400 mt-1">{n.date}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <button onClick={() => setView('settings')} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div 
                onClick={() => setView('profile')}
                className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
              >
                {userProfile.businessName[0]}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Dashboard View */}
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Free Invoice Template</h1>
                  <p className="text-slate-500 mt-2 max-w-2xl">
                    Make beautiful Invoices with one click! Welcome to the original JAAS Billing Pro AI Invoice Generator. 
                    Instantly make Invoices with our attractive template straight from your browser. 
                    Generate an unlimited number of Invoices for free.
                  </p>
                </div>
                <button onClick={handleCreateInvoice} className="btn-primary">
                  <Plus className="w-4 h-4" /> New Invoice
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-sm font-medium text-slate-500">Total Billed</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">${stats.totalBilled.toLocaleString()}</h3>
                  <div className="mt-4 flex items-center text-xs text-green-600 font-bold">
                    <TrendingUp className="w-3 h-3 mr-1" /> +12% from last month
                  </div>
                </div>
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-sm font-medium text-slate-500">Pending Invoices</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.pending}</h3>
                  <p className="mt-4 text-xs text-slate-400">Awaiting payment from 4 customers</p>
                </div>
                <div className="glass p-6 rounded-2xl border border-red-100 bg-red-50/10">
                  <p className="text-sm font-medium text-slate-500">Overdue</p>
                  <h3 className="text-3xl font-bold text-red-600 mt-2">{stats.overdue}</h3>
                  <div className="mt-4 flex items-center text-xs text-red-600 font-bold">
                    <AlertCircle className="w-3 h-3 mr-1" /> Action required
                  </div>
                </div>
              </div>

              {/* Recent Invoices */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-900">Recent Invoices</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search invoices..." 
                      className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 w-64"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="glass rounded-2xl overflow-hidden border border-slate-100">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Invoice</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                          <td className="px-6 py-4 text-slate-600">{inv.billTo.split('\n')[0]}</td>
                          <td className="px-6 py-4 text-slate-500 text-sm">{inv.date}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">
                            ${(inv.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + inv.taxRate/100)).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleEditInvoice(inv)}
                              className="text-primary hover:text-sky-600 font-bold text-sm"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Editor View */}
          {view === 'editor' && currentInvoice && (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col lg:flex-row gap-8"
            >
              <div className="flex-grow lg:w-2/3 space-y-6">
                <div className="flex items-center gap-4 mb-2">
                  <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                  </button>
                  <h1 className="text-2xl font-bold text-slate-900">Edit Invoice</h1>
                </div>

                <div className="glass rounded-2xl p-8 border border-slate-100">
                  {/* Form Header */}
                  <div className="flex justify-between items-start mb-12">
                    <div className="space-y-4">
                      <div 
                        onClick={() => logoInputRef.current?.click()}
                        className="w-40 h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer overflow-hidden"
                      >
                        {userProfile.logoUrl ? (
                          <img src={userProfile.logoUrl} className="w-full h-full object-contain" />
                        ) : (
                          <>
                            <ImageIcon className="w-6 h-6 mb-1" />
                            <span className="text-[10px] font-bold uppercase">Logo</span>
                          </>
                        )}
                      </div>
                      <textarea 
                        className="w-full bg-transparent border-none p-0 focus:ring-0 resize-none placeholder-slate-300 text-sm font-medium"
                        placeholder="Your Business Details..."
                        rows={3}
                        value={currentInvoice.from}
                        onChange={e => setCurrentInvoice({...currentInvoice, from: e.target.value})}
                      />
                    </div>
                    <div className="text-right space-y-4">
                      <h2 className="text-4xl font-light text-primary tracking-tighter">INVOICE</h2>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center justify-end">
                          <span className="text-slate-400 mr-2 text-sm font-bold">#</span>
                          <input 
                            className="w-24 text-right bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 font-bold"
                            value={currentInvoice.invoiceNumber}
                            onChange={e => setCurrentInvoice({...currentInvoice, invoiceNumber: e.target.value})}
                          />
                        </div>
                        <div className="flex items-center justify-end">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Status</label>
                          <select 
                            className="text-xs font-bold bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 p-1"
                            value={currentInvoice.status}
                            onChange={e => setCurrentInvoice({...currentInvoice, status: e.target.value as InvoiceStatus})}
                          >
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="paid">Paid</option>
                            <option value="part payment">Part Payment</option>
                            <option value="full payment">Full Payment</option>
                            <option value="overdue">Overdue</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bill To</label>
                      <select 
                        className="input-base"
                        onChange={e => {
                          const c = customers.find(cust => cust.id === e.target.value);
                          if (c) setCurrentInvoice({...currentInvoice, customerId: c.id, billTo: `${c.name}\n${c.address}`});
                        }}
                        value={currentInvoice.customerId}
                      >
                        <option value="">Select a customer...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <textarea 
                        className="input-base h-24 resize-none"
                        placeholder="Customer details..."
                        value={currentInvoice.billTo}
                        onChange={e => setCurrentInvoice({...currentInvoice, billTo: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Date', type: 'date', key: 'date' },
                        { label: 'Due Date', type: 'date', key: 'dueDate' },
                        { label: 'Terms', type: 'text', key: 'paymentTerms' }
                      ].map(f => (
                        <div key={f.key} className="flex items-center justify-end gap-4">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{f.label}</label>
                          <input 
                            type={f.type}
                            className="w-40 input-base"
                            value={(currentInvoice as any)[f.key]}
                            onChange={e => setCurrentInvoice({...currentInvoice, [f.key]: e.target.value})}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="mb-8">
                    <div className="overflow-hidden rounded-xl border border-slate-100">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                          <tr>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3 text-right">Qty</th>
                            <th className="px-4 py-3 text-right">Rate</th>
                            <th className="px-4 py-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentInvoice.items.map(item => (
                            <tr key={item.id}>
                              <td className="p-2">
                                <input 
                                  className="w-full bg-transparent border-none focus:ring-0 text-sm"
                                  placeholder="Item description..."
                                  value={item.description}
                                  onChange={e => {
                                    const items = currentInvoice.items.map(i => i.id === item.id ? {...i, description: e.target.value} : i);
                                    setCurrentInvoice({...currentInvoice, items});
                                  }}
                                />
                              </td>
                              <td className="p-2">
                                <input 
                                  type="number"
                                  className="w-full text-right bg-transparent border-none focus:ring-0 text-sm"
                                  value={item.quantity}
                                  onChange={e => {
                                    const items = currentInvoice.items.map(i => i.id === item.id ? {...i, quantity: parseFloat(e.target.value) || 0} : i);
                                    setCurrentInvoice({...currentInvoice, items});
                                  }}
                                />
                              </td>
                              <td className="p-2">
                                <input 
                                  type="number"
                                  className="w-full text-right bg-transparent border-none focus:ring-0 text-sm"
                                  value={item.rate}
                                  onChange={e => {
                                    const items = currentInvoice.items.map(i => i.id === item.id ? {...i, rate: parseFloat(e.target.value) || 0} : i);
                                    setCurrentInvoice({...currentInvoice, items});
                                  }}
                                />
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                                ${(item.quantity * item.rate).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button 
                      onClick={() => {
                        const items = [...currentInvoice.items, { id: Math.random().toString(), description: '', quantity: 1, rate: 0 }];
                        setCurrentInvoice({...currentInvoice, items});
                      }}
                      className="mt-4 flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-widest hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Add Item
                    </button>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end pt-8 border-t border-slate-100">
                    <div className="w-64 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-bold">${currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Tax (%)</span>
                        <input 
                          type="number"
                          className="w-16 text-right bg-slate-50 border-none rounded p-1 text-sm font-bold"
                          value={currentInvoice.taxRate}
                          onChange={e => setCurrentInvoice({...currentInvoice, taxRate: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div className="flex justify-between pt-3 border-t border-slate-100">
                        <span className="font-bold text-slate-900">Total</span>
                        <span className="text-2xl font-black text-primary">
                          ${(currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + currentInvoice.taxRate/100)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editor Sidebar */}
              <div className="lg:w-1/3 space-y-6">
                <div className="glass p-4 rounded-2xl flex gap-3">
                  <button onClick={handlePreview} className="flex-1 btn-primary">
                    <Printer className="w-4 h-4" /> Preview
                  </button>
                  <button onClick={handleSave} className="btn-secondary">
                    Save
                  </button>
                </div>

                {/* AI Insights */}
                <div className="glass bg-gradient-to-br from-primary/5 to-white rounded-2xl overflow-hidden border border-primary/10">
                  <div className="p-5 border-b border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <h3 className="font-bold text-slate-800">AI Assistant</h3>
                    </div>
                    {isGenerating && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles className="w-4 h-4 text-primary/50" /></motion.div>}
                  </div>
                  <div className="p-5 space-y-4">
                    {insights.map(insight => (
                      <div key={insight.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex gap-3">
                          {insight.type === 'optimization' ? <TrendingUp className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                          <div>
                            <p className="text-xs font-bold text-slate-800">{insight.title}</p>
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{insight.description}</p>
                            {insight.actionText && <button className="text-[10px] font-bold text-primary mt-2 hover:underline">{insight.actionText}</button>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Preview View */}
          {view === 'preview' && currentInvoice && (
            <motion.div 
              key="preview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex justify-between items-center">
                <button onClick={() => setView('editor')} className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-primary transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Editor
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      const isReceipt = ['paid', 'part payment', 'full payment'].includes(currentInvoice.status);
                      addNotification(isReceipt ? 'Receipt Generating' : 'PDF Generating', `Preparing your high-quality ${isReceipt ? 'receipt' : 'invoice'} document...`, 'info');
                      setTimeout(() => {
                        window.print();
                        addNotification(isReceipt ? 'Receipt Downloaded' : 'PDF Downloaded', `${isReceipt ? 'Receipt' : 'Invoice'} PDF has been generated successfully.`, 'success');
                      }, 1500);
                    }}
                    className="btn-secondary"
                  >
                    <Download className="w-4 h-4" /> {['paid', 'part payment', 'full payment'].includes(currentInvoice.status) ? 'Download Receipt' : 'Download PDF'}
                  </button>
                  <button 
                    onClick={() => {
                      const isReceipt = ['paid', 'part payment', 'full payment'].includes(currentInvoice.status);
                      addNotification('Sending Email', `Sending ${isReceipt ? 'receipt' : 'invoice'} to ${customers.find(c => c.id === currentInvoice.customerId)?.email || 'client'}...`, 'info');
                      setTimeout(() => {
                        addNotification('Email Sent', `${isReceipt ? 'Receipt' : 'Invoice'} ${currentInvoice.invoiceNumber} has been sent to the client and a copy to ${userProfile.email}.`, 'success');
                      }, 2000);
                    }}
                    className="btn-primary"
                  >
                    <Send className="w-4 h-4" /> {['paid', 'part payment', 'full payment'].includes(currentInvoice.status) ? 'Send Receipt' : 'Send to Client'}
                  </button>
                  <button 
                    onClick={() => {
                      const total = (currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + currentInvoice.taxRate/100)).toFixed(2);
                      const text = `Hi, here is your invoice ${currentInvoice.invoiceNumber} from ${userProfile.businessName}.\n\nTotal: $${total}\n\nYou can view and download the PDF here: ${window.location.origin}/invoice/${currentInvoice.id}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="btn-secondary bg-green-50 text-green-600 border-green-100 hover:bg-green-100"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </button>
                </div>
              </div>

              <div className="bg-white shadow-2xl rounded-3xl p-16 border border-slate-100 min-h-[1000px] relative overflow-hidden">
                {/* Decorative Element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32" />
                
                {currentInvoice.status === 'paid' && (
                  <div className="absolute top-20 right-20 rotate-12 border-4 border-green-500 text-green-500 px-6 py-2 rounded-xl font-black text-4xl opacity-20 pointer-events-none">
                    PAID
                  </div>
                )}

                <div className="flex justify-between items-start relative">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      {userProfile.logoUrl ? (
                        <img src={userProfile.logoUrl} className="w-12 h-12 object-contain" />
                      ) : (
                        <Sparkles className="w-10 h-10 text-primary" />
                      )}
                      <span className="text-2xl font-black tracking-tighter">{userProfile.businessName.toUpperCase()}</span>
                    </div>
                    <div className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">
                      {currentInvoice.from}
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-4">
                      {['paid', 'part payment', 'full payment'].includes(currentInvoice.status) ? 'RECEIPT' : 'INVOICE'}
                    </h1>
                    <p className="text-slate-400 font-bold tracking-widest text-xs">NO. {currentInvoice.invoiceNumber}</p>
                    <div className="mt-4 flex justify-end">
                      {getStatusBadge(currentInvoice.status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-16 mt-20">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Billed To</h4>
                    <div className="text-slate-900 font-bold leading-relaxed whitespace-pre-line">
                      {currentInvoice.billTo}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</h4>
                      <div className="text-slate-900 font-bold">{currentInvoice.date}</div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Due Date</h4>
                      <div className="text-slate-900 font-bold">{currentInvoice.dueDate || 'Upon Receipt'}</div>
                    </div>
                  </div>
                </div>

                <table className="w-full mt-20">
                  <thead>
                    <tr className="border-b-2 border-slate-900 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <th className="py-4">Description</th>
                      <th className="py-4 text-right">Qty</th>
                      <th className="py-4 text-right">Rate</th>
                      <th className="py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentInvoice.items.map(item => (
                      <tr key={item.id}>
                        <td className="py-6 font-bold text-slate-900">{item.description}</td>
                        <td className="py-6 text-right text-slate-600">{item.quantity}</td>
                        <td className="py-6 text-right text-slate-600">${item.rate.toFixed(2)}</td>
                        <td className="py-6 text-right font-black text-slate-900">${(item.quantity * item.rate).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-20 flex justify-end">
                  <div className="w-80 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-widest">Subtotal</span>
                      <span className="font-bold text-slate-900">${currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-widest">Tax ({currentInvoice.taxRate}%)</span>
                      <span className="font-bold text-slate-900">
                        ${(currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (currentInvoice.taxRate/100)).toFixed(2)}
                      </span>
                    </div>
                    <div className="pt-6 border-t-4 border-slate-900 flex justify-between items-baseline">
                      <span className="text-xl font-black text-slate-900 uppercase tracking-tighter">Total Due</span>
                      <span className="text-4xl font-black text-primary">
                        ${(currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + currentInvoice.taxRate/100)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-40 pt-10 border-t border-slate-100 grid grid-cols-2 gap-16">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Notes</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{currentInvoice.notes || 'No additional notes.'}</p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Terms</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{currentInvoice.terms || 'Standard terms apply.'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Customers View */}
          {view === 'customers' && (
            <motion.div 
              key="customers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
                  <p className="text-slate-500 mt-1">Manage your client relationships and billing history.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search customers..." 
                      className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 w-64"
                      value={customerSearchQuery}
                      onChange={e => setCustomerSearchQuery(e.target.value)}
                    />
                  </div>
                  <button onClick={() => {
                    setEditingCustomer(null);
                    setNewCustomer({ name: '', email: '', address: '' });
                    setShowAddCustomer(true);
                  }} className="btn-primary">
                    <Plus className="w-4 h-4" /> Add Customer
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredCustomers.map(c => (
                  <div key={c.id} className="glass p-6 rounded-2xl border border-slate-100 hover:border-primary/20 transition-all group">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-primary font-black text-xl group-hover:bg-primary group-hover:text-white transition-colors">
                        {c.name[0]}
                      </div>
                      <button 
                        onClick={() => {
                          setEditingCustomer(c);
                          setNewCustomer({ name: c.name, email: c.email, address: c.address });
                          setShowAddCustomer(true);
                        }}
                        className="text-slate-300 hover:text-primary transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-4">{c.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{c.email}</p>
                    <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Billed</p>
                        <p className="text-xl font-black text-slate-900 mt-1">${c.totalBilled.toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => setViewingCustomerHistory(c)}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <History className="w-3 h-3" /> History
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Cashflow View */}
          {view === 'cashflow' && (
            <motion.div 
              key="cashflow"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Cashflow Forecast</h1>
                  <p className="text-slate-500 mt-1">AI-powered projections based on your billing history.</p>
                </div>
                {isGenerating && <div className="flex items-center gap-2 text-primary text-sm font-bold"><Sparkles className="w-4 h-4 animate-spin" /> Analyzing...</div>}
              </div>

              <div className="glass p-8 rounded-3xl border border-slate-100 h-[400px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} aspect={2.5}>
                  <AreaChart data={cashflowData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10ade6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10ade6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="income" stroke="#10ade6" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                    <Line type="monotone" dataKey="forecast" stroke="#94a3b8" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Next Month Forecast</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">${cashflowData[0]?.forecast?.toLocaleString() || '0'}</h3>
                </div>
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg. Monthly Income</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">${(cashflowData.reduce((a, b) => a + b.income, 0) / (cashflowData.length || 1)).toFixed(0)}</h3>
                </div>
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Growth Trend</p>
                  <h3 className="text-2xl font-black text-green-500 mt-2">+8.4%</h3>
                </div>
              </div>
            </motion.div>
          )}

          {/* Pricing View */}
          {view === 'pricing' && (
            <motion.div 
              key="pricing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Smart Pricing</h1>
                  <p className="text-slate-500 mt-1">AI analysis of your rates compared to market standards.</p>
                </div>
                {isGenerating && <div className="flex items-center gap-2 text-primary text-sm font-bold"><Sparkles className="w-4 h-4 animate-spin" /> Researching...</div>}
              </div>

              <div className="grid grid-cols-1 gap-6">
                {pricingAnalysis.map(item => (
                  <div key={item.id} className="glass p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-grow">
                      <h3 className="text-lg font-bold text-slate-900">{item.itemName}</h3>
                      <p className="text-sm text-slate-500 mt-1">{item.reasoning}</p>
                      <div className="mt-4 flex gap-4">
                        <div className="bg-slate-50 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">Market Avg: ${item.marketAverage}</div>
                        <div className="bg-green-50 px-3 py-1 rounded-full text-[10px] font-bold text-green-600 uppercase tracking-widest">Potential: +${item.potentialRevenueIncrease}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current</p>
                        <p className="text-xl font-black text-slate-400">${item.currentRate}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <ArrowLeft className="w-4 h-4 text-primary rotate-180" />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Suggested</p>
                        <p className="text-2xl font-black text-primary">${item.suggestedRate}</p>
                      </div>
                      <button 
                        onClick={() => {
                          const updated = pricingAnalysis.map(p => p.id === item.id ? { ...p, currentRate: p.suggestedRate } : p);
                          setPricingAnalysis(updated);
                          alert('Rate applied successfully!');
                        }}
                        className="btn-primary ml-4"
                      >
                        Apply Rate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Settings View */}
          {view === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
              
              <div className="space-y-6">
                <div className="glass p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center gap-3 text-slate-900 font-bold">
                    <Globe className="w-5 h-5 text-primary" />
                    Localization
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Currency</label>
                      <select 
                        className="input-base"
                        value={currency.code}
                        onChange={(e) => setCurrency(CURRENCIES.find(c => c.code === e.target.value) || CURRENCIES[0])}
                      >
                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date Format</label>
                      <select className="input-base">
                        <option>YYYY-MM-DD</option>
                        <option>DD/MM/YYYY</option>
                        <option>MM/DD/YYYY</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="glass p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center gap-3 text-slate-900 font-bold">
                    <Bell className="w-5 h-5 text-primary" />
                    Notifications
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Email on payment received', enabled: true },
                      { label: 'Alert on overdue invoices', enabled: true },
                      { label: 'Weekly financial summary', enabled: false }
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">{item.label}</span>
                        <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${item.enabled ? 'bg-primary' : 'bg-slate-200'} relative`}>
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.enabled ? 'right-1' : 'left-1'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Profile View */}
          {view === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="flex justify-between items-end">
                <h1 className="text-3xl font-bold text-slate-900">Business Profile</h1>
                <button 
                  onClick={() => alert('Profile saved successfully!')}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>

              <div className="glass p-8 rounded-3xl border border-slate-100 space-y-8">
                <div className="flex items-center gap-8">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 overflow-hidden">
                      {userProfile.logoUrl ? <img src={userProfile.logoUrl} className="w-full h-full object-contain" /> : <ImageIcon className="w-8 h-8" />}
                    </div>
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      onChange={handleLogoUpload} 
                      className="hidden" 
                      accept="image/*" 
                    />
                    <button 
                      onClick={() => logoInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-primary hover:bg-primary hover:text-white transition-all"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Business Logo</h3>
                    <p className="text-xs text-slate-500 mt-1">Recommended size: 512x512px. PNG or JPG.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Business Name</label>
                    <input 
                      className="input-base" 
                      value={userProfile.businessName}
                      onChange={e => setUserProfile({...userProfile, businessName: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email</label>
                      <input 
                        className="input-base" 
                        value={userProfile.email}
                        onChange={e => setUserProfile({...userProfile, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone</label>
                      <input className="input-base" placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Address</label>
                    <textarea 
                      className="input-base h-24 resize-none" 
                      value={userProfile.address}
                      onChange={e => setUserProfile({...userProfile, address: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Legal View */}
          {view === 'legal' && (
            <motion.div 
              key="legal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex items-center gap-4">
                <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <h1 className="text-3xl font-bold text-slate-900">
                  {legalPage === 'terms' ? 'Terms of Service' : legalPage === 'privacy' ? 'Privacy Policy' : 'Cookie Settings'}
                </h1>
              </div>

              <div className="glass p-12 rounded-3xl border border-slate-100 prose prose-slate max-w-none">
                {legalPage === 'terms' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
                    <p>By accessing and using JAAS Billing Pro AI, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.</p>
                    <h2 className="text-2xl font-bold">2. Use of Service</h2>
                    <p>You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You agree to use the service only for lawful purposes.</p>
                    <h2 className="text-2xl font-bold">3. Intellectual Property</h2>
                    <p>All content and software used in the service are the property of JAAS Billing Pro AI or its suppliers and are protected by copyright and other laws.</p>
                    <h2 className="text-2xl font-bold">4. Limitation of Liability</h2>
                    <p>JAAS Billing Pro AI shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the service.</p>
                  </div>
                )}
                {legalPage === 'privacy' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">1. Information We Collect</h2>
                    <p>We collect information you provide directly to us, such as when you create an account, generate an invoice, or contact us for support.</p>
                    <h2 className="text-2xl font-bold">2. How We Use Information</h2>
                    <p>We use the information we collect to provide, maintain, and improve our services, and to communicate with you about your account and our services.</p>
                    <h2 className="text-2xl font-bold">3. Data Security</h2>
                    <p>We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.</p>
                    <h2 className="text-2xl font-bold">4. Your Choices</h2>
                    <p>You may update or correct information about yourself at any time by logging into your account or contacting us.</p>
                  </div>
                )}
                {legalPage === 'cookies' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">1. What are Cookies?</h2>
                    <p>Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work or work more efficiently.</p>
                    <h2 className="text-2xl font-bold">2. How We Use Cookies</h2>
                    <p>We use cookies to understand how you use our service and to improve your experience. This includes remembering your preferences and settings.</p>
                    <h2 className="text-2xl font-bold">3. Managing Cookies</h2>
                    <p>Most web browsers allow you to control cookies through their settings. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Customer Modal */}
      <AnimatePresence>
        {showAddCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddCustomer(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-100"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input 
                    className="input-base" 
                    placeholder="e.g. John Doe"
                    value={newCustomer.name}
                    onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input 
                    className="input-base" 
                    placeholder="john@example.com"
                    value={newCustomer.email}
                    onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Address</label>
                  <textarea 
                    className="input-base h-24 resize-none" 
                    placeholder="123 Business Way..."
                    value={newCustomer.address}
                    onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => {
                    setShowAddCustomer(false);
                    setEditingCustomer(null);
                  }} className="flex-1 btn-secondary">Cancel</button>
                  <button onClick={handleAddCustomer} className="flex-1 btn-primary">
                    {editingCustomer ? 'Update Customer' : 'Create Customer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customer History Modal */}
      <AnimatePresence>
        {viewingCustomerHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingCustomerHistory(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 border border-slate-100 max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Billing History</h2>
                  <p className="text-sm text-slate-500">{viewingCustomerHistory.name}</p>
                </div>
                <button onClick={() => setViewingCustomerHistory(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                {invoices.filter(inv => inv.customerId === viewingCustomerHistory.id).length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No invoices found for this customer.</p>
                  </div>
                ) : (
                  invoices
                    .filter(inv => inv.customerId === viewingCustomerHistory.id)
                    .map(inv => (
                      <div key={inv.id} className="flex justify-between items-center p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="font-bold text-slate-900">{inv.invoiceNumber}</p>
                          <p className="text-xs text-slate-500">{inv.date}</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="font-bold text-slate-900">
                              ${(inv.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + inv.taxRate/100)).toFixed(2)}
                            </p>
                            <div className="mt-1">{getStatusBadge(inv.status)}</div>
                          </div>
                          <button 
                            onClick={() => {
                              setCurrentInvoice(inv);
                              setView('preview');
                              setViewingCustomerHistory(null);
                            }}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <PlayCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-slate-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary w-6 h-6" />
              <span className="font-bold text-lg tracking-tight">JAAS Billing Pro AI</span>
            </div>
            
            <nav className="flex flex-wrap justify-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <button onClick={() => { setLegalPage('terms'); setView('legal'); }} className="hover:text-primary transition-colors">Terms of Service</button>
              <button onClick={() => { setLegalPage('privacy'); setView('legal'); }} className="hover:text-primary transition-colors">Privacy Policy</button>
              <button onClick={() => { setLegalPage('cookies'); setView('legal'); }} className="hover:text-primary transition-colors">Cookie Settings</button>
            </nav>

            <div className="flex items-center gap-4">
              <a href="https://www.facebook.com/Alston332" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-primary transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="https://www.youtube.com/@Alston332" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-primary transition-colors"><Youtube className="w-5 h-5" /></a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium">© 2026 JAAS Billing Pro AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Confirm Save Customer Modal */}
      <AnimatePresence>
        {showConfirmSaveCustomer && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmSaveCustomer(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 border border-slate-100 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Save className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Save Changes?</h2>
              <p className="text-slate-500 mb-8">Are you sure you want to save the changes for this customer?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmSaveCustomer(false)} className="flex-1 btn-secondary">Cancel</button>
                <button onClick={confirmSaveCustomer} className="flex-1 btn-primary">Yes, Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
, name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'BRL', symbol: 'R
const initialCustomers: Customer[] = [
  { id: 'c1', name: 'Acme Corp', email: 'billing@acme.com', address: '123 Industrial Way, CA', totalBilled: 4500 },
  { id: 'c2', name: 'Global Tech', email: 'finance@globaltech.io', address: '456 Innovation Blvd, NY', totalBilled: 12000 },
  { id: 'c3', name: 'Local Bakery', email: 'hello@localbakery.com', address: '789 Main St, TX', totalBilled: 850 }
];

const initialInvoices: InvoiceData[] = [
  {
    id: 'inv1',
    invoiceNumber: 'INV-001',
    status: 'paid',
    date: '2024-03-01',
    dueDate: '2024-03-15',
    paymentTerms: 'Net 15',
    from: 'My Small Business LLC\n123 My St, City, ST 12345',
    customerId: 'c1',
    billTo: 'Acme Corp\n123 Industrial Way, CA',
    shipTo: '',
    items: [{ id: 'i1', description: 'Web Design Services', quantity: 1, rate: 2500 }],
    notes: 'Thank you for your business!',
    terms: 'Payment is due within 15 days.',
    taxRate: 8,
    amountPaid: 2700,
    discount: 0,
    shipping: 0,
    currency: 'USD ($)'
  },
  {
    id: 'inv2',
    invoiceNumber: 'INV-002',
    status: 'overdue',
    date: '2024-02-15',
    dueDate: '2024-03-01',
    paymentTerms: 'Net 15',
    from: 'My Small Business LLC\n123 My St, City, ST 12345',
    customerId: 'c2',
    billTo: 'Global Tech\n456 Innovation Blvd, NY',
    shipTo: '',
    items: [{ id: 'i2', description: 'Consulting', quantity: 10, rate: 150 }],
    notes: '',
    terms: '',
    taxRate: 0,
    amountPaid: 0,
    discount: 0,
    shipping: 0,
    currency: 'USD ($)'
  }
];

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [invoices, setInvoices] = useState<InvoiceData[]>(initialInvoices);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New State
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'Payment Received', message: 'Acme Corp paid INV-001', type: 'success', date: '2024-03-05', read: false },
    { id: '2', title: 'Invoice Overdue', message: 'Global Tech is 5 days late', type: 'warning', date: '2024-03-01', read: false }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    businessName: 'My Small Business LLC',
    email: 'mike@mybiz.com',
    address: '123 My St, City, ST 12345',
    logoUrl: ''
  });
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [cashflowData, setCashflowData] = useState<CashflowData[]>([]);
  const [pricingAnalysis, setPricingAnalysis] = useState<PricingAnalysis[]>([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', address: '' });
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomerHistory, setViewingCustomerHistory] = useState<Customer | null>(null);
  const [showConfirmSaveCustomer, setShowConfirmSaveCustomer] = useState(false);
  const [legalPage, setLegalPage] = useState<LegalPage>('terms');
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  const addNotification = (title: string, message: string, type: 'info' | 'warning' | 'success') => {
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      date: new Date().toISOString().split('T')[0],
      read: false
    };
    setNotifications([newNotification, ...notifications]);
  };

  // Dashboard Stats
  const stats = useMemo(() => {
    const totalBilled = invoices.reduce((acc, inv) => {
      const sub = inv.items.reduce((a, i) => a + (i.quantity * i.rate), 0);
      return acc + sub + (sub * (inv.taxRate / 100)) - inv.discount + inv.shipping;
    }, 0);
    const pending = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length;
    const overdue = invoices.filter(i => i.status === 'overdue').length;
    return { totalBilled, pending, overdue };
  }, [invoices]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearchQuery.toLowerCase())
    );
  }, [customers, customerSearchQuery]);

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.billTo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateInvoice = () => {
    // Auto-increment invoice number
    const lastInvoiceNumber = invoices.reduce((max, inv) => {
      const num = parseInt(inv.invoiceNumber.replace('INV-', ''));
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);

    const newInv: InvoiceData = {
      id: Math.random().toString(36).substr(2, 9),
      invoiceNumber: `INV-${(lastInvoiceNumber + 1).toString().padStart(3, '0')}`,
      status: 'draft',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      paymentTerms: 'Net 30',
      from: 'My Small Business LLC\n123 My St, City, ST 12345',
      customerId: '',
      billTo: '',
      shipTo: '',
      items: [{ id: '1', description: '', quantity: 1, rate: 0 }],
      notes: '',
      terms: '',
      taxRate: 0,
      amountPaid: 0,
      discount: 0,
      shipping: 0,
      currency: 'USD ($)'
    };
    setCurrentInvoice(newInv);
    setView('editor');
  };

  const handleEditInvoice = (inv: InvoiceData) => {
    setCurrentInvoice(inv);
    setView('editor');
  };

  const handlePreview = () => {
    if (currentInvoice) setView('preview');
  };

  const handleSave = () => {
    if (currentInvoice) {
      setInvoices(prev => {
        const exists = prev.find(i => i.id === currentInvoice.id);
        if (exists) return prev.map(i => i.id === currentInvoice.id ? currentInvoice : i);
        return [currentInvoice, ...prev];
      });
      setView('dashboard');
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid': return <span className="badge bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Paid</span>;
      case 'full payment': return <span className="badge bg-emerald-100 text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Full Payment</span>;
      case 'part payment': return <span className="badge bg-amber-100 text-amber-700 flex items-center gap-1"><Clock className="w-3 h-3" /> Part Payment</span>;
      case 'overdue': return <span className="badge bg-red-100 text-red-700 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Overdue</span>;
      case 'sent': return <span className="badge bg-blue-100 text-blue-700 flex items-center gap-1"><Send className="w-3 h-3" /> Sent</span>;
      default: return <span className="badge bg-slate-100 text-slate-700 flex items-center gap-1"><Clock className="w-3 h-3" /> Draft</span>;
    }
  };

  // AI Insights Trigger
  useEffect(() => {
    if (view === 'editor' && currentInvoice) {
      const timer = setTimeout(async () => {
        setIsGenerating(true);
        const newInsights = await generateSmartInsights(currentInvoice);
        setInsights(newInsights);
        setIsGenerating(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentInvoice?.items, currentInvoice?.taxRate, view]);

  useEffect(() => {
    if (view === 'cashflow' && cashflowData.length === 0) {
      setIsGenerating(true);
      forecastCashflow(invoices).then(data => {
        setCashflowData(data);
        setIsGenerating(false);
      });
    }
    if (view === 'pricing' && pricingAnalysis.length === 0) {
      setIsGenerating(true);
      const allItems = invoices.flatMap(inv => inv.items);
      analyzePricing(allItems).then(data => {
        setPricingAnalysis(data);
        setIsGenerating(false);
      });
    }
  }, [view, invoices]);

  const handleAddCustomer = () => {
    if (newCustomer.name && newCustomer.email) {
      setShowConfirmSaveCustomer(true);
    }
  };

  const confirmSaveCustomer = () => {
    if (editingCustomer) {
      setCustomers(customers.map(c => c.id === editingCustomer.id ? { ...c, ...newCustomer } : c));
      addNotification('Customer Updated', `${newCustomer.name}'s details have been updated.`, 'success');
    } else {
      const customer: Customer = {
        id: Math.random().toString(36).substr(2, 9),
        name: newCustomer.name,
        email: newCustomer.email,
        address: newCustomer.address,
        totalBilled: 0
      };
      setCustomers([...customers, customer]);
      addNotification('Customer Added', `${newCustomer.name} has been added to your list.`, 'success');
    }
    setNewCustomer({ name: '', email: '', address: '' });
    setEditingCustomer(null);
    setShowAddCustomer(false);
    setShowConfirmSaveCustomer(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile({ ...userProfile, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-40 w-full glass border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('dashboard')}>
              <Sparkles className="text-primary w-8 h-8" />
              <span className="font-bold text-xl tracking-tight flex items-center">
                JAAS Billing Pro
                <span className="text-primary text-xs font-semibold ml-1.5 px-2 py-0.5 rounded-full bg-sky-50">AI</span>
              </span>
            </div>
            
            <nav className="hidden md:flex space-x-6">
              <button 
                onClick={() => setView('dashboard')}
                className={`flex items-center gap-2 font-medium transition-colors ${view === 'dashboard' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>
              <button 
                onClick={() => setView('customers')}
                className={`flex items-center gap-2 font-medium transition-colors ${view === 'customers' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
              >
                <Users className="w-4 h-4" /> Customers
              </button>
              <button 
                onClick={() => setView('cashflow')}
                className={`flex items-center gap-2 font-medium transition-colors ${view === 'cashflow' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
              >
                <BarChart3 className="w-4 h-4" /> Cashflow
              </button>
              <button 
                onClick={() => setView('pricing')}
                className={`flex items-center gap-2 font-medium transition-colors ${view === 'pricing' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
              >
                <DollarSign className="w-4 h-4" /> Pricing
              </button>
            </nav>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.some(n => !n.read) && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
                </button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center">
                        <span className="font-bold text-sm">Notifications</span>
                        <button onClick={() => setNotifications(n => n.map(x => ({...x, read: true})))} className="text-[10px] text-primary font-bold hover:underline">Mark all as read</button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs">No notifications</div>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-sky-50/30' : ''}`}>
                              <p className="text-xs font-bold text-slate-800">{n.title}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{n.message}</p>
                              <p className="text-[8px] text-slate-400 mt-1">{n.date}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <button onClick={() => setView('settings')} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div 
                onClick={() => setView('profile')}
                className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
              >
                {userProfile.businessName[0]}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Dashboard View */}
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Free Invoice Template</h1>
                  <p className="text-slate-500 mt-2 max-w-2xl">
                    Make beautiful Invoices with one click! Welcome to the original JAAS Billing Pro AI Invoice Generator. 
                    Instantly make Invoices with our attractive template straight from your browser. 
                    Generate an unlimited number of Invoices for free.
                  </p>
                </div>
                <button onClick={handleCreateInvoice} className="btn-primary">
                  <Plus className="w-4 h-4" /> New Invoice
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-sm font-medium text-slate-500">Total Billed</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">${stats.totalBilled.toLocaleString()}</h3>
                  <div className="mt-4 flex items-center text-xs text-green-600 font-bold">
                    <TrendingUp className="w-3 h-3 mr-1" /> +12% from last month
                  </div>
                </div>
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-sm font-medium text-slate-500">Pending Invoices</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.pending}</h3>
                  <p className="mt-4 text-xs text-slate-400">Awaiting payment from 4 customers</p>
                </div>
                <div className="glass p-6 rounded-2xl border border-red-100 bg-red-50/10">
                  <p className="text-sm font-medium text-slate-500">Overdue</p>
                  <h3 className="text-3xl font-bold text-red-600 mt-2">{stats.overdue}</h3>
                  <div className="mt-4 flex items-center text-xs text-red-600 font-bold">
                    <AlertCircle className="w-3 h-3 mr-1" /> Action required
                  </div>
                </div>
              </div>

              {/* Recent Invoices */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-900">Recent Invoices</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search invoices..." 
                      className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 w-64"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="glass rounded-2xl overflow-hidden border border-slate-100">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Invoice</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                          <td className="px-6 py-4 text-slate-600">{inv.billTo.split('\n')[0]}</td>
                          <td className="px-6 py-4 text-slate-500 text-sm">{inv.date}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">
                            ${(inv.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + inv.taxRate/100)).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleEditInvoice(inv)}
                              className="text-primary hover:text-sky-600 font-bold text-sm"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Editor View */}
          {view === 'editor' && currentInvoice && (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col lg:flex-row gap-8"
            >
              <div className="flex-grow lg:w-2/3 space-y-6">
                <div className="flex items-center gap-4 mb-2">
                  <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                  </button>
                  <h1 className="text-2xl font-bold text-slate-900">Edit Invoice</h1>
                </div>

                <div className="glass rounded-2xl p-8 border border-slate-100">
                  {/* Form Header */}
                  <div className="flex justify-between items-start mb-12">
                    <div className="space-y-4">
                      <div 
                        onClick={() => logoInputRef.current?.click()}
                        className="w-40 h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer overflow-hidden"
                      >
                        {userProfile.logoUrl ? (
                          <img src={userProfile.logoUrl} className="w-full h-full object-contain" />
                        ) : (
                          <>
                            <ImageIcon className="w-6 h-6 mb-1" />
                            <span className="text-[10px] font-bold uppercase">Logo</span>
                          </>
                        )}
                      </div>
                      <textarea 
                        className="w-full bg-transparent border-none p-0 focus:ring-0 resize-none placeholder-slate-300 text-sm font-medium"
                        placeholder="Your Business Details..."
                        rows={3}
                        value={currentInvoice.from}
                        onChange={e => setCurrentInvoice({...currentInvoice, from: e.target.value})}
                      />
                    </div>
                    <div className="text-right space-y-4">
                      <h2 className="text-4xl font-light text-primary tracking-tighter">INVOICE</h2>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center justify-end">
                          <span className="text-slate-400 mr-2 text-sm font-bold">#</span>
                          <input 
                            className="w-24 text-right bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 font-bold"
                            value={currentInvoice.invoiceNumber}
                            onChange={e => setCurrentInvoice({...currentInvoice, invoiceNumber: e.target.value})}
                          />
                        </div>
                        <div className="flex items-center justify-end">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Status</label>
                          <select 
                            className="text-xs font-bold bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 p-1"
                            value={currentInvoice.status}
                            onChange={e => setCurrentInvoice({...currentInvoice, status: e.target.value as InvoiceStatus})}
                          >
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="paid">Paid</option>
                            <option value="part payment">Part Payment</option>
                            <option value="full payment">Full Payment</option>
                            <option value="overdue">Overdue</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bill To</label>
                      <select 
                        className="input-base"
                        onChange={e => {
                          const c = customers.find(cust => cust.id === e.target.value);
                          if (c) setCurrentInvoice({...currentInvoice, customerId: c.id, billTo: `${c.name}\n${c.address}`});
                        }}
                        value={currentInvoice.customerId}
                      >
                        <option value="">Select a customer...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <textarea 
                        className="input-base h-24 resize-none"
                        placeholder="Customer details..."
                        value={currentInvoice.billTo}
                        onChange={e => setCurrentInvoice({...currentInvoice, billTo: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Date', type: 'date', key: 'date' },
                        { label: 'Due Date', type: 'date', key: 'dueDate' },
                        { label: 'Terms', type: 'text', key: 'paymentTerms' }
                      ].map(f => (
                        <div key={f.key} className="flex items-center justify-end gap-4">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{f.label}</label>
                          <input 
                            type={f.type}
                            className="w-40 input-base"
                            value={(currentInvoice as any)[f.key]}
                            onChange={e => setCurrentInvoice({...currentInvoice, [f.key]: e.target.value})}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="mb-8">
                    <div className="overflow-hidden rounded-xl border border-slate-100">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                          <tr>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3 text-right">Qty</th>
                            <th className="px-4 py-3 text-right">Rate</th>
                            <th className="px-4 py-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentInvoice.items.map(item => (
                            <tr key={item.id}>
                              <td className="p-2">
                                <input 
                                  className="w-full bg-transparent border-none focus:ring-0 text-sm"
                                  placeholder="Item description..."
                                  value={item.description}
                                  onChange={e => {
                                    const items = currentInvoice.items.map(i => i.id === item.id ? {...i, description: e.target.value} : i);
                                    setCurrentInvoice({...currentInvoice, items});
                                  }}
                                />
                              </td>
                              <td className="p-2">
                                <input 
                                  type="number"
                                  className="w-full text-right bg-transparent border-none focus:ring-0 text-sm"
                                  value={item.quantity}
                                  onChange={e => {
                                    const items = currentInvoice.items.map(i => i.id === item.id ? {...i, quantity: parseFloat(e.target.value) || 0} : i);
                                    setCurrentInvoice({...currentInvoice, items});
                                  }}
                                />
                              </td>
                              <td className="p-2">
                                <input 
                                  type="number"
                                  className="w-full text-right bg-transparent border-none focus:ring-0 text-sm"
                                  value={item.rate}
                                  onChange={e => {
                                    const items = currentInvoice.items.map(i => i.id === item.id ? {...i, rate: parseFloat(e.target.value) || 0} : i);
                                    setCurrentInvoice({...currentInvoice, items});
                                  }}
                                />
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                                ${(item.quantity * item.rate).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button 
                      onClick={() => {
                        const items = [...currentInvoice.items, { id: Math.random().toString(), description: '', quantity: 1, rate: 0 }];
                        setCurrentInvoice({...currentInvoice, items});
                      }}
                      className="mt-4 flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-widest hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Add Item
                    </button>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end pt-8 border-t border-slate-100">
                    <div className="w-64 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-bold">${currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Tax (%)</span>
                        <input 
                          type="number"
                          className="w-16 text-right bg-slate-50 border-none rounded p-1 text-sm font-bold"
                          value={currentInvoice.taxRate}
                          onChange={e => setCurrentInvoice({...currentInvoice, taxRate: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div className="flex justify-between pt-3 border-t border-slate-100">
                        <span className="font-bold text-slate-900">Total</span>
                        <span className="text-2xl font-black text-primary">
                          ${(currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + currentInvoice.taxRate/100)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editor Sidebar */}
              <div className="lg:w-1/3 space-y-6">
                <div className="glass p-4 rounded-2xl flex gap-3">
                  <button onClick={handlePreview} className="flex-1 btn-primary">
                    <Printer className="w-4 h-4" /> Preview
                  </button>
                  <button onClick={handleSave} className="btn-secondary">
                    Save
                  </button>
                </div>

                {/* AI Insights */}
                <div className="glass bg-gradient-to-br from-primary/5 to-white rounded-2xl overflow-hidden border border-primary/10">
                  <div className="p-5 border-b border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <h3 className="font-bold text-slate-800">AI Assistant</h3>
                    </div>
                    {isGenerating && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles className="w-4 h-4 text-primary/50" /></motion.div>}
                  </div>
                  <div className="p-5 space-y-4">
                    {insights.map(insight => (
                      <div key={insight.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex gap-3">
                          {insight.type === 'optimization' ? <TrendingUp className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                          <div>
                            <p className="text-xs font-bold text-slate-800">{insight.title}</p>
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{insight.description}</p>
                            {insight.actionText && <button className="text-[10px] font-bold text-primary mt-2 hover:underline">{insight.actionText}</button>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Preview View */}
          {view === 'preview' && currentInvoice && (
            <motion.div 
              key="preview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex justify-between items-center">
                <button onClick={() => setView('editor')} className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-primary transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Editor
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      const isReceipt = ['paid', 'part payment', 'full payment'].includes(currentInvoice.status);
                      addNotification(isReceipt ? 'Receipt Generating' : 'PDF Generating', `Preparing your high-quality ${isReceipt ? 'receipt' : 'invoice'} document...`, 'info');
                      setTimeout(() => {
                        window.print();
                        addNotification(isReceipt ? 'Receipt Downloaded' : 'PDF Downloaded', `${isReceipt ? 'Receipt' : 'Invoice'} PDF has been generated successfully.`, 'success');
                      }, 1500);
                    }}
                    className="btn-secondary"
                  >
                    <Download className="w-4 h-4" /> {['paid', 'part payment', 'full payment'].includes(currentInvoice.status) ? 'Download Receipt' : 'Download PDF'}
                  </button>
                  <button 
                    onClick={() => {
                      const isReceipt = ['paid', 'part payment', 'full payment'].includes(currentInvoice.status);
                      addNotification('Sending Email', `Sending ${isReceipt ? 'receipt' : 'invoice'} to ${customers.find(c => c.id === currentInvoice.customerId)?.email || 'client'}...`, 'info');
                      setTimeout(() => {
                        addNotification('Email Sent', `${isReceipt ? 'Receipt' : 'Invoice'} ${currentInvoice.invoiceNumber} has been sent to the client and a copy to ${userProfile.email}.`, 'success');
                      }, 2000);
                    }}
                    className="btn-primary"
                  >
                    <Send className="w-4 h-4" /> {['paid', 'part payment', 'full payment'].includes(currentInvoice.status) ? 'Send Receipt' : 'Send to Client'}
                  </button>
                  <button 
                    onClick={() => {
                      const total = (currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + currentInvoice.taxRate/100)).toFixed(2);
                      const text = `Hi, here is your invoice ${currentInvoice.invoiceNumber} from ${userProfile.businessName}.\n\nTotal: $${total}\n\nYou can view and download the PDF here: ${window.location.origin}/invoice/${currentInvoice.id}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="btn-secondary bg-green-50 text-green-600 border-green-100 hover:bg-green-100"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </button>
                </div>
              </div>

              <div className="bg-white shadow-2xl rounded-3xl p-16 border border-slate-100 min-h-[1000px] relative overflow-hidden">
                {/* Decorative Element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32" />
                
                {currentInvoice.status === 'paid' && (
                  <div className="absolute top-20 right-20 rotate-12 border-4 border-green-500 text-green-500 px-6 py-2 rounded-xl font-black text-4xl opacity-20 pointer-events-none">
                    PAID
                  </div>
                )}

                <div className="flex justify-between items-start relative">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      {userProfile.logoUrl ? (
                        <img src={userProfile.logoUrl} className="w-12 h-12 object-contain" />
                      ) : (
                        <Sparkles className="w-10 h-10 text-primary" />
                      )}
                      <span className="text-2xl font-black tracking-tighter">{userProfile.businessName.toUpperCase()}</span>
                    </div>
                    <div className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">
                      {currentInvoice.from}
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-4">
                      {['paid', 'part payment', 'full payment'].includes(currentInvoice.status) ? 'RECEIPT' : 'INVOICE'}
                    </h1>
                    <p className="text-slate-400 font-bold tracking-widest text-xs">NO. {currentInvoice.invoiceNumber}</p>
                    <div className="mt-4 flex justify-end">
                      {getStatusBadge(currentInvoice.status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-16 mt-20">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Billed To</h4>
                    <div className="text-slate-900 font-bold leading-relaxed whitespace-pre-line">
                      {currentInvoice.billTo}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</h4>
                      <div className="text-slate-900 font-bold">{currentInvoice.date}</div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Due Date</h4>
                      <div className="text-slate-900 font-bold">{currentInvoice.dueDate || 'Upon Receipt'}</div>
                    </div>
                  </div>
                </div>

                <table className="w-full mt-20">
                  <thead>
                    <tr className="border-b-2 border-slate-900 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <th className="py-4">Description</th>
                      <th className="py-4 text-right">Qty</th>
                      <th className="py-4 text-right">Rate</th>
                      <th className="py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentInvoice.items.map(item => (
                      <tr key={item.id}>
                        <td className="py-6 font-bold text-slate-900">{item.description}</td>
                        <td className="py-6 text-right text-slate-600">{item.quantity}</td>
                        <td className="py-6 text-right text-slate-600">${item.rate.toFixed(2)}</td>
                        <td className="py-6 text-right font-black text-slate-900">${(item.quantity * item.rate).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-20 flex justify-end">
                  <div className="w-80 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-widest">Subtotal</span>
                      <span className="font-bold text-slate-900">${currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-widest">Tax ({currentInvoice.taxRate}%)</span>
                      <span className="font-bold text-slate-900">
                        ${(currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (currentInvoice.taxRate/100)).toFixed(2)}
                      </span>
                    </div>
                    <div className="pt-6 border-t-4 border-slate-900 flex justify-between items-baseline">
                      <span className="text-xl font-black text-slate-900 uppercase tracking-tighter">Total Due</span>
                      <span className="text-4xl font-black text-primary">
                        ${(currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + currentInvoice.taxRate/100)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-40 pt-10 border-t border-slate-100 grid grid-cols-2 gap-16">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Notes</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{currentInvoice.notes || 'No additional notes.'}</p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Terms</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{currentInvoice.terms || 'Standard terms apply.'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Customers View */}
          {view === 'customers' && (
            <motion.div 
              key="customers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
                  <p className="text-slate-500 mt-1">Manage your client relationships and billing history.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search customers..." 
                      className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 w-64"
                      value={customerSearchQuery}
                      onChange={e => setCustomerSearchQuery(e.target.value)}
                    />
                  </div>
                  <button onClick={() => {
                    setEditingCustomer(null);
                    setNewCustomer({ name: '', email: '', address: '' });
                    setShowAddCustomer(true);
                  }} className="btn-primary">
                    <Plus className="w-4 h-4" /> Add Customer
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredCustomers.map(c => (
                  <div key={c.id} className="glass p-6 rounded-2xl border border-slate-100 hover:border-primary/20 transition-all group">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-primary font-black text-xl group-hover:bg-primary group-hover:text-white transition-colors">
                        {c.name[0]}
                      </div>
                      <button 
                        onClick={() => {
                          setEditingCustomer(c);
                          setNewCustomer({ name: c.name, email: c.email, address: c.address });
                          setShowAddCustomer(true);
                        }}
                        className="text-slate-300 hover:text-primary transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-4">{c.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{c.email}</p>
                    <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Billed</p>
                        <p className="text-xl font-black text-slate-900 mt-1">${c.totalBilled.toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => setViewingCustomerHistory(c)}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <History className="w-3 h-3" /> History
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Cashflow View */}
          {view === 'cashflow' && (
            <motion.div 
              key="cashflow"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Cashflow Forecast</h1>
                  <p className="text-slate-500 mt-1">AI-powered projections based on your billing history.</p>
                </div>
                {isGenerating && <div className="flex items-center gap-2 text-primary text-sm font-bold"><Sparkles className="w-4 h-4 animate-spin" /> Analyzing...</div>}
              </div>

              <div className="glass p-8 rounded-3xl border border-slate-100 h-[400px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} aspect={2.5}>
                  <AreaChart data={cashflowData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10ade6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10ade6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="income" stroke="#10ade6" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                    <Line type="monotone" dataKey="forecast" stroke="#94a3b8" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Next Month Forecast</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">${cashflowData[0]?.forecast?.toLocaleString() || '0'}</h3>
                </div>
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg. Monthly Income</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">${(cashflowData.reduce((a, b) => a + b.income, 0) / (cashflowData.length || 1)).toFixed(0)}</h3>
                </div>
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Growth Trend</p>
                  <h3 className="text-2xl font-black text-green-500 mt-2">+8.4%</h3>
                </div>
              </div>
            </motion.div>
          )}

          {/* Pricing View */}
          {view === 'pricing' && (
            <motion.div 
              key="pricing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Smart Pricing</h1>
                  <p className="text-slate-500 mt-1">AI analysis of your rates compared to market standards.</p>
                </div>
                {isGenerating && <div className="flex items-center gap-2 text-primary text-sm font-bold"><Sparkles className="w-4 h-4 animate-spin" /> Researching...</div>}
              </div>

              <div className="grid grid-cols-1 gap-6">
                {pricingAnalysis.map(item => (
                  <div key={item.id} className="glass p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-grow">
                      <h3 className="text-lg font-bold text-slate-900">{item.itemName}</h3>
                      <p className="text-sm text-slate-500 mt-1">{item.reasoning}</p>
                      <div className="mt-4 flex gap-4">
                        <div className="bg-slate-50 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">Market Avg: ${item.marketAverage}</div>
                        <div className="bg-green-50 px-3 py-1 rounded-full text-[10px] font-bold text-green-600 uppercase tracking-widest">Potential: +${item.potentialRevenueIncrease}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current</p>
                        <p className="text-xl font-black text-slate-400">${item.currentRate}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <ArrowLeft className="w-4 h-4 text-primary rotate-180" />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Suggested</p>
                        <p className="text-2xl font-black text-primary">${item.suggestedRate}</p>
                      </div>
                      <button 
                        onClick={() => {
                          const updated = pricingAnalysis.map(p => p.id === item.id ? { ...p, currentRate: p.suggestedRate } : p);
                          setPricingAnalysis(updated);
                          alert('Rate applied successfully!');
                        }}
                        className="btn-primary ml-4"
                      >
                        Apply Rate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Settings View */}
          {view === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
              
              <div className="space-y-6">
                <div className="glass p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center gap-3 text-slate-900 font-bold">
                    <Globe className="w-5 h-5 text-primary" />
                    Localization
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Currency</label>
                      <select 
                        className="input-base"
                        value={currency.code}
                        onChange={(e) => setCurrency(CURRENCIES.find(c => c.code === e.target.value) || CURRENCIES[0])}
                      >
                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date Format</label>
                      <select className="input-base">
                        <option>YYYY-MM-DD</option>
                        <option>DD/MM/YYYY</option>
                        <option>MM/DD/YYYY</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="glass p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center gap-3 text-slate-900 font-bold">
                    <Bell className="w-5 h-5 text-primary" />
                    Notifications
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Email on payment received', enabled: true },
                      { label: 'Alert on overdue invoices', enabled: true },
                      { label: 'Weekly financial summary', enabled: false }
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">{item.label}</span>
                        <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${item.enabled ? 'bg-primary' : 'bg-slate-200'} relative`}>
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.enabled ? 'right-1' : 'left-1'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Profile View */}
          {view === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="flex justify-between items-end">
                <h1 className="text-3xl font-bold text-slate-900">Business Profile</h1>
                <button 
                  onClick={() => alert('Profile saved successfully!')}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>

              <div className="glass p-8 rounded-3xl border border-slate-100 space-y-8">
                <div className="flex items-center gap-8">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 overflow-hidden">
                      {userProfile.logoUrl ? <img src={userProfile.logoUrl} className="w-full h-full object-contain" /> : <ImageIcon className="w-8 h-8" />}
                    </div>
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      onChange={handleLogoUpload} 
                      className="hidden" 
                      accept="image/*" 
                    />
                    <button 
                      onClick={() => logoInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-primary hover:bg-primary hover:text-white transition-all"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Business Logo</h3>
                    <p className="text-xs text-slate-500 mt-1">Recommended size: 512x512px. PNG or JPG.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Business Name</label>
                    <input 
                      className="input-base" 
                      value={userProfile.businessName}
                      onChange={e => setUserProfile({...userProfile, businessName: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email</label>
                      <input 
                        className="input-base" 
                        value={userProfile.email}
                        onChange={e => setUserProfile({...userProfile, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone</label>
                      <input className="input-base" placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Address</label>
                    <textarea 
                      className="input-base h-24 resize-none" 
                      value={userProfile.address}
                      onChange={e => setUserProfile({...userProfile, address: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Legal View */}
          {view === 'legal' && (
            <motion.div 
              key="legal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex items-center gap-4">
                <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <h1 className="text-3xl font-bold text-slate-900">
                  {legalPage === 'terms' ? 'Terms of Service' : legalPage === 'privacy' ? 'Privacy Policy' : 'Cookie Settings'}
                </h1>
              </div>

              <div className="glass p-12 rounded-3xl border border-slate-100 prose prose-slate max-w-none">
                {legalPage === 'terms' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
                    <p>By accessing and using JAAS Billing Pro AI, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.</p>
                    <h2 className="text-2xl font-bold">2. Use of Service</h2>
                    <p>You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You agree to use the service only for lawful purposes.</p>
                    <h2 className="text-2xl font-bold">3. Intellectual Property</h2>
                    <p>All content and software used in the service are the property of JAAS Billing Pro AI or its suppliers and are protected by copyright and other laws.</p>
                    <h2 className="text-2xl font-bold">4. Limitation of Liability</h2>
                    <p>JAAS Billing Pro AI shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the service.</p>
                  </div>
                )}
                {legalPage === 'privacy' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">1. Information We Collect</h2>
                    <p>We collect information you provide directly to us, such as when you create an account, generate an invoice, or contact us for support.</p>
                    <h2 className="text-2xl font-bold">2. How We Use Information</h2>
                    <p>We use the information we collect to provide, maintain, and improve our services, and to communicate with you about your account and our services.</p>
                    <h2 className="text-2xl font-bold">3. Data Security</h2>
                    <p>We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.</p>
                    <h2 className="text-2xl font-bold">4. Your Choices</h2>
                    <p>You may update or correct information about yourself at any time by logging into your account or contacting us.</p>
                  </div>
                )}
                {legalPage === 'cookies' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">1. What are Cookies?</h2>
                    <p>Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work or work more efficiently.</p>
                    <h2 className="text-2xl font-bold">2. How We Use Cookies</h2>
                    <p>We use cookies to understand how you use our service and to improve your experience. This includes remembering your preferences and settings.</p>
                    <h2 className="text-2xl font-bold">3. Managing Cookies</h2>
                    <p>Most web browsers allow you to control cookies through their settings. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Customer Modal */}
      <AnimatePresence>
        {showAddCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddCustomer(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-100"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input 
                    className="input-base" 
                    placeholder="e.g. John Doe"
                    value={newCustomer.name}
                    onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input 
                    className="input-base" 
                    placeholder="john@example.com"
                    value={newCustomer.email}
                    onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Address</label>
                  <textarea 
                    className="input-base h-24 resize-none" 
                    placeholder="123 Business Way..."
                    value={newCustomer.address}
                    onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => {
                    setShowAddCustomer(false);
                    setEditingCustomer(null);
                  }} className="flex-1 btn-secondary">Cancel</button>
                  <button onClick={handleAddCustomer} className="flex-1 btn-primary">
                    {editingCustomer ? 'Update Customer' : 'Create Customer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customer History Modal */}
      <AnimatePresence>
        {viewingCustomerHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingCustomerHistory(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 border border-slate-100 max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Billing History</h2>
                  <p className="text-sm text-slate-500">{viewingCustomerHistory.name}</p>
                </div>
                <button onClick={() => setViewingCustomerHistory(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                {invoices.filter(inv => inv.customerId === viewingCustomerHistory.id).length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No invoices found for this customer.</p>
                  </div>
                ) : (
                  invoices
                    .filter(inv => inv.customerId === viewingCustomerHistory.id)
                    .map(inv => (
                      <div key={inv.id} className="flex justify-between items-center p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="font-bold text-slate-900">{inv.invoiceNumber}</p>
                          <p className="text-xs text-slate-500">{inv.date}</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="font-bold text-slate-900">
                              ${(inv.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + inv.taxRate/100)).toFixed(2)}
                            </p>
                            <div className="mt-1">{getStatusBadge(inv.status)}</div>
                          </div>
                          <button 
                            onClick={() => {
                              setCurrentInvoice(inv);
                              setView('preview');
                              setViewingCustomerHistory(null);
                            }}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <PlayCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-slate-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary w-6 h-6" />
              <span className="font-bold text-lg tracking-tight">JAAS Billing Pro AI</span>
            </div>
            
            <nav className="flex flex-wrap justify-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <button onClick={() => { setLegalPage('terms'); setView('legal'); }} className="hover:text-primary transition-colors">Terms of Service</button>
              <button onClick={() => { setLegalPage('privacy'); setView('legal'); }} className="hover:text-primary transition-colors">Privacy Policy</button>
              <button onClick={() => { setLegalPage('cookies'); setView('legal'); }} className="hover:text-primary transition-colors">Cookie Settings</button>
            </nav>

            <div className="flex items-center gap-4">
              <a href="https://www.facebook.com/Alston332" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-primary transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="https://www.youtube.com/@Alston332" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-primary transition-colors"><Youtube className="w-5 h-5" /></a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium">© 2026 JAAS Billing Pro AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Confirm Save Customer Modal */}
      <AnimatePresence>
        {showConfirmSaveCustomer && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmSaveCustomer(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 border border-slate-100 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Save className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Save Changes?</h2>
              <p className="text-slate-500 mb-8">Are you sure you want to save the changes for this customer?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmSaveCustomer(false)} className="flex-1 btn-secondary">Cancel</button>
                <button onClick={confirmSaveCustomer} className="flex-1 btn-primary">Yes, Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
, name: 'Brazilian Real' },
];

const initialCustomers: Customer[] = [
  { id: 'c1', name: 'Acme Corp', email: 'billing@acme.com', address: '123 Industrial Way, CA', totalBilled: 4500 },
  { id: 'c2', name: 'Global Tech', email: 'finance@globaltech.io', address: '456 Innovation Blvd, NY', totalBilled: 12000 },
  { id: 'c3', name: 'Local Bakery', email: 'hello@localbakery.com', address: '789 Main St, TX', totalBilled: 850 }
];

const initialInvoices: InvoiceData[] = [
  {
    id: 'inv1',
    invoiceNumber: 'INV-001',
    status: 'paid',
    date: '2024-03-01',
    dueDate: '2024-03-15',
    paymentTerms: 'Net 15',
    from: 'My Small Business LLC\n123 My St, City, ST 12345',
    customerId: 'c1',
    billTo: 'Acme Corp\n123 Industrial Way, CA',
    shipTo: '',
    items: [{ id: 'i1', description: 'Web Design Services', quantity: 1, rate: 2500 }],
    notes: 'Thank you for your business!',
    terms: 'Payment is due within 15 days.',
    taxRate: 8,
    amountPaid: 2700,
    discount: 0,
    shipping: 0,
    currency: 'USD ($)'
  },
  {
    id: 'inv2',
    invoiceNumber: 'INV-002',
    status: 'overdue',
    date: '2024-02-15',
    dueDate: '2024-03-01',
    paymentTerms: 'Net 15',
    from: 'My Small Business LLC\n123 My St, City, ST 12345',
    customerId: 'c2',
    billTo: 'Global Tech\n456 Innovation Blvd, NY',
    shipTo: '',
    items: [{ id: 'i2', description: 'Consulting', quantity: 10, rate: 150 }],
    notes: '',
    terms: '',
    taxRate: 0,
    amountPaid: 0,
    discount: 0,
    shipping: 0,
    currency: 'USD ($)'
  }
];

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [invoices, setInvoices] = useState<InvoiceData[]>(initialInvoices);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New State
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'Payment Received', message: 'Acme Corp paid INV-001', type: 'success', date: '2024-03-05', read: false },
    { id: '2', title: 'Invoice Overdue', message: 'Global Tech is 5 days late', type: 'warning', date: '2024-03-01', read: false }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    businessName: 'My Small Business LLC',
    email: 'mike@mybiz.com',
    address: '123 My St, City, ST 12345',
    logoUrl: ''
  });
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [cashflowData, setCashflowData] = useState<CashflowData[]>([]);
  const [pricingAnalysis, setPricingAnalysis] = useState<PricingAnalysis[]>([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', address: '' });
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomerHistory, setViewingCustomerHistory] = useState<Customer | null>(null);
  const [showConfirmSaveCustomer, setShowConfirmSaveCustomer] = useState(false);
  const [legalPage, setLegalPage] = useState<LegalPage>('terms');
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  const addNotification = (title: string, message: string, type: 'info' | 'warning' | 'success') => {
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      date: new Date().toISOString().split('T')[0],
      read: false
    };
    setNotifications([newNotification, ...notifications]);
  };

  // Dashboard Stats
  const stats = useMemo(() => {
    const totalBilled = invoices.reduce((acc, inv) => {
      const sub = inv.items.reduce((a, i) => a + (i.quantity * i.rate), 0);
      return acc + sub + (sub * (inv.taxRate / 100)) - inv.discount + inv.shipping;
    }, 0);
    const pending = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length;
    const overdue = invoices.filter(i => i.status === 'overdue').length;
    return { totalBilled, pending, overdue };
  }, [invoices]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearchQuery.toLowerCase())
    );
  }, [customers, customerSearchQuery]);

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.billTo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateInvoice = () => {
    // Auto-increment invoice number
    const lastInvoiceNumber = invoices.reduce((max, inv) => {
      const num = parseInt(inv.invoiceNumber.replace('INV-', ''));
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);

    const newInv: InvoiceData = {
      id: Math.random().toString(36).substr(2, 9),
      invoiceNumber: `INV-${(lastInvoiceNumber + 1).toString().padStart(3, '0')}`,
      status: 'draft',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      paymentTerms: 'Net 30',
      from: 'My Small Business LLC\n123 My St, City, ST 12345',
      customerId: '',
      billTo: '',
      shipTo: '',
      items: [{ id: '1', description: '', quantity: 1, rate: 0 }],
      notes: '',
      terms: '',
      taxRate: 0,
      amountPaid: 0,
      discount: 0,
      shipping: 0,
      currency: 'USD ($)'
    };
    setCurrentInvoice(newInv);
    setView('editor');
  };

  const handleEditInvoice = (inv: InvoiceData) => {
    setCurrentInvoice(inv);
    setView('editor');
  };

  const handlePreview = () => {
    if (currentInvoice) setView('preview');
  };

  const handleSave = () => {
    if (currentInvoice) {
      setInvoices(prev => {
        const exists = prev.find(i => i.id === currentInvoice.id);
        if (exists) return prev.map(i => i.id === currentInvoice.id ? currentInvoice : i);
        return [currentInvoice, ...prev];
      });
      setView('dashboard');
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid': return <span className="badge bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Paid</span>;
      case 'full payment': return <span className="badge bg-emerald-100 text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Full Payment</span>;
      case 'part payment': return <span className="badge bg-amber-100 text-amber-700 flex items-center gap-1"><Clock className="w-3 h-3" /> Part Payment</span>;
      case 'overdue': return <span className="badge bg-red-100 text-red-700 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Overdue</span>;
      case 'sent': return <span className="badge bg-blue-100 text-blue-700 flex items-center gap-1"><Send className="w-3 h-3" /> Sent</span>;
      default: return <span className="badge bg-slate-100 text-slate-700 flex items-center gap-1"><Clock className="w-3 h-3" /> Draft</span>;
    }
  };

  // AI Insights Trigger
  useEffect(() => {
    if (view === 'editor' && currentInvoice) {
      const timer = setTimeout(async () => {
        setIsGenerating(true);
        const newInsights = await generateSmartInsights(currentInvoice);
        setInsights(newInsights);
        setIsGenerating(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentInvoice?.items, currentInvoice?.taxRate, view]);

  useEffect(() => {
    if (view === 'cashflow' && cashflowData.length === 0) {
      setIsGenerating(true);
      forecastCashflow(invoices).then(data => {
        setCashflowData(data);
        setIsGenerating(false);
      });
    }
    if (view === 'pricing' && pricingAnalysis.length === 0) {
      setIsGenerating(true);
      const allItems = invoices.flatMap(inv => inv.items);
      analyzePricing(allItems).then(data => {
        setPricingAnalysis(data);
        setIsGenerating(false);
      });
    }
  }, [view, invoices]);

  const handleAddCustomer = () => {
    if (newCustomer.name && newCustomer.email) {
      setShowConfirmSaveCustomer(true);
    }
  };

  const confirmSaveCustomer = () => {
    if (editingCustomer) {
      setCustomers(customers.map(c => c.id === editingCustomer.id ? { ...c, ...newCustomer } : c));
      addNotification('Customer Updated', `${newCustomer.name}'s details have been updated.`, 'success');
    } else {
      const customer: Customer = {
        id: Math.random().toString(36).substr(2, 9),
        name: newCustomer.name,
        email: newCustomer.email,
        address: newCustomer.address,
        totalBilled: 0
      };
      setCustomers([...customers, customer]);
      addNotification('Customer Added', `${newCustomer.name} has been added to your list.`, 'success');
    }
    setNewCustomer({ name: '', email: '', address: '' });
    setEditingCustomer(null);
    setShowAddCustomer(false);
    setShowConfirmSaveCustomer(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile({ ...userProfile, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-40 w-full glass border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('dashboard')}>
              <Sparkles className="text-primary w-8 h-8" />
              <span className="font-bold text-xl tracking-tight flex items-center">
                JAAS Billing Pro
                <span className="text-primary text-xs font-semibold ml-1.5 px-2 py-0.5 rounded-full bg-sky-50">AI</span>
              </span>
            </div>
            
            <nav className="hidden md:flex space-x-6">
              <button 
                onClick={() => setView('dashboard')}
                className={`flex items-center gap-2 font-medium transition-colors ${view === 'dashboard' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>
              <button 
                onClick={() => setView('customers')}
                className={`flex items-center gap-2 font-medium transition-colors ${view === 'customers' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
              >
                <Users className="w-4 h-4" /> Customers
              </button>
              <button 
                onClick={() => setView('cashflow')}
                className={`flex items-center gap-2 font-medium transition-colors ${view === 'cashflow' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
              >
                <BarChart3 className="w-4 h-4" /> Cashflow
              </button>
              <button 
                onClick={() => setView('pricing')}
                className={`flex items-center gap-2 font-medium transition-colors ${view === 'pricing' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
              >
                <DollarSign className="w-4 h-4" /> Pricing
              </button>
            </nav>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.some(n => !n.read) && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
                </button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center">
                        <span className="font-bold text-sm">Notifications</span>
                        <button onClick={() => setNotifications(n => n.map(x => ({...x, read: true})))} className="text-[10px] text-primary font-bold hover:underline">Mark all as read</button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs">No notifications</div>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-sky-50/30' : ''}`}>
                              <p className="text-xs font-bold text-slate-800">{n.title}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{n.message}</p>
                              <p className="text-[8px] text-slate-400 mt-1">{n.date}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <button onClick={() => setView('settings')} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div 
                onClick={() => setView('profile')}
                className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
              >
                {userProfile.businessName[0]}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Dashboard View */}
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Free Invoice Template</h1>
                  <p className="text-slate-500 mt-2 max-w-2xl">
                    Make beautiful Invoices with one click! Welcome to the original JAAS Billing Pro AI Invoice Generator. 
                    Instantly make Invoices with our attractive template straight from your browser. 
                    Generate an unlimited number of Invoices for free.
                  </p>
                </div>
                <button onClick={handleCreateInvoice} className="btn-primary">
                  <Plus className="w-4 h-4" /> New Invoice
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-sm font-medium text-slate-500">Total Billed</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">${stats.totalBilled.toLocaleString()}</h3>
                  <div className="mt-4 flex items-center text-xs text-green-600 font-bold">
                    <TrendingUp className="w-3 h-3 mr-1" /> +12% from last month
                  </div>
                </div>
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-sm font-medium text-slate-500">Pending Invoices</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.pending}</h3>
                  <p className="mt-4 text-xs text-slate-400">Awaiting payment from 4 customers</p>
                </div>
                <div className="glass p-6 rounded-2xl border border-red-100 bg-red-50/10">
                  <p className="text-sm font-medium text-slate-500">Overdue</p>
                  <h3 className="text-3xl font-bold text-red-600 mt-2">{stats.overdue}</h3>
                  <div className="mt-4 flex items-center text-xs text-red-600 font-bold">
                    <AlertCircle className="w-3 h-3 mr-1" /> Action required
                  </div>
                </div>
              </div>

              {/* Recent Invoices */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-900">Recent Invoices</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search invoices..." 
                      className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 w-64"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="glass rounded-2xl overflow-hidden border border-slate-100">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Invoice</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                          <td className="px-6 py-4 text-slate-600">{inv.billTo.split('\n')[0]}</td>
                          <td className="px-6 py-4 text-slate-500 text-sm">{inv.date}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">
                            ${(inv.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + inv.taxRate/100)).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleEditInvoice(inv)}
                              className="text-primary hover:text-sky-600 font-bold text-sm"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Editor View */}
          {view === 'editor' && currentInvoice && (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col lg:flex-row gap-8"
            >
              <div className="flex-grow lg:w-2/3 space-y-6">
                <div className="flex items-center gap-4 mb-2">
                  <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                  </button>
                  <h1 className="text-2xl font-bold text-slate-900">Edit Invoice</h1>
                </div>

                <div className="glass rounded-2xl p-8 border border-slate-100">
                  {/* Form Header */}
                  <div className="flex justify-between items-start mb-12">
                    <div className="space-y-4">
                      <div 
                        onClick={() => logoInputRef.current?.click()}
                        className="w-40 h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer overflow-hidden"
                      >
                        {userProfile.logoUrl ? (
                          <img src={userProfile.logoUrl} className="w-full h-full object-contain" />
                        ) : (
                          <>
                            <ImageIcon className="w-6 h-6 mb-1" />
                            <span className="text-[10px] font-bold uppercase">Logo</span>
                          </>
                        )}
                      </div>
                      <textarea 
                        className="w-full bg-transparent border-none p-0 focus:ring-0 resize-none placeholder-slate-300 text-sm font-medium"
                        placeholder="Your Business Details..."
                        rows={3}
                        value={currentInvoice.from}
                        onChange={e => setCurrentInvoice({...currentInvoice, from: e.target.value})}
                      />
                    </div>
                    <div className="text-right space-y-4">
                      <h2 className="text-4xl font-light text-primary tracking-tighter">INVOICE</h2>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center justify-end">
                          <span className="text-slate-400 mr-2 text-sm font-bold">#</span>
                          <input 
                            className="w-24 text-right bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 font-bold"
                            value={currentInvoice.invoiceNumber}
                            onChange={e => setCurrentInvoice({...currentInvoice, invoiceNumber: e.target.value})}
                          />
                        </div>
                        <div className="flex items-center justify-end">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Status</label>
                          <select 
                            className="text-xs font-bold bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 p-1"
                            value={currentInvoice.status}
                            onChange={e => setCurrentInvoice({...currentInvoice, status: e.target.value as InvoiceStatus})}
                          >
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="paid">Paid</option>
                            <option value="part payment">Part Payment</option>
                            <option value="full payment">Full Payment</option>
                            <option value="overdue">Overdue</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bill To</label>
                      <select 
                        className="input-base"
                        onChange={e => {
                          const c = customers.find(cust => cust.id === e.target.value);
                          if (c) setCurrentInvoice({...currentInvoice, customerId: c.id, billTo: `${c.name}\n${c.address}`});
                        }}
                        value={currentInvoice.customerId}
                      >
                        <option value="">Select a customer...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <textarea 
                        className="input-base h-24 resize-none"
                        placeholder="Customer details..."
                        value={currentInvoice.billTo}
                        onChange={e => setCurrentInvoice({...currentInvoice, billTo: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Date', type: 'date', key: 'date' },
                        { label: 'Due Date', type: 'date', key: 'dueDate' },
                        { label: 'Terms', type: 'text', key: 'paymentTerms' }
                      ].map(f => (
                        <div key={f.key} className="flex items-center justify-end gap-4">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{f.label}</label>
                          <input 
                            type={f.type}
                            className="w-40 input-base"
                            value={(currentInvoice as any)[f.key]}
                            onChange={e => setCurrentInvoice({...currentInvoice, [f.key]: e.target.value})}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="mb-8">
                    <div className="overflow-hidden rounded-xl border border-slate-100">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                          <tr>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3 text-right">Qty</th>
                            <th className="px-4 py-3 text-right">Rate</th>
                            <th className="px-4 py-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentInvoice.items.map(item => (
                            <tr key={item.id}>
                              <td className="p-2">
                                <input 
                                  className="w-full bg-transparent border-none focus:ring-0 text-sm"
                                  placeholder="Item description..."
                                  value={item.description}
                                  onChange={e => {
                                    const items = currentInvoice.items.map(i => i.id === item.id ? {...i, description: e.target.value} : i);
                                    setCurrentInvoice({...currentInvoice, items});
                                  }}
                                />
                              </td>
                              <td className="p-2">
                                <input 
                                  type="number"
                                  className="w-full text-right bg-transparent border-none focus:ring-0 text-sm"
                                  value={item.quantity}
                                  onChange={e => {
                                    const items = currentInvoice.items.map(i => i.id === item.id ? {...i, quantity: parseFloat(e.target.value) || 0} : i);
                                    setCurrentInvoice({...currentInvoice, items});
                                  }}
                                />
                              </td>
                              <td className="p-2">
                                <input 
                                  type="number"
                                  className="w-full text-right bg-transparent border-none focus:ring-0 text-sm"
                                  value={item.rate}
                                  onChange={e => {
                                    const items = currentInvoice.items.map(i => i.id === item.id ? {...i, rate: parseFloat(e.target.value) || 0} : i);
                                    setCurrentInvoice({...currentInvoice, items});
                                  }}
                                />
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                                ${(item.quantity * item.rate).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button 
                      onClick={() => {
                        const items = [...currentInvoice.items, { id: Math.random().toString(), description: '', quantity: 1, rate: 0 }];
                        setCurrentInvoice({...currentInvoice, items});
                      }}
                      className="mt-4 flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-widest hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Add Item
                    </button>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end pt-8 border-t border-slate-100">
                    <div className="w-64 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-bold">${currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Tax (%)</span>
                        <input 
                          type="number"
                          className="w-16 text-right bg-slate-50 border-none rounded p-1 text-sm font-bold"
                          value={currentInvoice.taxRate}
                          onChange={e => setCurrentInvoice({...currentInvoice, taxRate: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div className="flex justify-between pt-3 border-t border-slate-100">
                        <span className="font-bold text-slate-900">Total</span>
                        <span className="text-2xl font-black text-primary">
                          ${(currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + currentInvoice.taxRate/100)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editor Sidebar */}
              <div className="lg:w-1/3 space-y-6">
                <div className="glass p-4 rounded-2xl flex gap-3">
                  <button onClick={handlePreview} className="flex-1 btn-primary">
                    <Printer className="w-4 h-4" /> Preview
                  </button>
                  <button onClick={handleSave} className="btn-secondary">
                    Save
                  </button>
                </div>

                {/* AI Insights */}
                <div className="glass bg-gradient-to-br from-primary/5 to-white rounded-2xl overflow-hidden border border-primary/10">
                  <div className="p-5 border-b border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <h3 className="font-bold text-slate-800">AI Assistant</h3>
                    </div>
                    {isGenerating && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles className="w-4 h-4 text-primary/50" /></motion.div>}
                  </div>
                  <div className="p-5 space-y-4">
                    {insights.map(insight => (
                      <div key={insight.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex gap-3">
                          {insight.type === 'optimization' ? <TrendingUp className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                          <div>
                            <p className="text-xs font-bold text-slate-800">{insight.title}</p>
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{insight.description}</p>
                            {insight.actionText && <button className="text-[10px] font-bold text-primary mt-2 hover:underline">{insight.actionText}</button>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Preview View */}
          {view === 'preview' && currentInvoice && (
            <motion.div 
              key="preview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex justify-between items-center">
                <button onClick={() => setView('editor')} className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-primary transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Editor
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      const isReceipt = ['paid', 'part payment', 'full payment'].includes(currentInvoice.status);
                      addNotification(isReceipt ? 'Receipt Generating' : 'PDF Generating', `Preparing your high-quality ${isReceipt ? 'receipt' : 'invoice'} document...`, 'info');
                      setTimeout(() => {
                        window.print();
                        addNotification(isReceipt ? 'Receipt Downloaded' : 'PDF Downloaded', `${isReceipt ? 'Receipt' : 'Invoice'} PDF has been generated successfully.`, 'success');
                      }, 1500);
                    }}
                    className="btn-secondary"
                  >
                    <Download className="w-4 h-4" /> {['paid', 'part payment', 'full payment'].includes(currentInvoice.status) ? 'Download Receipt' : 'Download PDF'}
                  </button>
                  <button 
                    onClick={() => {
                      const isReceipt = ['paid', 'part payment', 'full payment'].includes(currentInvoice.status);
                      addNotification('Sending Email', `Sending ${isReceipt ? 'receipt' : 'invoice'} to ${customers.find(c => c.id === currentInvoice.customerId)?.email || 'client'}...`, 'info');
                      setTimeout(() => {
                        addNotification('Email Sent', `${isReceipt ? 'Receipt' : 'Invoice'} ${currentInvoice.invoiceNumber} has been sent to the client and a copy to ${userProfile.email}.`, 'success');
                      }, 2000);
                    }}
                    className="btn-primary"
                  >
                    <Send className="w-4 h-4" /> {['paid', 'part payment', 'full payment'].includes(currentInvoice.status) ? 'Send Receipt' : 'Send to Client'}
                  </button>
                  <button 
                    onClick={() => {
                      const total = (currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + currentInvoice.taxRate/100)).toFixed(2);
                      const text = `Hi, here is your invoice ${currentInvoice.invoiceNumber} from ${userProfile.businessName}.\n\nTotal: $${total}\n\nYou can view and download the PDF here: ${window.location.origin}/invoice/${currentInvoice.id}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="btn-secondary bg-green-50 text-green-600 border-green-100 hover:bg-green-100"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </button>
                </div>
              </div>

              <div className="bg-white shadow-2xl rounded-3xl p-16 border border-slate-100 min-h-[1000px] relative overflow-hidden">
                {/* Decorative Element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32" />
                
                {currentInvoice.status === 'paid' && (
                  <div className="absolute top-20 right-20 rotate-12 border-4 border-green-500 text-green-500 px-6 py-2 rounded-xl font-black text-4xl opacity-20 pointer-events-none">
                    PAID
                  </div>
                )}

                <div className="flex justify-between items-start relative">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      {userProfile.logoUrl ? (
                        <img src={userProfile.logoUrl} className="w-12 h-12 object-contain" />
                      ) : (
                        <Sparkles className="w-10 h-10 text-primary" />
                      )}
                      <span className="text-2xl font-black tracking-tighter">{userProfile.businessName.toUpperCase()}</span>
                    </div>
                    <div className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">
                      {currentInvoice.from}
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-4">
                      {['paid', 'part payment', 'full payment'].includes(currentInvoice.status) ? 'RECEIPT' : 'INVOICE'}
                    </h1>
                    <p className="text-slate-400 font-bold tracking-widest text-xs">NO. {currentInvoice.invoiceNumber}</p>
                    <div className="mt-4 flex justify-end">
                      {getStatusBadge(currentInvoice.status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-16 mt-20">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Billed To</h4>
                    <div className="text-slate-900 font-bold leading-relaxed whitespace-pre-line">
                      {currentInvoice.billTo}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</h4>
                      <div className="text-slate-900 font-bold">{currentInvoice.date}</div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Due Date</h4>
                      <div className="text-slate-900 font-bold">{currentInvoice.dueDate || 'Upon Receipt'}</div>
                    </div>
                  </div>
                </div>

                <table className="w-full mt-20">
                  <thead>
                    <tr className="border-b-2 border-slate-900 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <th className="py-4">Description</th>
                      <th className="py-4 text-right">Qty</th>
                      <th className="py-4 text-right">Rate</th>
                      <th className="py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentInvoice.items.map(item => (
                      <tr key={item.id}>
                        <td className="py-6 font-bold text-slate-900">{item.description}</td>
                        <td className="py-6 text-right text-slate-600">{item.quantity}</td>
                        <td className="py-6 text-right text-slate-600">${item.rate.toFixed(2)}</td>
                        <td className="py-6 text-right font-black text-slate-900">${(item.quantity * item.rate).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-20 flex justify-end">
                  <div className="w-80 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-widest">Subtotal</span>
                      <span className="font-bold text-slate-900">${currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-widest">Tax ({currentInvoice.taxRate}%)</span>
                      <span className="font-bold text-slate-900">
                        ${(currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (currentInvoice.taxRate/100)).toFixed(2)}
                      </span>
                    </div>
                    <div className="pt-6 border-t-4 border-slate-900 flex justify-between items-baseline">
                      <span className="text-xl font-black text-slate-900 uppercase tracking-tighter">Total Due</span>
                      <span className="text-4xl font-black text-primary">
                        ${(currentInvoice.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + currentInvoice.taxRate/100)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-40 pt-10 border-t border-slate-100 grid grid-cols-2 gap-16">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Notes</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{currentInvoice.notes || 'No additional notes.'}</p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Terms</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{currentInvoice.terms || 'Standard terms apply.'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Customers View */}
          {view === 'customers' && (
            <motion.div 
              key="customers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
                  <p className="text-slate-500 mt-1">Manage your client relationships and billing history.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search customers..." 
                      className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 w-64"
                      value={customerSearchQuery}
                      onChange={e => setCustomerSearchQuery(e.target.value)}
                    />
                  </div>
                  <button onClick={() => {
                    setEditingCustomer(null);
                    setNewCustomer({ name: '', email: '', address: '' });
                    setShowAddCustomer(true);
                  }} className="btn-primary">
                    <Plus className="w-4 h-4" /> Add Customer
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredCustomers.map(c => (
                  <div key={c.id} className="glass p-6 rounded-2xl border border-slate-100 hover:border-primary/20 transition-all group">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-primary font-black text-xl group-hover:bg-primary group-hover:text-white transition-colors">
                        {c.name[0]}
                      </div>
                      <button 
                        onClick={() => {
                          setEditingCustomer(c);
                          setNewCustomer({ name: c.name, email: c.email, address: c.address });
                          setShowAddCustomer(true);
                        }}
                        className="text-slate-300 hover:text-primary transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-4">{c.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{c.email}</p>
                    <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Billed</p>
                        <p className="text-xl font-black text-slate-900 mt-1">${c.totalBilled.toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => setViewingCustomerHistory(c)}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <History className="w-3 h-3" /> History
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Cashflow View */}
          {view === 'cashflow' && (
            <motion.div 
              key="cashflow"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Cashflow Forecast</h1>
                  <p className="text-slate-500 mt-1">AI-powered projections based on your billing history.</p>
                </div>
                {isGenerating && <div className="flex items-center gap-2 text-primary text-sm font-bold"><Sparkles className="w-4 h-4 animate-spin" /> Analyzing...</div>}
              </div>

              <div className="glass p-8 rounded-3xl border border-slate-100 h-[400px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} aspect={2.5}>
                  <AreaChart data={cashflowData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10ade6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10ade6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="income" stroke="#10ade6" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                    <Line type="monotone" dataKey="forecast" stroke="#94a3b8" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Next Month Forecast</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">${cashflowData[0]?.forecast?.toLocaleString() || '0'}</h3>
                </div>
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg. Monthly Income</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">${(cashflowData.reduce((a, b) => a + b.income, 0) / (cashflowData.length || 1)).toFixed(0)}</h3>
                </div>
                <div className="glass p-6 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Growth Trend</p>
                  <h3 className="text-2xl font-black text-green-500 mt-2">+8.4%</h3>
                </div>
              </div>
            </motion.div>
          )}

          {/* Pricing View */}
          {view === 'pricing' && (
            <motion.div 
              key="pricing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Smart Pricing</h1>
                  <p className="text-slate-500 mt-1">AI analysis of your rates compared to market standards.</p>
                </div>
                {isGenerating && <div className="flex items-center gap-2 text-primary text-sm font-bold"><Sparkles className="w-4 h-4 animate-spin" /> Researching...</div>}
              </div>

              <div className="grid grid-cols-1 gap-6">
                {pricingAnalysis.map(item => (
                  <div key={item.id} className="glass p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-grow">
                      <h3 className="text-lg font-bold text-slate-900">{item.itemName}</h3>
                      <p className="text-sm text-slate-500 mt-1">{item.reasoning}</p>
                      <div className="mt-4 flex gap-4">
                        <div className="bg-slate-50 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">Market Avg: ${item.marketAverage}</div>
                        <div className="bg-green-50 px-3 py-1 rounded-full text-[10px] font-bold text-green-600 uppercase tracking-widest">Potential: +${item.potentialRevenueIncrease}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current</p>
                        <p className="text-xl font-black text-slate-400">${item.currentRate}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <ArrowLeft className="w-4 h-4 text-primary rotate-180" />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Suggested</p>
                        <p className="text-2xl font-black text-primary">${item.suggestedRate}</p>
                      </div>
                      <button 
                        onClick={() => {
                          const updated = pricingAnalysis.map(p => p.id === item.id ? { ...p, currentRate: p.suggestedRate } : p);
                          setPricingAnalysis(updated);
                          alert('Rate applied successfully!');
                        }}
                        className="btn-primary ml-4"
                      >
                        Apply Rate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Settings View */}
          {view === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
              
              <div className="space-y-6">
                <div className="glass p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center gap-3 text-slate-900 font-bold">
                    <Globe className="w-5 h-5 text-primary" />
                    Localization
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Currency</label>
                      <select 
                        className="input-base"
                        value={currency.code}
                        onChange={(e) => setCurrency(CURRENCIES.find(c => c.code === e.target.value) || CURRENCIES[0])}
                      >
                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date Format</label>
                      <select className="input-base">
                        <option>YYYY-MM-DD</option>
                        <option>DD/MM/YYYY</option>
                        <option>MM/DD/YYYY</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="glass p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center gap-3 text-slate-900 font-bold">
                    <Bell className="w-5 h-5 text-primary" />
                    Notifications
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Email on payment received', enabled: true },
                      { label: 'Alert on overdue invoices', enabled: true },
                      { label: 'Weekly financial summary', enabled: false }
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">{item.label}</span>
                        <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${item.enabled ? 'bg-primary' : 'bg-slate-200'} relative`}>
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.enabled ? 'right-1' : 'left-1'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Profile View */}
          {view === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="flex justify-between items-end">
                <h1 className="text-3xl font-bold text-slate-900">Business Profile</h1>
                <button 
                  onClick={() => alert('Profile saved successfully!')}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>

              <div className="glass p-8 rounded-3xl border border-slate-100 space-y-8">
                <div className="flex items-center gap-8">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 overflow-hidden">
                      {userProfile.logoUrl ? <img src={userProfile.logoUrl} className="w-full h-full object-contain" /> : <ImageIcon className="w-8 h-8" />}
                    </div>
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      onChange={handleLogoUpload} 
                      className="hidden" 
                      accept="image/*" 
                    />
                    <button 
                      onClick={() => logoInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-primary hover:bg-primary hover:text-white transition-all"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Business Logo</h3>
                    <p className="text-xs text-slate-500 mt-1">Recommended size: 512x512px. PNG or JPG.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Business Name</label>
                    <input 
                      className="input-base" 
                      value={userProfile.businessName}
                      onChange={e => setUserProfile({...userProfile, businessName: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email</label>
                      <input 
                        className="input-base" 
                        value={userProfile.email}
                        onChange={e => setUserProfile({...userProfile, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone</label>
                      <input className="input-base" placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Address</label>
                    <textarea 
                      className="input-base h-24 resize-none" 
                      value={userProfile.address}
                      onChange={e => setUserProfile({...userProfile, address: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Legal View */}
          {view === 'legal' && (
            <motion.div 
              key="legal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex items-center gap-4">
                <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <h1 className="text-3xl font-bold text-slate-900">
                  {legalPage === 'terms' ? 'Terms of Service' : legalPage === 'privacy' ? 'Privacy Policy' : 'Cookie Settings'}
                </h1>
              </div>

              <div className="glass p-12 rounded-3xl border border-slate-100 prose prose-slate max-w-none">
                {legalPage === 'terms' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
                    <p>By accessing and using JAAS Billing Pro AI, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.</p>
                    <h2 className="text-2xl font-bold">2. Use of Service</h2>
                    <p>You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You agree to use the service only for lawful purposes.</p>
                    <h2 className="text-2xl font-bold">3. Intellectual Property</h2>
                    <p>All content and software used in the service are the property of JAAS Billing Pro AI or its suppliers and are protected by copyright and other laws.</p>
                    <h2 className="text-2xl font-bold">4. Limitation of Liability</h2>
                    <p>JAAS Billing Pro AI shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the service.</p>
                  </div>
                )}
                {legalPage === 'privacy' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">1. Information We Collect</h2>
                    <p>We collect information you provide directly to us, such as when you create an account, generate an invoice, or contact us for support.</p>
                    <h2 className="text-2xl font-bold">2. How We Use Information</h2>
                    <p>We use the information we collect to provide, maintain, and improve our services, and to communicate with you about your account and our services.</p>
                    <h2 className="text-2xl font-bold">3. Data Security</h2>
                    <p>We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.</p>
                    <h2 className="text-2xl font-bold">4. Your Choices</h2>
                    <p>You may update or correct information about yourself at any time by logging into your account or contacting us.</p>
                  </div>
                )}
                {legalPage === 'cookies' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">1. What are Cookies?</h2>
                    <p>Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work or work more efficiently.</p>
                    <h2 className="text-2xl font-bold">2. How We Use Cookies</h2>
                    <p>We use cookies to understand how you use our service and to improve your experience. This includes remembering your preferences and settings.</p>
                    <h2 className="text-2xl font-bold">3. Managing Cookies</h2>
                    <p>Most web browsers allow you to control cookies through their settings. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Customer Modal */}
      <AnimatePresence>
        {showAddCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddCustomer(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-100"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input 
                    className="input-base" 
                    placeholder="e.g. John Doe"
                    value={newCustomer.name}
                    onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input 
                    className="input-base" 
                    placeholder="john@example.com"
                    value={newCustomer.email}
                    onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Address</label>
                  <textarea 
                    className="input-base h-24 resize-none" 
                    placeholder="123 Business Way..."
                    value={newCustomer.address}
                    onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => {
                    setShowAddCustomer(false);
                    setEditingCustomer(null);
                  }} className="flex-1 btn-secondary">Cancel</button>
                  <button onClick={handleAddCustomer} className="flex-1 btn-primary">
                    {editingCustomer ? 'Update Customer' : 'Create Customer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customer History Modal */}
      <AnimatePresence>
        {viewingCustomerHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingCustomerHistory(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 border border-slate-100 max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Billing History</h2>
                  <p className="text-sm text-slate-500">{viewingCustomerHistory.name}</p>
                </div>
                <button onClick={() => setViewingCustomerHistory(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                {invoices.filter(inv => inv.customerId === viewingCustomerHistory.id).length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No invoices found for this customer.</p>
                  </div>
                ) : (
                  invoices
                    .filter(inv => inv.customerId === viewingCustomerHistory.id)
                    .map(inv => (
                      <div key={inv.id} className="flex justify-between items-center p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="font-bold text-slate-900">{inv.invoiceNumber}</p>
                          <p className="text-xs text-slate-500">{inv.date}</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="font-bold text-slate-900">
                              ${(inv.items.reduce((a, i) => a + (i.quantity * i.rate), 0) * (1 + inv.taxRate/100)).toFixed(2)}
                            </p>
                            <div className="mt-1">{getStatusBadge(inv.status)}</div>
                          </div>
                          <button 
                            onClick={() => {
                              setCurrentInvoice(inv);
                              setView('preview');
                              setViewingCustomerHistory(null);
                            }}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <PlayCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-slate-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary w-6 h-6" />
              <span className="font-bold text-lg tracking-tight">JAAS Billing Pro AI</span>
            </div>
            
            <nav className="flex flex-wrap justify-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <button onClick={() => { setLegalPage('terms'); setView('legal'); }} className="hover:text-primary transition-colors">Terms of Service</button>
              <button onClick={() => { setLegalPage('privacy'); setView('legal'); }} className="hover:text-primary transition-colors">Privacy Policy</button>
              <button onClick={() => { setLegalPage('cookies'); setView('legal'); }} className="hover:text-primary transition-colors">Cookie Settings</button>
            </nav>

            <div className="flex items-center gap-4">
              <a href="https://www.facebook.com/Alston332" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-primary transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="https://www.youtube.com/@Alston332" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-primary transition-colors"><Youtube className="w-5 h-5" /></a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium">© 2026 JAAS Billing Pro AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Confirm Save Customer Modal */}
      <AnimatePresence>
        {showConfirmSaveCustomer && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmSaveCustomer(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 border border-slate-100 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Save className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Save Changes?</h2>
              <p className="text-slate-500 mb-8">Are you sure you want to save the changes for this customer?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmSaveCustomer(false)} className="flex-1 btn-secondary">Cancel</button>
                <button onClick={confirmSaveCustomer} className="flex-1 btn-primary">Yes, Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
