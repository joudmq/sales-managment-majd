import {
  Product,
  Customer,
  Supplier,
  Invoice,
  Payment,
  StockMovement,
  AppSettings,
  User,
  UserAccount,
  UserRole,
  UserPermissions,
  CustomerType,
} from '../types';
import {
  fsSaveProduct,
  fsDeleteProduct,
  fsSaveCustomer,
  fsDeleteCustomer,
  fsSaveSupplier,
  fsDeleteSupplier,
  fsSaveInvoice,
  fsSavePayment,
  fsSaveStockMovement,
  fsSaveSettings,
  fsSaveUser,
  fsDeleteUser,
  fsSeedAllData,
  fsClearAllData,
  FS_COLLECTIONS,
} from './firestoreService';
import { db } from './firebase';
import { collection, onSnapshot, doc, getDocs } from 'firebase/firestore';

const STORAGE_KEYS = {
  PRODUCTS: 'app_products_v1',
  CUSTOMERS: 'app_customers_v1',
  SUPPLIERS: 'app_suppliers_v1',
  INVOICES: 'app_invoices_v1',
  PAYMENTS: 'app_payments_v1',
  MOVEMENTS: 'app_stock_movements_v1',
  SETTINGS: 'app_settings_v1',
  USER: 'app_user_v1',
  USERS: 'app_users_v1',
  INITIALIZED: 'app_initialized_v1',
};

export const defaultPermissionsByRole: Record<UserRole, UserPermissions> = {
  admin: {
    canManageProducts: true,
    canManageInvoices: true,
    canManageCustomers: true,
    canManageSuppliers: true,
    canManageInventory: true,
    canViewReports: true,
    canManageSettings: true,
    canManageUsers: true,
  },
  accountant: {
    canManageProducts: false,
    canManageInvoices: true,
    canManageCustomers: true,
    canManageSuppliers: true,
    canManageInventory: false,
    canViewReports: true,
    canManageSettings: false,
    canManageUsers: false,
  },
  sales: {
    canManageProducts: true,
    canManageInvoices: true,
    canManageCustomers: true,
    canManageSuppliers: false,
    canManageInventory: false,
    canViewReports: false,
    canManageSettings: false,
    canManageUsers: false,
  },
  inventory: {
    canManageProducts: true,
    canManageInvoices: false,
    canManageCustomers: false,
    canManageSuppliers: true,
    canManageInventory: true,
    canViewReports: false,
    canManageSettings: false,
    canManageUsers: false,
  },
};

export const defaultUsers: UserAccount[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    name: 'مدير النظام الرئيسي',
    role: 'admin',
    password: '123456',
    phone: '0599000001',
    email: 'admin@system.local',
    avatarColor: 'bg-blue-600',
    isActive: true,
    permissions: defaultPermissionsByRole.admin,
    createdAt: '2026-08-01T08:00:00Z',
  },
  {
    id: 'usr-sales',
    username: 'sales',
    name: 'مسؤول المبيعات',
    role: 'sales',
    password: '123456',
    phone: '0599000002',
    email: 'sales@system.local',
    avatarColor: 'bg-emerald-600',
    isActive: true,
    permissions: defaultPermissionsByRole.sales,
    createdAt: '2026-08-01T08:00:00Z',
  },
  {
    id: 'usr-accountant',
    username: 'accountant',
    name: 'محاسب الحسابات والفواتير',
    role: 'accountant',
    password: '123456',
    phone: '0599000003',
    email: 'accounts@system.local',
    avatarColor: 'bg-purple-600',
    isActive: true,
    permissions: defaultPermissionsByRole.accountant,
    createdAt: '2026-08-01T08:00:00Z',
  },
];

export const defaultSettings: AppSettings = {
  businessName: 'مؤسسة النخبة للمستحضرات الطبية والتجميلية',
  logoText: 'النخبة الطبية',
  phone: '059-9123456',
  address: 'فلسطين - رام الله / القدس',
  email: 'info@elite-medical.ps',
  currency: '₪',
  invoicePrefix: 'INV-',
  startingInvoiceNumber: 1001,
  invoiceFooterText: 'شكرًا لتعاملكم معنا ونسعد بخدمتكم دائمًا',
  defaultMinStockAlert: 10,
  allowSellingOutOfStock: false,
};

export const defaultUser: User = defaultUsers[0];

const seedProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Cream X',
    sku: 'CRX-001',
    category: 'كريمات علاجية',
    brand: 'ديرما كير',
    description: 'كريم مرطب ومجدد لخلايا البشرة بعد الجلسات العلاجية',
    currentQuantity: 100,
    minStockLevel: 15,
    costPrice: 20,
    doctorPrice: 30,
    pharmacyPrice: 32,
    skincareSpecialistPrice: 35,
    regularCustomerPrice: 40,
    notes: 'المنتج المرجعي في الاختبار',
    isActive: true,
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'prod-2',
    name: 'سيروم حمض الهيالورونيك 30 مل',
    sku: 'SER-HYAL-30',
    category: 'سيرومات',
    brand: 'فيتال بيوتي',
    description: 'ترطيب عميق ومقاومة لعلامات التقدم بالسن',
    currentQuantity: 42,
    minStockLevel: 10,
    costPrice: 45,
    doctorPrice: 65,
    pharmacyPrice: 70,
    skincareSpecialistPrice: 75,
    regularCustomerPrice: 90,
    notes: 'مناسب لجميع أنواع البشرة',
    isActive: true,
    createdAt: '2026-08-05T11:00:00Z',
    updatedAt: '2026-08-05T11:00:00Z',
  },
  {
    id: 'prod-3',
    name: 'واقي شمس طبي فيزيائي SPF50+',
    sku: 'SUN-SPF50',
    category: 'واقيات شمس',
    brand: 'ديرما بروتكت',
    description: 'حماية فائقة وغير مدهن بعد التقشير والليزر',
    currentQuantity: 3, // Low stock alert! (<= minStock 10)
    minStockLevel: 10,
    costPrice: 30,
    doctorPrice: 45,
    pharmacyPrice: 48,
    skincareSpecialistPrice: 52,
    regularCustomerPrice: 65,
    notes: 'طلب متزايد في فصل الصيف',
    isActive: true,
    createdAt: '2026-08-10T09:30:00Z',
    updatedAt: '2026-08-10T09:30:00Z',
  },
  {
    id: 'prod-4',
    name: 'غسول للبشرة الحساسة والرقيقة 200 مل',
    sku: 'CLN-SENS-200',
    category: 'غسول ومنظفات',
    brand: 'بيوديرم',
    description: 'خالٍ من الصابون والعطور والكحول',
    currentQuantity: 0, // Out of stock alert!
    minStockLevel: 5,
    costPrice: 25,
    doctorPrice: 38,
    pharmacyPrice: 40,
    skincareSpecialistPrice: 42,
    regularCustomerPrice: 55,
    notes: 'بانتظار وصول الشحنة الجديدة',
    isActive: true,
    createdAt: '2026-08-12T14:00:00Z',
    updatedAt: '2026-08-12T14:00:00Z',
  },
  {
    id: 'prod-5',
    name: 'ميزوثيرابي نضارة وفيتامينات 5 مل',
    sku: 'MESO-GLOW-5',
    category: 'أمبولات وميزو',
    brand: 'ميزولاين',
    description: 'جلسات عيادات وأخصائيين لتفتيح ونضارة فورية',
    currentQuantity: 28,
    minStockLevel: 8,
    costPrice: 110,
    doctorPrice: 160,
    pharmacyPrice: 170,
    skincareSpecialistPrice: 180,
    regularCustomerPrice: 220,
    notes: 'منتج احترافي عالي الربحية',
    isActive: true,
    createdAt: '2026-08-15T16:00:00Z',
    updatedAt: '2026-08-15T16:00:00Z',
  },
];

const seedSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: 'شركة الشرق للمستلزمات الطبية',
    company: 'الشرق لمستحضرات التجميل',
    phone: '059-9887766',
    address: 'رام الله - المنطقة الصناعية',
    notes: 'المورد الرئيسي لكريمات وسيرومات ديرما كير',
    createdAt: '2026-07-20T08:00:00Z',
  },
  {
    id: 'sup-2',
    name: 'دار الدواء والميزو الدولي',
    company: 'انترناشونال فارما',
    phone: '059-9776655',
    address: 'نابلس - شارع رفيديا',
    notes: 'مورد أمبولات ومستحضرات العيادات المتخصصة',
    createdAt: '2026-07-22T09:00:00Z',
  },
];

const seedCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'د. أحمد',
    type: 'طبيب',
    clinicOrPharmacyName: 'عيادة د. أحمد للجلدية والتجميل',
    phone: '059-8112233',
    address: 'رام الله - مجمع الزهراء الطبي الطابق 3',
    email: 'dr.ahmed@example.com',
    notes: 'عميل دائم، يفضل الفواتير الشهرية المجمعة',
    createdAt: '2026-08-01T09:00:00Z',
  },
  {
    id: 'cust-2',
    name: 'صيدلية الشفاء المركزية',
    type: 'صيدلي',
    clinicOrPharmacyName: 'صيدلية الشفاء المركزية',
    phone: '059-8223344',
    address: 'القدس - شارع صلاح الدين',
    email: 'shifa.pharmacy@example.com',
    notes: 'د. يوسف المسؤول عن المشتريات',
    createdAt: '2026-08-02T10:00:00Z',
  },
  {
    id: 'cust-3',
    name: 'سارة للعناية بالبشرة',
    type: 'أخصائي بشرة',
    clinicOrPharmacyName: 'مركز سارة سكين كير',
    phone: '059-8334455',
    address: 'بيت لحم - شارع المهد',
    email: 'sara.skincare@example.com',
    notes: 'تطلب الميزو والسيرومات أسبوعيًا',
    createdAt: '2026-08-05T12:00:00Z',
  },
  {
    id: 'cust-4',
    name: 'مريم خليل',
    type: 'زبون عادي',
    clinicOrPharmacyName: '',
    phone: '059-8445566',
    address: 'الخليل - عين سارة',
    email: 'maryam.k@example.com',
    notes: 'شراء منتجات العناية المنزلية الشخصية',
    createdAt: '2026-08-10T14:00:00Z',
  },
  {
    id: 'cust-5',
    name: 'د. محمود النجار',
    type: 'طبيب',
    clinicOrPharmacyName: 'مجمع النجار لجراحة وتجميل الجلد',
    phone: '059-8556677',
    address: 'جنين - الشارع العسكري',
    email: 'dr.najjar@example.com',
    notes: 'طلبيات دورية بحجم كبير',
    createdAt: '2026-08-12T15:00:00Z',
  },
];

const seedInvoices: Invoice[] = [
  {
    id: 'inv-1001',
    invoiceNumber: 'INV-1001',
    customerId: 'cust-1',
    customerName: 'د. أحمد',
    customerType: 'طبيب',
    customerPhone: '059-8112233',
    clinicOrPharmacyName: 'عيادة د. أحمد للجلدية والتجميل',
    date: '2026-09-01',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Cream X',
        sku: 'CRX-001',
        quantity: 10,
        costPrice: 20,
        unitPrice: 30, // Doctor price
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        finalUnitPrice: 30,
        total: 300,
        totalCost: 200,
        profit: 100,
        netProfit: 100,
      },
      {
        id: 'item-2',
        productId: 'prod-2',
        productName: 'سيروم حمض الهيالورونيك 30 مل',
        sku: 'SER-HYAL-30',
        quantity: 5,
        costPrice: 45,
        unitPrice: 65, // Doctor price
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        finalUnitPrice: 65,
        total: 325,
        totalCost: 225,
        profit: 100,
        netProfit: 100,
      },
    ],
    subtotal: 625,
    invoiceDiscountType: 'fixed',
    invoiceDiscountValue: 25,
    invoiceDiscountAmount: 25,
    totalDiscount: 25,
    grossTotal: 625,
    finalTotal: 600,
    totalCost: 425,
    totalProfit: 175,
    paidAmount: 150,
    remainingAmount: 450, // prompt example: د. أحمد المستحق: ₪450
    status: 'مدفوعة جزئيًا',
    notes: 'دفعة أولى عند الاستلام والباقي نهاية الشهر',
    createdAt: '2026-09-01T11:00:00Z',
    updatedAt: '2026-09-01T11:00:00Z',
  },
  {
    id: 'inv-1002',
    invoiceNumber: 'INV-1002',
    customerId: 'cust-2',
    customerName: 'صيدلية الشفاء المركزية',
    customerType: 'صيدلي',
    customerPhone: '059-8223344',
    clinicOrPharmacyName: 'صيدلية الشفاء المركزية',
    date: '2026-09-02',
    items: [
      {
        id: 'item-3',
        productId: 'prod-1',
        productName: 'Cream X',
        sku: 'CRX-001',
        quantity: 15,
        costPrice: 20,
        unitPrice: 32, // Pharmacy price
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        finalUnitPrice: 32,
        total: 480,
        totalCost: 300,
        profit: 180,
        netProfit: 180,
      },
      {
        id: 'item-4',
        productId: 'prod-3',
        productName: 'واقي شمس طبي فيزيائي SPF50+',
        sku: 'SUN-SPF50',
        quantity: 5,
        costPrice: 30,
        unitPrice: 48, // Pharmacy price
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        finalUnitPrice: 48,
        total: 240,
        totalCost: 150,
        profit: 90,
        netProfit: 90,
      },
    ],
    subtotal: 720,
    invoiceDiscountType: 'fixed',
    invoiceDiscountValue: 0,
    invoiceDiscountAmount: 0,
    totalDiscount: 0,
    grossTotal: 720,
    finalTotal: 720,
    totalCost: 450,
    totalProfit: 270,
    paidAmount: 0,
    remainingAmount: 720, // prompt example: صيدلية الشفاء المستحق: ₪720
    status: 'غير مدفوعة',
    notes: 'تسليم البضاعة مؤجل السداد لأسبوع',
    createdAt: '2026-09-02T13:00:00Z',
    updatedAt: '2026-09-02T13:00:00Z',
  },
  {
    id: 'inv-1003',
    invoiceNumber: 'INV-1003',
    customerId: 'cust-3',
    customerName: 'سارة للعناية بالبشرة',
    customerType: 'أخصائي بشرة',
    customerPhone: '059-8334455',
    clinicOrPharmacyName: 'مركز سارة سكين كير',
    date: '2026-09-03',
    items: [
      {
        id: 'item-5',
        productId: 'prod-5',
        productName: 'ميزوثيرابي نضارة وفيتامينات 5 مل',
        sku: 'MESO-GLOW-5',
        quantity: 2,
        costPrice: 110,
        unitPrice: 180, // Skincare price
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        finalUnitPrice: 180,
        total: 360,
        totalCost: 220,
        profit: 140,
        netProfit: 140,
      },
    ],
    subtotal: 360,
    invoiceDiscountType: 'fixed',
    invoiceDiscountValue: 0,
    invoiceDiscountAmount: 0,
    totalDiscount: 0,
    grossTotal: 360,
    finalTotal: 360,
    totalCost: 220,
    totalProfit: 140,
    paidAmount: 180,
    remainingAmount: 180, // prompt example: سارة المستحق: ₪180
    status: 'مدفوعة جزئيًا',
    notes: '',
    createdAt: '2026-09-03T15:30:00Z',
    updatedAt: '2026-09-03T15:30:00Z',
  },
  {
    id: 'inv-1004',
    invoiceNumber: 'INV-1004',
    customerId: 'cust-4',
    customerName: 'مريم خليل',
    customerType: 'زبون عادي',
    customerPhone: '059-8445566',
    clinicOrPharmacyName: '',
    date: '2026-09-04',
    items: [
      {
        id: 'item-6',
        productId: 'prod-1',
        productName: 'Cream X',
        sku: 'CRX-001',
        quantity: 1,
        costPrice: 20,
        unitPrice: 40, // Regular customer price
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        finalUnitPrice: 40,
        total: 40,
        totalCost: 20,
        profit: 20,
        netProfit: 20,
      },
      {
        id: 'item-7',
        productId: 'prod-2',
        productName: 'سيروم حمض الهيالورونيك 30 مل',
        sku: 'SER-HYAL-30',
        quantity: 1,
        costPrice: 45,
        unitPrice: 90, // Regular customer price
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        finalUnitPrice: 90,
        total: 90,
        totalCost: 45,
        profit: 45,
        netProfit: 45,
      },
    ],
    subtotal: 130,
    invoiceDiscountType: 'fixed',
    invoiceDiscountValue: 0,
    invoiceDiscountAmount: 0,
    totalDiscount: 0,
    grossTotal: 130,
    finalTotal: 130,
    totalCost: 65,
    totalProfit: 65,
    paidAmount: 130,
    remainingAmount: 0,
    status: 'مدفوعة بالكامل',
    notes: 'الدفع نقدًا عند التسليم',
    createdAt: '2026-09-04T10:00:00Z',
    updatedAt: '2026-09-04T10:00:00Z',
  },
];

