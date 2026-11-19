import { Loader } from '../../../shared/components/common/Loader';
import React, { useState, useMemo } from "react";
import {
  Eye, Edit, Trash2, AlertTriangle, ShoppingCart, DollarSign, Clock, Calendar, FileText, Download } from "lucide-react";
import { TableToolbar } from "../../../shared/components/common/TableToolbar";
import { Pagination } from "../../../shared/components/common/Pagination";
import { TableActionButton } from "../../../shared/components/common/TableActionButton";
import { useSales } from "../../hooks/sales/useSales";
import { useStoreCurrencyConverter } from "../../hooks/currency/useStoreCurrencyConverter";
import SaleCreate from "./SaleCreate";
import { TruncatedId } from "../../components/common/TruncatedId";
import { useNavigate } from 'react-router-dom';

export default function Sales() {
  const { sales, pagination, loading, error, params, setParams, reFetch } =
    useSales({ page: 1, per_page: 5 });
  const { formatFromUSD } = useStoreCurrencyConverter();
  const navigate = useNavigate();
  
  const [create, setCreate] = useState(false),
    [del, setDel] = useState<any>(null);

  // Gestion des dates "Du" et "Au" pour les filtres
  const [dateFrom, setDateFrom] = useState(params.date_from || "");
  const [dateTo, setDateTo] = useState(params.date_to || "");

  const handleDateFilterChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    setParams((p: any) => ({
      ...p,
      date_from: from || undefined,
      date_to: to || undefined,
      page: 1,
    }));
  };

  // Gestion des exports PDF / Excel
  const handleExportPDF = () => {
    // Exemple : window.open(`/api/sales/export-pdf?${new URLSearchParams(params)}`, '_blank');
    alert("Export PDF en cours...");
  };

  const handleExportExcel = () => {
    // Exemple : window.open(`/api/sales/export-excel?${new URLSearchParams(params)}`, '_blank');
    alert("Export Excel en cours...");
  };

  // Calculs pour les KPIs
  const { totalRevenue, totalPaid, totalRemaining } = useMemo(() => {
    return sales.reduce(
      (acc, item: any) => {
        if (item.status?.toLowerCase() === 'draft') return acc;
        acc.totalRevenue += Number(item.total || 0);
        acc.totalPaid += Number(item.paid_amount || 0);
        acc.totalRemaining += Number(item.remaining_amount || 0);
        return acc;
      },
      { totalRevenue: 0, totalPaid: 0, totalRemaining: 0 }
    );
  }, [sales]);

  // Cartes KPI avec le style coloré cohérent
  const kpiCards = [
    {
      title: "Chiffre d'affaires total",
      value: formatFromUSD(totalRevenue),
      icon: DollarSign,
      color: "#32b978",
      background: "#eaf9f1"
    },
    {
      title: "Total payé",
      value: formatFromUSD(totalPaid),
      icon: ShoppingCart,
      color: "#4188e9",
      background: "#eef5ff"
    },
    {
      title: "Reste à payer",
      value: formatFromUSD(totalRemaining),
      icon: Clock,
      color: "#ef4770",
      background: "#fff0f4"
    }
  ];

  return (
    <div
      className="container-fluid p-3 p-md-4 min-vh-100"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* Header & TableToolbar */}
      <div className="d-flex align-items-center bg-light-subtle p-2 rounded-2 justify-content-between mb-3 gap-2 flex-wrap">
        <h1 className="fw-bold text-dark mb-0 fs-5">Ventes</h1>
        <TableToolbar
          searchValue={params.search || ""}
          onSearchChange={(q) =>
            setParams((p: any) => ({ ...p, search: q || undefined, page: 1 }))
          }
          searchPlaceholder="Rechercher..."
          statusValue={
            params.status === 'completed'
              ? 'completed'
              : params.status === 'draft'
                ? 'draft'
              : params.status === 'cancelled'
                ? 'cancelled'
                : ""
          }
          onStatusChange={(s) =>
            setParams((p: any) => ({
              ...p,
              status: s === '' ? undefined : s,
              page: 1,
            }))
          }
          statusOptions={[
            { value: '', label: 'Tous les statuts' },
            { value: 'completed', label: 'Terminées' },
            { value: 'draft', label: 'Brouillons' },
            { value: 'cancelled', label: 'Annulées' },
          ]}
          perPage={params.per_page || 5}
          onPerPageChange={(n) =>
            setParams((p: any) => ({ ...p, per_page: n, page: 1 }))
          }
          onAddClick={() => setCreate(true)}
          addButtonLabel="Nouveau"
        />
      </div>
   {/* KPI Cards */}
      <div className="row g-3 mb-2">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="col-md-4">
              <div 
                className="card shadow-2xs rounded-3 p-3 bg-white d-flex flex-row align-items-center gap-3"
                style={{ transition: 'transform 0.2s ease' }}
              >
                <div 
                  className="d-flex align-items-center justify-content-center rounded-3" 
                  style={{ width: '48px', height: '48px', background: card.background, color: card.color, flexShrink: 0 }}
                >
                  <Icon size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <span className="text-muted d-block text-truncate" style={{ fontSize: '12px' }}>{card.title}</span>
                  <h4 className="fw-bold text-dark mb-0 fs-5">{card.value}</h4>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barre de Filtres Avancés avec Button Group (Input Group) pour Du / Au */}
      <div className=" border-0 shadow-2xs rounded-3 mb-3">
        <div className="row g-3 align-items-center justify-content-between">
          <div className="col-12 col-md-auto d-flex align-items-center gap-2 flex-wrap">
            {/* Input Group pour la date "Du" */}
            <div className="input-group input-group-sm" style={{ width: "auto" }}>
              <span className="input-group-text bg-light text-muted fw-medium gap-1">
                <Calendar size={14} /> Du
              </span>
              <input
                type="date"
                className="form-control"
                value={dateFrom}
                onChange={(e) => handleDateFilterChange(e.target.value, dateTo)}
              />
            </div>

            {/* Input Group pour la date "Au" */}
            <div className="input-group input-group-sm" style={{ width: "auto" }}>
          <span className="input-group-text bg-light text-muted fw-medium gap-1">
                    <Calendar size={14} /> Au
                </span>
              <input
                type="date"
                className="form-control"
                value={dateTo}
                onChange={(e) => handleDateFilterChange(dateFrom, e.target.value)}
              />
            </div>

            {(dateFrom || dateTo) && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => handleDateFilterChange("", "")}
                style={{ fontSize: "12px" }}
              >
                Réinitialiser les dates
              </button>
            )}
          </div>

          {/* Dropdown d'Export */}
          <div className="col-12 col-md-auto">
            <div className="dropdown">
              <button
                className=" border-1 btn btn-outline-primary btn-sm dropdown-toggle d-flex align-items-center gap-2"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <Download size={14} /> Exporter
              </button>
              <ul className="dropdown-menu dropdown-menu-end border border-light-subtle shadow-sm rounded-2 py-1">
                <li>
                  <button
                    className="dropdown-item d-flex align-items-center gap-2 text-danger"
                    onClick={handleExportPDF}
                  >
                    <FileText size={14} /> Format PDF
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item d-flex align-items-center gap-2 text-success"
                    onClick={handleExportExcel}
                  >
                    <Download size={14} /> Format Excel
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

   
      {error && (
        <div className="alert alert-danger border-0 shadow-2xs d-flex align-items-center gap-2 mb-3 py-2 px-3 rounded-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Table des Ventes */}
      <div className="card border border-light shadow-2xs rounded-3 overflow-hidden bg-white">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr className="border-bottom border-light-subtle bg-light-subtle">
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: "12px" }}>Référence</th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: "12px" }}>Client</th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: "12px" }}>Sous-total</th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: "12px" }}>Remise</th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: "12px" }}>Taxe</th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: "12px" }}>Total</th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: "12px" }}>Payé</th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: "12px" }}>Reste</th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: "12px" }}>Paiement</th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: "12px" }}>Statut</th>
                  <th className="text-end pe-3 py-2 text-muted fw-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="text-center py-4">
                      <Loader height="100px" />
                    </td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-4 text-muted">
                      Aucun élément trouvé.
                    </td>
                  </tr>
                ) : (
                  sales.map((item: any) => (
                    <tr key={item.id} className="border-bottom border-light-subtle">
                      <td className="py-2 text-start" style={{ fontSize: "13px" }}>
                        {item.reference ? <TruncatedId id={item.reference} /> : <span className="text-muted">—</span>}
                      </td>
                      <td className="py-2 text-start" style={{ fontSize: "13px" }}>
                        {item.customer?.name ?? <span className="text-muted">—</span>}
                      </td>
                      <td className="py-2 text-start" style={{ fontSize: "13px" }}>
                        {item.subtotal !== null && item.subtotal !== undefined ? formatFromUSD(item.subtotal) : <span className="text-muted">—</span>}
                      </td>
                      <td className="py-2 text-start" style={{ fontSize: "13px" }}>
                        {item.discount !== null && item.discount !== undefined ? formatFromUSD(item.discount) : <span className="text-muted">—</span>}
                      </td>
                      <td className="py-2 text-start" style={{ fontSize: "13px" }}>
                        {item.tax !== null && item.tax !== undefined ? formatFromUSD(item.tax) : <span className="text-muted">—</span>}
                      </td>
                      <td className="py-2 text-start fw-semibold text-success" style={{ fontSize: "13px" }}>
                        {item.total !== null && item.total !== undefined ? formatFromUSD(item.total) : <span className="text-muted">—</span>}
                      </td>
                      <td className="py-2 text-start" style={{ fontSize: "13px" }}>
                        {item.paid_amount !== null && item.paid_amount !== undefined ? formatFromUSD(item.paid_amount) : <span className="text-muted">—</span>}
                      </td>
                      <td className="py-2 text-start text-danger" style={{ fontSize: "13px" }}>
                        {item.remaining_amount !== null && item.remaining_amount !== undefined ? formatFromUSD(item.remaining_amount) : <span className="text-muted">—</span>}
                      </td>
                      <td className="py-2 text-start" style={{ fontSize: "13px" }}>
                        {item.payment_status ?? <span className="text-muted">—</span>}
                      </td>
                      <td className="py-2 text-start" style={{ fontSize: "13px" }}>
                        {item.status?.toLowerCase() === 'draft' ? (
                          <span className="badge bg-warning-subtle text-warning rounded-pill">Brouillon</span>
                        ) : item.status?.toLowerCase() === 'completed' ? (
                          <span className="badge bg-success-subtle text-success rounded-pill">Enregistrée</span>
                        ) : item.status?.toLowerCase() === 'cancelled' ? (
                          <span className="badge bg-secondary-subtle text-secondary rounded-pill">Annulée</span>
                        ) : (
                          item.status ?? <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="text-end pe-3 py-2">
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <TableActionButton label="Détails" icon={<Eye size={13} />} onClick={() => navigate(`/pos/sales/${item.id}`)} />
                          <TableActionButton label="Modifier" icon={<Edit size={13} />} variant="primary" onClick={() => navigate(`/pos/sales/${item.id}/edit`)} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            meta={pagination}
            loading={loading}
            onPageChange={(p) => setParams((x: any) => ({ ...x, page: p }))}
          />
        </div>
      </div>

      <SaleCreate
        key={create ? 'open' : 'closed'}
        isOpen={create}
        onClose={() => setCreate(false)}
        onSuccess={reFetch}
      />
    </div>
  );
}