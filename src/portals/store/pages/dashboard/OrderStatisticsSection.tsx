import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useDashboard } from '../../hooks/dashboard/useDashboard';
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

interface OrderStatisticsSectionProps {
  storeId?: string;
}

export function OrderStatisticsSection({ storeId }: OrderStatisticsSectionProps) {
  const { statistics, loading } = useDashboard(storeId);
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

  return (
    <div className="card h-100 border-0 shadow-sm rounded-3 p-3">
      <CardHeader
        title="Order Statistics"
        showSelect={true}
        filterLabel={getFilterLabel()}
        onFilterChange={handleFilterChange}
      />
      {loading ? <DashboardSkeleton variant="orders" /> : (
        <div className="row align-items-center h-100">
          <div className="col-12 col-md-6 d-flex justify-content-center position-relative">
            <svg className="w-75 h-75" style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 36 36">
              <path className="text-success" strokeWidth="3.8" strokeDasharray="67, 100" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-primary" strokeWidth="3.8" strokeDasharray="16, 100" strokeDashoffset="-67" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-info" strokeWidth="3.8" strokeDasharray="10, 100" strokeDashoffset="-83" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-warning" strokeWidth="3.8" strokeDasharray="6, 100" strokeDashoffset="-93" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="position-absolute top-50 start-50 translate-middle text-center">
              <div className="h5 fw-bold mb-0">{getFilteredSalesCount()}</div>
              <div className="text-muted" style={{ fontSize: '0.65rem' }}>Ventes {getFilterLabel().toLowerCase()}</div>
            </div>
          </div>
          <div className="col-12 col-md-6 d-flex flex-column gap-2 small">
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-muted"><span className="badge bg-success rounded-circle me-2" style={{ padding: '4px' }}> </span>Complétées</span>
              <span className="fw-semibold">{Math.floor((getFilteredSalesCount()) * 0.8)} <span className="text-muted fw-normal">(80%)</span></span>
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-muted"><span className="badge bg-primary rounded-circle me-2" style={{ padding: '4px' }}> </span>En cours</span>
              <span className="fw-semibold">{Math.floor((getFilteredSalesCount()) * 0.15)} <span className="text-muted fw-normal">(15%)</span></span>
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-muted"><span className="badge bg-info rounded-circle me-2" style={{ padding: '4px' }}> </span>En attente</span>
              <span className="fw-semibold">{Math.floor((getFilteredSalesCount()) * 0.05)} <span className="text-muted fw-normal">(5%)</span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
