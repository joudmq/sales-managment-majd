import React, { useState, useEffect } from 'react';
import { Customer, Invoice, AppSettings } from './types';
import {
  isAuthenticated,
  logoutUser,
  getSettings,
  cancelInvoice,
  startFirestoreRealtimeSync,
  initStorage,
} from './lib/storage';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { NewInvoice } from './components/NewInvoice';
import { Invoices } from './components/Invoices';
import { Products } from './components/Products';
import { Inventory } from './components/Inventory';
import { StockMovements } from './components/StockMovements';
import { StockIn } from './components/StockIn';
import { Customers } from './components/Customers';
import { Suppliers } from './components/Suppliers';
import { Reports } from './components/Reports';
import { SettingsPage } from './components/SettingsPage';
import { UsersManagement } from './components/UsersManagement';
import { Login } from './components/Login';

// Modals
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { CustomerProfileModal } from './components/CustomerProfileModal';

import { Menu, Stethoscope, Search, Cloud, Check } from 'lucide-react';

export default function App() {
  const [auth, setAuth] = useState<boolean>(isAuthenticated());
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Page titles map for top header
  const pageTitles: Record<string, string> = {
    dashboard: 'لوحة التحكم العامة',
    'new-invoice': 'إنشاء فاتورة مبيعات جديدة',
    invoices: 'سجل وإدارة الفواتير',
    products: 'إدارة المنتجات وقوائم الأسعار',
    inventory: 'المخزون وحركات الجرد',
    'stock-movements': 'سجل حركة المخزون',
    'stock-in': 'إدخال وتوريد بضاعة للمخزن',
    customers: 'دليل وحسابات العملاء',
    suppliers: 'إدارة الموردين والمشتريات',
    reports: 'تقارير المبيعات والأرباح',
    users: 'إدارة حسابات المستخدمين والصلاحيات',
    settings: 'إعدادات النظام والفواتير',
  };

  // Cross-page state (for pre-selecting customer in new invoice)
  const [selectedCustomerIdForInvoice, setSelectedCustomerIdForInvoice] = useState<string | undefined>(undefined);

  // Modals state
  const [printModalInvoice, setPrintModalInvoice] = useState<Invoice | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [detailModalInvoice, setDetailModalInvoice] = useState<Invoice | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [profileModalCustomer, setProfileModalCustomer] = useState<Customer | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Refresh trigger for components when global data changes (e.g. payment recorded, data reset)
  const [dataVersion, setDataVersion] = useState(0);

  const refreshData = () => {
    setSettings(getSettings());
    setDataVersion(v => v + 1);
  };

  useEffect(() => {
    initStorage();
    setAuth(isAuthenticated());
    // Start real-time Firestore synchronization across devices & tabs
    const unsubscribe = startFirestoreRealtimeSync(() => {
      refreshData();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    logoutUser();
    setAuth(false);
  };

  const handleOpenPrint = (invoice: Invoice) => {
    setPrintModalInvoice(invoice);
    setIsPrintModalOpen(true);
  };

  const handleOpenDetail = (invoice: Invoice) => {
    setDetailModalInvoice(invoice);
    setIsDetailModalOpen(true);
  };

  const handleOpenPayment = (invoice: Invoice) => {
    setPaymentModalInvoice(invoice);
    setIsPaymentModalOpen(true);
  };

  const handleOpenCustomerProfile = (customer: Customer) => {
    setProfileModalCustomer(customer);
    setIsProfileModalOpen(true);
  };

  const handleNewInvoiceForCustomer = (customer: Customer) => {
    setSelectedCustomerIdForInvoice(customer.id);
    setIsProfileModalOpen(false);
    setCurrentPage('new-invoice');
  };

  const handleCancelInvoice = (invoice: Invoice) => {
    if (
      window.confirm(
        `هل أنت متأكد من رغبتك في إلغاء الفاتورة ${invoice.invoiceNumber}؟\nسيتم إرجاع كميات جميع المنتجات تلقائياً إلى المخزون.`
      )
    ) {
      const res = cancelInvoice(invoice.id);
      alert(res.message);
      setIsDetailModalOpen(false);
      refreshData();
    }
  };

  // If unauthenticated, show Login screen
  if (!auth) {
    return <Login onLoginSuccess={() => setAuth(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col lg:flex-row antialiased font-sans" dir="rtl">
      {/* Sidebar navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={page => {
          if (page === 'new-invoice') {
            setSelectedCustomerIdForInvoice(undefined);
          }
          setCurrentPage(page);
        }}
        onLogout={handleLogout}
        settings={settings}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-64">
        {/* Desktop Header Bar */}
        <header className="hidden lg:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 sticky top-0 z-20 shadow-xs">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {pageTitles[currentPage] || 'لوحة التحكم'}
          </h2>
          <div className="flex items-center gap-4">
            {/* Cloud Firestore Status Badge */}
            <div
              id="firestore-connection-status"
              className="hidden xl:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/80 text-emerald-700 rounded-full text-xs font-medium shadow-xs"
              title="قاعدة بيانات Google Cloud Firestore متصلة ومحفوظة سحابياً بشكل دائم"
            >
              <div className="relative flex items-center justify-center">
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <span className="font-semibold">سحابة Firestore متصلة</span>
              <Check className="w-3 h-3 text-emerald-500" />
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="بحث سريع (منتج، عميل، فاتورة...)"
                value={globalSearch}
                onChange={e => {
                  setGlobalSearch(e.target.value);
                  if (currentPage !== 'invoices' && currentPage !== 'products' && currentPage !== 'customers') {
                    setCurrentPage('invoices');
                  }
                }}
                className="bg-slate-100 border-none rounded-full py-2 pr-10 pl-4 text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
            </div>
            <button
              onClick={() => {
                setSelectedCustomerIdForInvoice(undefined);
                setCurrentPage('new-invoice');
              }}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center shadow-md text-sm gap-2"
            >
              <span className="text-lg leading-none">+</span>
              <span>فاتورة جديدة</span>
            </button>
          </div>
        </header>

        {/* Mobile Header Bar */}
        <header className="lg:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs truncate max-w-[180px]">{settings.businessName}</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Page Views */}
        <main className="flex-1 pb-12">
          {currentPage === 'dashboard' && (
            <Dashboard
              key={dataVersion}
              onNavigate={page => {
                if (page === 'new-invoice') setSelectedCustomerIdForInvoice(undefined);
                setCurrentPage(page);
              }}
              onViewInvoice={handleOpenDetail}
            />
          )}

          {currentPage === 'new-invoice' && (
            <NewInvoice
              key={`${dataVersion}-${selectedCustomerIdForInvoice || 'new'}`}
              initialCustomerId={selectedCustomerIdForInvoice}
              onInvoiceCreated={(createdInvoice, shouldPrint) => {
                refreshData();
                if (shouldPrint) {
                  handleOpenPrint(createdInvoice);
                }
              }}
              onNavigateToInvoices={() => setCurrentPage('invoices')}
            />
          )}

          {currentPage === 'invoices' && (
            <Invoices
              key={dataVersion}
              onNewInvoice={() => {
                setSelectedCustomerIdForInvoice(undefined);
                setCurrentPage('new-invoice');
              }}
              onViewInvoice={handleOpenDetail}
              onPrintInvoice={handleOpenPrint}
              onPdfInvoice={handleOpenPrint}
              onRecordPayment={handleOpenPayment}
            />
          )}

          {currentPage === 'products' && <Products key={dataVersion} />}

          {currentPage === 'inventory' && (
            <Inventory
              key={dataVersion}
              onGoToStockIn={() => setCurrentPage('stock-in')}
              onGoToMovements={() => setCurrentPage('stock-movements')}
            />
          )}

          {currentPage === 'stock-movements' && (
            <StockMovements
              key={dataVersion}
              onGoToStockIn={() => setCurrentPage('stock-in')}
              onViewInvoice={handleOpenDetail}
            />
          )}

          {currentPage === 'stock-in' && <StockIn key={dataVersion} />}

          {currentPage === 'customers' && (
            <Customers
              key={dataVersion}
              onOpenCustomerProfile={handleOpenCustomerProfile}
              onNewInvoiceForCustomer={handleNewInvoiceForCustomer}
            />
          )}

          {currentPage === 'suppliers' && <Suppliers key={dataVersion} />}

          {currentPage === 'reports' && <Reports key={dataVersion} />}

          {currentPage === 'users' && <UsersManagement key={dataVersion} />}

          {currentPage === 'settings' && (
            <SettingsPage
              onDataReset={() => {
                refreshData();
                setCurrentPage('dashboard');
              }}
              onNavigateToUsers={() => setCurrentPage('users')}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <InvoicePrintModal
        invoice={printModalInvoice}
        settings={settings}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />

      <InvoiceDetailModal
        invoice={detailModalInvoice}
        settings={settings}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onPrint={handleOpenPrint}
        onPdf={handleOpenPrint}
        onRecordPayment={inv => {
          setIsDetailModalOpen(false);
          handleOpenPayment(inv);
        }}
        onCancelInvoice={handleCancelInvoice}
      />

      <RecordPaymentModal
        invoice={paymentModalInvoice}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={_updatedInvoice => {
          refreshData();
        }}
      />

      <CustomerProfileModal
        customer={profileModalCustomer}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onNewInvoiceForCustomer={handleNewInvoiceForCustomer}
        onViewInvoice={handleOpenDetail}
        onPrintInvoice={handleOpenPrint}
        onRecordPayment={handleOpenPayment}
      />
    </div>
  );
}
