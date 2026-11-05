'use client';

import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Plus,
  SlidersHorizontal,
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  X,
  TrendingDown,
  Layers
} from 'lucide-react';
import { Product, StockAdjustment, UnitOfMeasure } from '@invodesk/types';
import { calculateInventoryValuation } from '@invodesk/inventory';
import { EmptyState } from './StatusStates';

interface InventoryViewProps {
  products: Product[];
  onAdjustStock: (productId: string, quantityDelta: number, reason: StockAdjustment['reason'], note?: string) => void;
  onAddProduct: (newProduct: Partial<Product>) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onAdjustStock,
  onAddProduct
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals state
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<string>('5');
  const [adjustReason, setAdjustReason] = useState<StockAdjustment['reason']>('PURCHASE');
  const [adjustNote, setAdjustNote] = useState('');

  const [newProductModalOpen, setNewProductModalOpen] = useState(false);
  const [newProd, setNewProd] = useState<Partial<Product>>({
    name: '',
    sku: '',
    barcode: '',
    category: 'Computer Accessories',
    brand: '',
    unit: 'PCS',
    hsnCode: '8471',
    gstRate: 18,
    purchasePrice: 500,
    sellingPrice: 750,
    mrp: 899,
    currentStock: 20,
    minStockAlert: 5,
    isTaxInclusive: false
  });

