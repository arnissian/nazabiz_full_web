export default function TenantDashboardSkeleton() {
  return (
    <div className="container-fluid p-3 p-md-4" role="status" aria-label="Chargement du tableau de bord">
      <div className="dashboard-skeleton-shimmer rounded mb-4" style={{ height: 118 }} />

      <section className="mb-4">
        <div className="dashboard-skeleton-shimmer rounded mb-3" style={{ width: 130, height: 18 }} />
        <div className="row row-cols-2 row-cols-lg-4 g-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="col" key={index}>
              <div className="card border-0 shadow-sm rounded-3 p-3 h-100">
                <div className="dashboard-skeleton-shimmer rounded mb-3" style={{ width: '55%', height: 11 }} />
                <div className="dashboard-skeleton-shimmer rounded mb-2" style={{ width: '72%', height: 23 }} />
                <div className="dashboard-skeleton-shimmer rounded" style={{ width: '88%', height: 9 }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="row g-4 mb-4">
        {Array.from({ length: 2 }, (_, index) => (
          <div className="col-12 col-lg-6" key={index}>
            <section className="card h-100 border-0 shadow-sm rounded-3 p-3">
              <div className="dashboard-skeleton-shimmer rounded mb-3" style={{ width: '58%', height: 15 }} />
              <div className="dashboard-skeleton-shimmer rounded" style={{ height: 190 }} />
            </section>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {Array.from({ length: 2 }, (_, index) => (
          <div className="col-12 col-lg-6" key={index}>
            <section className="card h-100 border-0 shadow-sm rounded-3 p-3">
              <div className="dashboard-skeleton-shimmer rounded mb-3" style={{ width: '48%', height: 15 }} />
              {Array.from({ length: 4 }, (_, row) => (
                <div className="mb-3" key={row}>
                  <div className="dashboard-skeleton-shimmer rounded mb-2" style={{ width: `${80 - row * 8}%`, height: 11 }} />
                  <div className="dashboard-skeleton-shimmer rounded" style={{ height: 7 }} />
                </div>
              ))}
            </section>
          </div>
        ))}
      </div>
    </div>
  );
}
