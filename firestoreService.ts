import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Product,
  Customer,
  Supplier,
  Invoice,
  Payment,
  StockMovement,
  AppSettings,
  UserAccount,
} from '../types';

export interface SyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  errorMessage: string | null;
}

// Deep clean undefined values so Firestore doesn't reject them
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) return null as any;
  if (data === null || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as any;
  }
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(data as Record<string, any>)) {
    if (v !== undefined) {
      clean[k] = sanitizeForFirestore(v);
    }
  }
  return clean as T;
}

// Firestore Collection Names
export const FS_COLLECTIONS = {
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  SUPPLIERS: 'suppliers',
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  STOCK_MOVEMENTS: 'stockMovements',
  SETTINGS: 'settings',
  USERS: 'users',
};

// Global Sync State
let currentSyncStatus: SyncStatus = {
  isConnected: false,
  isSyncing: true,
  lastSyncedAt: null,
  errorMessage: null,
};

const statusListeners: Array<(status: SyncStatus) => void> = [];

export function getFirestoreSyncStatus(): SyncStatus {
  return currentSyncStatus;
}

export function subscribeToSyncStatus(listener: (status: SyncStatus) => void): () => void {
  statusListeners.push(listener);
  listener(currentSyncStatus);
  return () => {
    const idx = statusListeners.indexOf(listener);
    if (idx !== -1) statusListeners.splice(idx, 1);
  };
}

function updateSyncStatus(update: Partial<SyncStatus>) {
  currentSyncStatus = { ...currentSyncStatus, ...update };
  statusListeners.forEach(l => {
    try {
      l(currentSyncStatus);
    } catch (err) {
      console.error('Error in sync status listener:', err);
    }
  });
}

