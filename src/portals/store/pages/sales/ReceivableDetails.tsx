import { AlertTriangle, ArrowLeft, Phone, RefreshCw } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Loader } from '../../../shared/components/common/Loader';
import ReceivablesExportActions from '../../components/sales/ReceivablesExportActions';
import UnpaidSalesTable from '../../components/sales/UnpaidSalesTable';
import { useReceivables } from '../../hooks/reports/useReceivables';
import { useStoreCurrencyConverter } from '../../hooks/currency/useStoreCurrencyConverter';

export default function ReceivableDetails() {
  const { customerId } = useParams<{ customerId: string }>();
  const { data, loading, error, reFetch } = useReceivables();
  const { formatFromUSD: formatCurrency } = useStoreCurrencyConverter();
  const customer = data?.customers.find((item) => String(item.id) === customerId);

  return (
    <div className="container-fluid p-3 p-md-4 min-vh-100" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="d-flex align-items-center bg-light-subtle p-2 rounded-2 justify-content-between mb-3 gap-2 flex-wrap">
        <div className="d-flex align-items-center gap-2">
          <Link to="/pos/receivables" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
            <ArrowLeft size={15} />
            Créances
          </Link>
          <h1 className="fw-bold text-dark mb-0 fs-5">Détail des ventes impayées</h1>
        </div>
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
            customers={customer ? [customer] : []}
            totalOutstanding={customer?.total_outstanding ?? 0}
            fileName={`creances_${String(customer?.name || customerId).replace(/[^\w.-]+/g, '_')}`}
            includeSales
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

      {loading ? (
        <div className="card border border-light shadow-2xs rounded-3 bg-white p-4">
          <Loader height="100px" />
        </div>
      ) : customer ? (
        <>
          <div className="card border border-light shadow-2xs rounded-3 bg-white mb-3">
            <div className="card-body d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <h2 className="fw-bold text-dark fs-5 mb-1">{customer.name}</h2>
                {customer.phone && (
                  <span className="text-muted d-flex align-items-center gap-2 small">
                    <Phone size={14} />
                    {customer.phone}
                  </span>
                )}
              </div>
              <div className="text-md-end">
                <span className="text-muted d-block small">Montant dû</span>
                <strong className="text-danger fs-5">{formatCurrency(customer.total_outstanding)}</strong>
              </div>
            </div>
          </div>
          <div className="card border border-light shadow-2xs rounded-3 overflow-hidden bg-white">
            <UnpaidSalesTable sales={customer.sales} onPaymentSuccess={reFetch} />
          </div>
        </>
      ) : (
        <div className="card border border-light shadow-2xs rounded-3 bg-white">
          <div className="card-body text-center py-4 text-muted">
            Client introuvable ou sans créance en cours.
          </div>
        </div>
      )}
    </div>
  );
}
