import React from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, PieChart, ShieldCheck } from 'lucide-react';

interface FinancialReportTabProps {
  data: any;
}

export default function FinancialReportTab({ data }: FinancialReportTabProps) {
  if (!data) return null;
  const { financial } = data;

  const isProfitable = Number(financial.net_profit || 0) >= 0;

  return (
    <div>
      {/* Net profit card */}
      <div className="card shadow-2xs rounded-3 p-4 bg-white mb-4">
        <div className="row align-items-center">
          <div className="col-md-7">
            <span className="text-muted small fw-semibold text-uppercase">Résultat Net d'Exploitation Estimé</span>
            <div className="d-flex align-items-baseline gap-3 my-2">
              <h2 className={`fw-black mb-0 ${isProfitable ? 'text-success' : 'text-danger'}`}>
                {isProfitable ? '+' : ''}{Number(financial.net_profit || 0).toLocaleString()} $
              </h2>
              <span className={`badge ${isProfitable ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-pill px-3 py-1 fs-6`}>
                {isProfitable ? <ArrowUpRight size={16} className="me-1" /> : <ArrowDownRight size={16} className="me-1" />}
                {Number(financial.profit_margin_pct || 0).toFixed(1)}% marge
              </span>
            </div>
            <p className="text-muted small mb-0">
              Calculé sur la formule : <em>Chiffre d'affaires - Achats marchandises - Dépenses opérationnelles</em>.
            </p>
          </div>

          <div className="col-md-5 mt-3 mt-md-0">
            <div className="bg-light p-3 rounded-3">
              <div className="d-flex justify-content-between mb-2 small">
                <span className="text-muted">Marge brute commerciale :</span>
                <span className="fw-bold text-dark">{Number(financial.gross_margin || 0).toLocaleString()} $</span>
              </div>
              <div className="d-flex justify-content-between small">
                <span className="text-muted">Total charges d'exploitation :</span>
                <span className="fw-bold text-danger">-{Number(financial.expenses || 0).toLocaleString()} $</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="row g-3">
        <div className="col-md-4">
          <div className="card shadow-2xs rounded-3 p-4 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="fw-bold text-dark">1. Chiffre d'affaires</span>
              <span className="badge bg-primary-subtle text-primary">+ Encaissements</span>
            </div>
            <h3 className="fw-bold text-primary mb-1">+{Number(financial.revenue || 0).toLocaleString()} $</h3>
            <p className="text-muted small mb-0">Ventes directes boutique et commandes clients.</p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-2xs rounded-3 p-4 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="fw-bold text-dark">2. Achats Marchandises</span>
              <span className="badge bg-warning-subtle text-warning">- Décaissements</span>
            </div>
            <h3 className="fw-bold text-warning mb-1">-{Number(financial.cogs || 0).toLocaleString()} $</h3>
            <p className="text-muted small mb-0">Factures payées ou engagées auprès des fournisseurs.</p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-2xs rounded-3 p-4 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="fw-bold text-dark">3. Dépenses & Frais</span>
              <span className="badge bg-danger-subtle text-danger">- Charges</span>
            </div>
            <h3 className="fw-bold text-danger mb-1">-{Number(financial.expenses || 0).toLocaleString()} $</h3>
            <p className="text-muted small mb-0">Loyers, factures d'énergie, salaires, fournitures diverses.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