const seedPayments: Payment[] = [
  {
    id: 'pay-1',
    invoiceId: 'inv-1001',
    invoiceNumber: 'INV-1001',
    customerId: 'cust-1',
    customerName: 'د. أحمد',
    amount: 150,
    date: '2026-09-01',
    paymentMethod: 'نقدي',
    notes: 'دفعة مقدمة عند استلام الطلبية',
    createdAt: '2026-09-01T11:05:00Z',
  },
  {
    id: 'pay-2',
    invoiceId: 'inv-1003',
    invoiceNumber: 'INV-1003',
    customerId: 'cust-3',
    customerName: 'سارة للعناية بالبشرة',
    amount: 180,
    date: '2026-09-03',
    paymentMethod: 'تحويل بنكي',
    notes: 'دفعة نصف القيمة عبر بنك فلسطين',
    createdAt: '2026-09-03T15:45:00Z',
  },
  {
    id: 'pay-3',
    invoiceId: 'inv-1004',
    invoiceNumber: 'INV-1004',
    customerId: 'cust-4',
    customerName: 'مريم خليل',
    amount: 130,
    date: '2026-09-04',
    paymentMethod: 'نقدي',
    notes: 'سداد كامل القيمة',
    createdAt: '2026-09-04T10:05:00Z',
  },
];

