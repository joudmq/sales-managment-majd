import React, { useState, useEffect } from 'react';
import { Supplier, StockMovement } from '../types';
import { getSuppliers, saveSupplier, deleteSupplier, getStockMovements } from '../lib/storage';
import { formatCurrency } from '../lib/calculations';
import {
  Truck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Building,
  CheckCircle,
  AlertCircle,
  X,
  History,
} from 'lucide-react';

export const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    setSuppliers(getSuppliers());
    setMovements(getStockMovements());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setName('');
    setCompany('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setCompany(s.company || '');
    setContactPerson(s.contactPerson || '');
    setPhone(s.phone);
    setEmail(s.email || '');
    setAddress(s.address || '');
    setNotes(s.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      saveSupplier({
        id: editingSupplier?.id,
        name: name.trim(),
        company: company.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        notes: notes.trim(),
      });

      setNotification({
        type: 'success',
        text: editingSupplier ? 'تم تحديث بيانات المورد بنجاح.' : 'تم إضافة المورد بنجاح.',
      });
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        text: err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ المورد.',
      });
    }
  };

  const handleDelete = (supplierId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المورد؟')) {
      const res = deleteSupplier(supplierId);
      setNotification({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
      loadData();
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Compute purchase stats per supplier
  const supplierStats = suppliers.map(s => {
    const sMovements = movements.filter(m => m.supplierId === s.id && (m.type === 'in' || m.type === 'return'));
    const totalPurchases = sMovements.reduce((sum, m) => sum + (m.costPrice || 0) * m.quantity, 0);
    const shipmentsCount = sMovements.length;

    return {
      ...s,
      totalPurchases,
      shipmentsCount,
    };
  });

  const filtered = supplierStats.filter(
    s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.company && s.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.phone.includes(searchQuery)
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            <span>إدارة الموردين والشركات الموردة</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل وتتبع بيانات مصادر البضاعة، الشركات المصنعة، وحجم المشتريات الإجمالية لكل مورد.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة مورد جديد</span>
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

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-4 text-xs">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="ابحث باسم المورد، الشركة، أو رقم الهاتف..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">اسم المورد / الشركة</th>
                <th className="py-3 px-4">الشخص المسؤول</th>
                <th className="py-3 px-4">الهاتف والعنوان</th>
                <th className="py-3 px-4 text-center">عدد الشحنات</th>
                <th className="py-3 px-4 text-left font-mono font-bold">إجمالي المشتريات</th>
                <th className="py-3 px-4">ملاحظات</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    لا يوجد موردين مسجلين
                  </td>
                </tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                      {s.company && <div className="text-[11px] text-slate-500">{s.company}</div>}
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {s.contactPerson || '—'}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-800 font-bold">{s.phone}</div>
                      {s.address && <div className="text-[10px] text-slate-400">{s.address}</div>}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full">
                        {s.shipmentsCount}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-left font-mono font-bold text-slate-900 text-sm">
                      {formatCurrency(s.totalPurchases)}
                    </td>

                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {s.notes || '—'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(s)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="تعديل المورد"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="حذف المورد"
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
                {editingSupplier ? `تعديل بيانات المورد: ${editingSupplier.name}` : 'إضافة مورد جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المورد *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة النقاء للمستحضرات الطبية"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الشركة</label>
                  <input
                    type="text"
                    placeholder="مثال: فارما تريد"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الشخص المسؤول</label>
                  <input
                    type="text"
                    placeholder="مثال: أ. وائل سلامة"
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف *</label>
                  <input
                    type="tel"
                    required
                    placeholder="مثال: 059-9988776"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    placeholder="sales@supplier.ps"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">العنوان</label>
                <input
                  type="text"
                  placeholder="المدينة، المنطقة..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="شروط الدفع، فترات التوريد..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-colors"
                >
                  {editingSupplier ? 'حفظ التعديلات' : 'إضافة المورد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
