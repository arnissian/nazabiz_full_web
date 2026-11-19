import React from 'react';
import {
  Package,
  Receipt,
  AlertTriangle,
  ShoppingCart,

} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../shared/context/AppContext';
import { StatisticsCardsSection } from './dashboard/StatisticsCardsSection';
import { RevenueOverviewSection } from './dashboard/RevenueOverviewSection';
import { OrderStatisticsSection } from './dashboard/OrderStatisticsSection';
import { CustomerMetricsSection } from './dashboard/CustomerMetricsSection';
import { ProductPerformanceSection } from './dashboard/ProductPerformanceSection';
import { InventoryStatusSection } from './dashboard/InventoryStatusSection';
import { RecentOrdersSection } from './dashboard/RecentOrdersSection';
import { TopProductsSection } from './dashboard/TopProductsSection';
import { StockAlertsSection } from './dashboard/StockAlertsSection';

export default function Dashboard() {
  const navigate = useNavigate();
  const { activeStore,auth } = React.useContext(AppContext);
  const storeId = activeStore?.id;

  // Utiliser le contexte ou un hook pour accéder au thème si nécessaire
  const isDarkScheme = false; // À remplacer par votre contexte

  const operations = [
    { title: "Caisse POS", description: "Traitement rapide des ventes", icon: Receipt, color: "#ef4770", background: "#fff0f4", onClick: () => navigate('/pos') },
    { title: "Nouveau Stock", description: "Ajouter des produits au stock", icon: Package, color: "#32b978", background: "#eaf9f1", onClick: () => navigate('/pos/stocks') },
    { title: "Ajustement Stock", description: "Gérer les pertes et casse", icon: AlertTriangle, color: "#ef4770", background: "#fff0f4", onClick: () => navigate('/pos/stock-movements?adjustment=true') },
    { title: "Nouvelle Vente", description: "Créer une nouvelle vente", icon: ShoppingCart, color: "#4188e9", background: "#eef5ff", onClick: () => navigate('/pos/sales') },
  ];

  return (
    <>
    {/* <pre>{JSON.stringify(auth, null, 2)}</pre> */}
      {/* Welcome */}
      <section className={`welcome ${isDarkScheme ? "dark-theme" : ""} mb-2`}>
        <div>
          <h1 className="welcome-h1">Bienvenue sur votre dashboard</h1>
          <p className={`welcome-p ${isDarkScheme ? "dark" : "light"}`}>Magasin actif : {activeStore?.name || 'Aucun magasin actif'}</p>
        </div>
        <div className="steps-grid">
          <div className="step-card step-pink">
            <div className="step-number">01</div>
            <strong className="step-strong">1.Gérer le stock</strong>
            <span className="step-text">Ajouter et configurer vos produits</span>
          </div>
          <div className="step-card step-blue">
            <div className="step-number">02</div>
            <strong className="step-strong">2.Vendre en caisse</strong>
            <span className="step-text">Utiliser le POS pour les ventes</span>
          </div>
          <div className="step-card step-purple">
            <div className="step-number">03</div>
            <strong className="step-strong">3.Suivre les indicateurs</strong>
            <span className="step-text">Analyser vos performances</span>
          </div>
        </div>
      </section>

      {/* Today's Data */}
      <StatisticsCardsSection storeId={storeId} />

      {/* 2. Ligne 2 : Revenue & Order Statistics */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <RevenueOverviewSection storeId={storeId} />
        </div>
        <div className="col-12 col-lg-6">
          <OrderStatisticsSection storeId={storeId} />
        </div>
      </div>

      {/* 3. Ligne 3 : Product Performance & Inventory Status */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <ProductPerformanceSection storeId={storeId} />
        </div>
        <div className="col-12 col-lg-6">
          <InventoryStatusSection storeId={storeId} />
        </div>
      </div>

      {/* 4. Ligne 4 : Customer Metrics & Stock Alerts */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <CustomerMetricsSection storeId={storeId} />
        </div>
        <div className="col-12 col-lg-6">
          <StockAlertsSection storeId={storeId} />
        </div>
      </div>

      {/* 5. Ligne 5 : Recent Orders & Top Products */}
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <RecentOrdersSection storeId={storeId} />
        </div>
        <div className="col-12 col-lg-6">
          <TopProductsSection storeId={storeId} />
        </div>
      </div>

      {/* Common Operations */}
      <section className="section">
        <div className="section-header">
          <h2 className={`section-title ${isDarkScheme ? "dark" : "light"}`}>Opérations rapides</h2>
        </div>
        <div className="operations-grid">
          {operations.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className={`operation-card ${isDarkScheme ? "dark-theme" : ""}`} onClick={item.onClick} style={{ cursor: 'pointer' }}>
                <div className="operation-icon" style={{ background: item.background, color: item.color }}>
                  <Icon size={16} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <span className={`operation-title ${isDarkScheme ? "dark" : "light"}`}>{item.title}</span>
                  <span className={`operation-desc ${isDarkScheme ? "dark" : "light"}`}>{item.description}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
