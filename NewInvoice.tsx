import React, { useState, useEffect } from 'react';
import {
  Customer,
  Product,
  InvoiceItem,
  DiscountType,
  Invoice,
  CustomerType,
} from '../types';
import {
  getCustomers,
  getProducts,
  getSettings,
  getNextInvoiceNumber,
  createInvoice,
  saveCustomer,
} from '../lib/storage';
import {
  getPriceByCustomerType,
  calculateItemValues,
  distributeInvoiceDiscount,
  formatCurrency,
} from '../lib/calculations';
import { InvoicePhotoAssistant } from './InvoicePhotoAssistant';
import {
  Plus,
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
  UserPlus,
  FileCheck,
  Printer,
  FileDown,
  ChevronDown,
  ShieldCheck,
  Camera,
  Image as ImageIcon,
  Package,
} from 'lucide-react';

interface NewInvoiceProps {
  initialCustomerId?: string;
  onInvoiceCreated: (invoice: Invoice, shouldPrint?: boolean) => void;
  onNavigateToInvoices: () => void;
}

interface DraftItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  imageUrl?: string;
  currentStock: number;
  costPrice: number;
  unitPrice: number;
  quantity: number;
  discountType: DiscountType;
  discountValue: number;
}

export const NewInvoice: React.FC<NewInvoiceProps> = ({
  initialCustomerId,
  onInvoiceCreated,
  onNavigateToInvoices,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState(getSettings());

  // Invoice state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [invoiceDiscountType, setInvoiceDiscountType] = useState<DiscountType>('percentage');
  const [invoiceDiscountValue, setInvoiceDiscountValue] = useState<number | string>(0);
  const [paidAmount, setPaidAmount] = useState<number | string>(0);
  const [notes, setNotes] = useState<string>('');

  // Scanned invoice image state for manual side-by-side transcription
  const [scannedImageUrl, setScannedImageUrl] = useState<string | null>(null);
  const [showPhotoAssistant, setShowPhotoAssistant] = useState<boolean>(false);

  // Quick Customer modal
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustType, setNewCustType] = useState<CustomerType>('طبيب');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustClinic, setNewCustClinic] = useState('');

  // Product search picker
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Errors / alerts / saved invoice
  const [error, setError] = useState<string>('');
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    setCustomers(getCustomers());
    setProducts(getProducts());
    setSettings(getSettings());
  }, []);

  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    }
  }, [initialCustomerId]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // When customer changes, update default suggested prices for all items that haven't been manually altered
  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const newCust = customers.find(c => c.id === customerId);
    if (newCust && items.length > 0) {
      setItems(prevItems =>
        prevItems.map(item => {
          const prod = products.find(p => p.id === item.productId);
          if (prod) {
            const suggested = getPriceByCustomerType(prod, newCust.type);
            return {
              ...item,
              unitPrice: suggested,
            };
          }
          return item;
        })
      );
    }
  };

  // Add product to invoice
  const handleAddProduct = (product: Product) => {
    // Check if already in items
    const existingIndex = items.findIndex(i => i.productId === product.id);
    const customerType = selectedCustomer ? selectedCustomer.type : 'طبيب';
    const suggestedPrice = getPriceByCustomerType(product, customerType);

    if (existingIndex !== -1) {
      // Increment quantity
      const existing = items[existingIndex];
      const newQty = existing.quantity + 1;
      if (!settings.allowSellingOutOfStock && newQty > product.currentQuantity) {
        setError(`لا يمكن زيادة الكمية عن المخزون المتوفر (${product.currentQuantity}) للمنتج "${product.name}".`);
        return;
      }
      const updated = [...items];
      updated[existingIndex] = { ...existing, quantity: newQty };
      setItems(updated);
    } else {
      // New item
      if (!settings.allowSellingOutOfStock && product.currentQuantity <= 0) {
        setError(`المنتج "${product.name}" نفد من المخزون تماماً.`);
        return;
      }

      const newItem: DraftItem = {
        id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        imageUrl: product.imageUrl,
        currentStock: product.currentQuantity,
        costPrice: product.costPrice,
        unitPrice: suggestedPrice,
        quantity: 1,
        discountType: 'percentage',
        discountValue: 0,
      };
      setItems([...items, newItem]);
    }

    setSearchProductQuery('');
    setShowProductDropdown(false);
    setError('');
  };

  const handleUpdateItem = (index: number, updates: Partial<DraftItem>) => {
    const updated = [...items];
    const item = { ...updated[index], ...updates };

    // Stock check
    if (!settings.allowSellingOutOfStock && item.quantity > item.currentStock) {
      setError(`الكمية المطلوبة (${item.quantity}) تتجاوز المخزون المتوفر (${item.currentStock}) لـ "${item.productName}".`);
    } else {
      setError('');
    }

    updated[index] = item;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  // Quick Customer Creation
  const handleCreateQuickCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      setError('يرجى إدخال اسم العميل ورقم الهاتف.');
      return;
    }

    const created = saveCustomer({
      name: newCustName.trim(),
      type: newCustType,
      phone: newCustPhone.trim(),
      clinicOrPharmacyName: newCustClinic.trim(),
    });

    setCustomers(getCustomers());
    setSelectedCustomerId(created.id);
    handleCustomerChange(created.id);
    setShowQuickCustomer(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustClinic('');
    setError('');
  };

  // Filtered products for dropdown search
  const filteredProducts = products.filter(
    p =>
      p.isActive &&
      (p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchProductQuery.toLowerCase()))
  );

  // Calculate detailed items values
  const evaluatedItems: InvoiceItem[] = items.map(item => {
    const calculated = calculateItemValues({
      costPrice: item.costPrice,
      unitPrice: Number(item.unitPrice) || 0,
      quantity: Number(item.quantity) || 0,
      discountType: item.discountType,
      discountValue: Number(item.discountValue) || 0,
    });

    return {
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      costPrice: item.costPrice,
      unitPrice: item.unitPrice,
      discountType: item.discountType,
      discountValue: Number(item.discountValue) || 0,
      discountAmount: calculated.discountAmount,
      finalUnitPrice: calculated.finalUnitPrice,
      total: calculated.total,
      totalCost: calculated.totalCost,
      profit: calculated.profit,
    };
  });

  // Distribute invoice discount
  const totals = distributeInvoiceDiscount(
    evaluatedItems,
    invoiceDiscountType,
    Number(invoiceDiscountValue) || 0
  );

  const grossTotal = evaluatedItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const itemsDiscountTotal = evaluatedItems.reduce((sum, i) => sum + i.discountAmount, 0);
  const totalDiscount = itemsDiscountTotal + totals.invoiceDiscountAmount;

  const numPaid = Math.max(0, Number(paidAmount) || 0);
  const remainingAmount = Math.max(0, Number((totals.finalTotal - numPaid).toFixed(2)));

  // Handle Save
  const handleSaveInvoice = () => {
    setError('');

    if (!selectedCustomerId) {
      setError('يرجى اختيار العميل أولاً.');
      return;
    }

    if (items.length === 0) {
      setError('يرجى إضافة منتج واحد على الأقل للفاتورة.');
      return;
    }

    for (const itm of items) {
      if (itm.quantity <= 0) {
        setError(`الكمية للمنتج "${itm.productName}" يجب أن تكون أكبر من صفر.`);
        return;
      }
      if (!settings.allowSellingOutOfStock && itm.quantity > itm.currentStock) {
        setError(`الكمية المطلوبة للمنتج "${itm.productName}" (${itm.quantity}) غير متوفرة في المخزون (${itm.currentStock}).`);
        return;
      }
    }

    if (numPaid > totals.finalTotal) {
      setError(`المبلغ المدفوع (${formatCurrency(numPaid)}) أكبر من إجمالي الفاتورة (${formatCurrency(totals.finalTotal)}).`);
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId)!;
    const invNumber = getNextInvoiceNumber();

    let status: Invoice['status'] = 'غير مدفوعة';
    if (remainingAmount <= 0) {
      status = 'مدفوعة بالكامل';
    } else if (numPaid > 0) {
      status = 'مدفوعة جزئيًا';
    }

    try {
      const created = createInvoice({
        invoiceNumber: invNumber,
        customerId: customer.id,
        customerName: customer.name,
        customerType: customer.type,
        customerPhone: customer.phone,
        clinicOrPharmacyName: customer.clinicOrPharmacyName,
        customerAddress: customer.address,
        date: invoiceDate,
        items: totals.distributedItems,
        subtotal: totals.subtotal,
        invoiceDiscountType,
        invoiceDiscountValue: Number(invoiceDiscountValue) || 0,
        invoiceDiscountAmount: totals.invoiceDiscountAmount,
        totalDiscount: Number(totalDiscount.toFixed(2)),
        grossTotal: Number(grossTotal.toFixed(2)),
        finalTotal: totals.finalTotal,
        totalCost: totals.totalCost,
        totalProfit: totals.totalProfit,
        paidAmount: numPaid,
        remainingAmount,
        status,
        scannedImageUrl: scannedImageUrl || undefined,
        notes: notes.trim(),
      });

      setSavedInvoice(created);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في حفظ الفاتورة.');
    }
  };

  const handleResetForm = () => {
    setSavedInvoice(null);
    setSelectedCustomerId('');
    setItems([]);
    setInvoiceDiscountValue(0);
    setPaidAmount(0);
    setNotes('');
    setScannedImageUrl(null);
    setShowPhotoAssistant(false);
    setError('');
  };

  // If invoice is successfully saved, render instant success screen
  if (savedInvoice) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6" dir="rtl">
        <div className="bg-white rounded-xl p-8 sm:p-10 border border-slate-100 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-xs">
            <FileCheck className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 font-medium px-3 py-1 rounded-full">
              تم حفظ الفاتورة وتحديث المخزون بنجاح
            </span>
            <h2 className="text-2xl font-bold text-slate-800 mt-2">
              فاتورة رقم: <span className="text-blue-600 font-mono">{savedInvoice.invoiceNumber}</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              العميل: <strong className="text-slate-800">{savedInvoice.customerName}</strong> ({savedInvoice.customerType})
            </p>
          </div>

          {/* Quick numbers summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-500 block">صافي الفاتورة</span>
              <span className="font-mono text-base font-bold text-slate-800">{formatCurrency(savedInvoice.finalTotal)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">المدفوع</span>
              <span className="font-mono text-base font-bold text-blue-600">{formatCurrency(savedInvoice.paidAmount)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">المتبقي</span>
              <span className={`font-mono text-base font-bold ${savedInvoice.remainingAmount > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                {formatCurrency(savedInvoice.remainingAmount)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">الربح المحقق (داخلي)</span>
              <span className="font-mono text-base font-bold text-green-700">{formatCurrency(savedInvoice.totalProfit)}</span>
            </div>
          </div>

          {/* Next action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onInvoiceCreated(savedInvoice, true)}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs flex items-center gap-2 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الفاتورة</span>
            </button>

            <button
              onClick={() => onInvoiceCreated(savedInvoice, false)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs flex items-center gap-2 shadow-md transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span>حفظ كملف PDF</span>
            </button>

            <button
              onClick={handleResetForm}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition-colors"
            >
              إنشاء فاتورة جديدة
            </button>

            <button
              onClick={onNavigateToInvoices}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs transition-colors"
            >
              الذهاب إلى قائمة الفواتير
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6" dir="rtl">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span>فاتورة مبيعات جديدة</span>
            <span className="text-xs font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
              {getNextInvoiceNumber()}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            اختر العميل وسيقوم النظام تلقائياً بتحديد فئة السعر المناسبة، ثم أضف المنتجات والخصومات.
          </p>
        </div>

        <button
          onClick={onNavigateToInvoices}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-white px-3 py-2 border border-slate-200 rounded-lg shadow-sm"
        >
          العودة لقائمة الفواتير
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Photo Invoice Entry Banner / Workspace */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-sm border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold flex items-center gap-2">
                <span>إدخال الفاتورة عبر تصوير الفاتورة الورقية</span>
                {scannedImageUrl && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                    تم إرفاق صورة
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5">
                التقط صورة الفاتورة الورقية بهاتفك أو ارفعها لتظهر أمامك مباشرة وتقوم بإدخال البنود والأسعار يدوياً وبدقة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPhotoAssistant(!showPhotoAssistant)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs ${
                showPhotoAssistant || scannedImageUrl
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-white hover:bg-slate-100 text-slate-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>
                {showPhotoAssistant || scannedImageUrl
                  ? (scannedImageUrl ? 'عرض / إخفاء صورة الفاتورة' : 'إخفاء لوحة التصوير')
                  : 'فتح التصوير / رفع صورة الفاتورة'}
              </span>
            </button>
          </div>
        </div>

        {(showPhotoAssistant || scannedImageUrl) && (
          <div className="mt-4 pt-3 border-t border-slate-700/60">
            <InvoicePhotoAssistant
              imageUrl={scannedImageUrl}
              onImageChange={(url) => {
                setScannedImageUrl(url);
                if (url) setShowPhotoAssistant(true);
              }}
            />
          </div>
        )}
      </div>

      {/* Step 1 & 2: Customer Selection & Auto-Pricing Identification */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">1</span>
            <span>بيانات العميل وفئة التسعير التلقائي</span>
          </span>

          <button
            type="button"
            onClick={() => setShowQuickCustomer(true)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ عميل جديد سريع</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              اختر العميل <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCustomerId}
              onChange={e => handleCustomerChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- اختر العميل من القائمة --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type}) {c.clinicOrPharmacyName ? `- ${c.clinicOrPharmacyName}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">تاريخ الفاتورة</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={e => setInvoiceDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {selectedCustomer ? (
          <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-blue-950">فئة التسعير التلقائية المطبقة:</span>
              <span className="bg-blue-600 text-white font-medium px-2.5 py-0.5 rounded-md">
                {selectedCustomer.type === 'طبيب' && 'سعر الأطباء (Doctor Price)'}
                {selectedCustomer.type === 'صيدلي' && 'سعر الصيدليات (Pharmacy Price)'}
                {selectedCustomer.type === 'أخصائي بشرة' && 'سعر أخصائي البشرة (Skincare Price)'}
                {selectedCustomer.type === 'زبون عادي' && 'سعر الزبون العادي (Regular Price)'}
                {selectedCustomer.type === 'آخر' && 'السعر العادي (Standard Price)'}
              </span>
            </div>
            <div className="text-slate-600 flex gap-3 text-[11px]">
              {selectedCustomer.phone && <span>الهاتف: <strong className="font-mono text-slate-800">{selectedCustomer.phone}</strong></span>}
              {selectedCustomer.clinicOrPharmacyName && <span>المنشأة: <strong className="text-slate-800">{selectedCustomer.clinicOrPharmacyName}</strong></span>}
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>يرجى اختيار العميل لتفعيل أسعار البيع التلقائية المخصصة له.</span>
          </div>
        )}
      </div>

      {/* Quick Add Customer Modal */}
      {showQuickCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
              إضافة عميل جديد سريع
            </h3>
            <form onSubmit={handleCreateQuickCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم العميل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: د. إياد"
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع العميل (فئة السعر) *</label>
                <select
                  value={newCustType}
                  onChange={e => setNewCustType(e.target.value as CustomerType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800"
                >
                  <option value="طبيب">طبيب (Doctor)</option>
                  <option value="صيدلي">صيدلي (Pharmacist)</option>
                  <option value="أخصائي بشرة">أخصائي بشرة (Skincare Specialist)</option>
                  <option value="زبون عادي">زبون عادي (Regular Customer)</option>
                  <option value="آخر">آخر (Other)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الهاتف *</label>
                <input
                  type="tel"
                  required
                  placeholder="مثال: 059-1234567"
                  value={newCustPhone}
                  onChange={e => setNewCustPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-left"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">العيادة أو الصيدلية (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: عيادة النور التخصصية"
                  value={newCustClinic}
                  onChange={e => setNewCustClinic(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickCustomer(false)}
                  className="px-3 py-1.5 text-slate-500 font-medium text-xs hover:bg-slate-50 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs shadow-md transition-colors"
                >
                  حفظ واختيار العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step 3: Add Products */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">2</span>
            <span>إضافة المنتجات والكميات</span>
          </span>

          <span className="text-xs text-slate-400">
            يمكنك تعديل سعر البيع يدوياً داخل هذه الفاتورة دون تغيير السعر الأصلي للمنتج.
          </span>
        </div>

        {/* Search Input and Dropdown */}
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              value={searchProductQuery}
              onChange={e => {
                setSearchProductQuery(e.target.value);
                setShowProductDropdown(true);
              }}
              onFocus={() => setShowProductDropdown(true)}
              placeholder="ابحث عن منتج بالاسم أو الرمز (SKU) لإضافته للفاتورة..."
              className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
            {searchProductQuery && (
              <button
                onClick={() => {
                  setSearchProductQuery('');
                  setShowProductDropdown(false);
                }}
                className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                مسح
              </button>
            )}
          </div>

          {showProductDropdown && filteredProducts.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
              {filteredProducts.map(p => {
                const suggested = selectedCustomer
                  ? getPriceByCustomerType(p, selectedCustomer.type)
                  : p.doctorPrice;
                const isOutOfStock = p.currentQuantity <= 0;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAddProduct(p)}
                    className="w-full p-3 text-right hover:bg-blue-50/50 flex items-center justify-between transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200 shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-slate-800 flex items-center gap-2">
                          <span>{p.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">{p.category}</span>
                      </div>
                    </div>

                    <div className="text-left flex items-center gap-4">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          isOutOfStock
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : p.currentQuantity <= p.minStockLevel
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-green-50 text-green-800 border border-green-200'
                        }`}
                      >
                        المتوفر: {p.currentQuantity}
                      </span>

                      <div>
                        <span className="text-slate-400 text-[10px] block">السعر المقترح</span>
                        <span className="font-mono font-bold text-blue-600 text-sm">
                          {formatCurrency(suggested)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Invoice Items Table */}
        {items.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
            لم تقم بإضافة أي منتج بعد. استخدم مربع البحث أعلاه لاختيار المنتجات.
          </div>
        ) : (
          <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">المنتج</th>
                    <th className="py-2.5 px-3 text-center">المتوفر</th>
                    <th className="py-2.5 px-3 text-center w-24">الكمية</th>
                    <th className="py-2.5 px-3 text-center w-28">سعر الوحدة (₪)</th>
                    <th className="py-2.5 px-3 text-center w-36">الخصم للبند</th>
                    <th className="py-2.5 px-3 text-left">الإجمالي</th>
                    <th className="py-2.5 px-3 text-center w-12">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item, index) => {
                    const evaluated = evaluatedItems[index];
                    const hasStockIssue =
                      !settings.allowSellingOutOfStock && item.quantity > item.currentStock;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/50 ${hasStockIssue ? 'bg-rose-50/60' : ''}`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.productName}
                                className="w-8 h-8 rounded-md object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200 shrink-0">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-slate-800 block">{item.productName}</span>
                              <span className="font-mono text-[10px] text-slate-400">{item.sku}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`font-mono text-[11px] font-bold ${
                              item.currentStock <= 0
                                ? 'text-rose-600'
                                : item.currentStock < 10
                                ? 'text-amber-600'
                                : 'text-slate-600'
                            }`}
                          >
                            {item.currentStock}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e =>
                              handleUpdateItem(index, {
                                quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                              })
                            }
                            className={`w-20 px-2 py-1 bg-white border text-center font-mono font-bold rounded-lg ${
                              hasStockIssue ? 'border-rose-500 text-rose-700' : 'border-slate-300'
                            }`}
                          />
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={e =>
                              handleUpdateItem(index, {
                                unitPrice: Math.max(0, parseFloat(e.target.value) || 0),
                              })
                            }
                            className="w-24 px-2 py-1 bg-white border border-slate-300 text-center font-mono font-bold rounded-lg text-emerald-700"
                          />
                        </td>

                        {/* Item Level Discount */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.discountValue}
                              onChange={e =>
                                handleUpdateItem(index, {
                                  discountValue: Math.max(0, parseFloat(e.target.value) || 0),
                                })
                              }
                              placeholder="0"
                              className="w-16 px-1.5 py-1 bg-white border border-slate-300 text-center font-mono text-xs rounded-lg"
                            />
                            <select
                              value={item.discountType}
                              onChange={e =>
                                handleUpdateItem(index, {
                                  discountType: e.target.value as DiscountType,
                                })
                              }
                              className="px-1 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[10px] font-bold"
                            >
                              <option value="percentage">%</option>
                              <option value="fixed">₪</option>
                            </select>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-left font-mono font-bold text-slate-900 text-sm">
                          {formatCurrency(evaluated.total)}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="حذف البند"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Step 4 & 5: Discounts, Payments & Calculations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes & Extra settings */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm space-y-4">
          <span className="text-xs font-bold text-slate-800 block border-b border-slate-100 pb-2">
            ملاحظات الفاتورة
          </span>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
            placeholder="أدخل أي شروط تسليم، أرقام إرسالية، أو تفاصيل خاصة بالعميل..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Internal Profit Overview (PRIVATE ADMIN ONLY) */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold border-b border-blue-200/60 pb-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>الأرباح المتوقعة (بيانات داخلية سرية)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>إجمالي التكلفة (Cost):</span>
              <span className="font-mono font-bold">{formatCurrency(totals.totalCost)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>صافي الإيراد (Net Sales):</span>
              <span className="font-mono font-bold">{formatCurrency(totals.finalTotal)}</span>
            </div>
            <div className="flex justify-between text-blue-900 font-bold text-sm border-t border-blue-200 pt-2">
              <span>صافي الربح الفعلي:</span>
              <span className="font-mono text-blue-700">{formatCurrency(totals.totalProfit)}</span>
            </div>
            <p className="text-[10px] text-blue-800/70">
              * يتم حساب الربح تلقائياً بعد خصم كافة التخفيضات ومقارنتها بسعر التكلفة.
            </p>
          </div>
        </div>

        {/* Invoice-Level Discount & Summary */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-100 shadow-sm space-y-4">
          <span className="text-xs font-bold text-slate-800 block border-b border-slate-100 pb-2">
            الحساب الإجمالي والتحصيل
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Invoice Level Discount */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                خصم إضافي على إجمالي الفاتورة
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={invoiceDiscountValue}
                  onChange={e => setInvoiceDiscountValue(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-sm font-bold text-slate-800 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex rounded-lg overflow-hidden border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setInvoiceDiscountType('percentage')}
                    className={`px-3 py-2 text-xs font-medium transition-colors ${
                      invoiceDiscountType === 'percentage'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    % نسبة
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvoiceDiscountType('fixed')}
                    className={`px-3 py-2 text-xs font-medium transition-colors ${
                      invoiceDiscountType === 'fixed'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    ₪ مبلغ
                  </button>
                </div>
              </div>
              {totals.invoiceDiscountAmount > 0 && (
                <span className="text-xs text-red-600 font-semibold block">
                  قيمة خصم الفاتورة: -{formatCurrency(totals.invoiceDiscountAmount)}
                </span>
              )}
            </div>

            {/* Paid Amount Input */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-700">
                  المبلغ المدفوع نقدًا الآن (₪)
                </label>
                <button
                  type="button"
                  onClick={() => setPaidAmount(totals.finalTotal)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                >
                  سداد كامل القيمة
                </button>
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={totals.finalTotal}
                  value={paidAmount}
                  onChange={e => setPaidAmount(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-lg font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none text-left"
                  dir="ltr"
                />
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₪</span>
              </div>
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-600">
              <span>المجموع الفرعي (قبل الخصم العام):</span>
              <span className="font-mono font-semibold">{formatCurrency(totals.subtotal)}</span>
            </div>

            {totalDiscount > 0 && (
              <div className="flex justify-between text-red-600 font-semibold">
                <span>إجمالي الخصومات الممنوحة:</span>
                <span className="font-mono">-{formatCurrency(totalDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-900 font-bold text-base border-t border-slate-200 pt-2">
              <span>الإجمالي النهائي المستحق:</span>
              <span className="font-mono text-blue-700 text-lg">{formatCurrency(totals.finalTotal)}</span>
            </div>

            <div className="flex justify-between text-slate-700 border-t border-slate-200 pt-2">
              <span>المبلغ المدفوع:</span>
              <span className="font-mono font-bold text-blue-600">{formatCurrency(numPaid)}</span>
            </div>

            <div className="flex justify-between text-slate-900 font-bold text-sm bg-white p-2.5 rounded-lg border border-slate-200">
              <span>المتبقي في ذمة العميل:</span>
              <span
                className={`font-mono text-base ${
                  remainingAmount > 0 ? 'text-red-600' : 'text-slate-700'
                }`}
              >
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          </div>

          {/* Final Action Button */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
            >
              إلغاء وتفريغ
            </button>

            <button
              type="button"
              onClick={handleSaveInvoice}
              disabled={items.length === 0 || !selectedCustomerId}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-medium text-xs rounded-lg transition-all shadow-md flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>حفظ الفاتورة وتحديث المخزون</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
