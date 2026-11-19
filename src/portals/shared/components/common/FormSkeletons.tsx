type OptionSkeletonProps = {
  rows?: number;
  variant?: 'chips' | 'rows';
  label: string;
};

export function OptionSkeleton({ rows = 4, variant = 'chips', label }: OptionSkeletonProps) {
  return (
    <div role="status" aria-label={label}>
      {variant === 'chips' ? (
        <div className="d-flex flex-wrap gap-2">
          {Array.from({ length: rows }, (_, index) => (
            <div className="dashboard-skeleton-shimmer rounded border" key={index} style={{ width: 82 + (index % 2) * 28, height: 31 }} />
          ))}
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {Array.from({ length: rows }, (_, index) => (
            <div className="d-flex align-items-center gap-2" key={index}>
              <div className="dashboard-skeleton-shimmer rounded" style={{ width: 16, height: 16 }} />
              <div className="dashboard-skeleton-shimmer rounded" style={{ width: `${45 + (index % 3) * 13}%`, height: 12 }} />
              <div className="dashboard-skeleton-shimmer rounded ms-auto" style={{ width: 48, height: 12 }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SelectFieldSkeleton({ label }: { label: string }) {
  return (
    <div className="dashboard-skeleton-shimmer rounded" role="status" aria-label={label} style={{ height: 38 }} />
  );
}
