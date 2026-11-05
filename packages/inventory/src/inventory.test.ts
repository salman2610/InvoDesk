import { describe, it, expect } from 'vitest';
import { recordStockChange, getLowStockProducts, calculateInventoryValuation } from './index';
import { Product } from '@invodesk/types';

describe('Inventory Engine', () => {
  const sampleProduct: Product = {
    id: 'prod_test',
    tenantId: 'tenant_1',
    sku: 'TEST-SKU-1',
    name: 'Wireless Keyboard',
    category: 'Peripherals',
    unit: 'PCS',
    hsnCode: '8471',
    gstRate: 18,
    purchasePrice: 500,
    sellingPrice: 750,
    mrp: 899,
    isTaxInclusive: false,
    currentStock: 10,
    minStockAlert: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('records stock decrements for sales accurately', () => {
    const { updatedProduct, adjustmentRecord } = recordStockChange({
      product: sampleProduct,
      branchId: 'branch_1',
      quantityDelta: -3,
      reason: 'SALE',
      userId: 'cashier_1'
    });

    expect(updatedProduct.currentStock).toBe(7);
    expect(adjustmentRecord.previousStock).toBe(10);
    expect(adjustmentRecord.newStock).toBe(7);
    expect(adjustmentRecord.quantityDelta).toBe(-3);
    expect(adjustmentRecord.reason).toBe('SALE');
  });

  it('identifies products at or under low-stock alert threshold', () => {
    const lowStockProd = { ...sampleProduct, currentStock: 4, minStockAlert: 5 };
    const healthyProd = { ...sampleProduct, id: 'prod_2', currentStock: 20, minStockAlert: 5 };

    const alerts = getLowStockProducts([lowStockProd, healthyProd]);
    expect(alerts.length).toBe(1);
    expect(alerts[0].currentStock).toBe(4);
  });

  it('calculates cost-based and retail-based inventory valuation', () => {
    const p1 = { ...sampleProduct, currentStock: 10, purchasePrice: 400, sellingPrice: 600 };
    const p2 = { ...sampleProduct, id: 'p2', currentStock: 5, purchasePrice: 1000, sellingPrice: 1500 };

    const val = calculateInventoryValuation([p1, p2]);
    // Cost: 10*400 + 5*1000 = 4000 + 5000 = 9000
    // Retail: 10*600 + 5*1500 = 6000 + 7500 = 13500
    expect(val.costValuation).toBe(9000);
    expect(val.retailValuation).toBe(13500);
    expect(val.totalUnitsInStock).toBe(15);
  });
});
