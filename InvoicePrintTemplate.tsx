import React from 'react';
import { Invoice, AppSettings } from '../types';
import { formatCurrency } from '../lib/calculations';

interface InvoicePrintTemplateProps {
  invoice: Invoice;
  settings: AppSettings;
  elementId?: string;
}

export const InvoicePrintTemplate: React.FC<InvoicePrintTemplateProps> = ({
  invoice,
  settings,
  elementId = 'printable-invoice',
}) => {
  return (
    <div
      id={elementId}
      dir="rtl"
      className="bg-white text-slate-900 p-8 sm:p-10 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col justify-between border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0"
      style={{ fontFamily: 'Tajawal, sans-serif' }}
    >
      {/* Top Header */}
      <div>
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
              {settings.logoText ? settings.logoText.charAt(0) : '₪'}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">{settings.businessName}</h1>
              <div className="text-xs text-slate-600 space-y-0.5 mt-1">
                {settings.phone && <p>الهاتف: {settings.phone}</p>}
                {settings.address && <p>العنوان: {settings.address}</p>}
                {settings.email && <p>البريد: {settings.email}</p>}
              </div>
            </div>
          </div>

          <div className="text-left">
            <span className="inline-block bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-md mb-2">
              فاتورة مبيعات ضريبية / إرسالية
            </span>
            <div className="text-sm font-semibold text-slate-900">
              رقم الفاتورة: <span className="font-mono text-base font-bold text-blue-700">{invoice.invoiceNumber}</span>
            </div>
            <div className="text-xs text-slate-600 mt-1">
              التاريخ: <span className="font-semibold text-slate-800">{invoice.date}</span>
            </div>
            <div className="mt-2">
              <span
                className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded border ${
                  invoice.status === 'مدفوعة بالكامل'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : invoice.status === 'مدفوعة جزئيًا'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : invoice.status === 'غير مدفوعة'
                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Information Block */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">العميل:</span>
            <span className="font-bold text-slate-900 text-sm">{invoice.customerName}</span>
          </div>
          <div>
            <span className="text-slate-500 block">نوع العميل:</span>
            <span className="font-semibold text-slate-800 bg-slate-200/70 px-2 py-0.5 rounded inline-block mt-0.5">
              {invoice.customerType}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">المنشأة / العيادة:</span>
            <span className="font-semibold text-slate-800">
              {invoice.clinicOrPharmacyName || '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">رقم الهاتف:</span>
            <span className="font-mono font-semibold text-slate-800">
              {invoice.customerPhone || '—'}
            </span>
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
          <table className="w-full text-right border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3">المنتج / البيان</th>
                <th className="py-2.5 px-3 text-center">الرمز (SKU)</th>
                <th className="py-2.5 px-3 text-center">الكمية</th>
                <th className="py-2.5 px-3 text-left">سعر الوحدة</th>
                <th className="py-2.5 px-3 text-left">الخصم</th>
                <th className="py-2.5 px-3 text-left font-bold">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{item.productName}</td>
                  <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-xs">{item.sku || '—'}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-800">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-left font-mono">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-2.5 px-3 text-left text-slate-600 font-mono">
                    {item.discountAmount > 0 ? (
                      <span className="text-rose-600 font-medium">
                        -{formatCurrency(item.discountAmount)}
                        {item.discountType === 'percentage' && ` (${item.discountValue}%)`}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-left font-bold font-mono text-slate-900">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Summary Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-6">
          {/* Notes and Terms */}
          <div className="flex-1 w-full text-xs text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-lg">
            <span className="font-bold text-slate-800 block mb-1">ملاحظات:</span>
            <p className="whitespace-pre-wrap">{invoice.notes || 'لا توجد ملاحظات إضافية.'}</p>
          </div>

          {/* Totals Table */}
          <div className="w-full sm:w-72 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-600">
              <span>المجموع الفرعي:</span>
              <span className="font-mono font-semibold">{formatCurrency(invoice.subtotal)}</span>
            </div>

            {invoice.invoiceDiscountAmount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>خصم الفاتورة {invoice.invoiceDiscountType === 'percentage' ? `(${invoice.invoiceDiscountValue}%)` : ''}:</span>
                <span className="font-mono font-semibold">-{formatCurrency(invoice.invoiceDiscountAmount)}</span>
              </div>
            )}

            {invoice.totalDiscount > 0 && (
              <div className="flex justify-between text-rose-700 text-xs border-t border-slate-200 pt-1">
                <span>إجمالي الخصومات:</span>
                <span className="font-mono font-bold">-{formatCurrency(invoice.totalDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-900 font-bold text-base border-t-2 border-slate-800 pt-2">
              <span>الإجمالي النهائي:</span>
              <span className="font-mono text-blue-700">{formatCurrency(invoice.finalTotal)}</span>
            </div>

            <div className="flex justify-between text-slate-700 border-t border-slate-200 pt-2">
              <span>المبلغ المدفوع:</span>
              <span className="font-mono font-bold text-blue-600">{formatCurrency(invoice.paidAmount)}</span>
            </div>

            <div className="flex justify-between text-slate-900 font-bold text-sm bg-white p-2 rounded border border-slate-200">
              <span>المبلغ المتبقي:</span>
              <span className={`font-mono ${invoice.remainingAmount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                {formatCurrency(invoice.remainingAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="border-t border-slate-200 pt-4 mt-auto text-center">
        <p className="text-sm font-bold text-slate-800 mb-1">{settings.invoiceFooterText || 'شكرًا لتعاملكم معنا'}</p>
        <p className="text-xs text-slate-500">
          تم إصدار هذه الفاتورة إلكترونياً من {settings.businessName} • العملة: ₪ شيكل
        </p>
      </div>
    </div>
  );
};
