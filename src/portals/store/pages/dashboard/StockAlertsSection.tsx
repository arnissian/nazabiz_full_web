import React from 'react';
import { useDashboard } from '../../hooks/dashboard/useDashboard';
import { DashboardSkeleton } from './DashboardSkeleton';

interface StockAlertsSectionProps {
  storeId?: string;
}

export function StockAlertsSection({ storeId }: StockAlertsSectionProps) {
  const { statistics, loading: statsLoading } = useDashboard(storeId);

  return (
    <div className="card h-100 border-0 shadow-sm rounded-3 p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-semibold mb-0">Alertes de stock</h5>
      </div>
      {statsLoading ? <DashboardSkeleton variant="stock-alerts" /> : (
        <div className="row g-3">
          <div className="col-6">
            <div className="p-3 border rounded-3 d-flex flex-column justify-content-between h-100">
              <div>
                <span className="text-muted small">Alertes de stock</span>
                <div className="fs-5 fw-bold my-1">{statistics?.low_stock || 0}</div>
                <span className="text-warning fw-semibold" style={{ fontSize: '0.65rem' }}>Stock bas</span>
              </div>
              <svg className="w-100 mt-2" style={{ height: '30px' }} viewBox="0 0 100 30">
                <path d="M0,25 L20,20 L40,22 L60,10 L80,18 L100,5" fill="none" stroke="#ffc107" strokeWidth="2" />
              </svg>
            </div>
          </div>
          <div className="col-6">
            <div className="p-3 border rounded-3 d-flex flex-column justify-content-between h-100">
              <div>
                <span className="text-muted small">Rupture de stock</span>
                <div className="fs-5 fw-bold my-1">{statistics?.out_of_stock || 0}</div>
                <span className="text-danger fw-semibold" style={{ fontSize: '0.65rem' }}>Urgent</span>
              </div>
              <svg className="w-100 mt-2" style={{ height: '30px' }} viewBox="0 0 100 30">
                <path d="M0,15 L20,25 L40,18 L60,28 L80,12 L100,22" fill="none" stroke="#dc3545" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
