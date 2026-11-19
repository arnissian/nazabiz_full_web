import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  DollarSign,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import axiosInstance from '../../shared/services/api/axiosInterceptor';
import { useTenantCurrencyConverter } from '../hooks/currency/useTenantCurrencyConverter';
import TenantDashboardSkeleton from './TenantDashboardSkeleton';

type Period = 'today' | 'week' | 'month' | 'year';

const periods: Array<{ value: Period; label: string }> = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
  { value: 'year', label: 'Cette année' },
];

interface StoreOverview {
  id: string;
  name: string;
  code: string | null;
  month_revenue: number;
  month_sales_count: number;
  period_revenue: number;
  period_sales_count: number;
  previous_period_revenue: number;
  revenue_change_percent: number | null;
  stock_cost_value: number;
  stock_count: number;
  out_of_stock: number;
  low_stock: number;
  supplier_debt: number;
}

interface SalesChartPoint {
  label: string;
  revenue: number;
  sales_count: number;
}

interface RankingItem {
  id: string;
  name: string;
  quantity_sold: number;
  revenue: number;
}

interface TenantOverview {
  tenant_id: string;
  period: Period;
  selected_store_id: string | null;
  available_stores: Array<Pick<StoreOverview, 'id' | 'name' | 'code'>>;
  store_count: number;
  product_count: number;
  today_revenue: number;
  week_revenue: number;
  month_revenue: number;
  year_revenue: number;
  today_sales_count: number;
  week_sales_count: number;
  month_sales_count: number;
  year_sales_count: number;
  period_revenue: number;
  period_sales_count: number;
  previous_period_revenue: number;
  previous_period_sales_count: number;
  revenue_change_percent: number | null;
  average_basket: number;
  sales_chart: SalesChartPoint[];
  active_stocks: number;
  stock_cost_value: number;
  out_of_stock: number;
  low_stock: number;
  supplier_debt: number;
  top_products: RankingItem[];
  top_categories: RankingItem[];
  stores: StoreOverview[];
}

