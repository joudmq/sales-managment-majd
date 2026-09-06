import React, { useState } from 'react';
import { Customer, Invoice } from '../types';
import { getInvoices } from '../lib/storage';
import { formatCurrency } from '../lib/calculations';
import { X, Phone, Building2, MapPin, Mail, FileText, PlusCircle, Printer } from 'lucide-react';

interface CustomerProfileModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenInvoice: (invoice: Invoice) => void;
  onPrintInvoice: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onNewInvoiceForCustomer: (customer: Customer) => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  customer,
  isOpen,
  onClose,
  onOpenInvoice,
  onPrintInvoice,
  onRecordPayment,
  onNewInvoiceForCustomer,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  if (!isOpen || !customer) return null;

  const allInvoices = getInvoices();
  const customerInvoices = allInvoices.filter(inv => inv.customerId === customer.id);

  // Totals calculations
  const totalSales = customerInvoices
    .filter(inv => inv.status !== 'ملغاة')
    .reduce((sum, inv) => sum + inv.finalTotal, 0);

  const totalPaid = customerInvoices
    .filter(inv => inv.status !== 'ملغاة')
    .reduce((sum, inv) => sum + inv.paidAmount, 0);

  const outstandingBalance = Math.max(0, totalSales - totalPaid);

  const filteredInvoices = customerInvoices.filter(inv => {
    if (filterStatus === 'all') return true;
    return inv.status === filterStatus;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-lg">
              {customer.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">{customer.name}</h2>
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full font-medium">
                  {customer.type}
                </span>
              </div>
              <p className="text-xs text-slate-400">ملف العميل المالي وسجل الفواتير</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onNewInvoiceForCustomer(customer);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>فاتورة جديدة للعميل</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Customer Info Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block">المنشأة / العيادة:</span>
                <span className="font-bold text-slate-800">{customer.clinicOrPharmacyName || '—'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block">الهاتف:</span>
                <span className="font-bold font-mono text-slate-800">{customer.phone}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block">العنوان:</span>
                <span className="font-semibold text-slate-800">{customer.address || '—'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block">البريد:</span>
                <span className="font-semibold text-slate-800">{customer.email || '—'}</span>
              </div>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-semibold text-slate-500 block mb-1">إجمالي المبيعات</span>
              <span className="text-2xl font-black font-mono text-slate-800">{formatCurrency(totalSales)}</span>
              <span className="text-xs text-slate-400 block mt-1">عدد الفواتير: {customerInvoices.length}</span>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
              <span className="text-xs font-semibold text-emerald-800 block mb-1">إجمالي المسدد (التحصيلات)</span>
              <span className="text-2xl font-black font-mono text-emerald-600">{formatCurrency(totalPaid)}</span>
              <span className="text-xs text-emerald-700 block mt-1">تم تحصيله بنجاح</span>
            </div>

            <div className={`p-4 rounded-xl border ${outstandingBalance > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-xs font-semibold block mb-1 ${outstandingBalance > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                المستحق (الرصيد المتبقي)
              </span>
              <span className={`text-2xl font-black font-mono ${outstandingBalance > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                {formatCurrency(outstandingBalance)}
              </span>
              <span className="text-xs text-slate-400 block mt-1">
                {outstandingBalance > 0 ? 'مبالغ قيد الانتظار' : 'الحساب خالص بالكامل ✓'}
              </span>
            </div>
          </div>

          {/* Invoice History Section */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>سجل فواتير العميل</span>
              </h3>

              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${filterStatus === 'all' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500'}`}
                >
                  الكل ({customerInvoices.length})
                </button>
                <button
                  onClick={() => setFilterStatus('غير مدفوعة')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${filterStatus === 'غير مدفوعة' ? 'bg-white shadow-xs text-red-600' : 'text-slate-500'}`}
                >
                  غير مدفوعة
                </button>
                <button
                  onClick={() => setFilterStatus('مدفوعة جزئيًا')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${filterStatus === 'مدفوعة جزئيًا' ? 'bg-white shadow-xs text-orange-600' : 'text-slate-500'}`}
                >
                  جزئية
                </button>
                <button
                  onClick={() => setFilterStatus('مدفوعة بالكامل')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${filterStatus === 'مدفوعة بالكامل' ? 'bg-white shadow-xs text-green-600' : 'text-slate-500'}`}
                >
                  مدفوعة بالكامل
                </button>
              </div>
            </div>

            {filteredInvoices.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-xl text-slate-400 text-xs">
                لا توجد فواتير مطابقة لهذا التصنيف
              </div>
            ) : (
              <div className="border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-3">رقم الفاتورة</th>
                        <th className="py-2.5 px-3">التاريخ</th>
                        <th className="py-2.5 px-3">الإجمالي</th>
                        <th className="py-2.5 px-3">المدفوع</th>
                        <th className="py-2.5 px-3">المتبقي</th>
                        <th className="py-2.5 px-3">الحالة</th>
                        <th className="py-2.5 px-3 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{inv.date}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                            {formatCurrency(inv.finalTotal)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-emerald-600 font-bold">
                            {formatCurrency(inv.paidAmount)}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold">
                            <span className={inv.remainingAmount > 0 ? 'text-rose-600' : 'text-slate-500'}>
                              {formatCurrency(inv.remainingAmount)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                inv.status === 'مدفوعة بالكامل'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : inv.status === 'مدفوعة جزئيًا'
                                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                                  : inv.status === 'غير مدفوعة'
                                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                                  : 'bg-slate-100 text-slate-600 border-slate-300'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => onOpenInvoice(inv)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px]"
                                title="عرض الفاتورة"
                              >
                                عرض
                              </button>
                              <button
                                onClick={() => onPrintInvoice(inv)}
                                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                                title="طباعة"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              {inv.remainingAmount > 0 && inv.status !== 'ملغاة' && (
                                <button
                                  onClick={() => onRecordPayment(inv)}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded font-bold text-[11px]"
                                  title="تسجيل دفعة"
                                >
                                  تسجيل دفعة
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
