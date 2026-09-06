import React, { useState } from 'react';
import { Invoice, AppSettings } from '../types';
import { formatCurrency } from '../lib/calculations';
import { getPayments } from '../lib/storage';
import {
  X,
  Printer,
  FileDown,
  CreditCard,
  Ban,
  ShieldCheck,
  Calendar,
  User,
  Phone,
  Camera,
  Image as ImageIcon,
  ZoomIn,
} from 'lucide-react';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onPrint: (invoice: Invoice) => void;
  onPdf: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onCancelInvoice: (invoice: Invoice) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  settings,
  isOpen,
  onClose,
  onPrint,
  onPdf,
  onRecordPayment,
  onCancelInvoice,
}) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  if (!isOpen || !invoice) return null;

  const allPayments = getPayments();
  const invoicePayments = allPayments.filter(p => p.invoiceId === invoice.id);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold">تفاصيل الفاتورة:</span>
                <span className="font-mono text-lg font-bold text-blue-400">{invoice.invoiceNumber}</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                    invoice.status === 'مدفوعة بالكامل'
                      ? 'bg-green-500/20 text-green-300 border-green-500/30'
                      : invoice.status === 'مدفوعة جزئيًا'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : invoice.status === 'غير مدفوعة'
                      ? 'bg-red-500/20 text-red-300 border-red-500/30'
                      : 'bg-slate-700 text-slate-300 border-slate-600'
                  }`}
                >
                  {invoice.status}
                </span>

                {invoice.scannedImageUrl && (
                  <button
                    type="button"
                    onClick={() => setIsImageModalOpen(true)}
                    className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 hover:bg-blue-500/30 transition-colors cursor-pointer"
                    title="انقر لمعاينة صورة الفاتورة الأصلية"
                  >
                    <Camera className="w-3 h-3" />
                    <span>صورة مرفقة</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>تاريخ الفاتورة: {invoice.date}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrint(invoice)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>
            <button
              onClick={() => onPdf(invoice)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Customer & Info bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block">العميل:</span>
                <span className="font-bold text-slate-800 text-sm">{invoice.customerName}</span>
                <span className="inline-block bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded text-[10px] mr-1">
                  {invoice.customerType}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block">الهاتف / المنشأة:</span>
                <span className="font-mono font-bold text-slate-800">{invoice.customerPhone || '—'}</span>
                {invoice.clinicOrPharmacyName && (
                  <span className="block text-slate-500">{invoice.clinicOrPharmacyName}</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3">
              {invoice.remainingAmount > 0 && invoice.status !== 'ملغاة' && (
                <button
                  onClick={() => onRecordPayment(invoice)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs flex items-center gap-2 shadow-md transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>تسجيل دفعة ({formatCurrency(invoice.remainingAmount)})</span>
                </button>
              )}

              {invoice.status !== 'ملغاة' && (
                <button
                  onClick={() => onCancelInvoice(invoice)}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Ban className="w-4 h-4" />
                  <span>إلغاء الفاتورة وإرجاع المخزون</span>
                </button>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 font-bold text-xs text-slate-700 flex justify-between items-center">
              <span>بنود الفاتورة</span>
              <span className="text-slate-500 font-normal">عدد البنود: {invoice.items.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">المنتج</th>
                    <th className="py-2.5 px-3 text-center">الكمية</th>
                    <th className="py-2.5 px-3 text-left">سعر الوحدة</th>
                    <th className="py-2.5 px-3 text-left">الخصم</th>
                    <th className="py-2.5 px-3 text-left">الإجمالي للعميل</th>
                    {/* Internal Cost & Profit */}
                    <th className="py-2.5 px-3 text-left bg-emerald-50/40 text-emerald-900 border-r border-emerald-100 font-bold">
                      التكلفة (خاص)
                    </th>
                    <th className="py-2.5 px-3 text-left bg-emerald-50/40 text-emerald-900 font-bold">
                      الربح (خاص)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-800 block">{item.productName}</span>
                        {item.sku && <span className="font-mono text-[10px] text-slate-400">{item.sku}</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-left font-mono">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2.5 px-3 text-left font-mono text-slate-600">
                        {item.discountAmount > 0 ? (
                          <span className="text-rose-600 font-semibold">
                            -{formatCurrency(item.discountAmount)}
                            {item.discountType === 'percentage' && ` (${item.discountValue}%)`}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-left font-mono font-bold text-slate-900">
                        {formatCurrency(item.total)}
                      </td>
                      {/* Internal Columns */}
                      <td className="py-2.5 px-3 text-left font-mono text-slate-600 bg-emerald-50/20 border-r border-emerald-100">
                        {formatCurrency(item.totalCost)}
                        <span className="block text-[10px] text-slate-400">({formatCurrency(item.costPrice)}/وحدة)</span>
                      </td>
                      <td className="py-2.5 px-3 text-left font-mono font-bold text-emerald-600 bg-emerald-50/20">
                        {formatCurrency(item.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Internal Profit Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Internal Profit Card (Admin view only) */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-blue-800 font-bold border-b border-blue-200 pb-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>حساب الأرباح والتكلفة (بيانات داخلية سرية للإدارة فقط)</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>إجمالي المبيعات الإجمالية:</span>
                <span className="font-mono font-semibold">{formatCurrency(invoice.grossTotal)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>إجمالي الخصومات الممنوحة:</span>
                <span className="font-mono font-semibold">-{formatCurrency(invoice.totalDiscount)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold border-t border-blue-200/60 pt-1">
                <span>صافي المبيعات (Net Sales):</span>
                <span className="font-mono">{formatCurrency(invoice.finalTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>إجمالي تكلفة المنتجات (Cost):</span>
                <span className="font-mono">-{formatCurrency(invoice.totalCost)}</span>
              </div>
              <div className="flex justify-between text-blue-900 font-bold text-base bg-white p-2.5 rounded-lg border border-blue-300">
                <span>صافي الربح الفعلي (Net Profit):</span>
                <span className="font-mono text-blue-700">{formatCurrency(invoice.totalProfit)}</span>
              </div>
              <p className="text-[10px] text-blue-800/80">
                * ملاحظة أمان: هذه البيانات لا تظهر إطلاقاً في طباعة الفاتورة أو ملف PDF المرسل للعميل.
              </p>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <div className="font-bold text-slate-800 border-b border-slate-200 pb-2">
                ملخص حساب الفاتورة
              </div>
              <div className="flex justify-between text-slate-600">
                <span>المجموع الفرعي:</span>
                <span className="font-mono font-semibold">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.invoiceDiscountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>خصم الفاتورة:</span>
                  <span className="font-mono font-semibold">-{formatCurrency(invoice.invoiceDiscountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-black text-sm border-t border-slate-300 pt-1">
                <span>الإجمالي المستحق على العميل:</span>
                <span className="font-mono text-emerald-700">{formatCurrency(invoice.finalTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>المبلغ المسدد:</span>
                <span className="font-mono font-bold text-emerald-600">{formatCurrency(invoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold text-sm bg-white p-2 rounded-lg border border-slate-200">
                <span>المبلغ المتبقي:</span>
                <span className={`font-mono ${invoice.remainingAmount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {formatCurrency(invoice.remainingAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment History on this Invoice */}
          {invoicePayments.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-xs text-slate-700">
                سجل الدفعات المستلمة على هذه الفاتورة ({invoicePayments.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="py-2 px-3">التاريخ</th>
                      <th className="py-2 px-3">المبلغ</th>
                      <th className="py-2 px-3">طريقة الدفع</th>
                      <th className="py-2 px-3">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoicePayments.map(p => (
                      <tr key={p.id}>
                        <td className="py-2 px-3 text-slate-600">{p.date}</td>
                        <td className="py-2 px-3 font-mono font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                        <td className="py-2 px-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-500">{p.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Attached Scanned Invoice Image */}
          {invoice.scannedImageUrl && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-xs text-slate-800">صورة الفاتورة الورقية الأصلية المرفقة</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>تكبير الصورة</span>
                </button>
              </div>

              <div
                className="relative max-w-sm rounded-lg overflow-hidden border border-slate-300 bg-black/5 cursor-pointer group"
                onClick={() => setIsImageModalOpen(true)}
              >
                <img
                  src={invoice.scannedImageUrl}
                  alt={`صورة فاتورة ${invoice.invoiceNumber}`}
                  className="w-full max-h-60 object-contain rounded-lg"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                  <ZoomIn className="w-4 h-4" />
                  <span>انقر للتكبير بالحجم الكامل</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Photo Modal */}
      {isImageModalOpen && invoice.scannedImageUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-700 cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Camera className="w-4 h-4 text-blue-400" />
                <span>صورة الفاتورة الورقية الأصلية: {invoice.invoiceNumber}</span>
              </div>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={invoice.scannedImageUrl}
                alt={invoice.invoiceNumber}
                className="max-h-[70vh] max-w-full object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
