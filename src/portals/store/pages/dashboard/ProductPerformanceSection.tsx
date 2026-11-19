import React from 'react';
import { Package, ChevronDown } from 'lucide-react';
import { useRecentSales } from '../../hooks/dashboard/useDashboard';
import { DashboardSkeleton } from './DashboardSkeleton';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

const CardHeader: React.FC<{ title: string; showSelect?: boolean }> = ({
  title,
  showSelect = true
}) => (
  <div className="d-flex align-items-center justify-content-between mb-3">
    <h6 className="fw-bold text-dark m-0">{title}</h6>
    {showSelect && (
      <button className="btn btn-light btn-sm border text-muted d-flex align-items-center gap-1 small py-1 px-2">
        This Month <ChevronDown size={12} />
      </button>
    )}
  </div>
);

interface ProductPerformanceSectionProps {
  storeId?: string;
}

export function ProductPerformanceSection({ storeId }: ProductPerformanceSectionProps) {
  const { sales, loading } = useRecentSales(storeId, 5);

  const productPerformance = loading ? [] : sales.slice(0, 5).map((sale: any, index: number) => {
    const percentage = 100 - (index * 20); // Calcul fictif pour l'exemple
    return {
      name: `Vente #${index + 1}`, // À adapter si l'API retourne les détails des produits
      icon: <Package size={16} />,
      amount: formatCurrency(sale.total),
      percentage: `${percentage}%`
    };
  });

  return (
    <div className="card h-100 border-0 shadow-sm rounded-3 p-3">
      <CardHeader title="Product Performance" />
      {loading ? (
        <DashboardSkeleton variant="products" />
      ) : productPerformance.length === 0 ? (
        <div className="text-center py-4 text-muted">Aucune donnée de performance</div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {productPerformance.map((item, idx) => (
            <div key={idx} className="d-flex align-items-center justify-content-between small">
              <div className="d-flex align-items-center gap-2" style={{ width: '160px' }}>
                <span className="text-muted">{item.icon}</span>
                <span className="fw-medium text-truncate">{item.name}</span>
              </div>
              <div className="progress flex-grow-1 mx-3" style={{ height: '6px' }}>
                <div className="progress-bar bg-primary" style={{ width: item.percentage }}></div>
              </div>
              <span className="fw-semibold text-end" style={{ width: '60px' }}>{item.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
