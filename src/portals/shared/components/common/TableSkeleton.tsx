type TableSkeletonRowsProps = {
  columns: number;
  rows?: number;
};

export function TableSkeletonRows({ columns, rows = 5 }: TableSkeletonRowsProps) {
  return (
    <>
      <tr className="visually-hidden">
        <td colSpan={columns}>
          <span role="status">Chargement des données…</span>
        </td>
      </tr>
      {Array.from({ length: rows }, (_, row) => (
        <tr key={row} aria-hidden="true">
          {Array.from({ length: columns }, (_, column) => (
            <td key={column} className="py-3">
              <div
                className="dashboard-skeleton-shimmer rounded"
                style={{ width: `${55 + ((row + column) % 4) * 10}%`, height: 12 }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

type CardGridSkeletonProps = {
  cards?: number;
};

export function CardGridSkeleton({ cards = 6 }: CardGridSkeletonProps) {
  return (
    <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3" role="status" aria-label="Chargement des cartes">
      {Array.from({ length: cards }, (_, index) => (
        <div className="col" key={index}>
          <div className="card border shadow-2xs rounded-3 p-3 h-100 bg-white">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="dashboard-skeleton-shimmer rounded" style={{ width: 38, height: 38 }} />
              <div className="flex-grow-1">
                <div className="dashboard-skeleton-shimmer rounded mb-2" style={{ width: '62%', height: 12 }} />
                <div className="dashboard-skeleton-shimmer rounded" style={{ width: '38%', height: 9 }} />
              </div>
            </div>
            <div className="dashboard-skeleton-shimmer rounded mb-2" style={{ width: '92%', height: 10 }} />
            <div className="dashboard-skeleton-shimmer rounded mb-3" style={{ width: '70%', height: 10 }} />
            <div className="dashboard-skeleton-shimmer rounded mt-auto" style={{ width: '44%', height: 9 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
