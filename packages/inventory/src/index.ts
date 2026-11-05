import { Product, StockAdjustment } from '@invodesk/types';

export interface RecordStockChangeParams {
  product: Product;
  branchId: string;
  quantityDelta: number; // e.g. -2 for sale, +10 for purchase
  reason: StockAdjustment['reason'];
  note?: string;
  userId: string;
}

/**
 * Record stock adjustment and calculate new stock level safely
 */
export function recordStockChange(params: RecordStockChangeParams): {
  updatedProduct: Product;
  adjustmentRecord: StockAdjustment;
} {
  const previousStock = params.product.currentStock;
  const newStock = previousStock + params.quantityDelta;

  const updatedProduct: Product = {
    ...params.product,
    currentStock: newStock,
    updatedAt: new Date().toISOString()
  };

  const adjustmentRecord: StockAdjustment = {
    id: `adj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    productId: params.product.id,
    branchId: params.branchId,
    quantityDelta: params.quantityDelta,
    previousStock,
    newStock,
    reason: params.reason,
    note: params.note,
    userId: params.userId,
    createdAt: new Date().toISOString()
  };

  return {
    updatedProduct,
    adjustmentRecord
  };
}

/**
 * Identify products currently under or at their minimum stock alert threshold
 */
export function getLowStockProducts(products: Product[]): Product[] {
  return products.filter(p => p.isActive && p.currentStock <= p.minStockAlert);
}

/**
 * Calculate total inventory valuation: cost-based vs retail-based
 */
export function calculateInventoryValuation(products: Product[]): {
  costValuation: number;
  retailValuation: number;
  totalUnitsInStock: number;
  lowStockCount: number;
} {
  let costValuation = 0;
  let retailValuation = 0;
  let totalUnitsInStock = 0;
  let lowStockCount = 0;

  for (const p of products) {
    if (!p.isActive) continue;
    const stock = Math.max(0, p.currentStock);
    costValuation += stock * p.purchasePrice;
    retailValuation += stock * p.sellingPrice;
    totalUnitsInStock += stock;
    if (p.currentStock <= p.minStockAlert) {
      lowStockCount++;
    }
  }

  return {
    costValuation: Math.round(costValuation * 100) / 100,
    retailValuation: Math.round(retailValuation * 100) / 100,
    totalUnitsInStock,
    lowStockCount
  };
}
