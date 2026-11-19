import React from 'react';
import { useReceivables } from '../../hooks/reports/useReceivables';
import { useStoreCurrencyConverter } from '../../hooks/currency/useStoreCurrencyConverter';
import { DollarSign, Users, AlertTriangle, RefreshCw, Phone, Calendar, Eye } from 'lucide-react';
import { Loader } from '../../../shared/components/common/Loader';
import { Link } from 'react-router-dom';
import ReceivablesExportActions from '../../components/sales/ReceivablesExportActions';
import type { ReceivableCustomer } from '../../hooks/reports/useReceivables';

const getCustomerTotals = (customer: ReceivableCustomer) => customer.sales.reduce(
  (totals, sale) => ({
    total: totals.total + Number(sale.total || 0),
    paid: totals.paid + Number(sale.paid_amount || 0),
    remaining: totals.remaining + Number(sale.remaining_amount || 0),
  }),
  { total: 0, paid: 0, remaining: 0 },
);

const Receivables: React.FC = () => {
  const { data, loading, error, reFetch } = useReceivables();
  const { formatFromUSD: formatCurrency } = useStoreCurrencyConverter();

  const isOverdue = (dateString: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  const customers = data?.customers || [];
  const summaryCards = [
    {
      title: 'Total des créances',
      value: formatCurrency(data?.total_outstanding ?? 0),
      icon: DollarSign,
      color: '#4188e9',
      background: '#eef5ff',
    },
    {
      title: 'Clients concernés',
      value: data?.total_customers ?? 0,
      icon: Users,
      color: '#32b978',
      background: '#eaf9f1',
    },
    {
      title: 'Créances en retard',
      value: data?.overdue_count ?? 0,
      icon: AlertTriangle,
      color: '#ef4770',
      background: '#fff0f4',
    },
  ];

  return (
    <div className="container-fluid p-3 p-md-4 min-vh-100" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="d-flex align-items-center bg-light-subtle p-2 rounded-2 justify-content-between mb-3 gap-2 flex-wrap">
        <h1 className="fw-bold text-dark mb-0 fs-5">Suivi des créances</h1>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm d-flex align-items-center"
            onClick={reFetch}
            disabled={loading}
          >
            <RefreshCw className={`me-2 ${loading ? 'spin' : ''}`} size={16} />
            Actualiser
          </button>
          <ReceivablesExportActions
            customers={customers}
            totalOutstanding={data?.total_outstanding ?? 0}
            fileName="releve_creances"
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 shadow-2xs d-flex align-items-center gap-2 mb-3 py-2 px-3 rounded-2" role="alert">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="row g-3 mb-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="col-md-4">
              <div className="card border border-light shadow-2xs rounded-3 p-3 bg-white d-flex flex-row align-items-center gap-3 h-100">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3"
                  style={{ width: 48, height: 48, background: card.background, color: card.color, flexShrink: 0 }}
                >
                  <Icon size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <span className="text-muted d-block text-truncate" style={{ fontSize: '12px' }}>{card.title}</span>
                  <strong className="fw-bold text-dark fs-5">{card.value}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card border border-light shadow-2xs rounded-3 overflow-hidden bg-white">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th className="py-2 text-muted fw-medium text-start bg-light-subtle border-bottom border-light-subtle" style={{ fontSize: '12px' }}>Client</th>
                  <th className="py-2 text-muted fw-medium text-start bg-light-subtle border-bottom border-light-subtle" style={{ fontSize: '12px' }}>Téléphone</th>
                  <th className="py-2 text-muted fw-medium text-end bg-light-subtle border-bottom border-light-subtle" style={{ fontSize: '12px' }}>Total</th>
                  <th className="py-2 text-muted fw-medium text-end bg-light-subtle border-bottom border-light-subtle" style={{ fontSize: '12px' }}>Payé</th>
                  <th className="py-2 text-muted fw-medium text-end bg-light-subtle border-bottom border-light-subtle" style={{ fontSize: '12px' }}>Restant</th>
                  <th className="py-2 text-muted fw-medium text-center bg-light-subtle border-bottom border-light-subtle" style={{ fontSize: '12px' }}>Nb ventes</th>
                  <th className="py-2 text-muted fw-medium text-start bg-light-subtle border-bottom border-light-subtle" style={{ fontSize: '12px' }}>Plus ancienne échéance</th>
                  <th className="text-end pe-3 py-2 text-muted fw-medium bg-light-subtle border-bottom border-light-subtle" style={{ fontSize: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      <Loader height="100px" />
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">Aucune créance en cours.</td>
                  </tr>
                ) : (
                  customers.map((customer) => {
                    const totals = getCustomerTotals(customer);
                    return (
                      <tr key={customer.id} className="border-bottom border-light-subtle">
                        <td className="py-2 fw-medium" style={{ fontSize: '13px' }}>{customer.name}</td>
                        <td className="py-2" style={{ fontSize: '13px' }}>
                          {customer.phone && (
                            <span className="d-flex align-items-center text-muted">
                              <Phone size={14} className="me-2" /> {customer.phone}
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-end" style={{ fontSize: '13px' }}>{formatCurrency(totals.total)}</td>
                        <td className="py-2 text-end text-success" style={{ fontSize: '13px' }}>{formatCurrency(totals.paid)}</td>
                        <td className="py-2 text-end fw-bold text-danger" style={{ fontSize: '13px' }}>{formatCurrency(totals.remaining)}</td>
                        <td className="py-2 text-center" style={{ fontSize: '13px' }}>
                          <span className="badge bg-secondary rounded-pill">{customer.sales_count}</span>
                        </td>
                        <td className="py-2" style={{ fontSize: '13px' }}>
                          {customer.oldest_due_date && (
                            <span className={`d-flex align-items-center ${isOverdue(customer.oldest_due_date) ? 'text-danger fw-bold' : 'text-muted'}`}>
                              <Calendar size={14} className="me-2" />
                              {new Date(customer.oldest_due_date).toLocaleDateString()}
                            </span>
                          )}
                        </td>
                        <td className="text-end pe-3 py-2">
                          <Link
                            to={`/pos/receivables/${customer.id}`}
                            className="btn btn-sm btn-link text-primary p-1 border-0 d-inline-flex align-items-center gap-1 text-decoration-none"
                            aria-label={`Voir les ventes impayées de ${customer.name}`}
                          >
                            <Eye size={15} />
                            <span>Voir le détail</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receivables;