// Write single entity to Firestore
export async function fsSaveProduct(product: Product): Promise<void> {
  try {
    const clean = sanitizeForFirestore(product);
    await setDoc(doc(db, FS_COLLECTIONS.PRODUCTS, product.id), clean, { merge: true });
    updateSyncStatus({ isConnected: true, lastSyncedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Firestore save product error:', err);
    updateSyncStatus({ errorMessage: err.message });
  }
}

export async function fsDeleteProduct(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, FS_COLLECTIONS.PRODUCTS, productId));
    updateSyncStatus({ isConnected: true, lastSyncedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Firestore delete product error:', err);
  }
}

export async function fsSaveCustomer(customer: Customer): Promise<void> {
  try {
    const clean = sanitizeForFirestore(customer);
    await setDoc(doc(db, FS_COLLECTIONS.CUSTOMERS, customer.id), clean, { merge: true });
    updateSyncStatus({ isConnected: true, lastSyncedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Firestore save customer error:', err);
    updateSyncStatus({ errorMessage: err.message });
  }
}

export async function fsDeleteCustomer(customerId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, FS_COLLECTIONS.CUSTOMERS, customerId));
    updateSyncStatus({ isConnected: true, lastSyncedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Firestore delete customer error:', err);
  }
}

export async function fsSaveSupplier(supplier: Supplier): Promise<void> {
  try {
    const clean = sanitizeForFirestore(supplier);
    await setDoc(doc(db, FS_COLLECTIONS.SUPPLIERS, supplier.id), clean, { merge: true });
    updateSyncStatus({ isConnected: true, lastSyncedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Firestore save supplier error:', err);
    updateSyncStatus({ errorMessage: err.message });
  }
}

export async function fsDeleteSupplier(supplierId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, FS_COLLECTIONS.SUPPLIERS, supplierId));
    updateSyncStatus({ isConnected: true, lastSyncedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Firestore delete supplier error:', err);
  }
}

export async function fsSaveInvoice(invoice: Invoice): Promise<void> {
  try {
    const clean = sanitizeForFirestore(invoice);
    await setDoc(doc(db, FS_COLLECTIONS.INVOICES, invoice.id), clean, { merge: true });
    updateSyncStatus({ isConnected: true, lastSyncedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Firestore save invoice error:', err);
    updateSyncStatus({ errorMessage: err.message });
  }
}

export async function fsSavePayment(payment: Payment): Promise<void> {
  try {
    const clean = sanitizeForFirestore(payment);
    await setDoc(doc(db, FS_COLLECTIONS.PAYMENTS, payment.id), clean, { merge: true });
    updateSyncStatus({ isConnected: true, lastSyncedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Firestore save payment error:', err);
    updateSyncStatus({ errorMessage: err.message });
  }
}

export async function fsSaveStockMovement(movement: StockMovement): Promise<void> {
  try {
    const clean = sanitizeForFirestore(movement);
    await setDoc(doc(db, FS_COLLECTIONS.STOCK_MOVEMENTS, movement.id), clean, { merge: true });
    updateSyncStatus({ isConnected: true, lastSyncedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Firestore save stock movement error:', err);
    updateSyncStatus({ errorMessage: err.message });
  }
}

export async function fsSaveSettings(settings: AppSettings): Promise<void> {
  try {
    const clean = sanitizeForFirestore(settings);
    await setDoc(doc(db, FS_COLLECTIONS.SETTINGS, 'app_settings'), clean, { merge: true });
    updateSyncStatus({ isConnected: true, lastSyncedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Firestore save settings error:', err);
    updateSyncStatus({ errorMessage: err.message });
  }
}

export async function fsSaveUser(user: UserAccount): Promise<void> {
  try {
    const clean = sanitizeForFirestore(user);
    await setDoc(doc(db, FS_COLLECTIONS.USERS, user.id), clean, { merge: true });
    updateSyncStatus({ isConnected: true, lastSyncedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Firestore save user error:', err);
    updateSyncStatus({ errorMessage: err.message });
  }
}

export async function fsDeleteUser(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, FS_COLLECTIONS.USERS, userId));
    updateSyncStatus({ isConnected: true, lastSyncedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Firestore delete user error:', err);
    updateSyncStatus({ errorMessage: err.message });
  }
}

// Bulk overwrite / reset to Firestore
export async function fsSeedAllData(data: {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  payments: Payment[];
  movements: StockMovement[];
  settings: AppSettings;
}): Promise<void> {
  try {
    updateSyncStatus({ isSyncing: true });
    const batch = writeBatch(db);

    // Products
    data.products.forEach(p => {
      const ref = doc(db, FS_COLLECTIONS.PRODUCTS, p.id);
      batch.set(ref, sanitizeForFirestore(p), { merge: true });
    });

    // Customers
    data.customers.forEach(c => {
      const ref = doc(db, FS_COLLECTIONS.CUSTOMERS, c.id);
      batch.set(ref, sanitizeForFirestore(c), { merge: true });
    });

    // Suppliers
    data.suppliers.forEach(s => {
      const ref = doc(db, FS_COLLECTIONS.SUPPLIERS, s.id);
      batch.set(ref, sanitizeForFirestore(s), { merge: true });
    });

    // Invoices
    data.invoices.forEach(i => {
      const ref = doc(db, FS_COLLECTIONS.INVOICES, i.id);
      batch.set(ref, sanitizeForFirestore(i), { merge: true });
    });

    // Payments
    data.payments.forEach(pay => {
      const ref = doc(db, FS_COLLECTIONS.PAYMENTS, pay.id);
      batch.set(ref, sanitizeForFirestore(pay), { merge: true });
    });

    // Stock Movements
    data.movements.forEach(m => {
      const ref = doc(db, FS_COLLECTIONS.STOCK_MOVEMENTS, m.id);
      batch.set(ref, sanitizeForFirestore(m), { merge: true });
    });

    // Settings
    const settingsRef = doc(db, FS_COLLECTIONS.SETTINGS, 'app_settings');
    batch.set(settingsRef, sanitizeForFirestore(data.settings), { merge: true });

    await batch.commit();
    updateSyncStatus({
      isConnected: true,
      isSyncing: false,
      lastSyncedAt: new Date().toISOString(),
      errorMessage: null,
    });
  } catch (err: any) {
    console.error('Firestore seed all data error:', err);
    updateSyncStatus({
      isSyncing: false,
      errorMessage: err.message,
    });
  }
}

// Clear all collections from Firestore
export async function fsClearAllData(): Promise<void> {
  try {
    updateSyncStatus({ isSyncing: true });
    const collectionsToClear = [
      FS_COLLECTIONS.PRODUCTS,
      FS_COLLECTIONS.CUSTOMERS,
      FS_COLLECTIONS.SUPPLIERS,
      FS_COLLECTIONS.INVOICES,
      FS_COLLECTIONS.PAYMENTS,
      FS_COLLECTIONS.STOCK_MOVEMENTS,
    ];

    for (const collName of collectionsToClear) {
      const snap = await getDocs(collection(db, collName));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }

    updateSyncStatus({
      isConnected: true,
      isSyncing: false,
      lastSyncedAt: new Date().toISOString(),
      errorMessage: null,
    });
  } catch (err: any) {
    console.error('Firestore clear error:', err);
    updateSyncStatus({
      isSyncing: false,
      errorMessage: err.message,
    });
  }
}
