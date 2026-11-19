import React, { useContext, useState } from 'react';
import {
  Calendar, Printer, RefreshCw,
  TrendingUp, Boxes, DollarSign, ShoppingBag
} from 'lucide-react';
import { useReports } from '../../hooks/reports/useReports';
import { Loader } from '../../../shared/components/common/Loader';
import SalesReportTab from './SalesReportTab';
import StockReportTab from './StockReportTab';
import FinancialReportTab from './FinancialReportTab';
import PurchasesReportTab from './PurchasesReportTab';
import { TenantDocumentHeader } from '../../../shared/components/common/TenantDocumentHeader';
import { AppContext } from '../../../shared/context/AppContext';

export default function Reports() {
  const { activeStore } = useContext(AppContext);
  const [period, setPeriod] = useState('this_month');
  const [activeTab, setActiveTab] = useState<'sales' | 'stocks' | 'financial' | 'purchases'>('sales');

  const { reportData, loading, reFetch } = useReports({
    period,
    store_id: activeStore?.id
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container-fluid p-3 p-md-4 min-vh-100" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <TenantDocumentHeader />
      {/* Top Header */}
      <div className="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap">
        <div>
          <h1 className="fw-bold text-dark mb-0 fs-5">Rapports & Statistiques</h1>
          <div className="text-muted small">Analyse de la performance commerciale et financière</div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Period Filter */}
          <div className="input-group input-group-sm" style={{ width: 'auto' }}>
            <span className="input-group-text bg-white border-end-0 text-muted">
              <Calendar size={13} />
            </span>
            <select
              className="form-select form-select-sm border-start-0"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="today">Aujourd'hui</option>
              <option value="last_7_days">7 derniers jours</option>
              <option value="this_month">Ce mois-ci</option>
              <option value="this_year">Cette année</option>
              <option value="all">Tout l'historique</option>
            </select>
          </div>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            onClick={() => reFetch()}
            title="Actualiser"
          >
            <RefreshCw size={13} />
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            onClick={handlePrint}
          >
            <Printer size={13} /> Imprimer le rapport
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="card shadow-2xs rounded-3 p-1 bg-white mb-4">
        <ul className="nav nav-pills gap-1">
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-2 px-3 fw-medium d-flex align-items-center gap-2 ${
                activeTab === 'sales' ? 'active' : 'text-secondary'
              }`}
              onClick={() => setActiveTab('sales')}
            >
              <TrendingUp size={16} /> Ventes & Clients
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-2 px-3 fw-medium d-flex align-items-center gap-2 ${
                activeTab === 'stocks' ? 'active' : 'text-secondary'
              }`}
              onClick={() => setActiveTab('stocks')}
            >
              <Boxes size={16} /> Stocks & Valorisation
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-2 px-3 fw-medium d-flex align-items-center gap-2 ${
                activeTab === 'financial' ? 'active' : 'text-secondary'
              }`}
              onClick={() => setActiveTab('financial')}
            >
              <DollarSign size={16} /> Bilan Financier & Marge
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-2 px-3 fw-medium d-flex align-items-center gap-2 ${
                activeTab === 'purchases' ? 'active' : 'text-secondary'
              }`}
              onClick={() => setActiveTab('purchases')}
            >
              <ShoppingBag size={16} /> Achats & Fournisseurs
            </button>
          </li>
        </ul>
      </div>

      {/* Content */}
      {loading ? (
        <Loader />
      ) : (
        <div>
          {activeTab === 'sales' && <SalesReportTab data={reportData} />}
          {activeTab === 'stocks' && <StockReportTab data={reportData} />}
          {activeTab === 'financial' && <FinancialReportTab data={reportData} />}
          {activeTab === 'purchases' && <PurchasesReportTab storeId={activeStore?.id || ''} period={period} />}
        </div>
      )}
    </div>
  );
}
