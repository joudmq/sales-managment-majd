import React, { useState, useEffect, useMemo } from 'react';
import { StockMovement, Product, Invoice } from '../types';
import {
  getStockMovements,
  getProducts,
  getInvoices,
  adjustStock,
} from '../lib/storage';
import {
  History,
  Search,
  Filter,
  ArrowDownToLine,
  ArrowUpRight,
  RotateCcw,
  Sliders,
  Calendar,
  Package,
  FileText,
  Truck,
  Plus,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

interface StockMovementsProps {
  onGoToStockIn?: () => void;
  onViewInvoice?: (invoice: Invoice) => void;
}

export const StockMovements: React.FC<StockMovementsProps> = ({
  onGoToStockIn,
  onViewInvoice,
}) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all');
  const [dateRangePreset, setDateRangePreset] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Manual Adjustment Modal state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState('');
  const [adjustNewQuantity, setAdjustNewQuantity] = useState<number | ''>('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustError, setAdjustError] = useState('');
  const [adjustSuccess, setAdjustSuccess] = useState('');

  const loadData = () => {
    setMovements(getStockMovements());
    setProducts(getProducts());
    setInvoices(getInvoices());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick Date presets
  const handleDatePreset = (preset: string) => {
    setDateRangePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'week') {
      const pastWeek = new Date(today);
      pastWeek.setDate(today.getDate() - 7);
      setStartDate(pastWeek.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'month') {
      const pastMonth = new Date(today);
      pastMonth.setDate(today.getDate() - 30);
      setStartDate(pastMonth.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedProductId('all');
    setMovementTypeFilter('all');
    setDateRangePreset('all');
    setStartDate('');
    setEndDate('');
  };

  // Filtered movements list
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      // Search query (Product name, SKU, Notes, Invoice/Supplier)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = m.productName.toLowerCase().includes(query);
        const matchesSku = (m.sku || '').toLowerCase().includes(query);
        const matchesNotes = (m.notes || '').toLowerCase().includes(query);
        const matchesInvoice = (m.invoiceNumber || '').toLowerCase().includes(query);
        const matchesSupplier = (m.supplierName || '').toLowerCase().includes(query);

        if (!matchesName && !matchesSku && !matchesNotes && !matchesInvoice && !matchesSupplier) {
          return false;
        }
      }

      // Product filter
      if (selectedProductId !== 'all' && m.productId !== selectedProductId) {
        return false;
      }

      // Movement Type filter
      if (movementTypeFilter !== 'all' && m.type !== movementTypeFilter) {
        return false;
      }

      // Date range filter
      const movDate = m.date || (m.createdAt ? m.createdAt.split('T')[0] : '');
      if (startDate && movDate < startDate) {
        return false;
      }
      if (endDate && movDate > endDate) {
        return false;
      }

      return true;
    });
  }, [movements, searchQuery, selectedProductId, movementTypeFilter, startDate, endDate]);

  // Statistics calculation for filtered view
  const stats = useMemo(() => {
    let totalInUnits = 0;
    let totalOutUnits = 0;

    filteredMovements.forEach(m => {
      if (m.quantity > 0) {
        totalInUnits += m.quantity;
      } else {
        totalOutUnits += Math.abs(m.quantity);
      }
    });

    const netChange = totalInUnits - totalOutUnits;

    return {
      count: filteredMovements.length,
      totalInUnits,
      totalOutUnits,
      netChange,
    };
  }, [filteredMovements]);

  // Handle opening invoice details from row
  const handleInvoiceClick = (invoiceNumber?: string, invoiceId?: string) => {
    if (!onViewInvoice) return;
    const inv = invoices.find(i => i.id === invoiceId || i.invoiceNumber === invoiceNumber);
    if (inv) {
      onViewInvoice(inv);
    }
  };

  // Submit Manual Stock Adjustment
  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError('');
    setAdjustSuccess('');

    if (!adjustProductId) {
      setAdjustError('يرجى اختيار المنتج المراد تسوية رصيده');
      return;
    }

    if (adjustNewQuantity === '' || adjustNewQuantity < 0) {
      setAdjustError('يرجى إدخال الرصيد الفعلي الجديد بشكل صحيح (صفر أو أكثر)');
      return;
    }

    const res = adjustStock({
      productId: adjustProductId,
      newQuantity: Number(adjustNewQuantity),
      reason: adjustReason.trim() || 'تسوية جردية دورية',
    });

    if (res.success) {
      setAdjustSuccess(res.message);
      loadData();
      setTimeout(() => {
        setIsAdjustModalOpen(false);
        setAdjustProductId('');
        setAdjustNewQuantity('');
        setAdjustReason('');
        setAdjustSuccess('');
        setAdjustError('');
      }, 1200);
    } else {
      setAdjustError(res.message);
    }
  };

  // Format Arabic Date and Time
  const formatDateTime = (isoString?: string, fallbackDate?: string) => {
    if (!isoString) return { date: fallbackDate || '-', time: '' };
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) {
        return { date: fallbackDate || '-', time: '' };
      }
      const date = d.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const time = d.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return { date, time };
    } catch {
      return { date: fallbackDate || '-', time: '' };
    }
  };

  // Print Movement Log
  const handlePrint = () => {
    window.print();
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredMovements.length === 0) return;

    const headers = [
      'التاريخ والوقت',
      'كود المنتج SKU',
      'اسم المنتج',
      'نوع الحركة',
      'الكمية المتغيرة',
      'المخزون بعد الحركة',
      'المرجع / المستند',
      'الملاحظات',
    ];

    const typeLabels: Record<string, string> = {
      in: 'استلام بضاعة / توريد',
      out: 'بيع / فاتورة',
      return: 'إلغاء فاتورة / مرتجع',
      adjustment: 'تسوية جردية',
    };

    const rows = filteredMovements.map(m => {
      const dt = formatDateTime(m.createdAt, m.date);
      const ref = m.invoiceNumber || m.supplierInvoiceNumber || m.supplierName || '-';
      return [
        `"${dt.date} ${dt.time}"`,
        `"${m.sku || ''}"`,
        `"${m.productName}"`,
        `"${typeLabels[m.type] || m.type}"`,
        m.quantity > 0 ? `+${m.quantity}` : `${m.quantity}`,
        m.remainingStock !== undefined ? m.remainingStock : '-',
        `"${ref}"`,
        `"${m.notes || ''}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory-movements-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Selected product object for modal
  const selectedAdjustProduct = products.find(p => p.id === adjustProductId);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            <span>سجل حركة المخزون</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            سجل زمني دقيق وتفصيلي لكافة العمليات التي تؤثر على كميات المنتجات مع الرصيد المتبقي بعد كل حركة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setIsAdjustModalOpen(true);
              setAdjustError('');
              setAdjustSuccess('');
            }}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>تسوية مخزون يدوية</span>
          </button>

          {onGoToStockIn && (
            <button
              onClick={onGoToStockIn}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-md transition-colors"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>+ توريد بضاعة للمخزن</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            title="تصدير إلى ملف CSV"
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrint}
            title="طباعة السجل"
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block mb-1">
            إجمالي الحركات المفلترة
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-slate-800">
            {stats.count}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">حركة مخزنية مسجلة</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block mb-1">
            إجمالي الوارد للمخزن (+)
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-green-600">
            +{stats.totalInUnits}
          </span>
          <span className="text-[11px] text-green-600/80 font-medium block mt-1">
            توريدات ومرتجعات
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block mb-1">
            إجمالي المنصرف من المخزن (-)
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-red-600">
            -{stats.totalOutUnits}
          </span>
          <span className="text-[11px] text-red-600/80 font-medium block mt-1">
            فواتير ومبيعات
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block mb-1">
            صافي التغير في الكميات
          </span>
          <span
            className={`font-mono text-xl sm:text-2xl font-bold ${
              stats.netChange >= 0 ? 'text-blue-600' : 'text-amber-600'
            }`}
          >
            {stats.netChange >= 0 ? `+${stats.netChange}` : stats.netChange}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">وحدة خلال الفترة</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>فلترة وبحث في الحركات</span>
          </span>

          {(searchQuery ||
            selectedProductId !== 'all' ||
            movementTypeFilter !== 'all' ||
            startDate ||
            endDate) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة تعيين الفلاتر</span>
            </button>
          )}
        </div>

        {/* Row 1: Search & Product & Movement Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث برقم الفاتورة، اسم المنتج، المورد..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-4 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>

          {/* Product Filter Dropdown */}
          <div>
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">جميع المنتجات</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.sku ? `(${p.sku})` : ''} - المتوفر: {p.currentQuantity}
                </option>
              ))}
            </select>
          </div>

          {/* Movement Type Filter */}
          <div>
            <select
              value={movementTypeFilter}
              onChange={e => setMovementTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">جميع أنواع الحركات</option>
              <option value="in">استلام بضاعة / توريد (+)</option>
              <option value="out">بيع / فواتير مبيعات (-)</option>
              <option value="return">إلغاء فاتورة / مرتجع (+)</option>
              <option value="adjustment">تسوية جردية / تعديل يدوي</option>
            </select>
          </div>
        </div>

        {/* Row 2: Date Presets & Date Pickers */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>الفترة الزمنية:</span>
          </span>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => handleDatePreset('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                dateRangePreset === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset('today')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                dateRangePreset === 'today'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset('week')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                dateRangePreset === 'week'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              آخر 7 أيام
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset('month')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                dateRangePreset === 'month'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              آخر 30 يومًا
            </button>
          </div>

          <div className="flex items-center gap-2 mr-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">من:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setDateRangePreset('custom');
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">إلى:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setDateRangePreset('custom');
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredMovements.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <Package className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
            <p className="text-sm font-medium text-slate-600">
              لا توجد أي حركات مخزنية تطابق معايير البحث والفلترة.
            </p>
            <p className="text-xs text-slate-400">
              جرب تغيير معايير البحث، توسيع الفترة الزمنية، أو اختيار منتج آخر.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors inline-block"
            >
              عرض كل الحركات
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">التاريخ والوقت</th>
                  <th className="py-3 px-4">المنتج المتأثر</th>
                  <th className="py-3 px-4 text-center">نوع الحركة</th>
                  <th className="py-3 px-4">المرجع / المستند</th>
                  <th className="py-3 px-4 text-center">الكمية المتغيرة</th>
                  <th className="py-3 px-4 text-center">المخزون بعد الحركة</th>
                  <th className="py-3 px-4">ملاحظات وبيان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.map(m => {
                  const dt = formatDateTime(m.createdAt, m.date);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Date & Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-800 block">{dt.date}</span>
                        {dt.time && (
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {dt.time}
                          </span>
                        )}
                      </td>

                      {/* Product Name & SKU */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{m.productName}</span>
                        {m.sku && (
                          <span className="text-[10px] font-mono text-slate-400 block">
                            {m.sku}
                          </span>
                        )}
                      </td>

                      {/* Movement Type Badge */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {m.type === 'in' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-green-50 text-green-700 border border-green-200">
                            <ArrowDownToLine className="w-3 h-3 text-green-600" />
                            <span>استلام بضاعة</span>
                          </span>
                        )}
                        {m.type === 'out' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            <ArrowUpRight className="w-3 h-3 text-blue-600" />
                            <span>بيع (فاتورة)</span>
                          </span>
                        )}
                        {m.type === 'return' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            <RotateCcw className="w-3 h-3 text-amber-600" />
                            <span>إلغاء فاتورة</span>
                          </span>
                        )}
                        {m.type === 'adjustment' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            <Sliders className="w-3 h-3 text-purple-600" />
                            <span>تسوية جردية</span>
                          </span>
                        )}
                      </td>

                      {/* Reference Document */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {m.invoiceNumber ? (
                          <button
                            type="button"
                            onClick={() => handleInvoiceClick(m.invoiceNumber, m.invoiceId)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-mono font-medium"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{m.invoiceNumber}</span>
                          </button>
                        ) : m.supplierInvoiceNumber || m.supplierName ? (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Truck className="w-3 h-3 text-slate-400" />
                            <span>
                              {m.supplierName || 'مورد'}
                              {m.supplierInvoiceNumber ? ` (${m.supplierInvoiceNumber})` : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Quantity Changed */}
                      <td className="py-3 px-4 text-center whitespace-nowrap font-mono font-bold text-sm">
                        {m.quantity > 0 ? (
                          <span className="text-green-600">+{m.quantity}</span>
                        ) : m.quantity < 0 ? (
                          <span className="text-red-600">{m.quantity}</span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>

                      {/* Remaining Stock After Movement */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="font-mono text-sm font-bold bg-slate-100 text-slate-800 px-3 py-1 rounded-lg border border-slate-200 inline-block min-w-[48px]">
                          {m.remainingStock !== undefined ? m.remainingStock : '-'}
                        </span>
                      </td>

                      {/* Notes / Details */}
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={m.notes}>
                        {m.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" dir="rtl">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                <span>تسوية مخزون يدوية</span>
              </h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              تُستخدم التسوية لتصحيح كميات المخزون بعد الجرد الفعلي، مع تسجيل حركة تسوية وتوضيح السبب تلقائياً.
            </p>

            {adjustError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{adjustError}</span>
              </div>
            )}

            {adjustSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-xs p-3 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
                <span>{adjustSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdjustment} className="space-y-3 text-xs">
              {/* Select Product */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  اختر المنتج <span className="text-red-500">*</span>
                </label>
                <select
                  value={adjustProductId}
                  onChange={e => {
                    const id = e.target.value;
                    setAdjustProductId(id);
                    const prod = products.find(p => p.id === id);
                    if (prod) {
                      setAdjustNewQuantity(prod.currentQuantity);
                    } else {
                      setAdjustNewQuantity('');
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- اختر المنتج من القائمة --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.sku ? `(${p.sku})` : ''} - الحالي: {p.currentQuantity}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAdjustProduct && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3 flex justify-between items-center text-xs">
                  <span className="text-blue-950 font-medium">الرصيد المسجل حالياً في النظام:</span>
                  <span className="font-mono text-sm font-bold text-blue-700">
                    {selectedAdjustProduct.currentQuantity} وحدة
                  </span>
                </div>
              )}

              {/* New Actual Stock */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  الرصيد الفعلي الجديد بعد الجرد <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="أدخل الكمية الفعلية الموجودة في المخزن"
                  value={adjustNewQuantity}
                  onChange={e =>
                    setAdjustNewQuantity(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              {selectedAdjustProduct && adjustNewQuantity !== '' && (
                <div className="flex justify-between items-center text-xs px-1 text-slate-600">
                  <span>فرق التسوية الناتج:</span>
                  <span
                    className={`font-mono font-bold ${
                      Number(adjustNewQuantity) - selectedAdjustProduct.currentQuantity >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {Number(adjustNewQuantity) - selectedAdjustProduct.currentQuantity >= 0
                      ? `+${Number(adjustNewQuantity) - selectedAdjustProduct.currentQuantity}`
                      : Number(adjustNewQuantity) - selectedAdjustProduct.currentQuantity}{' '}
                    وحدة
                  </span>
                </div>
              )}

              {/* Reason / Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  سبب التسوية والبيان
                </label>
                <input
                  type="text"
                  placeholder="مثال: جرد شهري، تالف أثناء النقل، تصحيح إدخال سابق..."
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-md transition-colors"
                >
                  حفظ وتسجيل الحركة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
