type DashboardSkeletonVariant =
  | 'statistics'
  | 'revenue'
  | 'orders'
  | 'products'
  | 'inventory'
  | 'customers'
  | 'recent-orders'
  | 'stock-alerts'
  | 'top-products';

interface DashboardSkeletonProps {
  variant: DashboardSkeletonVariant;
}

function Shimmer({ width, height, className = '' }: { width: string | number; height: string | number; className?: string }) {
  return <div className={`dashboard-skeleton-shimmer ${className}`} style={{ width, height }} />;
}

function RowSkeleton({ withBadge = false }: { withBadge?: boolean }) {
  return (
    <div className="d-flex align-items-center gap-3">
      <Shimmer width={28} height={28} className="rounded" />
      <Shimmer width="42%" height={10} className="rounded" />
      <Shimmer width="16%" height={10} className="rounded ms-auto" />
      {withBadge && <Shimmer width={64} height={20} className="rounded-pill" />}
    </div>
  );
}

export function DashboardSkeleton({ variant }: DashboardSkeletonProps) {
  if (variant === 'statistics') {
    return (
      <div className="stats-grid" role="status" aria-label="Chargement des statistiques">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="stat-card shadow-sm bg-white">
            <div className="w-100">
              <Shimmer width="65%" height={8} className="rounded mb-2" />
              <Shimmer width="85%" height={15} className="rounded my-3" />
              <Shimmer width="45%" height={8} className="rounded mt-2" />
            </div>
            <Shimmer width={38} height={38} className="rounded-circle flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'revenue') {
    return (
      <div role="status" aria-label="Chargement des revenus">
        <div className="position-relative d-flex align-items-end justify-content-between p-3" style={{ height: 200 }}>
          <Shimmer width="100%" height="85%" className="rounded" />
          <div className="position-absolute top-0 end-0 bg-white border shadow-sm rounded-3 p-3 me-4 mt-2">
            <Shimmer width={62} height={8} className="rounded mb-2" />
            <Shimmer width={86} height={12} className="rounded" />
          </div>
        </div>
        <div className="d-flex justify-content-between mt-2 px-2">
          {Array.from({ length: 5 }, (_, index) => <Shimmer key={index} width={18} height={8} className="rounded" />)}
        </div>
      </div>
    );
  }

  if (variant === 'orders') {
    return (
      <div className="row align-items-center g-4" role="status" aria-label="Chargement des statistiques de vente">
        <div className="col-12 col-md-6 d-flex justify-content-center">
          <Shimmer width={150} height={150} className="rounded-circle" />
        </div>
        <div className="col-12 col-md-6 d-flex flex-column gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="d-flex justify-content-between align-items-center">
              <Shimmer width="55%" height={10} className="rounded" />
              <Shimmer width="28%" height={10} className="rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'customers') {
    return (
      <div className="row g-2" role="status" aria-label="Chargement des indicateurs clients">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="col-6 col-sm-3">
            <div className="d-flex flex-column align-items-center p-2 bg-light rounded-3 h-100">
              <Shimmer width={32} height={32} className="rounded-circle mb-2" />
              <Shimmer width="52%" height={16} className="rounded mb-2" />
              <Shimmer width="75%" height={8} className="rounded mb-2" />
              <Shimmer width="40%" height={8} className="rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'recent-orders') {
    return (
      <div className="table-responsive" role="status" aria-label="Chargement des ventes récentes">
        <table className="table table-borderless align-middle mb-0">
          <thead>
            <tr>
              {Array.from({ length: 5 }, (_, index) => (
                <th key={index}><Shimmer width="75%" height={8} className="rounded mb-2" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }, (_, row) => (
              <tr key={row}>
                {Array.from({ length: 5 }, (_, column) => (
                  <td key={column}><Shimmer width={column === 1 ? '85%' : '68%'} height={10} className="rounded" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (variant === 'stock-alerts') {
    return (
      <div className="row g-3" role="status" aria-label="Chargement des alertes de stock">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="col-6">
            <div className="p-3 border rounded-3 d-flex flex-column justify-content-between h-100">
              <Shimmer width="72%" height={9} className="rounded mb-3" />
              <Shimmer width="40%" height={20} className="rounded mb-2" />
              <Shimmer width="48%" height={8} className="rounded mb-3" />
              <Shimmer width="100%" height={30} className="rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const isInventory = variant === 'inventory';
  const rowCount = isInventory ? 4 : 5;
  return (
    <div className="d-flex flex-column gap-3" role="status" aria-label={isInventory ? 'Chargement des stocks' : 'Chargement des produits'}>
      {Array.from({ length: rowCount }, (_, index) => (
        <RowSkeleton key={index} withBadge={isInventory} />
      ))}
    </div>
  );
}

export type { DashboardSkeletonVariant };
