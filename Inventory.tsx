import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { getProducts } from '../lib/storage';
import { formatCurrency } from '../lib/calculations';
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowDownToLine,
  Filter,
  History,
} from 'lucide-react';

interface InventoryProps {
  onGoToStockIn: () => void;
  onGoToMovements?: () => void;
}

export const Inventory: React.FC<InventoryProps> = ({ onGoToStockIn, onGoToMovements }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'low' | 'out'>('all');

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.currentQuantity * p.costPrice,
    0
  );
  const totalUnits = products.reduce((sum, p) => sum + p.currentQuantity, 0);
  const outOfStockCount = products.filter(p => p.currentQuantity <= 0).length;
  const lowStockCount = products.filter(
    p => p.currentQuantity > 0 && p.currentQuantity <= p.minStockLevel
  ).length;
  const availableCount = products.filter(p => p.currentQuantity > p.minStockLevel).length;

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'available') return p.currentQuantity > p.minStockLevel;
    if (statusFilter === 'low')
      return p.currentQuantity > 0 && p.currentQuantity <= p.minStockLevel;
    if (statusFilter === 'out') return p.currentQuantity <= 0;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-blue-600" />
            <span>المخزون وإجمالي قيمة البضاعة</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            متابعة دقيقة لكميات البضاعة، قيمة المخزون الحالية (الكمية × التكلفة)، وحالات نفاد المخزون.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onGoToMovements && (
            <button
              onClick={onGoToMovements}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <History className="w-4 h-4 text-blue-600" />
              <span>سجل حركة المخزون</span>
            </button>
          )}
          <button
            onClick={onGoToStockIn}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-colors shadow-md"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>+ إدخال بضاعة جديدة</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block mb-1">
            إجمالي قيمة المخزون (بالتكلفة)
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-slate-900">
            {formatCurrency(totalInventoryValue)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            إجمالي الوحدات: {totalUnits} وحدة
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block mb-1">
            متوفر بكميات كافية
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-green-600">
            {availableCount}
          </span>
          <span className="text-[11px] text-green-600 font-medium block mt-1">أعلى من الحد الأدنى</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block mb-1">
            مخزون منخفض (تنبيه)
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-orange-600">
            {lowStockCount}
          </span>
          <span className="text-[11px] text-orange-600 font-medium block mt-1">قريب من الحد الأدنى</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block mb-1">
            نافد من المخزون تماماً
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-red-600">
            {outOfStockCount}
          </span>
          <span className="text-[11px] text-red-600 font-medium block mt-1">بحاجة توريد عاجل</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="ابحث بالاسم، رمز SKU، أو التصنيف..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'all' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
            }`}
          >
            الكل ({products.length})
          </button>
          <button
            onClick={() => setStatusFilter('available')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'available' ? 'bg-white text-green-700 shadow-xs' : 'text-slate-500'
            }`}
          >
            متوفر ({availableCount})
          </button>
          <button
            onClick={() => setStatusFilter('low')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'low' ? 'bg-white text-orange-700 shadow-xs' : 'text-slate-500'
            }`}
          >
            منخفض ({lowStockCount})
          </button>
          <button
            onClick={() => setStatusFilter('out')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'out' ? 'bg-white text-red-700 shadow-xs' : 'text-slate-500'
            }`}
          >
            نافد ({outOfStockCount})
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">المنتج / الرمز</th>
                <th className="py-3 px-4">التصنيف</th>
                <th className="py-3 px-4 text-center">الكمية المتوفرة</th>
                <th className="py-3 px-4 text-center">الحد الأدنى</th>
                <th className="py-3 px-4 text-left font-mono">سعر التكلفة</th>
                <th className="py-3 px-4 text-left font-mono font-bold">قيمة المخزون (الكمية × التكلفة)</th>
                <th className="py-3 px-4 text-center">حالة التوفر</th>
                <th className="py-3 px-4 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    لا توجد منتجات مطابقة لخيارات الفلترة
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const inventoryValue = p.currentQuantity * p.costPrice;
                  const isOut = p.currentQuantity <= 0;
                  const isLow = p.currentQuantity > 0 && p.currentQuantity <= p.minStockLevel;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{p.sku}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">{p.category}</td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono text-sm font-black px-2.5 py-1 rounded-lg ${
                            isOut
                              ? 'bg-rose-100 text-rose-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {p.currentQuantity}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {p.minStockLevel}
                      </td>

                      <td className="py-3 px-4 text-left font-mono text-slate-700">
                        {formatCurrency(p.costPrice)}
                      </td>

                      <td className="py-3 px-4 text-left font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(inventoryValue)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                            <XCircle className="w-3 h-3" />
                            <span>🔴 نافد من المخزون</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertTriangle className="w-3 h-3" />
                            <span>🟡 مخزون منخفض</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>🟢 متوفر</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={onGoToStockIn}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg font-medium text-[11px] transition-colors"
                          title="توريد بضاعة لهذا المنتج"
                        >
                          توريد +
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
