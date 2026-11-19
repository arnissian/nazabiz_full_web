export function SettingsPageSkeleton() {
  return (
    <div className="container-fluid p-3 p-md-4 min-vh-100" role="status" aria-label="Chargement des paramètres">
      <div className="d-flex align-items-center justify-content-between mb-4 gap-3">
        <div>
          <div className="dashboard-skeleton-shimmer rounded mb-2" style={{ width: 220, height: 22 }} />
          <div className="dashboard-skeleton-shimmer rounded" style={{ width: 320, maxWidth: '80vw', height: 11 }} />
        </div>
        <div className="dashboard-skeleton-shimmer rounded" style={{ width: 110, height: 34 }} />
      </div>
      <div className="card border-0 shadow-sm rounded-3 p-3 p-md-4">
        <div className="row g-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div className="col-12 col-md-6" key={index}>
              <div className="dashboard-skeleton-shimmer rounded mb-2" style={{ width: `${36 + (index % 3) * 12}%`, height: 11 }} />
              <div className="dashboard-skeleton-shimmer rounded" style={{ height: 38 }} />
            </div>
          ))}
          <div className="col-12">
            <div className="dashboard-skeleton-shimmer rounded" style={{ height: 110 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
