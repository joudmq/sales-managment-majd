import { CustomerType, DiscountType, Product, InvoiceItem } from '../types';

/**
 * Returns the default suggested price for a product based on customer type
 */
export function getPriceByCustomerType(product: Product, type: CustomerType): number {
  switch (type) {
    case 'طبيب':
      return product.doctorPrice;
    case 'صيدلي':
      return product.pharmacyPrice;
    case 'أخصائي بشرة':
      return product.skincareSpecialistPrice;
    case 'زبون عادي':
      return product.regularCustomerPrice;
    case 'آخر':
    default:
      return product.regularCustomerPrice;
  }
}

/**
 * Format currency with ₪ symbol
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₪0';
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  return `₪${rounded.toLocaleString('en-US', {
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculate single invoice item totals & profits
 */
export function calculateItemValues(params: {
  costPrice: number;
  unitPrice: number;
  quantity: number;
  discountType: DiscountType;
  discountValue: number;
}): {
  discountAmount: number;
  finalUnitPrice: number;
  total: number;
  totalCost: number;
  profit: number;
} {
  const { costPrice, unitPrice, quantity, discountType, discountValue } = params;
  const rawTotal = unitPrice * quantity;
  let discountAmount = 0;

  if (discountValue > 0) {
    if (discountType === 'percentage') {
      discountAmount = (rawTotal * Math.min(100, discountValue)) / 100;
    } else {
      discountAmount = Math.min(rawTotal, discountValue);
    }
  }

  const total = Math.max(0, rawTotal - discountAmount);
  const finalUnitPrice = quantity > 0 ? total / quantity : 0;
  const totalCost = costPrice * quantity;
  const profit = total - totalCost;

  return {
    discountAmount: Number(discountAmount.toFixed(2)),
    finalUnitPrice: Number(finalUnitPrice.toFixed(2)),
    total: Number(total.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    profit: Number(profit.toFixed(2)),
  };
}

/**
 * Distribute invoice-level discount proportionally across items for internal profit calculation
 */
export function distributeInvoiceDiscount(
  items: InvoiceItem[],
  invoiceDiscountType: DiscountType,
  invoiceDiscountValue: number
): {
  subtotal: number;
  invoiceDiscountAmount: number;
  finalTotal: number;
  totalCost: number;
  totalProfit: number;
  distributedItems: InvoiceItem[];
} {
  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  let invoiceDiscountAmount = 0;

  if (invoiceDiscountValue > 0 && subtotal > 0) {
    if (invoiceDiscountType === 'percentage') {
      invoiceDiscountAmount = (subtotal * Math.min(100, invoiceDiscountValue)) / 100;
    } else {
      invoiceDiscountAmount = Math.min(subtotal, invoiceDiscountValue);
    }
  }

  invoiceDiscountAmount = Number(invoiceDiscountAmount.toFixed(2));
  const finalTotal = Math.max(0, Number((subtotal - invoiceDiscountAmount).toFixed(2)));
  const totalCost = Number(items.reduce((sum, i) => sum + i.totalCost, 0).toFixed(2));
  const totalProfit = Number((finalTotal - totalCost).toFixed(2));

  // Distribute proportionally
  const distributedItems = items.map(item => {
    const itemShareRatio = subtotal > 0 ? item.total / subtotal : 0;
    const itemDiscountShare = invoiceDiscountAmount * itemShareRatio;
    const netItemRevenue = item.total - itemDiscountShare;
    const netProfit = Number((netItemRevenue - item.totalCost).toFixed(2));

    return {
      ...item,
      netProfit,
    };
  });

  return {
    subtotal: Number(subtotal.toFixed(2)),
    invoiceDiscountAmount,
    finalTotal,
    totalCost,
    totalProfit,
    distributedItems,
  };
}