const seedStockMovements: StockMovement[] = [
  {
    id: 'mov-1',
    productId: 'prod-1',
    productName: 'Cream X',
    sku: 'CRX-001',
    quantity: 126,
    type: 'in',
    costPrice: 20,
    supplierId: 'sup-1',
    supplierName: 'شركة الشرق للمستلزمات الطبية',
    supplierInvoiceNumber: 'SUP-4412',
    date: '2026-08-01',
    notes: 'رصيد افتتاحي واستلام شحنة جديدة',
    createdAt: '2026-08-01T10:00:00Z',
    previousStock: 0,
    remainingStock: 126,
  },
  {
    id: 'mov-2',
    productId: 'prod-2',
    productName: 'سيروم حمض الهيالورونيك 30 مل',
    sku: 'SER-HYAL-30',
    quantity: 50,
    type: 'in',
    costPrice: 45,
    supplierId: 'sup-2',
    supplierName: 'المؤسسة الألمانية لمستحضرات التجميل',
    supplierInvoiceNumber: 'GER-902',
    date: '2026-08-05',
    notes: 'شحنة استيراد سيرومات ألمانية أصلية',
    createdAt: '2026-08-05T11:00:00Z',
    previousStock: 0,
    remainingStock: 50,
  },
  {
    id: 'mov-3',
    productId: 'prod-3',
    productName: 'واقي شمس طبي فيزيائي SPF50+',
    sku: 'SUN-SPF50',
    quantity: 25,
    type: 'in',
    costPrice: 30,
    supplierId: 'sup-1',
    supplierName: 'شركة الشرق للمستلزمات الطبية',
    supplierInvoiceNumber: 'SUP-4480',
    date: '2026-08-10',
    notes: 'توريد دفعة صيفية',
    createdAt: '2026-08-10T09:30:00Z',
    previousStock: 0,
    remainingStock: 25,
  },
  {
    id: 'mov-4',
    productId: 'prod-4',
    productName: 'غسول للبشرة الحساسة والرقيقة 200 مل',
    sku: 'CLN-SENS-200',
    quantity: 20,
    type: 'in',
    costPrice: 25,
    supplierId: 'sup-2',
    supplierName: 'المؤسسة الألمانية لمستحضرات التجميل',
    supplierInvoiceNumber: 'GER-915',
    date: '2026-08-12',
    notes: 'توريد غسول طبي للبشرة الحساسة',
    createdAt: '2026-08-12T14:00:00Z',
    previousStock: 0,
    remainingStock: 20,
  },
  {
    id: 'mov-5',
    productId: 'prod-5',
    productName: 'ميزوثيرابي نضارة وفيتامينات 5 مل',
    sku: 'MESO-GLOW-5',
    quantity: 30,
    type: 'in',
    costPrice: 110,
    supplierId: 'sup-3',
    supplierName: 'ميديكال سوليوشنز فارما',
    supplierInvoiceNumber: 'MED-1102',
    date: '2026-08-15',
    notes: 'استلام أمبولات ميزوثيرابي للعيادات',
    createdAt: '2026-08-15T16:00:00Z',
    previousStock: 0,
    remainingStock: 30,
  },
  {
    id: 'mov-6',
    productId: 'prod-1',
    productName: 'Cream X',
    sku: 'CRX-001',
    quantity: -10,
    type: 'out',
    invoiceId: 'inv-1001',
    invoiceNumber: 'INV-1001',
    date: '2026-09-01',
    notes: 'مبيعات فاتورة د. أحمد',
    createdAt: '2026-09-01T11:00:00Z',
    previousStock: 126,
    remainingStock: 116,
  },
  {
    id: 'mov-7',
    productId: 'prod-2',
    productName: 'سيروم حمض الهيالورونيك 30 مل',
    sku: 'SER-HYAL-30',
    quantity: -5,
    type: 'out',
    invoiceId: 'inv-1001',
    invoiceNumber: 'INV-1001',
    date: '2026-09-01',
    notes: 'مبيعات فاتورة د. أحمد',
    createdAt: '2026-09-01T11:00:00Z',
    previousStock: 50,
    remainingStock: 45,
  },
  {
    id: 'mov-8',
    productId: 'prod-1',
    productName: 'Cream X',
    sku: 'CRX-001',
    quantity: -15,
    type: 'out',
    invoiceId: 'inv-1002',
    invoiceNumber: 'INV-1002',
    date: '2026-09-02',
    notes: 'مبيعات فاتورة صيدلية الشفاء',
    createdAt: '2026-09-02T13:00:00Z',
    previousStock: 116,
    remainingStock: 101,
  },
  {
    id: 'mov-9',
    productId: 'prod-3',
    productName: 'واقي شمس طبي فيزيائي SPF50+',
    sku: 'SUN-SPF50',
    quantity: -12,
    type: 'out',
    invoiceId: 'inv-1002',
    invoiceNumber: 'INV-1002',
    date: '2026-09-02',
    notes: 'مبيعات فاتورة صيدلية الشفاء',
    createdAt: '2026-09-02T13:00:00Z',
    previousStock: 25,
    remainingStock: 13,
  },
  {
    id: 'mov-10',
    productId: 'prod-2',
    productName: 'سيروم حمض الهيالورونيك 30 مل',
    sku: 'SER-HYAL-30',
    quantity: -3,
    type: 'out',
    invoiceId: 'inv-1003',
    invoiceNumber: 'INV-1003',
    date: '2026-09-03',
    notes: 'مبيعات فاتورة سارة للعناية بالبشرة',
    createdAt: '2026-09-03T15:30:00Z',
    previousStock: 45,
    remainingStock: 42,
  },
  {
    id: 'mov-11',
    productId: 'prod-4',
    productName: 'غسول للبشرة الحساسة والرقيقة 200 مل',
    sku: 'CLN-SENS-200',
    quantity: -15,
    type: 'out',
    invoiceId: 'inv-1003',
    invoiceNumber: 'INV-1003',
    date: '2026-09-03',
    notes: 'مبيعات فاتورة سارة للعناية بالبشرة',
    createdAt: '2026-09-03T15:30:00Z',
    previousStock: 20,
    remainingStock: 5,
  },
  {
    id: 'mov-12',
    productId: 'prod-5',
    productName: 'ميزوثيرابي نضارة وفيتامينات 5 مل',
    sku: 'MESO-GLOW-5',
    quantity: -2,
    type: 'out',
    invoiceId: 'inv-1003',
    invoiceNumber: 'INV-1003',
    date: '2026-09-03',
    notes: 'مبيعات فاتورة سارة للعناية بالبشرة',
    createdAt: '2026-09-03T15:30:00Z',
    previousStock: 30,
    remainingStock: 28,
  },
  {
    id: 'mov-13',
    productId: 'prod-1',
    productName: 'Cream X',
    sku: 'CRX-001',
    quantity: -1,
    type: 'out',
    invoiceId: 'inv-1004',
    invoiceNumber: 'INV-1004',
    date: '2026-09-04',
    notes: 'مبيعات فاتورة مريم خليل',
    createdAt: '2026-09-04T10:00:00Z',
    previousStock: 101,
    remainingStock: 100,
  },
  {
    id: 'mov-14',
    productId: 'prod-3',
    productName: 'واقي شمس طبي فيزيائي SPF50+',
    sku: 'SUN-SPF50',
    quantity: -10,
    type: 'out',
    invoiceId: 'inv-1005',
    invoiceNumber: 'INV-1005',
    date: '2026-09-05',
    notes: 'مبيعات فاتورة د. محمود النجار',
    createdAt: '2026-09-05T09:15:00Z',
    previousStock: 13,
    remainingStock: 3,
  },
  {
    id: 'mov-15',
    productId: 'prod-4',
    productName: 'غسول للبشرة الحساسة والرقيقة 200 مل',
    sku: 'CLN-SENS-200',
    quantity: -5,
    type: 'out',
    invoiceId: 'inv-1005',
    invoiceNumber: 'INV-1005',
    date: '2026-09-05',
    notes: 'مبيعات فاتورة د. محمود النجار (نفد المخزون)',
    createdAt: '2026-09-05T09:15:00Z',
    previousStock: 5,
    remainingStock: 0,
  },
];

let unsubscribers: Array<() => void> = [];

export function startFirestoreRealtimeSync(onDataChange?: () => void): () => void {
  // Clear any previous listeners
  unsubscribers.forEach(unsub => unsub());
  unsubscribers = [];

  // 1. Products
  const unsubProd = onSnapshot(collection(db, FS_COLLECTIONS.PRODUCTS), (snapshot) => {
    const items = snapshot.docs.map(d => d.data() as Product);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(items));
    if (onDataChange) onDataChange();
  }, (err) => console.warn('Products sync notice:', err));
  unsubscribers.push(unsubProd);

  // 2. Customers
  const unsubCust = onSnapshot(collection(db, FS_COLLECTIONS.CUSTOMERS), (snapshot) => {
    const items = snapshot.docs.map(d => d.data() as Customer);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(items));
    if (onDataChange) onDataChange();
  }, (err) => console.warn('Customers sync notice:', err));
  unsubscribers.push(unsubCust);

  // 3. Suppliers
  const unsubSupp = onSnapshot(collection(db, FS_COLLECTIONS.SUPPLIERS), (snapshot) => {
    const items = snapshot.docs.map(d => d.data() as Supplier);
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(items));
    if (onDataChange) onDataChange();
  }, (err) => console.warn('Suppliers sync notice:', err));
  unsubscribers.push(unsubSupp);

  // 4. Invoices
  const unsubInv = onSnapshot(collection(db, FS_COLLECTIONS.INVOICES), (snapshot) => {
    const items = snapshot.docs.map(d => d.data() as Invoice);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(items));
    if (onDataChange) onDataChange();
  }, (err) => console.warn('Invoices sync notice:', err));
  unsubscribers.push(unsubInv);

  // 5. Payments
  const unsubPay = onSnapshot(collection(db, FS_COLLECTIONS.PAYMENTS), (snapshot) => {
    const items = snapshot.docs.map(d => d.data() as Payment);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(items));
    if (onDataChange) onDataChange();
  }, (err) => console.warn('Payments sync notice:', err));
  unsubscribers.push(unsubPay);

  // 6. Stock Movements
  const unsubMov = onSnapshot(collection(db, FS_COLLECTIONS.STOCK_MOVEMENTS), (snapshot) => {
    const items = snapshot.docs.map(d => d.data() as StockMovement);
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(items));
    if (onDataChange) onDataChange();
  }, (err) => console.warn('Movements sync notice:', err));
  unsubscribers.push(unsubMov);

  // 7. Settings
  const unsubSet = onSnapshot(doc(db, FS_COLLECTIONS.SETTINGS, 'app_settings'), (snapshot) => {
    if (snapshot.exists()) {
      const s = snapshot.data() as AppSettings;
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...s, currency: '₪' }));
    } else {
      fsSaveSettings(defaultSettings).catch(err => console.error(err));
    }
    if (onDataChange) onDataChange();
  }, (err) => console.warn('Settings sync notice:', err));
  unsubscribers.push(unsubSet);

  // 8. Users
  const unsubUsers = onSnapshot(collection(db, FS_COLLECTIONS.USERS), (snapshot) => {
    if (!snapshot.empty) {
      const items = snapshot.docs.map(d => d.data() as UserAccount);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(items));
    } else {
      // Sync local users to Firestore if Firestore is empty
      const localUsers = getUsers();
      localUsers.forEach(u => fsSaveUser(u).catch(err => console.error(err)));
    }
    if (onDataChange) onDataChange();
  }, (err) => console.warn('Users sync notice:', err));
  unsubscribers.push(unsubUsers);

  return () => {
    unsubscribers.forEach(u => u());
    unsubscribers = [];
  };
}

