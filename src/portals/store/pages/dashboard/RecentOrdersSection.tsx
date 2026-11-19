import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useRecentSales } from '../../hooks/dashboard/useDashboard';
import { useNavigate } from 'react-router-dom';
import { TruncatedId } from '../../components/common/TruncatedId';
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

interface RecentOrdersSectionProps {
  storeId?: string;
}

export function RecentOrdersSection({ storeId }: RecentOrdersSectionProps) {
  const { sales, loading } = useRecentSales(storeId, 5);
  const { formatFromUSD } = useStoreCurrencyConverter();
  const navigate = useNavigate();

  const recentOrders = loading ? [] : sales.map((sale: any) => ({
    id: sale.reference || `#${sale.id?.slice(0, 8)}`,
    customer: sale.customer?.name || 'Client comptant',
    date: new Date(sale.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
    amount: formatFromUSD(sale.total),
    status: 'Delivered' // Par défaut, à adapter selon le statut réel
  }));

  return (
    <div className="card border-0 shadow-sm rounded-3 p-3">
      <CardHeader title="Recent Orders" showSelect={false} actionText="View All" onActionClick={() => navigate('/pos/sales')} />
      {loading ? (
        <DashboardSkeleton variant="recent-orders" />
      ) : sales.length === 0 ? (
        <div className="text-center py-4 text-muted">Aucune vente récente</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-borderless table-hover align-middle mb-0 small">
            <thead>
              <tr className="border-bottom text-muted" style={{ fontSize: '0.75rem' }}>
                <th className="fw-semibold">Référence</th>
                <th className="fw-semibold">Client</th>
                <th className="fw-semibold">Date</th>
                <th className="fw-semibold">Montant</th>
                <th className="fw-semibold text-end">Statut</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, idx) => (
                <tr key={idx} style={{ cursor: 'pointer' }} onClick={() => navigate(`/pos/sales/${sales[idx]?.id}`)}>
                  <td className="fw-medium"><TruncatedId id={order.id}/></td>
                  <td className="text-secondary">{order.customer}</td>
                  <td className="text-muted" style={{ fontSize: '0.7rem' }}>{order.date}</td>
                  <td className="fw-semibold">{order.amount}</td>
                  <td className="text-end">
                    <span className={`badge rounded-pill bg-success-subtle text-success`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
