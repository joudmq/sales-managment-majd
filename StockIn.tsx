import React, { useState, useEffect } from 'react';
import { Product, Supplier, StockMovement } from '../types';
import { getProducts, getSuppliers, getStockMovements, receiveStock } from '../lib/storage';
import { formatCurrency } from '../lib/calculations';
import {
  Download,
  CheckCircle,
  AlertCircle,
  History,
  TrendingUp,
  PackageCheck,
  Calendar,
} from 'lucide-react';

export const StockIn: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState<number | string>(10);
  const [costPrice, setCostPrice] = useState<number | string>(0);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [updateProductCost, setUpdateProductCost] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    const prods = getProducts();
    setProducts(prods);
    const sups = getSuppliers();
    setSuppliers(sups);
    const movs = getStockMovements();
    setMovements(movs);

    if (prods.length > 0 && !selectedProductId) {
      setSelectedProductId(prods[0].id);
      setCostPrice(prods[0].costPrice);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find(p => p.id === id);
    if (prod) {
      setCostPrice(prod.costPrice);
      if (prod.supplierId) {
        setSelectedSupplierId(prod.supplierId);
      }
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setNotification({ type: 'error', text: 'يرجى اختيار المنتج المراد إدخاله للمخزن.' });
      return;
    }

    const numQty = Number(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      setNotification({ type: 'error', text: 'يرجى إدخال كمية صحيحة أكبر من صفر.' });
      return;
    }

    const numCost = Number(costPrice) || 0;
    const sup = suppliers.find(s => s.id === selectedSupplierId);

    const result = receiveStock({
      productId: selectedProductId,
      quantity: numQty,
      costPrice: numCost,
      supplierId: selectedSupplierId,
      supplierName: sup?.name,
      supplierInvoiceNumber: supplierInvoiceNumber.trim(),
      date,
      notes: notes.trim(),
      updateProductCost,
    });

    if (result.success) {
      setNotification({ type: 'success', text: result.message });
      setQuantity(10);
      setSupplierInvoiceNumber('');
      setNotes('');
      loadData();
      setTimeout(() => setNotification(null), 4000);
    } else {
      setNotification({ type: 'error', text: result.message });
    }
  };

  const recentInMovements = movements.filter(m => m.type === 'in' || m.type === 'return');

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Download className="w-6 h-6 text-blue-600" />
          <span>إدخال بضاعة وتوريد للمخزون</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          تسجيل الشحنات والمنتجات الواردة من الموردين لزيادة الكميات في المخزون وتوثيق حركة التوريد تلقائياً.
        </p>
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

      {/* Main Receiving Form & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-blue-600" />
            <span>بيانات الشحنة المستلمة</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                المنتج المستلم <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedProductId}
                onChange={e => handleProductSelect(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">-- اختر المنتج من القائمة --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — متوفر حالياً: {p.currentQuantity} وحدة
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  الكمية الواردة <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base font-bold text-slate-900 text-center"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  سعر التكلفة للوحدة (₪) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={costPrice}
                    onChange={e => setCostPrice(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base font-bold text-slate-900 text-left"
                    dir="ltr"
                  />
                  <span className="absolute left-3 top-3 text-slate-400 font-bold">₪</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">المورد</label>
                <select
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-semibold"
                >
                  <option value="">-- اختياري: اختر المورد --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.company ? `(${s.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تاريخ الاستلام</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم فاتورة المورد (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: SUP-4921"
                  value={supplierInvoiceNumber}
                  onChange={e => setSupplierInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات الشحنة</label>
                <input
                  type="text"
                  placeholder="مثال: دفعة جديدة، تخزين في الرف A..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="updateCostCheck"
                checked={updateProductCost}
                onChange={e => setUpdateProductCost(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300"
              />
              <label htmlFor="updateCostCheck" className="text-slate-700 cursor-pointer font-semibold">
                تحديث سعر التكلفة الافتراضي للمنتج إلى هذا السعر الجديد ({formatCurrency(Number(costPrice) || 0)})
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={!selectedProductId}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-xs rounded-lg shadow-md transition-colors flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span>تسجيل إدخال البضاعة للمخزن</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Stock Calculation Preview Card */}
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
            المعاينة قبل وبعد الإدخال
          </h2>

          {selectedProduct ? (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-slate-400 block">المنتج المحدد:</span>
                <span className="text-sm font-bold text-slate-900 block">{selectedProduct.name}</span>
                <span className="font-mono text-slate-500 block">{selectedProduct.sku}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-slate-500 block mb-1">المخزون الحالي</span>
                  <span className="font-mono text-xl font-bold text-slate-800">
                    {selectedProduct.currentQuantity}
                  </span>
                </div>

                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
                  <span className="text-emerald-800 block mb-1">الكمية الجديدة بعد التوريد</span>
                  <span className="font-mono text-xl font-black text-emerald-700">
                    {selectedProduct.currentQuantity + (Number(quantity) || 0)}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>إجمالي قيمة البضاعة الواردة:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatCurrency((Number(quantity) || 0) * (Number(costPrice) || 0))}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              اختر منتجاً لمعاينة أثر الإدخال على المخزون
            </div>
          )}
        </div>
      </div>

      {/* Recent Movements History */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <span>سجل آخر عمليات إدخال وتوريد البضاعة</span>
          </h2>
          <span className="text-xs text-slate-500">إجمالي الحركات: {recentInMovements.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">التاريخ</th>
                <th className="py-2.5 px-3">المنتج</th>
                <th className="py-2.5 px-3 text-center">الكمية المضافة</th>
                <th className="py-2.5 px-3 text-left font-mono">سعر التكلفة</th>
                <th className="py-2.5 px-3 text-left font-mono">إجمالي التكلفة</th>
                <th className="py-2.5 px-3">المورد / الفاتورة</th>
                <th className="py-2.5 px-3">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentInMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    لا توجد حركات توريد مسجلة حتى الآن
                  </td>
                </tr>
              ) : (
                recentInMovements.slice(0, 10).map(m => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-600 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{m.date}</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{m.productName}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        +{m.quantity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-left font-mono text-slate-700">
                      {m.costPrice ? formatCurrency(m.costPrice) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-left font-mono font-bold text-slate-900">
                      {m.costPrice ? formatCurrency(m.costPrice * m.quantity) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <span>{m.supplierName || '—'}</span>
                      {m.supplierInvoiceNumber && (
                        <span className="block text-[10px] font-mono text-slate-400">
                          #{m.supplierInvoiceNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{m.notes || '—'}</td>
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