const PURGE_DEMO_KEY = 'app_demo_purged_for_real_data_v1';

export function initStorage(): void {
  try {
    const isPurged = localStorage.getItem(PURGE_DEMO_KEY);
    if (!isPurged) {
      // Clear out any demo / seeded data so the user starts with empty clean data
      clearAllData();
      localStorage.setItem(PURGE_DEMO_KEY, 'true');
    }
    // Ensure users exist
    getUsers();
  } catch (err) {
    console.error('Storage initialization error:', err);
  }
}

export function resetToDemoData(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(seedProducts));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(seedCustomers));
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(seedSuppliers));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(seedInvoices));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(seedPayments));
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(seedStockMovements));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(defaultUser));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

    // Sync seed data to Firestore
    fsSeedAllData({
      products: seedProducts,
      customers: seedCustomers,
      suppliers: seedSuppliers,
      invoices: seedInvoices,
      payments: seedPayments,
      movements: seedStockMovements,
      settings: defaultSettings,
    }).catch(err => console.error('Firestore reset demo error:', err));
  } catch (e) {
    console.error('Reset storage error:', e);
  }
}

export function clearAllData(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(defaultUser));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

    // Clear Firestore collections
    fsClearAllData().catch(err => console.error('Firestore clear all error:', err));
    fsSaveSettings(defaultSettings).catch(err => console.error(err));
  } catch (e) {
    console.error('Clear all data error:', e);
  }
}

// Products
export function getProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProduct(product: Partial<Product> & { name: string }): Product {
  const list = getProducts();
  const now = new Date().toISOString();
  
  if (product.id) {
    const index = list.findIndex(p => p.id === product.id);
    if (index !== -1) {
      const updated: Product = {
        ...list[index],
        ...product,
        updatedAt: now,
      };
      list[index] = updated;
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
      fsSaveProduct(updated).catch(err => console.error(err));
      return updated;
    }
  }

  // Create new product
  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name: product.name.trim(),
    sku: (product.sku || `SKU-${Date.now().toString().slice(-4)}`).trim(),
    category: (product.category || 'عام').trim(),
    brand: (product.brand || '').trim(),
    description: (product.description || '').trim(),
    imageUrl: product.imageUrl || undefined,
    supplierId: product.supplierId,
    supplierName: product.supplierName,
    currentQuantity: Number(product.currentQuantity) || 0,
    minStockLevel: Number(product.minStockLevel) >= 0 ? Number(product.minStockLevel) : 10,
    costPrice: Number(product.costPrice) || 0,
    doctorPrice: Number(product.doctorPrice) || 0,
    pharmacyPrice: Number(product.pharmacyPrice) || 0,
    skincareSpecialistPrice: Number(product.skincareSpecialistPrice) || 0,
    regularCustomerPrice: Number(product.regularCustomerPrice) || 0,
    notes: (product.notes || '').trim(),
    isActive: product.isActive !== undefined ? product.isActive : true,
    createdAt: now,
    updatedAt: now,
  };

  list.unshift(newProduct);
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
  fsSaveProduct(newProduct).catch(err => console.error(err));

  // If created with initial stock > 0, log initial movement
  if (newProduct.currentQuantity > 0) {
    addStockMovement({
      productId: newProduct.id,
      productName: newProduct.name,
      sku: newProduct.sku,
      quantity: newProduct.currentQuantity,
      type: 'in',
      costPrice: newProduct.costPrice,
      supplierId: newProduct.supplierId,
      supplierName: newProduct.supplierName,
      date: new Date().toISOString().split('T')[0],
      notes: 'رصيد افتتاحي للمنتج',
      previousStock: 0,
      remainingStock: newProduct.currentQuantity,
    });
  }

  return newProduct;
}

export function deleteProduct(productId: string): { success: boolean; message: string } {
  const invoices = getInvoices();
  const usedInInvoice = invoices.some(inv => inv.items.some(i => i.productId === productId));
  const products = getProducts();
  const product = products.find(p => p.id === productId);

  if (!product) return { success: false, message: 'المنتج غير موجود' };

  if (usedInInvoice) {
    // Soft delete / deactivate to preserve historical invoices
    product.isActive = false;
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    fsSaveProduct(product).catch(err => console.error(err));
    return {
      success: true,
      message: 'تم إلغاء تنشيط المنتج مع الاحتفاظ ببياناته التاريخية لوجود فواتير مرتبطة به.',
    };
  }

  // Hard delete if never used in any invoice
  const updated = products.filter(p => p.id !== productId);
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
  fsDeleteProduct(productId).catch(err => console.error(err));
  return { success: true, message: 'تم حذف المنتج بنجاح.' };
}

// Customers
export function getCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomer(customer: Partial<Customer> & { name: string; type: CustomerType; phone: string }): Customer {
  const list = getCustomers();
  const now = new Date().toISOString();

  if (customer.id) {
    const index = list.findIndex(c => c.id === customer.id);
    if (index !== -1) {
      const updated: Customer = {
        ...list[index],
        ...customer,
      };
      list[index] = updated;
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(list));
      fsSaveCustomer(updated).catch(err => console.error(err));
      return updated;
    }
  }

  const newCustomer: Customer = {
    id: `cust-${Date.now()}`,
    name: customer.name.trim(),
    type: customer.type,
    clinicOrPharmacyName: (customer.clinicOrPharmacyName || '').trim(),
    phone: customer.phone.trim(),
    address: (customer.address || '').trim(),
    email: (customer.email || '').trim(),
    notes: (customer.notes || '').trim(),
    createdAt: now,
  };

  list.unshift(newCustomer);
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(list));
  fsSaveCustomer(newCustomer).catch(err => console.error(err));
  return newCustomer;
}

export function deleteCustomer(customerId: string): { success: boolean; message: string } {
  const invoices = getInvoices();
  const hasInvoices = invoices.some(inv => inv.customerId === customerId);
  const list = getCustomers();

  if (hasInvoices) {
    return {
      success: false,
      message: 'لا يمكن حذف العميل لوجود فواتير مرتبطة به، يمكنك تعديل بياناته فقط.',
    };
  }

  const updated = list.filter(c => c.id !== customerId);
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
  fsDeleteCustomer(customerId).catch(err => console.error(err));
  return { success: true, message: 'تم حذف العميل بنجاح.' };
}

