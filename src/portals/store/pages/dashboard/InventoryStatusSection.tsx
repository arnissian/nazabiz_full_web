import React from 'react';
import { Package, ChevronDown } from 'lucide-react';
import { useLowStock } from '../../hooks/dashboard/useDashboard';
import { useNavigate } from 'react-router-dom';
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

interface InventoryStatusSectionProps {
  storeId?: string;
}

export function InventoryStatusSection({ storeId }: InventoryStatusSectionProps) {
  const { stocks, loading } = useLowStock(storeId, 5);
  const navigate = useNavigate();

  const inventoryItems = loading ? [] : stocks.map((stock: any) => ({
    name: stock.product?.name || 'Produit inconnu',
    count: stock.quantity,
    status: stock.quantity <= 0 ? 'Out of Stock' : 
           stock.quantity <= stock.minimum_stock ? 'Low Stock' : 'In Stock',
    icon: <Package size={16} />
  }));

  return (
    <div className="card h-100 border-0 shadow-sm rounded-3 p-3">
      <CardHeader title="Inventory Status" showSelect={false} actionText="View All" onActionClick={() => navigate('/pos/stocks')} />
      {loading ? (
        <DashboardSkeleton variant="inventory" />
      ) : inventoryItems.length === 0 ? (
        <div className="text-center py-4 text-muted">Aucune alerte de stock</div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {inventoryItems.map((item, idx) => (
            <div key={idx} className="d-flex align-items-center justify-content-between small">
              <div className="d-flex align-items-center gap-2">
                <div className="p-1 bg-light rounded text-muted">{item.icon}</div>
                <span className="fw-medium">{item.name}</span>
              </div>
              <div className="d-flex align-items-center gap-4">
                <span className="text-muted">{item.count}</span>
                <span className={`badge rounded-pill px-3 py-1 ${
                  item.status === 'In Stock' ? 'bg-success-subtle text-success' :
                  item.status === 'Low Stock' ? 'bg-warning-subtle text-warning' : 'bg-danger-subtle text-danger'
                }`} style={{ width: '90px' }}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
