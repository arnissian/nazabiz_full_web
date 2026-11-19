import React, { useState } from 'react';
import { ChevronDown, Users } from 'lucide-react';
import { useDashboard } from '../../hooks/dashboard/useDashboard';
import { useRecentSales } from '../../hooks/dashboard/useDashboard';
import { useStoreCurrencyConverter } from '../../hooks/currency/useStoreCurrencyConverter';
import { DashboardSkeleton } from './DashboardSkeleton';

const CardHeader: React.FC<{ title: string; showSelect?: boolean; filterLabel?: string; onFilterChange?: () => void }> = ({
  title,
  showSelect = true,
  filterLabel,
  onFilterChange
}) => (
  <div className="d-flex align-items-center justify-content-between mb-3">
    <h6 className="fw-bold text-dark m-0">{title}</h6>
    {showSelect && (
      <button className="btn btn-light btn-sm border text-muted d-flex align-items-center gap-1 small py-1 px-2" onClick={onFilterChange}>
        {filterLabel || "Ce mois"} <ChevronDown size={12} />
      </button>
    )}
  </div>
);

interface CustomerMetricsSectionProps {
  storeId?: string;
}

export function CustomerMetricsSection({ storeId }: CustomerMetricsSectionProps) {
  const { statistics, loading: statsLoading } = useDashboard(storeId);
  const { sales, loading: salesLoading } = useRecentSales(storeId, 5);
  const { formatFromUSD } = useStoreCurrencyConverter();
  const [filter, setFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');

  const getFilterLabel = () => {
    switch (filter) {
      case 'today': return "Aujourd'hui";
      case 'week': return "Cette semaine";
      case 'month': return "Ce mois";
      case 'year': return "Cette année";
      default: return "Aujourd'hui";
    }
  };

  const getFilteredRevenue = () => {
    switch (filter) {
      case 'today': return statistics?.today_revenue || 0;
      case 'week': return statistics?.week_revenue || 0;
      case 'month': return statistics?.month_revenue || 0;
      case 'year': return statistics?.year_revenue || 0;
      default: return statistics?.today_revenue || 0;
    }
  };

  const getFilteredSalesCount = () => {
    switch (filter) {
      case 'today': return statistics?.today_sales_count || 0;
      case 'week': return statistics?.week_sales_count || 0;
      case 'month': return statistics?.month_sales_count || 0;
      case 'year': return statistics?.year_sales_count || 0;
      default: return statistics?.today_sales_count || 0;
    }
  };

  const handleFilterChange = () => {
    const periods: Array<'today' | 'week' | 'month' | 'year'> = ['today', 'week', 'month', 'year'];
    const currentIndex = periods.indexOf(filter);
    const nextIndex = (currentIndex + 1) % periods.length;
    setFilter(periods[nextIndex]);
  };

  const isLoading = statsLoading || salesLoading;

  return (
    <div className="card h-100 border-0 shadow-sm rounded-3 p-3">
      <CardHeader
        title="Customer Metrics"
        showSelect={true}
        filterLabel={getFilterLabel()}
        onFilterChange={handleFilterChange}
      />
      {isLoading ? <DashboardSkeleton variant="customers" /> : (
        <div className="row g-2">
          {[
            { label: 'Total Clients', val: sales.length || 0, change: 'N/A', bg: 'bg-primary-subtle text-primary' },
            { label: `Clients ${getFilterLabel().toLowerCase()}`, val: getFilteredSalesCount(), change: 'N/A', bg: 'bg-info-subtle text-info' },
            { label: `CA ${getFilterLabel().toLowerCase()}`, val: formatFromUSD(getFilteredRevenue()), change: 'N/A', bg: 'bg-success-subtle text-success' },
            { label: 'Stock actif', val: statistics?.total_stocks || 0, change: 'N/A', bg: 'bg-indigo-subtle text-indigo' }
          ].map((metric, idx) => (
            <div key={idx} className="col-6 col-sm-3 text-center p-2 bg-light rounded-3">
              <div className={`p-2 rounded-circle d-inline-flex mb-1 ${metric.bg}`}>
                <Users size={16} />
              </div>
              <div className="fw-bold fs-6">{metric.val}</div>
              <div className="text-muted" style={{ fontSize: '0.65rem' }}>{metric.label}</div>
              <span className="text-muted fw-semibold" style={{ fontSize: '0.65rem' }}>{metric.change}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
