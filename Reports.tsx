import React, { useState, useEffect } from 'react';
import { Invoice, Product, Customer } from '../types';
import { getInvoices, getProducts, getCustomers } from '../lib/storage';
import { formatCurrency } from '../lib/calculations';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Layers,
  PieChart,
  Users,
  Package,
  ArrowUpRight,
  ShieldCheck,
  Tag,
  CreditCard,
} from 'lucide-react';

type DateFilterType = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

export const Reports: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [dateFilter, setDateFilter] = useState<DateFilterType>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'customers' | 'customerTypes'>('overview');

  useEffect(() => {
    setInvoices(getInvoices());
    setProducts(getProducts());
    setCustomers(getCustomers());
  }, []);

  // Filter invoices by date
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const getWeekStart = () => {
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday/Sunday
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };

  const getMonthStart = () => {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  };

  const getYearStart = () => {
    return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
  };

  const filteredInvoices = invoices.filter(inv => {
    if (inv.status === 'ملغاة') return false;

    if (dateFilter === 'today') return inv.date === todayStr;
    if (dateFilter === 'week') return inv.date >= getWeekStart() && inv.date <= todayStr;
    if (dateFilter === 'month') return inv.date >= getMonthStart() && inv.date <= todayStr;
    if (dateFilter === 'year') return inv.date >= getYearStart() && inv.date <= todayStr;
    if (dateFilter === 'custom') {
      if (customFrom && inv.date < customFrom) return false;
      if (customTo && inv.date > customTo) return false;
      return true;
    }
    return true; // 'all'
  });

  // KPI Calculations
  const grossSales = filteredInvoices.reduce((sum, i) => sum + i.grossTotal, 0);
  const totalDiscounts = filteredInvoices.reduce((sum, i) => sum + i.totalDiscount, 0);
  const netSales = filteredInvoices.reduce((sum, i) => sum + i.finalTotal, 0);
  const totalCost = filteredInvoices.reduce((sum, i) => sum + i.totalCost, 0);
  const netProfit = filteredInvoices.reduce((sum, i) => sum + i.totalProfit, 0);
  const cashCollected = filteredInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const outstandingBalances = filteredInvoices.reduce((sum, i) => sum + i.remainingAmount, 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + p.currentQuantity * p.costPrice, 0);

  const overallProfitMargin = netSales > 0 ? ((netProfit / netSales) * 100).toFixed(1) : '0';

  // Product breakdown
  interface ProductReport {
    productId: string;
    productName: string;
    sku: string;
    quantitySold: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
  }

  const productMap = new Map<string, ProductReport>();
  filteredInvoices.forEach(inv => {
    inv.items.forEach(item => {
      const existing = productMap.get(item.productId) || {
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantitySold: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
      };

      existing.quantitySold += item.quantity;
      existing.totalRevenue += item.total;
      existing.totalCost += item.totalCost;
      existing.totalProfit += item.profit;
      productMap.set(item.productId, existing);
    });
  });

  const productReports = Array.from(productMap.values()).sort(
    (a, b) => b.totalProfit - a.totalProfit
  );

  // Customer breakdown
  interface CustomerReport {
    customerId: string;
    customerName: string;
    customerType: string;
    invoicesCount: number;
    totalRevenue: number;
    totalProfit: number;
    totalPaid: number;
    outstanding: number;
  }

  const customerMap = new Map<string, CustomerReport>();
  filteredInvoices.forEach(inv => {
    const existing = customerMap.get(inv.customerId) || {
      customerId: inv.customerId,
      customerName: inv.customerName,
      customerType: inv.customerType,
      invoicesCount: 0,
      totalRevenue: 0,
      totalProfit: 0,
      totalPaid: 0,
      outstanding: 0,
    };

    existing.invoicesCount += 1;
    existing.totalRevenue += inv.finalTotal;
    existing.totalProfit += inv.totalProfit;
    existing.totalPaid += inv.paidAmount;
    existing.outstanding += inv.remainingAmount;
    customerMap.set(inv.customerId, existing);
  });

  const customerReports = Array.from(customerMap.values()).sort(
    (a, b) => b.totalRevenue - a.totalRevenue
  );

  // Customer Type breakdown
  interface TypeReport {
    type: string;
    invoicesCount: number;
    totalRevenue: number;
    totalProfit: number;
  }

  const typeMap = new Map<string, TypeReport>();
  filteredInvoices.forEach(inv => {
    const existing = typeMap.get(inv.customerType) || {
      type: inv.customerType,
      invoicesCount: 0,
      totalRevenue: 0,
      totalProfit: 0,
    };

    existing.invoicesCount += 1;
    existing.totalRevenue += inv.finalTotal;
    existing.totalProfit += inv.totalProfit;
    typeMap.set(inv.customerType, existing);
  });

  const typeReports = Array.from(typeMap.values()).sort(
    (a, b) => b.totalRevenue - a.totalRevenue
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span>تقارير الأرباح والمبيعات</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تحليل دقيق لصافي الأرباح المحققة بعد الخصومات، التكلفة، والمبالغ المحصلة والمتبقية.
          </p>
        </div>

        {/* Date Filters Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm text-xs">
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              dateFilter === 'today' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            اليوم
          </button>
          <button
            onClick={() => setDateFilter('week')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              dateFilter === 'week' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            هذا الأسبوع
          </button>
          <button
            onClick={() => setDateFilter('month')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              dateFilter === 'month' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            هذا الشهر
          </button>
          <button
            onClick={() => setDateFilter('year')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              dateFilter === 'year' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            هذه السنة
          </button>
          <button
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              dateFilter === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setDateFilter('custom')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              dateFilter === 'custom' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            مخصص
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {dateFilter === 'custom' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">من تاريخ:</span>
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">إلى تاريخ:</span>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Main KPI Profit Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Profit (Highlighted) */}
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-blue-600 to-blue-800 text-white p-5 rounded-xl shadow-md">
          <div className="flex items-center justify-between opacity-85 text-xs">
            <span>صافي الربح الفعلي</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold mt-2">
            {formatCurrency(netProfit)}
          </div>
          <div className="text-[11px] opacity-80 mt-1 font-mono">
            هامش الربح: {overallProfitMargin}% من صافي المبيعات
          </div>
        </div>

        {/* Net Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>صافي المبيعات (Net Sales)</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(netSales)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            الإجمالي قبل الخصم: {formatCurrency(grossSales)}
          </div>
        </div>

        {/* Total Cost */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>تكلفة المنتجات المباعة (COGS)</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-slate-700 mt-2">
            {formatCurrency(totalCost)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            سعر التكلفة الأصلي للبضاعة
          </div>
        </div>

        {/* Total Discounts */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="text-xs text-rose-600 font-semibold flex items-center justify-between">
            <span>إجمالي الخصومات الممنوحة</span>
            <Tag className="w-4 h-4 text-rose-400" />
          </div>
          <div className="font-mono text-2xl font-black text-rose-600 mt-2">
            {formatCurrency(totalDiscounts)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            على مستوى البنود والفواتير
          </div>
        </div>
      </div>

      {/* Cash vs Remaining & Inventory Value */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 block mb-1">المبالغ المحصلة نقداً والتحويلات</span>
            <span className="font-mono text-xl font-bold text-green-600">
              {formatCurrency(cashCollected)}
            </span>
          </div>
          <CreditCard className="w-8 h-8 text-blue-100 shrink-0" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 block mb-1">المستحق في ذمة العملاء (ديون الفترة)</span>
            <span className={`font-mono text-xl font-bold ${outstandingBalances > 0 ? 'text-red-600' : 'text-slate-700'}`}>
              {formatCurrency(outstandingBalances)}
            </span>
          </div>
          <Users className="w-8 h-8 text-red-100 shrink-0" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 block mb-1">إجمالي قيمة المخزون الحالي بالمخزن</span>
            <span className="font-mono text-xl font-bold text-slate-800">
              {formatCurrency(totalInventoryValue)}
            </span>
          </div>
          <Package className="w-8 h-8 text-slate-200 shrink-0" />
        </div>
      </div>

      {/* Reports Breakdown Tabs */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Tab selector */}
        <div className="flex border-b border-slate-100 text-xs font-medium bg-slate-50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-3 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            الملخص المحاسبي
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-5 py-3 border-b-2 transition-colors ${
              activeTab === 'products'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            المبيعات والأرباح حسب المنتج ({productReports.length})
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-5 py-3 border-b-2 transition-colors ${
              activeTab === 'customers'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            المبيعات والأرصدة حسب العميل ({customerReports.length})
          </button>
          <button
            onClick={() => setActiveTab('customerTypes')}
            className={`px-5 py-3 border-b-2 transition-colors ${
              activeTab === 'customerTypes'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            الأرباح حسب فئة العميل
          </button>
        </div>

        {/* Tab 1: Accounting Overview */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-4 text-xs">
            <h3 className="font-bold text-slate-800 text-sm">
              قائمة الدخل والتدفق المالي للفترة المحددة
            </h3>

            <div className="max-w-2xl divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex justify-between p-3 bg-slate-50 font-bold text-slate-800">
                <span>إجمالي المبيعات الإجمالية (Gross Sales)</span>
                <span className="font-mono text-sm">{formatCurrency(grossSales)}</span>
              </div>
              <div className="flex justify-between p-3 text-rose-600">
                <span>(-) إجمالي الخصومات الممنوحة للعملاء</span>
                <span className="font-mono text-sm">-{formatCurrency(totalDiscounts)}</span>
              </div>
              <div className="flex justify-between p-3 font-bold text-slate-900 bg-emerald-50/50">
                <span>(=) صافي المبيعات (Net Sales)</span>
                <span className="font-mono text-sm text-emerald-800">{formatCurrency(netSales)}</span>
              </div>
              <div className="flex justify-between p-3 text-slate-600">
                <span>(-) تكلفة البضاعة المباعة (Cost of Goods Sold)</span>
                <span className="font-mono text-sm">-{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex justify-between p-3.5 font-black text-white bg-emerald-700 text-base">
                <span>(=) صافي الربح الحقيقي (Net Profit)</span>
                <span className="font-mono">{formatCurrency(netProfit)}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pt-2">
              * تم حساب كافة الأرباح بتوزيع خصومات الفاتورة تناسبياً على البنود لضمان الدقة المحاسبية التامة.
            </p>
          </div>
        )}

        {/* Tab 2: Products Breakdown */}
        {activeTab === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">المنتج</th>
                  <th className="py-3 px-4 text-center">الكمية المباعة</th>
                  <th className="py-3 px-4 text-left font-mono">إجمالي الإيراد</th>
                  <th className="py-3 px-4 text-left font-mono">إجمالي التكلفة</th>
                  <th className="py-3 px-4 text-left font-mono font-bold text-emerald-700">صافي الربح</th>
                  <th className="py-3 px-4 text-center">نسبة الربح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {productReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      لا توجد مبيعات مسجلة في الفترة المحددة
                    </td>
                  </tr>
                ) : (
                  productReports.map(pr => {
                    const margin = pr.totalRevenue > 0 ? ((pr.totalProfit / pr.totalRevenue) * 100).toFixed(1) : '0';
                    return (
                      <tr key={pr.productId} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{pr.productName}</div>
                          <div className="font-mono text-[10px] text-slate-400">{pr.sku}</div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800 font-mono">
                          {pr.quantitySold}
                        </td>
                        <td className="py-3 px-4 text-left font-mono text-slate-800">
                          {formatCurrency(pr.totalRevenue)}
                        </td>
                        <td className="py-3 px-4 text-left font-mono text-slate-600">
                          {formatCurrency(pr.totalCost)}
                        </td>
                        <td className="py-3 px-4 text-left font-mono font-bold text-emerald-600 text-sm">
                          {formatCurrency(pr.totalProfit)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                          {margin}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Customers Breakdown */}
        {activeTab === 'customers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">اسم العميل</th>
                  <th className="py-3 px-4">نوع العميل</th>
                  <th className="py-3 px-4 text-center">عدد الفواتير</th>
                  <th className="py-3 px-4 text-left font-mono">إجمالي المبيعات</th>
                  <th className="py-3 px-4 text-left font-mono font-bold text-emerald-700">صافي الربح منه</th>
                  <th className="py-3 px-4 text-left font-mono">المسدد</th>
                  <th className="py-3 px-4 text-left font-mono font-black">الرصيد المستحق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {customerReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      لا توجد فواتير للعملاء في هذه الفترة
                    </td>
                  </tr>
                ) : (
                  customerReports.map(cr => (
                    <tr key={cr.customerId} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{cr.customerName}</td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                          {cr.customerType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">{cr.invoicesCount}</td>
                      <td className="py-3 px-4 text-left font-mono font-bold text-slate-800">
                        {formatCurrency(cr.totalRevenue)}
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-bold text-emerald-600">
                        {formatCurrency(cr.totalProfit)}
                      </td>
                      <td className="py-3 px-4 text-left font-mono text-slate-700">
                        {formatCurrency(cr.totalPaid)}
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-black">
                        <span className={cr.outstanding > 0 ? 'text-rose-600' : 'text-slate-500'}>
                          {formatCurrency(cr.outstanding)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Customer Types Breakdown */}
        {activeTab === 'customerTypes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">فئة العميل</th>
                  <th className="py-3 px-4 text-center">عدد الفواتير</th>
                  <th className="py-3 px-4 text-left font-mono">إجمالي المبيعات</th>
                  <th className="py-3 px-4 text-left font-mono font-bold text-emerald-700">إجمالي الأرباح</th>
                  <th className="py-3 px-4 text-center">هامش الربح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {typeReports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      لا توجد بيانات للفترة المحددة
                    </td>
                  </tr>
                ) : (
                  typeReports.map(tr => {
                    const margin = tr.totalRevenue > 0 ? ((tr.totalProfit / tr.totalRevenue) * 100).toFixed(1) : '0';
                    return (
                      <tr key={tr.type} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900 text-sm">{tr.type}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold">{tr.invoicesCount}</td>
                        <td className="py-3 px-4 text-left font-mono font-bold text-slate-800">
                          {formatCurrency(tr.totalRevenue)}
                        </td>
                        <td className="py-3 px-4 text-left font-mono font-bold text-emerald-600 text-sm">
                          {formatCurrency(tr.totalProfit)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                          {margin}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
