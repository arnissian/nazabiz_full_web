import React from 'react';
import { Package, ChevronDown } from 'lucide-react';
import { useRecentSales } from '../../hooks/dashboard/useDashboard';
import { useNavigate } from 'react-router-dom';
import { useStoreCurrencyConverter } from '../../hooks/currency/useStoreCurrencyConverter';
import { DashboardSkeleton } from './DashboardSkeleton';

const CardHeader: React.FC<{ title: string; showSelect?: boolean; actionText?: string; onActionClick?: () => void }> = ({
  title,
  showSelect = true,
  actionText,
  onActionClick
}) => (
  <div className="d-flex align-items-center justify-content-between mb-3">
    <h6 className="fw-bold text-dark m-0">{title}</h6>
    {showSelect && (
      <button className="btn btn-light btn-sm border text-muted d-flex align-items-center gap-1 small py-1 px-2">
        This Month <ChevronDown size={12} />
      </button>
    )}
    {actionText && (
      <button className="btn btn-link text-muted text-decoration-none p-0 small fw-medium" onClick={onActionClick}>{actionText}</button>
    )}
  </div>
);

interface TopProductsSectionProps {
  storeId?: string;
}

export function TopProductsSection({ storeId }: TopProductsSectionProps) {
  const { sales, loading } = useRecentSales(storeId, 5);
  const { formatFromUSD } = useStoreCurrencyConverter();
  const navigate = useNavigate();

  const topProducts = loading ? [] : sales.slice(0, 5).map((sale: any, index: number) => ({
    id: index + 1,
    name: 'Produit de la vente', // À adapter si l'API retourne les détails des produits
    sales: formatFromUSD(sale.total),
    units: '1 unité', // À adapter si l'API retourne les quantités
    icon: <Package size={16} />
  }));

  return (
    <div className="card border-0 shadow-sm rounded-3 p-3">
      <CardHeader title="Top Products" showSelect={false} actionText="View All" onActionClick={() => navigate('/pos/stocks')} />
      {loading ? (
        <DashboardSkeleton variant="top-products" />
      ) : topProducts.length === 0 ? (
        <div className="text-center py-4 text-muted">Aucun produit</div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {topProducts.map((prod) => (
            <div key={prod.id} className="d-flex align-items-center justify-content-between small">
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted" style={{ width: '12px' }}>{prod.id}</span>
                <div className="p-1 bg-light rounded text-muted">{prod.icon}</div>
                <span className="fw-medium">{prod.name}</span>
              </div>
              <div className="d-flex align-items-center gap-4">
                <span className="fw-semibold">{prod.sales}</span>
                <span className="text-muted" style={{ width: '60px', textAlign: 'right', fontSize: '0.75rem' }}>{prod.units}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
