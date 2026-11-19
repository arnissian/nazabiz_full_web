import React, { useState } from 'react';
import { DollarSign, ShoppingCart, Package, AlertTriangle, ChevronDown } from 'lucide-react';
import { useDashboard } from '../../hooks/dashboard/useDashboard';
import { useStoreCurrencyConverter } from '../../hooks/currency/useStoreCurrencyConverter';
import { DashboardSkeleton } from './DashboardSkeleton';

interface StatisticsCardsSectionProps {
  storeId?: string;
}

export function StatisticsCardsSection({ storeId }: StatisticsCardsSectionProps) {
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

  const statisticsCards = [
    {
      title: `Chiffre d'affaires ${getFilterLabel().toLowerCase()}`,
      value: formatFromUSD(getFilteredRevenue()),
      yesterday: `Année: ${formatFromUSD(statistics?.year_revenue || 0)}`,
      icon: DollarSign,
      background: "#fff0f3",
      iconBackground: "#f53268"
    },
    { 
      title: `Ventes ${getFilterLabel().toLowerCase()}`, 
      value: getFilteredSalesCount(), 
      yesterday: 'Transactions', 
      icon: ShoppingCart, 
      background: "#eef5ff", 
      iconBackground: "#398be8" 
    },
    { 
      title: "Produits en stock", 
      value: statistics?.total_stocks || 0, 
      yesterday: 'Actifs', 
      icon: Package, 
      background: "#eaf8f0", 
      iconBackground: "#37bc7b" 
    },
    { 
      title: "Alertes de stock", 
      value: (statistics?.low_stock || 0) + (statistics?.out_of_stock || 0), 
      yesterday: `${statistics?.out_of_stock || 0} en rupture`, 
      icon: AlertTriangle, 
      background: "#fff3cd", 
      iconBackground: "#ffc107" 
    },
  ];

  return (
    <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="fw-bold text-dark m-0">Statistiques</h6>
          <button 
            className="btn btn-light btn-sm border text-muted d-flex align-items-center gap-1 small py-1 px-2" 
            onClick={handleFilterChange}
            disabled={loading}
          >
            {getFilterLabel()} <ChevronDown size={12} />
          </button>
        </div>

        {loading ? (
          <DashboardSkeleton variant="statistics" />
        ) : (
          <div className="stats-grid">
            {statisticsCards.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="stat-card" style={{ background: item.background }}>
                  <div>
                    <span className="stat-title">{item.title}</span>
                    <strong className="stat-value">{item.value}</strong>
                    <small className="stat-yesterday">{item.yesterday}</small>
                  </div>
                  <div className="stat-icon" style={{ background: item.iconBackground }}>
                    <Icon size={16} strokeWidth={2} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
  );
}