export default function TenantDashboard() {
  const [overview, setOverview] = useState<TenantOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('today');
  const [storeId, setStoreId] = useState('all');
  const { formatFromUSD, error: currencyError } = useTenantCurrencyConverter();
  const formatChange = (change: number | null) => change === null
    ? 'Pas de période de comparaison'
    : `${change > 0 ? '+' : ''}${change.toFixed(1)} % vs période précédente`;

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/dashboard/tenant', {
        params: { period, ...(storeId === 'all' ? {} : { store_id: storeId }) },
      });
      setOverview(response.data?.data || null);
    } catch (loadError: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(loadError)
        ? loadError.response?.data?.message
        : null;
      setError(message || 'Impossible de charger le tableau de bord de l’entreprise.');
    } finally {
      setLoading(false);
    }
  }, [period, storeId]);

  useEffect(() => {
    // Load the company-wide view independently from the active-store dashboard.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOverview();
  }, [loadOverview]);

  if (loading && !overview) return <TenantDashboardSkeleton />;

  const periodLabel = periods.find(item => item.value === period)?.label ?? periods[0].label;
  const cards = overview ? [
    {
      title: `Chiffre d’affaires ${periodLabel.toLowerCase()}`,
      value: formatFromUSD(overview.period_revenue),
      detail: formatChange(overview.revenue_change_percent),
      icon: DollarSign,
      background: '#fff0f3',
      iconBackground: '#f53268',
    },
    {
      title: `Ventes ${periodLabel.toLowerCase()}`,
      value: overview.period_sales_count,
      detail: `${overview.previous_period_sales_count} période précédente`,
      icon: ShoppingCart,
      background: '#eef5ff',
      iconBackground: '#398be8',
    },
    {
      title: 'Produits en stock',
      value: overview.active_stocks,
      detail: `Valeur : ${formatFromUSD(overview.stock_cost_value)} · Alertes : ${overview.low_stock + overview.out_of_stock} (${overview.out_of_stock} ruptures)`,
      icon: Package,
      background: '#eaf8f0',
      iconBackground: '#37bc7b',
    },
    {
      title: 'Panier moyen',
      value: formatFromUSD(overview.average_basket),
      detail: 'Chiffre d’affaires / ventes',
      icon: TrendingUp,
      background: '#f2efff',
      iconBackground: '#8061d8',
    },
  ] : [];

  const chartPoints = overview?.sales_chart ?? [];
  const chartMax = Math.max(...chartPoints.map(point => point.revenue), 0);
  const chartCoordinates = chartPoints.map((point, index) => {
    const x = chartPoints.length <= 1 ? 200 : (index / (chartPoints.length - 1)) * 400;
    const y = 130 - (point.revenue / (chartMax || 1)) * 110;
    return `${x},${y}`;
  });
  const chartLine = chartCoordinates.join(' ');
  const chartArea = chartCoordinates.length
    ? `0,150 ${chartLine} 400,150`
    : '';
  const maxStoreRevenue = Math.max(...(overview?.stores.map(store => store.period_revenue) ?? []), 0);
  const selectedStoreName = overview?.available_stores.find(store => store.id === storeId)?.name;

  return (
    <div className="container-fluid p-3 p-md-4 min-vh-100">

      
      <div className="d-flex align-items-center justify-content-between mb-4 gap-2 flex-wrap">
        <div>
          <h1 className="fw-bold text-dark mb-0 fs-5 d-flex align-items-center gap-2">
            <Building2 size={20} className="text-primary" /> Dashboard entreprise
          </h1>
          <div className="text-muted small">
            {storeId === 'all'
              ? 'Vue consolidée de tous les magasins de votre entreprise.'
              : `Vue du magasin ${selectedStoreName || ''}.`}
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <label className="visually-hidden" htmlFor="tenant-dashboard-store">Magasin</label>
          <div className="position-relative">
            <select
              id="tenant-dashboard-store"
              className="form-select form-select-sm pe-4"
              value={storeId}
              onChange={event => setStoreId(event.target.value)}
              disabled={loading}
            >
              <option value="all">Tous les magasins</option>
              {(overview?.available_stores ?? []).map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
            <ChevronDown size={13} className="position-absolute top-50 end-0 translate-middle-y me-2 text-muted pe-none" />
          </div>
          <label className="visually-hidden" htmlFor="tenant-dashboard-period">Période des statistiques</label>
          <div className="position-relative">
            <select
              id="tenant-dashboard-period"
              className="form-select form-select-sm pe-4"
              value={period}
              onChange={event => setPeriod(event.target.value as Period)}
              disabled={loading}
            >
              {periods.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <ChevronDown size={13} className="position-absolute top-50 end-0 translate-middle-y me-2 text-muted pe-none" />
          </div>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => void loadOverview()} disabled={loading} aria-label="Actualiser">
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {currencyError && <div className="alert alert-warning" role="alert">{currencyError}</div>}

      {overview && (
        <>
          <section className="welcome tenant-welcome mb-4">
            <div className="tenant-welcome-heading">
              <h2 className="welcome-h1">Bienvenue sur votre dashboard entreprise</h2>
              <p className="welcome-p light">
                {storeId === 'all' ? 'Chiffre d’affaires par magasin' : `Chiffre d’affaires — ${selectedStoreName || ''}`} · {periodLabel.toLowerCase()}
              </p>
            </div>
            <div className="steps-grid">
              {overview.stores.map((store, index) => (
                <div
                  className={`step-card tenant-store-card ${['step-pink', 'step-blue', 'step-purple'][index % 3]}`}
                  key={store.id}
                >
                  <div className="step-number">{String(index + 1).padStart(2, '0')}</div>
                  <strong className="step-strong" title={store.name}>{store.name}</strong>
                  <span className="step-text">
                    CA : {formatFromUSD(store.period_revenue)} · {store.period_sales_count} ventes · {formatChange(store.revenue_change_percent)}
                  </span>
                </div>
              ))}
              {overview.stores.length === 0 && (
                <p className="welcome-p light mb-0">Aucun magasin actif dans votre entreprise.</p>
              )}
            </div>
          </section>

          <section className="mb-4">
            <h2 className="h6 fw-bold text-dark mb-3">Statistiques</h2>
            <div className="stats-grid tenant-stats-grid">
              {cards.map(card => {
                const Icon = card.icon;
                return (
                  <div className="stat-card" key={card.title} style={{ background: card.background }}>
                    <div>
                      <span className="stat-title">{card.title}</span>
                      <strong className="stat-value">{card.value}</strong>
                      <small className="stat-yesterday">{card.detail}</small>
                    </div>
                    <div className="stat-icon" style={{ background: card.iconBackground }}>
                      <Icon size={16} strokeWidth={2} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="row g-4 mb-4">
            <div className="col-12 col-lg-6">
              <section className="card h-100 border-0 shadow-sm rounded-3 p-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h2 className="h6 fw-bold text-dark m-0">Évolution du chiffre d’affaires</h2>
                  <span className="small text-muted">{periodLabel}</span>
                </div>
                {chartMax > 0 ? (
                  <>
                    <div className="position-relative w-100" style={{ height: 190 }}>
                      <svg className="w-100 h-100" viewBox="0 0 400 150" preserveAspectRatio="none" role="img" aria-label={`Évolution des ventes ${periodLabel.toLowerCase()}`}>
                        {[30, 70, 110].map(y => <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#edf0f3" strokeWidth="1" />)}
                        <polygon points={chartArea} fill="#0d6efd" opacity="0.1" />
                        <polyline points={chartLine} fill="none" stroke="#0d6efd" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="d-flex justify-content-between small text-muted">
                      <span>{chartPoints[0]?.label}</span>
                      {chartPoints.length > 2 && <span>{chartPoints[Math.floor((chartPoints.length - 1) / 2)]?.label}</span>}
                      <span>{chartPoints[chartPoints.length - 1]?.label}</span>
                    </div>
                  </>
                ) : (
                  <div className="d-flex align-items-center justify-content-center text-muted small" style={{ height: 190 }}>
                    Aucune vente sur cette période.
                  </div>
                )}
              </section>
            </div>
            <div className="col-12 col-lg-6">
              <section className="card h-100 border-0 shadow-sm rounded-3 p-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h2 className="h6 fw-bold text-dark m-0">Ventes par magasin</h2>
                  <span className="small text-muted">{periodLabel}</span>
                </div>
                {overview.stores.some(store => store.period_revenue > 0) ? (
                  <div className="d-flex flex-column gap-3 py-2">
                    {overview.stores.map(store => (
                      <div key={store.id}>
                        <div className="d-flex justify-content-between align-items-center gap-2 small mb-1">
                          <span className="text-truncate fw-medium">{store.name}</span>
                          <span className="fw-semibold text-nowrap">{formatFromUSD(store.period_revenue)}</span>
                        </div>
                        <div className="progress" style={{ height: 7 }}>
                          <div
                            className="progress-bar bg-primary"
                            role="progressbar"
                            style={{ width: `${maxStoreRevenue ? (store.period_revenue / maxStoreRevenue) * 100 : 0}%` }}
                            aria-label={`${store.name}: ${formatFromUSD(store.period_revenue)}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="d-flex align-items-center justify-content-center text-muted small" style={{ minHeight: 190 }}>
                    Aucune vente sur cette période.
                  </div>
                )}
              </section>
            </div>
          </div>

          <div className="row g-4 mb-4">
            {[
              { title: 'Meilleurs produits', items: overview.top_products },
              { title: 'Meilleures catégories', items: overview.top_categories },
            ].map(section => (
              <div className="col-12 col-lg-6" key={section.title}>
                <section className="card h-100 border-0 shadow-sm rounded-3 p-3">
                  <h2 className="h6 fw-bold text-dark mb-3">{section.title} — {periodLabel.toLowerCase()}</h2>
                  {section.items.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                      {section.items.map((item, index) => {
                        const maxRevenue = Math.max(...section.items.map(entry => entry.revenue), 0);
                        return (
                          <div key={item.id}>
                            <div className="d-flex align-items-center justify-content-between gap-2 small mb-1">
                              <span className="text-truncate">
                                <span className="text-muted me-2">{index + 1}.</span>{item.name}
                              </span>
                              <span className="text-nowrap text-end">
                                <strong>{formatFromUSD(item.revenue)}</strong>
                                <span className="text-muted ms-2">{item.quantity_sold} vendus</span>
                              </span>
                            </div>
                            <div className="progress" style={{ height: 5 }}>
                              <div
                                className="progress-bar bg-primary"
                                role="progressbar"
                                style={{ width: `${maxRevenue ? (item.revenue / maxRevenue) * 100 : 0}%` }}
                                aria-label={`${item.name}: ${formatFromUSD(item.revenue)}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="d-flex align-items-center justify-content-center text-muted small flex-grow-1">
                      Aucune vente sur cette période.
                    </div>
                  )}
                </section>
              </div>
            ))}
          </div>

          <section className="card border-0 shadow-sm rounded-3 p-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <div>
                <h2 className="h6 fw-bold mb-1">Performance par magasin</h2>
                <div className="small text-muted">Ventes de la période, niveau de stock et dettes fournisseurs.</div>
              </div>
              <div className="small text-warning d-flex align-items-center gap-1">
                <AlertTriangle size={14} />
                {overview.low_stock + overview.out_of_stock} alertes de stock
              </div>
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Rang</th>
                    <th>Magasin</th>
                    <th className="text-end">Ventes</th>
                    <th className="text-end">Chiffre d’affaires</th>
                    <th className="text-end">Évolution</th>
                    <th className="text-end">Stocks actifs</th>
                    <th className="text-end">Valeur du stock</th>
                    <th className="text-end">Alertes stock</th>
                    <th className="text-end">Dette fournisseur</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.stores.map((store, index) => (
                    <tr key={store.id}>
                      <td className="text-muted fw-semibold">#{index + 1}</td>
                      <td>
                        <div className="fw-semibold">{store.name}</div>
                        {store.code && <div className="small text-muted">{store.code}</div>}
                      </td>
                      <td className="text-end">{store.period_sales_count}</td>
                      <td className="text-end fw-semibold">{formatFromUSD(store.period_revenue)}</td>
                      <td className={`text-end ${store.revenue_change_percent !== null && store.revenue_change_percent < 0 ? 'text-danger' : 'text-success'}`}>
                        {store.revenue_change_percent === null ? '—' : `${store.revenue_change_percent > 0 ? '+' : ''}${store.revenue_change_percent.toFixed(1)} %`}
                      </td>
                      <td className="text-end">{store.stock_count}</td>
                      <td className="text-end">{formatFromUSD(store.stock_cost_value)}</td>
                      <td className="text-end">
                        <span className={store.out_of_stock + store.low_stock > 0 ? 'text-warning fw-semibold' : ''}>
                          {store.out_of_stock + store.low_stock}
                        </span>
                      </td>
                      <td className="text-end">{formatFromUSD(store.supplier_debt)}</td>
                    </tr>
                  ))}
                  {overview.stores.length === 0 && (
                    <tr><td colSpan={9} className="text-center text-muted py-4">Aucun magasin actif trouvé.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
