import React from 'react';
import { ShoppingCart, TrendingUp, DollarSign, Award, Users } from 'lucide-react';

interface SalesReportTabProps {
  data: any;
}

export default function SalesReportTab({ data }: SalesReportTabProps) {
  if (!data) return null;
  const { sales, customers } = data;

  return (
    <div>
      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card shadow-2xs rounded-3 p-3 bg-white">
            <div className="d-flex align-items-center gap-3">
              <span className="p-3 bg-primary-subtle text-primary rounded-3">
                <DollarSign size={24} />
              </span>
              <div>
                <span className="text-muted small">Chiffre d'affaires Ventes</span>
                <h4 className="fw-bold text-dark mb-0">{Number(sales.total_revenue || 0).toLocaleString()} $</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-2xs rounded-3 p-3 bg-white">
            <div className="d-flex align-items-center gap-3">
              <span className="p-3 bg-success-subtle text-success rounded-3">
                <ShoppingCart size={24} />
              </span>
              <div>
                <span className="text-muted small">Nombre de commandes</span>
                <h4 className="fw-bold text-dark mb-0">{sales.sales_count || 0}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-2xs rounded-3 p-3 bg-white">
            <div className="d-flex align-items-center gap-3">
              <span className="p-3 bg-info-subtle text-info rounded-3">
                <TrendingUp size={24} />
              </span>
              <div>
                <span className="text-muted small">Panier moyen</span>
                <h4 className="fw-bold text-dark mb-0">{Number(sales.average_ticket || 0).toFixed(2)} $</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products & Top Customers */}
      <div className="row g-3">
        {/* Top Products */}
        <div className="col-lg-7">
          <div className="card shadow-2xs rounded-3 bg-white h-100">
            <div className="card-header bg-white border-bottom p-3 d-flex align-items-center gap-2">
              <Award size={18} className="text-warning" />
              <h6 className="fw-bold mb-0 text-dark">Top Produits les plus vendus</h6>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr style={{ fontSize: '12px' }}>
                      <th className="py-2 text-start">Produit</th>
                      <th className="py-2 text-center">Quantité vendue</th>
                      <th className="py-2 text-end">Total généré</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sales.top_products || []).map((p: any, idx: number) => (
                      <tr key={idx} style={{ fontSize: '13px' }}>
                        <td className="py-2">
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-light text-muted border">{idx + 1}</span>
                            <span className="fw-semibold text-dark">{p.name}</span>
                          </div>
                        </td>
                        <td className="py-2 text-center fw-medium">{p.sales_count}</td>
                        <td className="py-2 text-end fw-bold text-primary">
                          {Number(p.total_revenue).toLocaleString()} $
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className="col-lg-5">
          <div className="card shadow-2xs rounded-3 bg-white h-100">
            <div className="card-header bg-white border-bottom p-3 d-flex align-items-center gap-2">
              <Users size={18} className="text-primary" />
              <h6 className="fw-bold mb-0 text-dark">Meilleurs Clients</h6>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr style={{ fontSize: '12px' }}>
                      <th className="py-2 text-start">Client</th>
                      <th className="py-2 text-center">Achats</th>
                      <th className="py-2 text-end">Total dépensé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(customers.top_customers || []).map((c: any, idx: number) => (
                      <tr key={idx} style={{ fontSize: '13px' }}>
                        <td className="py-2 fw-medium text-dark">{c.name}</td>
                        <td className="py-2 text-center text-muted">{c.orders_count}</td>
                        <td className="py-2 text-end fw-bold text-success">
                          {Number(c.total_spent).toLocaleString()} $
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
