import React, { useState, useEffect, useRef } from 'react';
import { Product, Supplier } from '../types';
import { getProducts, getSuppliers, saveProduct, deleteProduct } from '../lib/storage';
import { formatCurrency } from '../lib/calculations';
import { compressImageFile } from '../lib/imageUtils';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle,
  Eye,
  EyeOff,
  Package,
  Camera,
  Upload,
  Image as ImageIcon,
  ZoomIn,
} from 'lucide-react';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showProfitPreview, setShowProfitPreview] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [currentQuantity, setCurrentQuantity] = useState<number | string>(0);
  const [minStockLevel, setMinStockLevel] = useState<number | string>(10);
  const [costPrice, setCostPrice] = useState<number | string>(0);
  const [doctorPrice, setDoctorPrice] = useState<number | string>(0);
  const [pharmacyPrice, setPharmacyPrice] = useState<number | string>(0);
  const [skincareSpecialistPrice, setSkincareSpecialistPrice] = useState<number | string>(0);
  const [regularCustomerPrice, setRegularCustomerPrice] = useState<number | string>(0);
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Fullscreen preview image modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    setProducts(getProducts());
    setSuppliers(getSuppliers());
  };

  useEffect(() => {
    loadData();
  }, []);

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const handleImageFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError('يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP).');
      return;
    }
    setImageError(null);
    setIsCompressingImage(true);
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 700,
        maxHeight: 700,
        quality: 0.8,
        mimeType: 'image/jpeg',
      });
      setImageUrl(compressed);
    } catch (err: any) {
      setImageError(err.message || 'فشل في معالجة صورة المنتج.');
    } finally {
      setIsCompressingImage(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setCategory('كريمات علاجية');
    setBrand('');
    setDescription('');
    setSupplierId(suppliers[0]?.id || '');
    setImageUrl('');
    setImageError(null);
    setCurrentQuantity(0);
    setMinStockLevel(10);
    setCostPrice(20);
    setDoctorPrice(30);
    setPharmacyPrice(32);
    setSkincareSpecialistPrice(35);
    setRegularCustomerPrice(40);
    setNotes('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setCategory(p.category);
    setBrand(p.brand || '');
    setDescription(p.description || '');
    setSupplierId(p.supplierId || '');
    setImageUrl(p.imageUrl || '');
    setImageError(null);
    setCurrentQuantity(p.currentQuantity);
    setMinStockLevel(p.minStockLevel);
    setCostPrice(p.costPrice);
    setDoctorPrice(p.doctorPrice);
    setPharmacyPrice(p.pharmacyPrice);
    setSkincareSpecialistPrice(p.skincareSpecialistPrice);
    setRegularCustomerPrice(p.regularCustomerPrice);
    setNotes(p.notes || '');
    setIsActive(p.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const supplier = suppliers.find(s => s.id === supplierId);

    try {
      saveProduct({
        id: editingProduct?.id,
        name: name.trim(),
        sku: sku.trim(),
        category: category.trim() || 'عام',
        brand: brand.trim(),
        description: description.trim(),
        supplierId,
        supplierName: supplier?.name,
        imageUrl: imageUrl.trim() || undefined,
        currentQuantity: Number(currentQuantity) || 0,
        minStockLevel: Number(minStockLevel) >= 0 ? Number(minStockLevel) : 10,
        costPrice: Math.max(0, Number(costPrice) || 0),
        doctorPrice: Math.max(0, Number(doctorPrice) || 0),
        pharmacyPrice: Math.max(0, Number(pharmacyPrice) || 0),
        skincareSpecialistPrice: Math.max(0, Number(skincareSpecialistPrice) || 0),
        regularCustomerPrice: Math.max(0, Number(regularCustomerPrice) || 0),
        notes: notes.trim(),
        isActive,
      });

      setNotification({
        type: 'success',
        text: editingProduct ? 'تم تعديل بيانات المنتج بنجاح.' : 'تم إضافة المنتج بنجاح إلى النظام.',
      });
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        text: err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ المنتج.',
      });
    }
  };

  const handleDelete = (productId: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا المنتج؟')) {
      const res = deleteProduct(productId);
      setNotification({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
      loadData();
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate live profits in modal
  const numCost = Number(costPrice) || 0;
  const numDoctor = Number(doctorPrice) || 0;
  const numPharmacy = Number(pharmacyPrice) || 0;
  const numSkin = Number(skincareSpecialistPrice) || 0;
  const numRegular = Number(regularCustomerPrice) || 0;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            <span>كتالوج المنتجات وتحديد الأسعار</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            حدد تكلفة المنتج وأسعار البيع التلقائية حسب تصنيف كل عميل (طبيب، صيدلي، أخصائي بشرة، زبون عادي).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProfitPreview(!showProfitPreview)}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            {showProfitPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showProfitPreview ? 'إخفاء أعمدة الأرباح' : 'إظهار أعمدة الأرباح'}</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة منتج جديد</span>
          </button>
        </div>
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
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          )}
          <span className="font-semibold">{notification.text}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="ابحث بالاسم، رمز SKU، أو العلامة التجارية..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-600">التصنيف:</span>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">كافة التصنيفات ({products.length})</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="py-3 px-3 text-center">الصورة</th>
                <th className="py-3 px-3">المنتج / SKU</th>
                <th className="py-3 px-3">التصنيف</th>
                <th className="py-3 px-3 text-center">المخزون الحالي</th>
                <th className="py-3 px-3 text-left font-mono text-slate-700">التكلفة</th>
                <th className="py-3 px-3 text-left font-mono text-slate-900">سعر الطبيب</th>
                <th className="py-3 px-3 text-left font-mono text-slate-900">سعر الصيدلي</th>
                <th className="py-3 px-3 text-left font-mono text-slate-900">سعر أخصائي البشرة</th>
                <th className="py-3 px-3 text-left font-mono text-slate-900">سعر الزبون العادي</th>
                {showProfitPreview && (
                  <th className="py-3 px-3 text-left bg-emerald-50/50 text-emerald-900 border-r border-emerald-200 font-bold">
                    هامش الربح المتوقع
                  </th>
                )}
                <th className="py-3 px-3 text-center">الحالة</th>
                <th className="py-3 px-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-10 text-center text-slate-400">
                    لا توجد منتجات مطابقة لخيارات البحث
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const isOutOfStock = p.currentQuantity <= 0;
                  const isLowStock = p.currentQuantity > 0 && p.currentQuantity <= p.minStockLevel;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 text-center">
                        {p.imageUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ url: p.imageUrl!, title: p.name })}
                            className="relative group w-10 h-10 rounded-lg overflow-hidden border border-slate-200 inline-block shadow-xs hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer"
                            title="انقر لتكبير صورة المنتج"
                          >
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <ZoomIn className="w-3.5 h-3.5" />
                            </div>
                          </button>
                        ) : (
                          <div
                            className="w-10 h-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200"
                            title="لا توجد صورة لهذا المنتج"
                          >
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {p.sku}
                          </span>
                          {p.brand && <span className="text-[10px] text-slate-500">{p.brand}</span>}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {p.category}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-mono font-medium px-2.5 py-0.5 rounded-full text-xs ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-700'
                              : isLowStock
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {p.currentQuantity} وحدة
                        </span>
                      </td>

                      <td className="py-3 px-3 text-left font-mono font-semibold text-slate-600">
                        {formatCurrency(p.costPrice)}
                      </td>

                      <td className="py-3 px-3 text-left font-mono font-bold text-slate-800">
                        {formatCurrency(p.doctorPrice)}
                      </td>

                      <td className="py-3 px-3 text-left font-mono font-bold text-slate-800">
                        {formatCurrency(p.pharmacyPrice)}
                      </td>

                      <td className="py-3 px-3 text-left font-mono font-bold text-slate-800">
                        {formatCurrency(p.skincareSpecialistPrice)}
                      </td>

                      <td className="py-3 px-3 text-left font-mono font-bold text-slate-800">
                        {formatCurrency(p.regularCustomerPrice)}
                      </td>

                      {/* Expected Profits (Internal Preview) */}
                      {showProfitPreview && (
                        <td className="py-3 px-3 text-left bg-emerald-50/30 border-r border-emerald-100 text-[11px] font-mono">
                          <div className="space-y-0.5">
                            <span className="text-emerald-700 block">
                              طبيب: +{formatCurrency(p.doctorPrice - p.costPrice)}
                            </span>
                            <span className="text-emerald-800 block">
                              صيدلي: +{formatCurrency(p.pharmacyPrice - p.costPrice)}
                            </span>
                            <span className="text-emerald-800 block">
                              بشرة: +{formatCurrency(p.skincareSpecialistPrice - p.costPrice)}
                            </span>
                            <span className="text-emerald-900 block font-bold">
                              عادي: +{formatCurrency(p.regularCustomerPrice - p.costPrice)}
                            </span>
                          </div>
                        </td>
                      )}

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {p.isActive ? 'نشط' : 'معطل'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="تعديل المنتج"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف المنتج"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingProduct ? `تعديل المنتج: ${editingProduct.name}` : 'إضافة منتج جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Product Image Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>صورة المنتج</span>
                  </span>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>إزالة الصورة</span>
                    </button>
                  )}
                </div>

                {imageError && (
                  <div className="mb-2 p-2 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] rounded-lg">
                    {imageError}
                  </div>
                )}

                <div className="flex items-center gap-4">
                  {/* Thumbnail / Placeholder */}
                  <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="معاينة المنتج"
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setPreviewImage({ url: imageUrl, title: name || 'معاينة المنتج' })}
                      />
                    ) : (
                      <Package className="w-8 h-8 text-slate-300" />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-1 space-y-2">
                    <p className="text-[11px] text-slate-500">
                      يمكنك التقاط صورة للمنتج مباشرة بالكاميرا أو رفعها من الجهاز لتسهيل التعرف عليه في الفواتير والمخزون.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isCompressingImage}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{isCompressingImage ? 'جاري المعالجة...' : 'التقاط بالكاميرا'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isCompressingImage}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>اختيار ملف</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المنتج *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: Cream X"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رمز المنتج / SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: CRX-001"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">التصنيف</label>
                  <input
                    type="text"
                    placeholder="مثال: كريمات علاجية، سيرومات..."
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">العلامة التجارية (البراند)</label>
                  <input
                    type="text"
                    placeholder="مثال: ديرما كير"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              {/* Stock and Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الكمية الحالية في المخزون</label>
                  <input
                    type="number"
                    min="0"
                    value={currentQuantity}
                    onChange={e => setCurrentQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 text-center"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الحد الأدنى للتنبيه بالمخزون</label>
                  <input
                    type="number"
                    min="0"
                    value={minStockLevel}
                    onChange={e => setMinStockLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 text-center"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المورد الافتراضي</label>
                  <select
                    value={supplierId}
                    onChange={e => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-semibold"
                  >
                    <option value="">-- بدون مورد محدد --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing & Customer Specific Prices */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block text-xs">
                  جدول الأسعار والتكلفة (بالشيكل ₪)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <label className="block font-bold text-rose-700 mb-1">سعر التكلفة *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={costPrice}
                      onChange={e => setCostPrice(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-md font-mono font-bold text-center text-slate-900"
                    />
                    <span className="block text-[10px] text-slate-400 text-center mt-1">تكلفة الشراء</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <label className="block font-bold text-emerald-700 mb-1">سعر الطبيب *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={doctorPrice}
                      onChange={e => setDoctorPrice(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-md font-mono font-bold text-center text-slate-900"
                    />
                    <span className="block text-[10px] text-emerald-700 text-center mt-1 font-mono">
                      ربح: {formatCurrency(numDoctor - numCost)}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <label className="block font-bold text-emerald-700 mb-1">سعر الصيدلي *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={pharmacyPrice}
                      onChange={e => setPharmacyPrice(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-md font-mono font-bold text-center text-slate-900"
                    />
                    <span className="block text-[10px] text-emerald-700 text-center mt-1 font-mono">
                      ربح: {formatCurrency(numPharmacy - numCost)}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <label className="block font-bold text-emerald-700 mb-1">سعر أخصائي بشرة *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={skincareSpecialistPrice}
                      onChange={e => setSkincareSpecialistPrice(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-md font-mono font-bold text-center text-slate-900"
                    />
                    <span className="block text-[10px] text-emerald-700 text-center mt-1 font-mono">
                      ربح: {formatCurrency(numSkin - numCost)}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <label className="block font-bold text-emerald-700 mb-1">سعر الزبون العادي *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={regularCustomerPrice}
                      onChange={e => setRegularCustomerPrice(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-md font-mono font-bold text-center text-slate-900"
                    />
                    <span className="block text-[10px] text-emerald-700 text-center mt-1 font-mono">
                      ربح: {formatCurrency(numRegular - numCost)}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 pt-1">
                  * يتم حساب أرباح كل فئة تلقائياً = (سعر البيع - سعر التكلفة). معلومات الربح والتكلفة سرية ولن تظهر على أي فاتورة مطبوعة.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">وصف أو ملاحظات إضافية للمنتج</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="ملاحظات استخدام، تاريخ انتهاء الصلاحية، تركيبة..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                />
                <label htmlFor="isActiveToggle" className="font-bold text-slate-700 cursor-pointer">
                  المنتج نشط ومتاح للبيع في الفواتير
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
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
                  {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden file & camera inputs for product image */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleImageFileSelect(file);
          e.target.value = '';
        }}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleImageFileSelect(file);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Fullscreen Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-700 cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm truncate">{previewImage.title}</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[65vh] max-w-full object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
