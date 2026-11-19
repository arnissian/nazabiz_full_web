import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useDashboard } from '../../hooks/dashboard/useDashboard';
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

interface RevenueOverviewSectionProps {
  storeId?: string;
}

export function RevenueOverviewSection({ storeId }: RevenueOverviewSectionProps) {
  const { statistics, loading } = useDashboard(storeId);
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

  const handleFilterChange = () => {
    const periods: Array<'today' | 'week' | 'month' | 'year'> = ['today', 'week', 'month', 'year'];
    const currentIndex = periods.indexOf(filter);
    const nextIndex = (currentIndex + 1) % periods.length;
    setFilter(periods[nextIndex]);
  };

  return (
    <div className="card h-100 border-0 shadow-sm rounded-3 p-3">
      <CardHeader
        title="Revenue Overview"
        showSelect={true}
        filterLabel={getFilterLabel()}
        onFilterChange={handleFilterChange}
      />
      {loading ? (
        <DashboardSkeleton variant="revenue" />
      ) : (
        <>
          <div className="position-relative d-flex align-items-end justify-content-between p-3" style={{ height: '200px' }}>
            <svg className="position-absolute top-0 start-0 w-100 h-100 p-2" viewBox="0 0 400 150" preserveAspectRatio="none">
              <path d="M0,120 Q40,90 80,105 T160,60 T240,80 T320,20 T400,50" fill="none" stroke="#0d6efd" strokeWidth="3" />
              <path d="M0,120 Q40,90 80,105 T160,60 T240,80 T320,20 T400,50 L400,150 L0,150 Z" fill="#0d6efd" opacity="0.1" />
            </svg>
            <div className="position-absolute top-0 end-0 bg-white border shadow-sm rounded-3 p-2 text-center me-4 mt-2">
              <div className="text-muted" style={{ fontSize: '0.65rem' }}>{getFilterLabel()}</div>
              <div className="fw-bold small">{formatFromUSD(getFilteredRevenue())}</div>
            </div>
          </div>
          <div className="d-flex justify-between text-muted small mt-2 px-2" style={{ fontSize: '0.75rem' }}>
            <span>Lu</span>
            <span>Ma</span>
            <span>Me</span>
            <span>Je</span>
            <span>Ve</span>
          </div>
        </>
      )}
    </div>
  );
}
