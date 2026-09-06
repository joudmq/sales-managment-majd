import React, { useState, useEffect } from 'react';
import { Customer, CustomerType, Invoice } from '../types';
import { getCustomers, saveCustomer, deleteCustomer, getInvoices } from '../lib/storage';
import { formatCurrency } from '../lib/calculations';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  UserCheck,
  Building2,
  Phone,
  FilePlus2,
  Eye,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';

interface CustomersProps {
  onOpenCustomerProfile: (customer: Customer) => void;
  onNewInvoiceForCustomer: (customer: Customer) => void;
}

export const Customers: React.FC<CustomersProps> = ({
  onOpenCustomerProfile,
  onNewInvoiceForCustomer,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form
  const [name, setName] = useState('');
  const [type, setType] = useState<CustomerType>('طبيب');
  const [clinicOrPharmacyName, setClinicOrPharmacyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    setCustomers(getCustomers());
    setInvoices(getInvoices());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setType('طبيب');
    setClinicOrPharmacyName('');
    setPhone('');
    setAddress('');
    setEmail('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setType(c.type);
    setClinicOrPharmacyName(c.clinicOrPharmacyName || '');
    setPhone(c.phone);
    setAddress(c.address || '');
    setEmail(c.email || '');
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setNotification({ type: 'error', text: 'يرجى إدخال اسم العميل ورقم الهاتف.' });
      return;
    }

    try {
      saveCustomer({
        id: editingCustomer?.id,
        name: name.trim(),
        type,
        clinicOrPharmacyName: clinicOrPharmacyName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        email: email.trim(),
        notes: notes.trim(),
      });

      setNotification({
        type: 'success',
        text: editingCustomer ? 'تم تحديث بيانات العميل بنجاح.' : 'تم إضافة العميل بنجاح.',
      });
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        text: err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ العميل.',
      });
    }
  };

  const handleDelete = (customerId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      const res = deleteCustomer(customerId);
      setNotification({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
      loadData();
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Compute metrics per customer
  const customerStats = customers.map(cust => {
    const custInvoices = invoices.filter(inv => inv.customerId === cust.id && inv.status !== 'ملغاة');
    const totalSales = custInvoices.reduce((sum, i) => sum + i.finalTotal, 0);
    const totalPaid = custInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
    const outstanding = Math.max(0, totalSales - totalPaid);

    // Last invoice
    const sorted = [...custInvoices].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const lastInvoice = sorted[0];

    return {
      ...cust,
      totalSales,
      totalPaid,
      outstanding,
      lastInvoiceDate: lastInvoice ? lastInvoice.date : null,
      lastInvoiceNumber: lastInvoice ? lastInvoice.invoiceNumber : null,
    };
  });

  const filtered = customerStats.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.clinicOrPharmacyName && c.clinicOrPharmacyName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>دليل العملاء وتصنيفاتهم</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة بيانات الأطباء، الصيدليات، أخصائيي البشرة، والزبائن العاديين لمتابعة مبيعاتهم ومستحقاتهم.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة عميل جديد</span>
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

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="ابحث باسم العميل، رقم الهاتف، أو اسم العيادة/الصيدلية..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-600">فئة العميل:</span>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">كافة الفئات ({customers.length})</option>
            <option value="طبيب">طبيب</option>
            <option value="صيدلي">صيدلي</option>
            <option value="أخصائي بشرة">أخصائي بشرة</option>
            <option value="زبون عادي">زبون عادي</option>
            <option value="آخر">آخر</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">اسم العميل</th>
                <th className="py-3 px-4">نوع العميل</th>
                <th className="py-3 px-4">الهاتف والمنشأة</th>
                <th className="py-3 px-4 text-left font-mono">إجمالي المبيعات</th>
                <th className="py-3 px-4 text-left font-mono">إجمالي المسدد</th>
                <th className="py-3 px-4 text-left font-mono font-bold">الرصيد المستحق</th>
                <th className="py-3 px-4 text-center">آخر فاتورة</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    لا يوجد عملاء مطابقين لخيارات البحث
                  </td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onOpenCustomerProfile(c)}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-right"
                      >
                        {c.name}
                      </button>
                      {c.clinicOrPharmacyName && (
                        <div className="text-[11px] text-slate-500">{c.clinicOrPharmacyName}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          c.type === 'طبيب'
                            ? 'bg-blue-50 text-blue-600'
                            : c.type === 'صيدلي'
                            ? 'bg-purple-50 text-purple-600'
                            : c.type === 'أخصائي بشرة'
                            ? 'bg-pink-50 text-pink-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {c.type}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-800 font-medium">{c.phone}</div>
                      {c.address && <div className="text-[10px] text-slate-400">{c.address}</div>}
                    </td>

                    <td className="py-3 px-4 text-left font-mono font-semibold text-slate-800">
                      {formatCurrency(c.totalSales)}
                    </td>

                    <td className="py-3 px-4 text-left font-mono font-bold text-emerald-600">
                      {formatCurrency(c.totalPaid)}
                    </td>

                    <td className="py-3 px-4 text-left font-mono font-black">
                      <span className={c.outstanding > 0 ? 'text-rose-600' : 'text-slate-500'}>
                        {formatCurrency(c.outstanding)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {c.lastInvoiceDate ? (
                        <div className="text-[11px] text-slate-600">
                          <span className="font-mono font-bold text-slate-800 block">
                            {c.lastInvoiceNumber}
                          </span>
                          <span className="text-[10px] text-slate-400">{c.lastInvoiceDate}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">لا توجد فواتير</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenCustomerProfile(c)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="فتح الملف وسجل الفواتير"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onNewInvoiceForCustomer(c)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="إنشاء فاتورة سريعة للعميل"
                        >
                          <FilePlus2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="تعديل البيانات"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف العميل"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingCustomer ? `تعديل بيانات العميل: ${editingCustomer.name}` : 'إضافة عميل جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم العميل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: د. أحمد"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  نوع العميل (يحدد سعر البيع التلقائي في الفاتورة) *
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as CustomerType)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="طبيب">طبيب (سعر الطبيب Doctor Price)</option>
                  <option value="صيدلي">صيدلي (سعر الصيدلي Pharmacy Price)</option>
                  <option value="أخصائي بشرة">أخصائي بشرة (سعر أخصائي البشرة Skincare Price)</option>
                  <option value="زبون عادي">زبون عادي (سعر الزبون العادي Regular Customer Price)</option>
                  <option value="آخر">آخر (السعر العادي)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم العيادة / الصيدلية / المركز</label>
                  <input
                    type="text"
                    placeholder="مثال: عيادة د. أحمد للجلدية"
                    value={clinicOrPharmacyName}
                    onChange={e => setClinicOrPharmacyName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف *</label>
                  <input
                    type="tel"
                    required
                    placeholder="مثال: 059-8112233"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">العنوان</label>
                  <input
                    type="text"
                    placeholder="المدينة والشارع..."
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني (اختياري)</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات العميل</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="ملاحظات تفضيل التسليم، مواعيد الدفع..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md text-xs"
                >
                  {editingCustomer ? 'حفظ التعديلات' : 'إضافة العميل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
