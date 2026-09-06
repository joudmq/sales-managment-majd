import React, { useState, useEffect } from 'react';
import { Invoice, AppSettings } from '../types';
import { getInvoices, getSettings, cancelInvoice } from '../lib/storage';
import { formatCurrency } from '../lib/calculations';
import {
  FileText,
  Search,
  Printer,
  FileDown,
  Eye,
  CreditCard,
  Ban,
  Plus,
  Filter,
  Calendar,
  CheckCircle,
  AlertCircle,
  Camera,
} from 'lucide-react';

interface InvoicesProps {
  onNewInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onPrintInvoice: (invoice: Invoice) => void;
  onPdfInvoice: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
}

export const Invoices: React.FC<InvoicesProps> = ({
  onNewInvoice,
  onViewInvoice,
  onPrintInvoice,
  onPdfInvoice,
  onRecordPayment,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getSettings());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    setInvoices(getInvoices());
    setSettings(getSettings());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelInvoice = (invoice: Invoice) => {
    if (invoice.status === 'ملغاة') {
      alert('هذه الفاتورة ملغاة بالفعل.');
      return;
    }

    if (
      window.confirm(
        `هل أنت متأكد من رغبتك في إلغاء الفاتورة ${invoice.invoiceNumber}؟\nسيتم إرجاع كميات جميع المنتجات (${invoice.items.reduce((s, i) => s + i.quantity, 0)} قطعة) تلقائياً إلى المخزون.`
      )
    ) {
      const res = cancelInvoice(invoice.id);
      setNotification({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
      loadData();
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Filter logic
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customerPhone && inv.customerPhone.includes(searchQuery));

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesType = customerTypeFilter === 'all' || inv.customerType === customerTypeFilter;

    let matchesDate = true;
    if (fromDate && inv.date < fromDate) matchesDate = false;
    if (toDate && inv.date > toDate) matchesDate = false;

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  // KPI summaries for invoices
  const totalSales = invoices.filter(i => i.status !== 'ملغاة').reduce((sum, i) => sum + i.finalTotal, 0);
  const totalPaid = invoices.filter(i => i.status !== 'ملغاة').reduce((sum, i) => sum + i.paidAmount, 0);
  const totalRemaining = invoices.filter(i => i.status !== 'ملغاة').reduce((sum, i) => sum + i.remainingAmount, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>سجل فواتير المبيعات</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            استعراض، طباعة، تصدير PDF، وتسجيل الدفعات للفواتير الصادرة للعملاء.
          </p>
        </div>

        <button
          onClick={onNewInvoice}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-colors shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>+ إنشاء فاتورة جديدة</span>
        </button>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span className="font-semibold">{notification.text}</span>
        </div>
      )}

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block mb-1">إجمالي الفواتير النشطة</span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-slate-900">
            {formatCurrency(totalSales)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            عدد الفواتير: {invoices.filter(i => i.status !== 'ملغاة').length}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block mb-1">إجمالي المبالغ المحصلة</span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-blue-600">
            {formatCurrency(totalPaid)}
          </span>
          <span className="text-[11px] text-green-600 font-medium block mt-1">المسدد نقداً والتحويلات</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block mb-1">المتبقي قيد التحصيل (ديون)</span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-red-600">
            {formatCurrency(totalRemaining)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">في ذمة العملاء</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <input
              type="text"
              placeholder="ابحث برقم الفاتورة، اسم العميل، أو الهاتف..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">كافة الحالات</option>
              <option value="مدفوعة بالكامل">مدفوعة بالكامل</option>
              <option value="مدفوعة جزئيًا">مدفوعة جزئيًا</option>
              <option value="غير مدفوعة">غير مدفوعة</option>
              <option value="ملغاة">ملغاة</option>
            </select>
          </div>

          {/* Customer Type Filter */}
          <div>
            <select
              value={customerTypeFilter}
              onChange={e => setCustomerTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">كافة فئات العملاء</option>
              <option value="طبيب">طبيب</option>
              <option value="صيدلي">صيدلي</option>
              <option value="أخصائي بشرة">أخصائي بشرة</option>
              <option value="زبون عادي">زبون عادي</option>
            </select>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-1/2 px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-[11px]"
              title="من تاريخ"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-1/2 px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-[11px]"
              title="إلى تاريخ"
            />
          </div>
        </div>

        {(searchQuery || statusFilter !== 'all' || customerTypeFilter !== 'all' || fromDate || toDate) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCustomerTypeFilter('all');
                setFromDate('');
                setToDate('');
              }}
              className="text-[11px] text-slate-500 hover:text-slate-800 underline font-semibold"
            >
              إعادة تعيين الفلاتر
            </button>
          </div>
        )}
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">رقم الفاتورة</th>
                <th className="py-3 px-4">العميل والتصنيف</th>
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4 text-left font-mono">الإجمالي النهائي</th>
                <th className="py-3 px-4 text-left font-mono">المدفوع</th>
                <th className="py-3 px-4 text-left font-mono font-bold">المتبقي</th>
                <th className="py-3 px-4 text-center">حالة السداد</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    لا توجد فواتير مطابقة لخيارات البحث أو الفلترة
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr
                    key={inv.id}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      inv.status === 'ملغاة' ? 'bg-slate-50/70 opacity-60' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="font-mono font-bold text-slate-900 hover:text-blue-700 block transition-colors"
                        >
                          {inv.invoiceNumber}
                        </button>
                        {inv.scannedImageUrl && (
                          <span
                            className="inline-flex items-center text-blue-600 bg-blue-50 border border-blue-200 p-0.5 rounded text-[10px]"
                            title="فاتورة مرفق معها صورة ورقية"
                          >
                            <Camera className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {inv.items.length} بنود ({inv.items.reduce((s, i) => s + i.quantity, 0)} قطعة)
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{inv.customerName}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-block bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px]">
                          {inv.customerType}
                        </span>
                        {inv.clinicOrPharmacyName && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            {inv.clinicOrPharmacyName}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{inv.date}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-left font-mono font-bold text-slate-900 text-sm">
                      {formatCurrency(inv.finalTotal)}
                    </td>

                    <td className="py-3 px-4 text-left font-mono font-bold text-emerald-600">
                      {formatCurrency(inv.paidAmount)}
                    </td>

                    <td className="py-3 px-4 text-left font-mono font-black">
                      <span className={inv.remainingAmount > 0 ? 'text-rose-600' : 'text-slate-400'}>
                        {formatCurrency(inv.remainingAmount)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          inv.status === 'مدفوعة بالكامل'
                            ? 'bg-green-100 text-green-700'
                            : inv.status === 'مدفوعة جزئيًا'
                            ? 'bg-orange-100 text-orange-700'
                            : inv.status === 'غير مدفوعة'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {inv.status === 'مدفوعة بالكامل'
                          ? 'مدفوعة'
                          : inv.status === 'مدفوعة جزئيًا'
                          ? 'جزئي'
                          : inv.status === 'غير مدفوعة'
                          ? 'غير مدفوع'
                          : 'ملغاة'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="عرض التفاصيل والأرباح الداخلية"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onPrintInvoice(inv)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="طباعة الفاتورة للعميل"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onPdfInvoice(inv)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تحميل كملف PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>

                        {inv.remainingAmount > 0 && inv.status !== 'ملغاة' && (
                          <button
                            onClick={() => onRecordPayment(inv)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="تسجيل دفعة جديدة"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}

                        {inv.status !== 'ملغاة' && (
                          <button
                            onClick={() => handleCancelInvoice(inv)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="إلغاء الفاتورة وإرجاع المخزون"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
