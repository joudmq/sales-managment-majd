import React, { useState, useEffect } from 'react';
import { Invoice, PaymentMethod } from '../types';
import { addPayment } from '../lib/storage';
import { formatCurrency } from '../lib/calculations';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface RecordPaymentModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const [amount, setAmount] = useState<number | string>('');
  const [date, setDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('نقدي');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    if (invoice) {
      setAmount(invoice.remainingAmount);
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('نقدي');
      setNotes('');
      setError('');
      setSuccess('');
    }
  }, [invoice, isOpen]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('يرجى إدخال مبلغ دفع صحيح أكبر من صفر.');
      return;
    }

    if (numAmount > invoice.remainingAmount) {
      setError(`المبلغ المدفوع (${formatCurrency(numAmount)}) أكبر من المبلغ المتبقي (${formatCurrency(invoice.remainingAmount)}).`);
      return;
    }

    try {
      addPayment({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        amount: numAmount,
        date: date || new Date().toISOString().split('T')[0],
        paymentMethod,
        notes: notes.trim(),
      });

      setSuccess('تم تسجيل الدفعة بنجاح وتحديث رصيد الفاتورة.');
      setTimeout(() => {
        onPaymentSuccess();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدفعة.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden" dir="rtl">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-800">تسجيل دفعة نقدية / تحصيل</h3>
            <p className="text-xs text-slate-500">فاتورة: <span className="font-mono font-bold text-slate-700">{invoice.invoiceNumber}</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Invoice Summary Box */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-600">العميل:</span>
              <span className="font-bold text-slate-800">{invoice.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">إجمالي الفاتورة:</span>
              <span className="font-mono font-bold text-slate-800">{formatCurrency(invoice.finalTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">المسدد مسبقاً:</span>
              <span className="font-mono text-emerald-600 font-bold">{formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1 text-slate-900">
              <span className="font-bold">المتبقي حالياً:</span>
              <span className="font-mono font-bold text-rose-600 text-sm">{formatCurrency(invoice.remainingAmount)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              مبلغ الدفعة (₪) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={invoice.remainingAmount}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left"
                dir="ltr"
              />
              <span className="absolute left-3 top-2.5 text-slate-500 font-bold">₪</span>
            </div>
            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setAmount(invoice.remainingAmount)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                سداد كامل المتبقي ({formatCurrency(invoice.remainingAmount)})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الدفعة</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الدفع</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
              >
                <option value="نقدي">نقدي</option>
                <option value="تحويل بنكي">تحويل بنكي</option>
                <option value="بطاقة">بطاقة</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات التحصيل (اختياري)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="مثال: رقم الحوالة، استلمها المندوب، شيك..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-md"
            >
              حفظ الدفعة الآن
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