  const valuation = useMemo(() => calculateInventoryValuation(products), [products]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => { if (p.category) set.add(p.category); });
    return ['All', ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm));
      const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
      const matchLow = !lowStockOnly || p.currentStock <= p.minStockAlert;
      return matchSearch && matchCat && matchLow;
    });
  }, [products, searchTerm, categoryFilter, lowStockOnly]);

  const handleOpenAdjust = (prod: Product) => {
    setSelectedProductForAdjust(prod);
    setAdjustDelta('5');
    setAdjustReason('PURCHASE');
    setAdjustNote('');
    setAdjustModalOpen(true);
  };

  const handleSaveAdjust = () => {
    if (!selectedProductForAdjust) return;
    const delta = parseInt(adjustDelta, 10);
    if (isNaN(delta) || delta === 0) return;
    onAdjustStock(selectedProductForAdjust.id, delta, adjustReason, adjustNote);
    setAdjustModalOpen(false);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.sku || !newProd.sellingPrice) return;
    onAddProduct(newProd);
    setNewProductModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header & Metrics */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800 }}>
            Inventory & Stock Operations
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time stock ledger, HSN tax classifications, valuation, and threshold alerts
          </p>
        </div>

        <button onClick={() => setNewProductModalOpen(true)} className="btn btn-primary">
          <Plus size={16} />
          Add New Product
        </button>
      </div>

      {/* Valuation Metrics Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14
      }}>
        <div className="glass-panel" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total SKUs Catalogued</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: 4 }}>{products.length} Products</div>
        </div>

        <div className="glass-panel" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Units in Warehouse</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--brand-emerald-dark)', marginTop: 4 }}>
            {valuation.totalUnitsInStock} Units
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Inventory Cost Valuation</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--brand-emerald-dark)', marginTop: 4 }}>
            ₹{valuation.costValuation.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Stock Attention Needed</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: valuation.lowStockCount > 0 ? '#ef4444' : 'var(--brand-emerald-dark)', marginTop: 4 }}>
            {valuation.lowStockCount} Low Stock
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search SKU, product name, barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingLeft: 38 }}
          />
        </div>

        {/* Category dropdown */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-field"
          style={{ width: 'auto', minWidth: 160 }}
        >
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Low Stock Toggle */}
        <button
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`btn btn-sm ${lowStockOnly ? 'btn-primary' : 'btn-outline'}`}
        >
          <AlertTriangle size={14} />
          {lowStockOnly ? 'Showing Low Stock' : 'Filter Low Stock'}
        </button>
      </div>

      {/* Stock Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No inventory products found"
            description="No items match your active search or filter. Try clearing filters or adding new stock."
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product & SKU</th>
                  <th>Category</th>
                  <th>HSN & Tax</th>
                  <th>Cost Price</th>
                  <th>Selling Price</th>
                  <th>Margin %</th>
                  <th>Current Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(prod => {
                  const isOutOfStock = prod.currentStock <= 0;
                  const isLow = !isOutOfStock && prod.currentStock <= prod.minStockAlert;
                  const margin = prod.sellingPrice > 0
                    ? Math.round(((prod.sellingPrice - prod.purchasePrice) / prod.sellingPrice) * 100)
                    : 0;

                  return (
                    <tr key={prod.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{prod.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          SKU: {prod.sku} {prod.barcode && `| Barcode: ${prod.barcode}`}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-indigo">{prod.category}</span>
                      </td>
                      <td>
                        <div>HSN: {prod.hsnCode}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>GST: {prod.gstRate}%</div>
                      </td>
                      <td>₹{prod.purchasePrice.toLocaleString('en-IN')}</td>
                      <td>
                        <strong style={{ color: 'var(--brand-emerald-dark)' }}>₹{prod.sellingPrice.toLocaleString('en-IN')}</strong>
                        {prod.mrp > prod.sellingPrice && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MRP: ₹{prod.mrp}</div>
                        )}
                      </td>
                      <td>
                        <span style={{ color: margin > 20 ? 'var(--brand-emerald-dark)' : '#d97706', fontWeight: 600 }}>
                          {margin}%
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.95rem', color: isOutOfStock ? 'var(--accent-danger)' : isLow ? 'var(--accent-warning)' : 'var(--text-primary)' }}>
                          {prod.currentStock} {prod.unit}
                        </strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Alert at: {prod.minStockAlert}</div>
                      </td>
                      <td>
                        <span className={`badge ${isOutOfStock ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`}>
                          {isOutOfStock ? 'Out of Stock' : isLow ? 'Low Stock' : 'Optimal'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenAdjust(prod)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem' }}
                        >
                          <ArrowUpDown size={13} />
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {adjustModalOpen && selectedProductForAdjust && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: 440, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Adjust Product Stock</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedProductForAdjust.name} (Current: {selectedProductForAdjust.currentStock} {selectedProductForAdjust.unit})
                </p>
              </div>
              <button onClick={() => setAdjustModalOpen(false)} className="btn btn-outline btn-sm" style={{ padding: 6, borderRadius: '50%' }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Adjustment Delta Quantity (+ to add, - to reduce)
                </label>
                <input
                  type="number"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(e.target.value)}
                  className="input-field"
                  placeholder="e.g. +10 or -2"
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Reason for Adjustment
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value as any)}
                  className="input-field"
                >
                  <option value="PURCHASE">Purchase / Goods Inward (+)</option>
                  <option value="DAMAGE">Damage / Broken Stock (-)</option>
                  <option value="RETURN">Customer Return (+)</option>
                  <option value="AUDIT_CORRECTION">Physical Stock Audit Correction</option>
                  <option value="THEFT">Shrinkage / Loss (-)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Audit Note / Reference
                </label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="e.g. Inward PO #4092 or Damaged packaging"
                  className="input-field"
                />
              </div>

              <button onClick={handleSaveAdjust} className="btn btn-primary" style={{ marginTop: 8 }}>
                <CheckCircle2 size={16} />
                Confirm Stock Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {newProductModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: 560, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Add New Product to Catalog</h3>
              <button onClick={() => setNewProductModalOpen(false)} className="btn btn-outline btn-sm" style={{ padding: 6, borderRadius: '50%' }}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HP Wireless Keyboard & Mouse Combo"
                  value={newProd.name}
                  onChange={e => setNewProd({ ...newProd, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>SKU Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ELEC-HP-COMBO"
                  value={newProd.sku}
                  onChange={e => setNewProd({ ...newProd, sku: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Barcode / EAN</label>
                <input
                  type="text"
                  placeholder="e.g. 8901030998877"
                  value={newProd.barcode}
                  onChange={e => setNewProd({ ...newProd, barcode: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Category</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Accessories"
                  value={newProd.category}
                  onChange={e => setNewProd({ ...newProd, category: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Unit of Measure</label>
                <select
                  value={newProd.unit}
                  onChange={e => setNewProd({ ...newProd, unit: e.target.value as UnitOfMeasure })}
                  className="input-field"
                >
                  <option value="PCS">PCS (Pieces)</option>
                  <option value="BOX">BOX (Boxes)</option>
                  <option value="KG">KG (Kilograms)</option>
                  <option value="LTR">LTR (Litres)</option>
                  <option value="PACK">PACK (Packs)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>HSN Code</label>
                <input
                  type="text"
                  placeholder="e.g. 8471"
                  value={newProd.hsnCode}
                  onChange={e => setNewProd({ ...newProd, hsnCode: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>GST Rate (%)</label>
                <select
                  value={newProd.gstRate}
                  onChange={e => setNewProd({ ...newProd, gstRate: Number(e.target.value) })}
                  className="input-field"
                >
                  <option value="0">0% (Exempt)</option>
                  <option value="5">5% (Concessional)</option>
                  <option value="12">12% (Standard 1)</option>
                  <option value="18">18% (Standard 2)</option>
                  <option value="28">28% (Luxury)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Cost Price (₹)</label>
                <input
                  type="number"
                  value={newProd.purchasePrice}
                  onChange={e => setNewProd({ ...newProd, purchasePrice: Number(e.target.value) })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Selling Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={newProd.sellingPrice}
                  onChange={e => setNewProd({ ...newProd, sellingPrice: Number(e.target.value) })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Opening Stock</label>
                <input
                  type="number"
                  value={newProd.currentStock}
                  onChange={e => setNewProd({ ...newProd, currentStock: Number(e.target.value) })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Low Stock Alert Threshold</label>
                <input
                  type="number"
                  value={newProd.minStockAlert}
                  onChange={e => setNewProd({ ...newProd, minStockAlert: Number(e.target.value) })}
                  className="input-field"
                />
              </div>

              <div style={{ gridColumn: 'span 2', marginTop: 10 }}>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  <CheckCircle2 size={16} />
                  Save Product to InvoDesk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
