export type CustomerType = 'طبيب' | 'صيدلي' | 'أخصائي بشرة' | 'زبون عادي' | 'آخر';

export type InvoiceStatus = 'مدفوعة بالكامل' | 'مدفوعة جزئيًا' | 'غير مدفوعة' | 'ملغاة';

export type PaymentMethod = 'نقدي' | 'تحويل بنكي' | 'بطاقة' | 'أخرى';

export type DiscountType = 'percentage' | 'fixed';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  description: string;
  supplierId?: string;
  supplierName?: string;
  currentQuantity: number;
  minStockLevel: number;
  costPrice: number; // ₪ Cost Price (Internal only)
  doctorPrice: number; // ₪ سعر الطبيب
  pharmacyPrice: number; // ₪ سعر الصيدلي
  skincareSpecialistPrice: number; // ₪ سعر أخصائي البشرة
  regularCustomerPrice: number; // ₪ سعر الزبون العادي
  imageUrl?: string; // رابط أو صورة المنتج (Data URL)
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  clinicOrPharmacyName?: string;
  phone: string;
  address?: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  company?: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  costPrice: number; // Cost at time of sale (Internal only)
  unitPrice: number; // Default suggested or manually customized
  discountType: DiscountType;
  discountValue: number; // e.g. 10% or ₪5
  discountAmount: number; // Calculated discount per item total
  finalUnitPrice: number; // unitPrice after discount
  total: number; // quantity * finalUnitPrice
  totalCost: number; // quantity * costPrice (Internal only)
  profit: number; // total - totalCost (Internal only, before invoice discount distribution)
  netProfit?: number; // after proportional invoice-level discount (Internal only)
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-1001
  customerId: string;
  customerName: string;
  customerType: CustomerType;
  customerPhone?: string;
  clinicOrPharmacyName?: string;
  customerAddress?: string;
  date: string; // YYYY-MM-DD
  items: InvoiceItem[];
  subtotal: number; // Sum of item totals before invoice-level discount
  invoiceDiscountType: DiscountType;
  invoiceDiscountValue: number;
  invoiceDiscountAmount: number; // ₪ total invoice discount
  totalDiscount: number; // items discounts + invoice discount
  grossTotal: number; // sum of (item.quantity * item.unitPrice)
  finalTotal: number; // net total to be paid
  totalCost: number; // sum of item costs (Internal only)
  totalProfit: number; // finalTotal - totalCost (Internal only)
  paidAmount: number;
  remainingAmount: number;
  status: InvoiceStatus;
  scannedImageUrl?: string; // صورة الفاتورة الورقية الأصلية الملتقطة
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export type StockMovementType = 'in' | 'out' | 'adjustment' | 'return';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  type: StockMovementType;
  costPrice?: number;
  supplierId?: string;
  supplierName?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  supplierInvoiceNumber?: string;
  date: string;
  notes?: string;
  createdAt: string;
  previousStock?: number;
  remainingStock?: number;
}

export interface AppSettings {
  businessName: string;
  logoText: string;
  logoUrl?: string;
  phone: string;
  address: string;
  email: string;
  currency: string; // Always '₪'
  invoicePrefix: string; // e.g. 'INV-'
  startingInvoiceNumber: number; // e.g. 1001
  invoiceFooterText: string;
  defaultMinStockAlert: number;
  allowSellingOutOfStock: boolean;
}

export type UserRole = 'admin' | 'accountant' | 'sales' | 'inventory';

export interface UserPermissions {
  canManageProducts: boolean;
  canManageInvoices: boolean;
  canManageCustomers: boolean;
  canManageSuppliers: boolean;
  canManageInventory: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canManageUsers: boolean;
}

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string;
  phone?: string;
  email?: string;
  avatarColor?: string;
  isActive: boolean;
  permissions: UserPermissions;
  createdAt: string;
  lastLoginAt?: string;
}

// User alias for seamless backward compatibility
export type User = UserAccount;