// Suppliers
export function getSuppliers(): Supplier[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSupplier(supplier: Partial<Supplier> & { name: string; phone: string }): Supplier {
  const list = getSuppliers();
  const now = new Date().toISOString();

  if (supplier.id) {
    const index = list.findIndex(s => s.id === supplier.id);
    if (index !== -1) {
      const updated: Supplier = {
        ...list[index],
        ...supplier,
      };
      list[index] = updated;
      localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(list));
      fsSaveSupplier(updated).catch(err => console.error(err));
      return updated;
    }
  }

  const newSupplier: Supplier = {
    id: `sup-${Date.now()}`,
    name: supplier.name.trim(),
    company: (supplier.company || '').trim(),
    phone: supplier.phone.trim(),
    address: (supplier.address || '').trim(),
    notes: (supplier.notes || '').trim(),
    createdAt: now,
  };

  list.unshift(newSupplier);
  localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(list));
  fsSaveSupplier(newSupplier).catch(err => console.error(err));
  return newSupplier;
}

export function deleteSupplier(supplierId: string): { success: boolean; message: string } {
  const movements = getStockMovements();
  const hasMovements = movements.some(m => m.supplierId === supplierId);
  const list = getSuppliers();

  if (hasMovements) {
    return {
      success: false,
      message: 'لا يمكن حذف المورد لوجود حركات توريد بضاعة مرتبطة به.',
    };
  }

  const updated = list.filter(s => s.id !== supplierId);
  localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(updated));
  fsDeleteSupplier(supplierId).catch(err => console.error(err));
  return { success: true, message: 'تم حذف المورد بنجاح.' };
}

// Stock Movements & Receiving Goods
export function getStockMovements(): StockMovement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    const list: StockMovement[] = raw ? JSON.parse(raw) : [];
    const products = getProducts();
    const productMap = new Map(products.map(p => [p.id, p]));

    // Sort chronologically ascending to calculate running balance if remainingStock is missing
    const sortedAsc = [...list].sort(
      (a, b) => new Date(a.createdAt || a.date).getTime() - new Date(b.createdAt || b.date).getTime()
    );

    const productBalances: Record<string, number> = {};

    const enriched = sortedAsc.map(m => {
      const prod = productMap.get(m.productId);
      const currentBal = productBalances[m.productId] || 0;
      const calculatedRemaining = currentBal + m.quantity;
      productBalances[m.productId] = calculatedRemaining;

      return {
        ...m,
        sku: m.sku || prod?.sku || '',
        productName: m.productName || prod?.name || 'منتج غير معروف',
        remainingStock: m.remainingStock !== undefined ? m.remainingStock : calculatedRemaining,
      };
    });

    // Return descending (newest first)
    return enriched.sort(
      (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
    );
  } catch {
    return [];
  }
}

export function addStockMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): StockMovement {
  const list = getStockMovements();
  const newMovement: StockMovement = {
    ...movement,
    id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };

  list.unshift(newMovement);
  localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(list));
  fsSaveStockMovement(newMovement).catch(err => console.error(err));
  return newMovement;
}

export function adjustStock(data: {
  productId: string;
  newQuantity: number;
  reason: string;
  date?: string;
}): { success: boolean; message: string; movement?: StockMovement } {
  const products = getProducts();
  const product = products.find(p => p.id === data.productId);
  if (!product) return { success: false, message: 'المنتج غير موجود' };

  const targetQty = Number(data.newQuantity);
  if (isNaN(targetQty) || targetQty < 0) {
    return { success: false, message: 'الكمية الجديدة يجب أن تكون رقماً صحيحاً موجباً أو صفراً' };
  }

  const prevStock = product.currentQuantity;
  const delta = targetQty - prevStock;

  if (delta === 0) {
    return { success: false, message: 'الكمية الجديدة مطابقة تماماً للمخزون الحالي، لم يتم إجراء أي تعديل.' };
  }

  product.currentQuantity = targetQty;
  product.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  fsSaveProduct(product).catch(err => console.error(err));

  const mov = addStockMovement({
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    quantity: delta,
    type: 'adjustment',
    date: data.date || new Date().toISOString().split('T')[0],
    notes: data.reason ? `تسوية جردية: ${data.reason}` : 'تسوية جردية يدوية',
    previousStock: prevStock,
    remainingStock: targetQty,
  });

  return {
    success: true,
    message: `تمت تسوية مخزون "${product.name}" بنجاح (${prevStock} ← ${targetQty} وحدة).`,
    movement: mov,
  };
}

export function receiveStock(data: {
  productId: string;
  quantity: number;
  costPrice: number;
  supplierId?: string;
  supplierName?: string;
  supplierInvoiceNumber?: string;
  date: string;
  notes?: string;
  updateProductCost?: boolean;
}): { success: boolean; message: string } {
  const products = getProducts();
  const product = products.find(p => p.id === data.productId);
  if (!product) return { success: false, message: 'المنتج غير موجود' };
  if (data.quantity <= 0) return { success: false, message: 'الكمية يجب أن تكون أكبر من صفر' };

  const prevStock = product.currentQuantity;

  // Increase stock
  product.currentQuantity += data.quantity;
  if (data.updateProductCost && data.costPrice > 0) {
    product.costPrice = data.costPrice;
  }
  product.updatedAt = new Date().toISOString();

  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  fsSaveProduct(product).catch(err => console.error(err));

  // Add stock movement
  addStockMovement({
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    quantity: data.quantity,
    type: 'in',
    costPrice: data.costPrice,
    supplierId: data.supplierId,
    supplierName: data.supplierName,
    supplierInvoiceNumber: data.supplierInvoiceNumber,
    date: data.date || new Date().toISOString().split('T')[0],
    notes: data.notes,
    previousStock: prevStock,
    remainingStock: product.currentQuantity,
  });

  return { success: true, message: 'تم إدخال البضاعة وتحديث المخزون بنجاح.' };
}

// Invoices
export function getInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getInvoiceById(id: string): Invoice | undefined {
  const invoices = getInvoices();
  return invoices.find(inv => inv.id === id);
}

export function getNextInvoiceNumber(): string {
  const settings = getSettings();
  const invoices = getInvoices();
  const prefix = settings.invoicePrefix || 'INV-';
  const startNumber = settings.startingInvoiceNumber || 1001;

  if (invoices.length === 0) {
    return `${prefix}${startNumber}`;
  }

  // Find max numeric suffix
  let maxNum = startNumber - 1;
  for (const inv of invoices) {
    const numPart = inv.invoiceNumber.replace(prefix, '');
    const parsed = parseInt(numPart, 10);
    if (!isNaN(parsed) && parsed > maxNum) {
      maxNum = parsed;
    }
  }

  return `${prefix}${maxNum + 1}`;
}

