'use client';

import React from 'react';
import {
  PieChart,
  Download,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { GSTR1Summary } from '@invodesk/types';

interface GSTR1ViewProps {
  report: GSTR1Summary;
  tenantGstin: string;
}

export const GSTR1View: React.FC<GSTR1ViewProps> = ({ report, tenantGstin }) => {
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `GSTR1_${tenantGstin}_${report.period}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800 }}>
              Form GSTR-1 Tax Filing Assistant
            </h1>
            <span className="badge badge-success">Govt Offline Tool Compatible</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Summary of outward supplies of goods or services for Return Period: <strong>{report.period}</strong>
          </p>
        </div>

        <button onClick={handleExportJSON} className="btn btn-primary">
          <Download size={16} />
          Export GSTR-1 JSON
        </button>
      </div>

      {/* GSTR-1 Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 14
      }}>
        {/* Total Outward Value */}
        <div className="glass-panel" style={{ padding: 18 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Invoice Value</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4 }}>
            ₹{report.totalInvoiceValue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{report.totalInvoices} total bills filed</div>
        </div>

        {/* Total Taxable Value */}
        <div className="glass-panel" style={{ padding: 18 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Net Taxable Value</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-emerald-dark)', marginTop: 4 }}>
            ₹{report.totalTaxableAmount.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Excluding GST & Cess</div>
        </div>

        {/* CGST + SGST */}
        <div className="glass-panel" style={{ padding: 18 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Central & State Tax (CGST+SGST)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-emerald-dark)', marginTop: 4 }}>
            ₹{(report.totalCgst + report.totalSgst).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            CGST: ₹{report.totalCgst} | SGST: ₹{report.totalSgst}
          </div>
        </div>

        {/* IGST */}
        <div className="glass-panel" style={{ padding: 18 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Integrated Tax (IGST)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-warning)', marginTop: 4 }}>
            ₹{report.totalIgst.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Inter-state supplies</div>
        </div>
      </div>

      {/* Return Tables Matrix: B2B vs B2C */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div className="glass-panel" style={{ padding: 18 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Table 4: B2B Invoices</span>
            <span className="badge badge-indigo">{report.b2bInvoicesCount} Invoices</span>
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Supplies made to GST registered taxpayers with valid 15-digit GSTIN. Eligible for Input Tax Credit (ITC) for buyers.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: 18 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Table 7: B2CS (Small Retail Consumers)</span>
            <span className="badge badge-success">{report.b2csInvoicesCount} Invoices</span>
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Intra-state sales to unregistered persons and inter-state invoice values under ₹2,50,000.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: 18 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Table 5: B2CL (Large Consumer Interstate)</span>
            <span className="badge badge-warning">{report.b2clInvoicesCount} Invoices</span>
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Inter-state sales to unregistered persons with invoice value exceeding ₹2,50,000.
          </p>
        </div>
      </div>

      {/* Table 12: HSN Summary of Outward Supplies */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
              Table 12: HSN-wise Summary of Outward Supplies
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Mandatory Harmonized System of Nomenclature reporting for Goods and Services
            </p>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>HSN Code</th>
                <th>GST Rate</th>
                <th>Taxable Value</th>
                <th>CGST Amount</th>
                <th>SGST Amount</th>
                <th>IGST Amount</th>
                <th>Total Tax</th>
              </tr>
            </thead>
            <tbody>
              {report.hsnSummary.map((item, idx) => (
                <tr key={`${item.hsnCode}_${idx}`}>
                  <td>
                    <strong style={{ color: 'var(--brand-emerald-dark)' }}>{item.hsnCode}</strong>
                  </td>
                  <td>{item.gstRate}%</td>
                  <td>₹{item.taxableAmount.toLocaleString('en-IN')}</td>
                  <td>₹{item.cgstAmount.toLocaleString('en-IN')}</td>
                  <td>₹{item.sgstAmount.toLocaleString('en-IN')}</td>
                  <td>₹{item.igstAmount.toLocaleString('en-IN')}</td>
                  <td>
                    <strong style={{ color: 'var(--brand-emerald-dark)' }}>₹{item.totalTax.toLocaleString('en-IN')}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
