import React from 'react';
import { Boxes, AlertTriangle, XCircle, TrendingUp, DollarSign } from 'lucide-react';

interface StockReportTabProps {
  data: any;
}

export default function StockReportTab({ data }: StockReportTabProps) {
  if (!data) return null;
  const { stocks } = data;

  return (
    <div>
      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card shadow-2xs rounded-3 p-3 bg-white">
            <div className="d-flex align-items-center gap-3">
              <span className="p-3 bg-secondary-subtle text-secondary rounded-3">
                <Boxes size={24} />
              </span>
              <div>
                <span className="text-muted small">Articles référencés</span>
                <h4 className="fw-bold text-dark mb-0">{stocks.total_items}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-2xs rounded-3 p-3 bg-white">
            <div className="d-flex align-items-center gap-3">
              <span className="p-3 bg-primary-subtle text-primary rounded-3">
                <DollarSign size={24} />
              </span>
              <div>
                <span className="text-muted small">Valeur au coût d'achat</span>
                <h4 className="fw-bold text-dark mb-0">{Number(stocks.stock_cost_value).toLocaleString()} $</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-2xs rounded-3 p-3 bg-white">
            <div className="d-flex align-items-center gap-3">
              <span className="p-3 bg-success-subtle text-success rounded-3">
                <TrendingUp size={24} />
              </span>
              <div>
                <span className="text-muted small">Valeur de vente estimée</span>
                <h4 className="fw-bold text-success mb-0">{Number(stocks.stock_selling_value).toLocaleString()} $</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-2xs rounded-3 p-3 bg-white">
            <div className="d-flex align-items-center gap-3">
              <span className="p-3 bg-warning-subtle text-warning rounded-3">
                <AlertTriangle size={24} />
              </span>
              <div>
                <span className="text-muted small">Marge potentielle stock</span>
                <h4 className="fw-bold text-dark mb-0">+{Number(stocks.potential_margin).toLocaleString()} $</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Alerts Overview */}
      <div className="row g-3">
        <div className="col-md-6">
          <div className="card shadow-2xs rounded-3 bg-white p-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <AlertTriangle size={20} className="text-warning" />
              <h6 className="fw-bold mb-0 text-dark">Articles à stock faible (Alerte réapprovisionnement)</h6>
            </div>
            <div className="p-3 bg-warning-subtle rounded-3 d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-bold text-warning fs-5">{stocks.low_stock_count} produits</div>
                <div className="text-muted small">Quantité en dessous du seuil d'alerte configuré</div>
              </div>
              <span className="badge bg-warning text-dark px-3 py-2 rounded-pill">À commander</span>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-2xs rounded-3 bg-white p-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <XCircle size={20} className="text-danger" />
              <h6 className="fw-bold mb-0 text-dark">Articles en rupture de stock</h6>
            </div>
            <div className="p-3 bg-danger-subtle rounded-3 d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-bold text-danger fs-5">{stocks.out_of_stock_count} produits</div>
                <div className="text-muted small">Quantité disponible = 0 en magasin</div>
              </div>
              <span className="badge bg-danger px-3 py-2 rounded-pill">Rupture totale</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
