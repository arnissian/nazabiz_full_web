export default function TenantSubscriptionSkeleton() {
  return (
    <div className="row g-4" role="status" aria-label="Chargement de l’abonnement">
      <div className="col-lg-4">
        <div className="card shadow-sm rounded-3 mb-4 bg-white overflow-hidden">
          <div className="p-4 border-bottom">
            <div className="dashboard-skeleton-shimmer rounded mb-3" style={{ width: '35%', height: 12 }} />
            <div className="dashboard-skeleton-shimmer rounded mb-4" style={{ width: '58%', height: 22 }} />
            {Array.from({ length: 4 }, (_, index) => (
              <div className="d-flex justify-content-between gap-3 py-2 border-bottom" key={index}>
                <div className="dashboard-skeleton-shimmer rounded" style={{ width: '40%', height: 11 }} />
                <div className="dashboard-skeleton-shimmer rounded" style={{ width: '30%', height: 11 }} />
              </div>
            ))}
          </div>
        </div>
        <div className="card shadow-sm rounded-3 p-4 bg-white">
          <div className="dashboard-skeleton-shimmer rounded mb-3" style={{ width: '52%', height: 16 }} />
          <div className="dashboard-skeleton-shimmer rounded mb-2" style={{ width: '88%', height: 11 }} />
          <div className="dashboard-skeleton-shimmer rounded" style={{ width: '66%', height: 11 }} />
        </div>
      </div>
      <div className="col-lg-8">
        <div className="dashboard-skeleton-shimmer rounded mb-3" style={{ width: 150, height: 19 }} />
        <div className="row g-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div className="col-12 col-md-6" key={index}>
              <div className="card shadow-sm rounded-3 p-4 h-100 bg-white">
                <div className="dashboard-skeleton-shimmer rounded mb-3" style={{ width: '55%', height: 17 }} />
                <div className="dashboard-skeleton-shimmer rounded mb-2" style={{ width: '40%', height: 24 }} />
                <div className="dashboard-skeleton-shimmer rounded mb-4" style={{ width: '75%', height: 11 }} />
                {Array.from({ length: 3 }, (_, row) => (
                  <div className="dashboard-skeleton-shimmer rounded mb-2" key={row} style={{ width: `${70 + row * 7}%`, height: 10 }} />
                ))}
                <div className="dashboard-skeleton-shimmer rounded mt-3" style={{ height: 36 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