export function createInvoice(invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Invoice {
  const invoices = getInvoices();
  const products = getProducts();
  const settings = getSettings();

  // Validate stock restrictions if enabled
  if (!settings.allowSellingOutOfStock) {
    for (const item of invoiceData.items) {
      const prod = products.find(p => p.id === item.productId);
      if (prod && prod.currentQuantity < item.quantity) {
        throw new Error(`الكمية المطلوبة من المنتج "${prod.name}" (${item.quantity}) غير متوفرة في المخزون (المتوفر: ${prod.currentQuantity}).`);
      }
    }
  }

  const now = new Date().toISOString();
  const newInvoice: Invoice = {
    ...invoiceData,
    id: `inv-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };

  // Deduct inventory & record stock movements
  invoiceData.items.forEach(item => {
    const prod = products.find(p => p.id === item.productId);
    if (prod) {
      const prevStock = prod.currentQuantity;
      prod.currentQuantity -= item.quantity;
      prod.updatedAt = now;
      fsSaveProduct(prod).catch(err => console.error(err));
      addStockMovement({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantity: -item.quantity,
        type: 'out',
        invoiceId: newInvoice.id,
        invoiceNumber: newInvoice.invoiceNumber,
        date: newInvoice.date,
        notes: `مبيعات فاتورة رقم ${newInvoice.invoiceNumber} للعميل ${newInvoice.customerName}`,
        previousStock: prevStock,
        remainingStock: prod.currentQuantity,
      });
    }
  });

  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

  // If initial payment was made, record payment
  if (newInvoice.paidAmount > 0) {
    addPayment({
      invoiceId: newInvoice.id,
      invoiceNumber: newInvoice.invoiceNumber,
      customerId: newInvoice.customerId,
      customerName: newInvoice.customerName,
      amount: newInvoice.paidAmount,
      date: newInvoice.date,
      paymentMethod: 'نقدي',
      notes: 'دفعة مسجلة تلقائياً عند إنشاء الفاتورة',
    });
  }

  invoices.unshift(newInvoice);
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  fsSaveInvoice(newInvoice).catch(err => console.error(err));

  return newInvoice;
}

export function cancelInvoice(invoiceId: string, reason?: string): { success: boolean; message: string } {
  const invoices = getInvoices();
  const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId);
  if (invoiceIndex === -1) return { success: false, message: 'الفاتورة غير موجودة' };

  const invoice = invoices[invoiceIndex];
  if (invoice.status === 'ملغاة') {
    return { success: false, message: 'الفاتورة ملغاة مسبقاً.' };
  }

  const products = getProducts();
  const now = new Date().toISOString();

  // Return quantities to stock
  invoice.items.forEach(item => {
    const prod = products.find(p => p.id === item.productId);
    if (prod) {
      const prevStock = prod.currentQuantity;
      prod.currentQuantity += item.quantity;
      prod.updatedAt = now;
      fsSaveProduct(prod).catch(err => console.error(err));
      addStockMovement({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantity: item.quantity,
        type: 'return',
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        date: now.split('T')[0],
        notes: `إرجاع إلى المخزون لإلغاء فاتورة ${invoice.invoiceNumber}${reason ? `: ${reason}` : ''}`,
        previousStock: prevStock,
        remainingStock: prod.currentQuantity,
      });
    }
  });

  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

  invoice.status = 'ملغاة';
  invoice.notes = invoice.notes
    ? `${invoice.notes} | ملغاة: ${reason || 'بطلب المستخدم'}`
    : `ملغاة: ${reason || 'بطلب المستخدم'}`;
  invoice.updatedAt = now;

  invoices[invoiceIndex] = invoice;
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  fsSaveInvoice(invoice).catch(err => console.error(err));

  return { success: true, message: 'تم إلغاء الفاتورة وإرجاع الكمية إلى المخزون بنجاح.' };
}

// Payments
export function getPayments(): Payment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>): Payment {
  const payments = getPayments();
  const invoices = getInvoices();
  const now = new Date().toISOString();

  const newPayment: Payment = {
    ...paymentData,
    id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: now,
  };

  // Update Invoice balance & status
  const invIndex = invoices.findIndex(i => i.id === paymentData.invoiceId);
  if (invIndex !== -1) {
    const inv = invoices[invIndex];
    const newPaid = Number((inv.paidAmount + paymentData.amount).toFixed(2));
    const newRemaining = Math.max(0, Number((inv.finalTotal - newPaid).toFixed(2)));

    inv.paidAmount = newPaid;
    inv.remainingAmount = newRemaining;
    if (newRemaining <= 0) {
      inv.status = 'مدفوعة بالكامل';
    } else if (newPaid > 0) {
      inv.status = 'مدفوعة جزئيًا';
    } else {
      inv.status = 'غير مدفوعة';
    }
    inv.updatedAt = now;
    invoices[invIndex] = inv;
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    fsSaveInvoice(inv).catch(err => console.error(err));
  }

  payments.unshift(newPayment);
  localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  fsSavePayment(newPayment).catch(err => console.error(err));

  return newPayment;
}

// Settings
export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated: AppSettings = {
    ...current,
    ...settings,
    currency: '₪', // Enforced: Only ₪ is allowed
  };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  fsSaveSettings(updated).catch(err => console.error(err));
  return updated;
}

// User Accounts Management
export function getUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
      defaultUsers.forEach(u => fsSaveUser(u).catch(err => console.error(err)));
      return defaultUsers;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
      defaultUsers.forEach(u => fsSaveUser(u).catch(err => console.error(err)));
      return defaultUsers;
    }
    return parsed;
  } catch {
    return defaultUsers;
  }
}

export function getUserById(id: string): UserAccount | undefined {
  return getUsers().find(u => u.id === id);
}

export function getUserByUsername(username: string): UserAccount | undefined {
  const norm = username.trim().toLowerCase();
  return getUsers().find(u => u.username.toLowerCase() === norm);
}

export function saveUser(userData: {
  id?: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string;
  phone?: string;
  email?: string;
  avatarColor?: string;
  isActive?: boolean;
  permissions?: Partial<UserPermissions>;
}): { success: boolean; user?: UserAccount; message: string } {
  const users = getUsers();
  const trimmedUsername = userData.username.trim();
  const trimmedName = userData.name.trim();

  if (!trimmedUsername) {
    return { success: false, message: 'اسم المستخدم مطلوب ولا يمكن تركه فارغاً.' };
  }
  if (!trimmedName) {
    return { success: false, message: 'الاسم الكامل مطلوب.' };
  }

  // Check username uniqueness
  const existingWithSameUsername = users.find(
    u => u.username.toLowerCase() === trimmedUsername.toLowerCase() && u.id !== userData.id
  );
  if (existingWithSameUsername) {
    return { success: false, message: `اسم المستخدم "${trimmedUsername}" مستخدم مسبقاً، يرجى اختيار اسم مستخدم آخر.` };
  }

  const role = userData.role || 'sales';
  const basePermissions = defaultPermissionsByRole[role] || defaultPermissionsByRole.sales;
  const mergedPermissions: UserPermissions = {
    ...basePermissions,
    ...(userData.permissions || {}),
  };

  const now = new Date().toISOString();

  if (userData.id) {
    // Edit existing user
    const userIndex = users.findIndex(u => u.id === userData.id);
    if (userIndex === -1) {
      return { success: false, message: 'المستخدم غير موجود.' };
    }

    const existing = users[userIndex];
    const updatedUser: UserAccount = {
      ...existing,
      username: trimmedUsername,
      name: trimmedName,
      role,
      phone: userData.phone !== undefined ? userData.phone.trim() : existing.phone,
      email: userData.email !== undefined ? userData.email.trim() : existing.email,
      avatarColor: userData.avatarColor || existing.avatarColor || 'bg-blue-600',
      isActive: userData.isActive !== undefined ? userData.isActive : existing.isActive,
      permissions: mergedPermissions,
      password: userData.password && userData.password.trim() ? userData.password.trim() : existing.password,
    };

    users[userIndex] = updatedUser;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    fsSaveUser(updatedUser).catch(err => console.error(err));

    // If edited user is the currently logged in user, update current session
    const current = getCurrentUser();
    if (current && current.id === updatedUser.id) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    }

    return { success: true, user: updatedUser, message: 'تم تحديث بيانات الحساب بنجاح.' };
  } else {
    // Create new user
    if (!userData.password || !userData.password.trim()) {
      return { success: false, message: 'كلمة المرور مطلوبة لإنشاء حساب جديد.' };
    }

    const avatarColors = [
      'bg-blue-600',
      'bg-emerald-600',
      'bg-purple-600',
      'bg-amber-600',
      'bg-rose-600',
      'bg-indigo-600',
      'bg-teal-600',
    ];
    const chosenColor = userData.avatarColor || avatarColors[users.length % avatarColors.length];

    const newUser: UserAccount = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      username: trimmedUsername,
      name: trimmedName,
      role,
      password: userData.password.trim(),
      phone: userData.phone ? userData.phone.trim() : '',
      email: userData.email ? userData.email.trim() : '',
      avatarColor: chosenColor,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      permissions: mergedPermissions,
      createdAt: now,
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    fsSaveUser(newUser).catch(err => console.error(err));

    return { success: true, user: newUser, message: 'تم إنشاء الحساب الجديد بنجاح!' };
  }
}

export function deleteUser(userId: string): { success: boolean; message: string } {
  const users = getUsers();
  const target = users.find(u => u.id === userId);
  if (!target) {
    return { success: false, message: 'الحساب غير موجود.' };
  }

  // Prevent deleting current user
  const current = getCurrentUser();
  if (current && current.id === userId) {
    return { success: false, message: 'لا يمكنك حذف الحساب المسجل به حالياً.' };
  }

  // Prevent deleting the last active admin
  const adminCount = users.filter(u => u.role === 'admin' && u.isActive).length;
  if (target.role === 'admin' && adminCount <= 1) {
    return { success: false, message: 'لا يمكن حذف حساب المسؤول الأخير في النظام لضمان استمرار الإدارة.' };
  }

  const remaining = users.filter(u => u.id !== userId);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(remaining));
  fsDeleteUser(userId).catch(err => console.error(err));

  return { success: true, message: `تم حذف حساب "${target.name}" بنجاح.` };
}

export function toggleUserStatus(userId: string): { success: boolean; user?: UserAccount; message: string } {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) {
    return { success: false, message: 'الحساب غير موجود.' };
  }

  const target = users[index];
  const current = getCurrentUser();
  if (current && current.id === userId && target.isActive) {
    return { success: false, message: 'لا يمكنك تعطيل حسابك النشط الحالي.' };
  }

  // Prevent deactivating the last active admin
  if (target.role === 'admin' && target.isActive) {
    const activeAdmins = users.filter(u => u.role === 'admin' && u.isActive).length;
    if (activeAdmins <= 1) {
      return { success: false, message: 'لا يمكن تعطيل المسؤول الوحيد النشط في النظام.' };
    }
  }

  target.isActive = !target.isActive;
  users[index] = target;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  fsSaveUser(target).catch(err => console.error(err));

  return {
    success: true,
    user: target,
    message: target.isActive ? `تم تفعيل حساب "${target.name}".` : `تم تعطيل حساب "${target.name}".`,
  };
}

// User / Auth Session
export function getCurrentUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

export function checkAuthCredentials(
  username: string,
  password?: string
): { success: boolean; user?: UserAccount; message: string } {
  const norm = username.trim().toLowerCase();
  const pwd = password ? password.trim() : '';

  const users = getUsers();
  const found = users.find(u => u.username.toLowerCase() === norm);

  if (!found) {
    return { success: false, message: 'اسم المستخدم غير مسجل في النظام.' };
  }

  if (!found.isActive) {
    return { success: false, message: 'هذا الحساب معطل حالياً من قبل الإدارة. يرجى مراجعة المسؤول.' };
  }

  if (found.password && found.password !== pwd) {
    return { success: false, message: 'كلمة المرور غير صحيحة، يرجى التأكد والمحاولة مرة أخرى.' };
  }

  // Update last login
  found.lastLoginAt = new Date().toISOString();
  loginUser(found);
  fsSaveUser(found).catch(err => console.error(err));

  return { success: true, user: found, message: 'تم تسجيل الدخول بنجاح.' };
}

export function loginUser(userOrUsername: UserAccount | string): UserAccount | null {
  let user: UserAccount | null = null;
  if (typeof userOrUsername === 'object' && userOrUsername !== null) {
    user = userOrUsername;
  } else if (typeof userOrUsername === 'string') {
    const found = getUserByUsername(userOrUsername);
    if (found) {
      user = found;
    } else {
      // Fallback if not found in database yet
      user = {
        id: `usr-${Date.now()}`,
        username: userOrUsername.trim(),
        name: userOrUsername.trim() === 'admin' ? 'مدير النظام الرئيسي' : userOrUsername.trim(),
        role: userOrUsername.trim() === 'admin' ? 'admin' : 'sales',
        isActive: true,
        permissions: defaultPermissionsByRole.admin,
        createdAt: new Date().toISOString(),
      };
    }
  }

  if (user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return user;
  }
  return null;
}

export function logoutUser(): void {
  localStorage.removeItem(STORAGE_KEYS.USER);
}

// Backup & Restore
export function exportBackupJSON(): string {
  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    products: getProducts(),
    customers: getCustomers(),
    suppliers: getSuppliers(),
    invoices: getInvoices(),
    payments: getPayments(),
    movements: getStockMovements(),
    settings: getSettings(),
  };
  return JSON.stringify(data, null, 2);
}

export function importBackupJSON(jsonStr: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed.products || !parsed.customers || !parsed.invoices) {
      return { success: false, message: 'ملف النسخة الاحتياطية غير صالح أو ناقص البيانات.' };
    }

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(parsed.products));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(parsed.customers));
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(parsed.suppliers || []));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(parsed.invoices));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(parsed.payments || []));
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(parsed.movements || []));
    if (parsed.settings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...parsed.settings, currency: '₪' }));
    }
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

    // Sync imported backup into Firestore
    fsSeedAllData({
      products: parsed.products,
      customers: parsed.customers,
      suppliers: parsed.suppliers || [],
      invoices: parsed.invoices,
      payments: parsed.payments || [],
      movements: parsed.movements || [],
      settings: parsed.settings ? { ...parsed.settings, currency: '₪' } : defaultSettings,
    }).catch(err => console.error('Firestore backup sync error:', err));

    return { success: true, message: 'تم استعادة كافة بيانات النسخة الاحتياطية بنجاح ومزامنتها سحابياً!' };
  } catch (err) {
    return { success: false, message: 'فشل في قراءة ملف النسخة الاحتياطية (تنسيق JSON غير صالح).' };
  }
}
