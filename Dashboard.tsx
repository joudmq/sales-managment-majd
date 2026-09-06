import React, { useState, useEffect } from 'react';
import { Invoice, Product, Customer } from '../types';
import { getInvoices, getProducts, getCustomers } from '../lib/storage';
import { formatCurrency } from '../lib/calculations';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  AlertTriangle,
  XCircle,
  FilePlus,
  Plus,
  ArrowDownToLine,
  UserPlus,
  FileText,
  Eye,
  CreditCard,
  Package,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string) => void;
  onViewInvoice: (invoice: Invoice) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onViewInvoice }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    setInvoices(getInvoices());
    setProducts(getProducts());
    setCustomers(getCustomers());
  }, []);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const monthStartStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const activeInvoices = invoices.filter(i => i.status !== 'ملغاة');

  // Sales & Profits
  const todayInvoices = activeInvoices.filter(i => i.date === todayStr);
  const monthInvoices = activeInvoices.filter(i => i.date >= monthStartStr && i.date <= todayStr);

  const salesToday = todayInvoices.reduce((sum, i) => sum + i.finalTotal, 0);
  const salesMonth = monthInvoices.reduce((sum, i) => sum + i.finalTotal, 0);
  const salesAllTime = activeInvoices.reduce((sum, i) => sum + i.finalTotal, 0);

  const profitToday = todayInvoices.reduce((sum, i) => sum + i.totalProfit, 0);
  const profitMonth = monthInvoices.reduce((sum, i) => sum + i.totalProfit, 0);

  const totalOutstanding = activeInvoices.reduce((sum, i) => sum + i.remainingAmount, 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + p.currentQuantity * p.costPrice, 0);

  // Stock Alerts
  const lowStockProducts = products.filter(
    p => p.currentQuantity > 0 && p.currentQuantity <= p.minStockLevel
  );
  const outOfStockProducts = products.filter(p => p.currentQuantity <= 0);

  // Recent Invoices
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  // Top Selling Products
  const productSalesMap = new Map<string, { name: string; sku: string; qty: number; total: number }>();
  activeInvoices.forEach(inv => {
    inv.items.forEach(item => {
      const existing = productSalesMap.get(item.productId) || {
        name: item.productName,
        sku: item.sku,
        qty: 0,
        total: 0,
      };
      existing.qty += item.quantity;
      existing.total += item.total;
      productSalesMap.set(item.productId, existing);
    });
  });

  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const renderCustomerTypeBadge = (type: string) => {
    switch (type) {
      case 'طبيب':
        return <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">طبيب</span>;
      case 'صيدلية':
        return <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-medium">صيدلي</span>;
      case 'أخصائي بشرة':
        return <span className="text-xs text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full font-medium">أخصائي</span>;
      default:
        return <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">عادي</span>;
    }
  };

  const renderInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'مدفوعة بالكامل':
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">مدفوعة</span>;
      case 'مدفوعة جزئيًا':
        return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">جزئي</span>;
      case 'غير مدفوعة':
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">غير مدفوع</span>;
      default:
        return <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-medium">ملغاة</span>;
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto bg-slate-50" dir="rtl">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
            بوابة التاجر • إدارة المبيعات الطبية والمخزون
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mt-1">
            لوحة التحكم العامة
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            نظرة شاملة وسريعة على مبيعات اليوم، صافي أرباح الشهر، وتنبيهات المخزون الفورية.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('new-invoice')}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center shadow-md text-xs gap-2"
          >
            <FilePlus className="w-4 h-4" />
            <span>+ فاتورة مبيعات</span>
          </button>

          <button
            onClick={() => onNavigate('stock-in')}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>+ إدخال بضاعة</span>
          </button>

          <button
            onClick={() => onNavigate('products')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-lg font-medium text-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ منتج جديد</span>
          </button>

          <button
            onClick={() => onNavigate('customers')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-lg font-medium text-xs transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ عميل جديد</span>
          </button>
        </div>
      </div>

      {/* 4-Card Metric Grid matching Professional Polish theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Sales Today */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm mb-1">
            <span>مبيعات اليوم</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">{formatCurrency(salesToday)}</p>
          <p className="text-xs text-green-600 mt-2 font-medium">
            {todayInvoices.length} فواتير مسجلة اليوم
          </p>
        </div>

        {/* Card 2: Profit This Month */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm mb-1">
            <span>أرباح الشهر</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">{formatCurrency(profitMonth)}</p>
          <p className="text-xs text-blue-600 mt-2 font-medium">
            صافي بعد الخصومات والتكاليف
          </p>
        </div>

        {/* Card 3: Outstanding Balances */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm mb-1">
            <span>إجمالي المستحقات</span>
            <CreditCard className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600 font-mono">{formatCurrency(totalOutstanding)}</p>
          <p className="text-xs text-slate-400 mt-2">
            {activeInvoices.filter(i => i.remainingAmount > 0).length} فواتير متبقية الذمة
          </p>
        </div>

        {/* Card 4: Inventory Value */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm mb-1">
            <span>قيمة المخزون</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">{formatCurrency(totalInventoryValue)}</p>
          <p className="text-xs text-orange-600 mt-2 font-medium">
            {lowStockProducts.length + outOfStockProducts.length} تنبيهات نواقص مخزون
          </p>
        </div>
      </div>

      {/* Main Content Grid: Recent Invoices (2/3) & Alerts/Quick Summary (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>آخر الفواتير الصادرة</span>
            </h3>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-blue-600 text-sm hover:underline font-medium"
            >
              عرض الكل &larr;
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-medium">
                  <th className="px-6 py-3 border-b border-slate-100">رقم الفاتورة</th>
                  <th className="px-6 py-3 border-b border-slate-100">العميل</th>
                  <th className="px-6 py-3 border-b border-slate-100 text-left font-mono">الإجمالي</th>
                  <th className="px-6 py-3 border-b border-slate-100 text-left font-mono">المدفوع</th>
                  <th className="px-6 py-3 border-b border-slate-100 text-center">الحالة</th>
                  <th className="px-4 py-3 border-b border-slate-100 text-center">عرض</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 text-xs divide-y divide-slate-100">
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      لا توجد فواتير بعد. انقر على "+ فاتورة جديدة" للبدء.
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{inv.customerName}</span>
                          {renderCustomerTypeBadge(inv.customerType)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-left font-mono font-bold text-slate-900">
                        {formatCurrency(inv.finalTotal)}
                      </td>
                      <td className="px-6 py-4 text-left font-mono font-medium text-slate-700">
                        {formatCurrency(inv.paidAmount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {renderInvoiceStatusBadge(inv.status)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="عرض الفاتورة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Inventory Alerts & Quick Summary Banner */}
        <div className="flex flex-col gap-6">
          {/* Inventory Alerts Box */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex-1 flex flex-col">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="text-orange-500">⚠️</span>
                <span>تنبيهات المخزون</span>
              </span>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                إدارة المخزون
              </button>
            </h3>

            <div className="space-y-3 flex-1 overflow-auto">
              {outOfStockProducts.length === 0 && lowStockProducts.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-lg">
                  جميع المنتجات متوفرة بكميات كافية في المخزن.
                </div>
              ) : (
                <>
                  {outOfStockProducts.map(p => (
                    <div
                      key={p.id}
                      className="p-3 bg-red-50 border-r-4 border-red-500 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{p.name}</p>
                        <p className="text-[11px] text-red-600 font-medium mt-0.5">نفد من المخزون</p>
                      </div>
                      <button
                        onClick={() => onNavigate('stock-in')}
                        className="text-xs bg-white border border-red-200 text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-md font-medium shadow-xs"
                      >
                        طلب بضاعة
                      </button>
                    </div>
                  ))}

                  {lowStockProducts.map(p => (
                    <div
                      key={p.id}
                      className="p-3 bg-orange-50 border-r-4 border-orange-500 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{p.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          متبقي <strong className="text-orange-700 font-mono">{p.currentQuantity}</strong> وحدات (الحد الأدنى {p.minStockLevel})
                        </p>
                      </div>
                      <button
                        onClick={() => onNavigate('stock-in')}
                        className="text-xs bg-white border border-orange-200 text-orange-800 hover:bg-orange-50 px-2.5 py-1 rounded-md font-medium shadow-xs"
                      >
                        طلب بضاعة
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Quick Summary Card (Solid Blue, matches design) */}
          <div className="bg-blue-600 rounded-xl shadow-lg p-5 text-white flex items-center justify-between">
            <div>
              <h4 className="text-xs opacity-80 font-medium">الملخص السريع</h4>
              <p className="text-lg font-bold mt-1">إجمالي المبيعات العامة</p>
              <p className="text-2xl sm:text-3xl font-black mt-1 font-mono">
                {formatCurrency(salesAllTime)}
              </p>
              <p className="text-[11px] opacity-80 mt-1">
                {activeInvoices.length} فواتير مسجلة في النظام
              </p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center border border-white/30 text-2xl shrink-0">
              📈
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
