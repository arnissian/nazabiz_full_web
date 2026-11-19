import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';

interface PurchaseReportData {
  purchase_count: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  stores: Array<{
    store_id: string;
    store_name: string | null;
    purchase_count: number;
    total_amount: number;
    paid_amount: number;
    outstanding_amount: number;
  }>;
}

interface PayableReportData {
  total_outstanding: number;
  suppliers: Array<{
    supplier_id: string;
    supplier_name: string | null;
    outstanding_amount: number;
    stores: Array<{
      store_id: string;
      store_name: string | null;
      outstanding_amount: number;
      purchase_count: number;
    }>;
  }>;
}

interface Props {
  storeId: string;
  period: string;
}

const money = (value: number) => new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
}).format(value || 0);

export default function PurchasesReportTab({ storeId, period }: Props) {
  const [purchases, setPurchases] = useState<PurchaseReportData | null>(null);
  const [payables, setPayables] = useState<PayableReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { store_id: storeId || undefined, period };
      const [purchaseResponse, payableResponse] = await Promise.all([
        axiosInstance.get('/reports/purchases', { params }),
        axiosInstance.get('/reports/payables', { params: { store_id: storeId || undefined } }),
      ]);
      setPurchases(purchaseResponse.data.data);
      setPayables(payableResponse.data.data);
    } catch (loadError: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(loadError)
        ? loadError.response?.data?.message
        : null;
      setError(message || 'Impossible de charger le rapport des achats et des dettes fournisseurs.');
    } finally {
      setLoading(false);
    }
  }, [period, storeId]);

  useEffect(() => {
    // Refresh the report whenever the selected store or period changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReport();
  }, [loadReport]);

  if (loading) return <div className="text-muted py-4">Chargement du rapport des achats…</div>;
  if (error) return <div className="alert alert-danger" role="alert">{error}</div>;
  if (!purchases || !payables) return null;

  return (
    <div className="d-grid gap-4">
      <section className="card border-0 shadow-sm rounded-3 p-4">
        <h2 className="h6 fw-bold mb-3">Achats par magasin</h2>
        <div className="row g-3 mb-4">
          <div className="col-md-3"><div className="small text-muted">Nombre d’achats</div><strong>{purchases.purchase_count}</strong></div>
          <div className="col-md-3"><div className="small text-muted">Montant total</div><strong>{money(purchases.total_amount)}</strong></div>
          <div className="col-md-3"><div className="small text-muted">Payé</div><strong>{money(purchases.paid_amount)}</strong></div>
          <div className="col-md-3"><div className="small text-muted">Dette fournisseur</div><strong>{money(purchases.outstanding_amount)}</strong></div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead><tr><th>Magasin</th><th>Achats</th><th>Total</th><th>Payé</th><th>Reste dû</th></tr></thead>
            <tbody>
              {purchases.stores.map(store => (
                <tr key={store.store_id}>
                  <td>{store.store_name || 'Magasin supprimé'}</td>
                  <td>{store.purchase_count}</td>
                  <td>{money(store.total_amount)}</td>
                  <td>{money(store.paid_amount)}</td>
                  <td>{money(store.outstanding_amount)}</td>
                </tr>
              ))}
              {purchases.stores.length === 0 && <tr><td colSpan={5} className="text-muted text-center">Aucun achat sur cette période.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card border-0 shadow-sm rounded-3 p-4">
        <h2 className="h6 fw-bold mb-3">Dettes fournisseurs ventilées par magasin</h2>
        <div className="text-muted small mb-3">Dette totale : <strong className="text-dark">{money(payables.total_outstanding)}</strong></div>
        {payables.suppliers.map(supplier => (
          <div key={supplier.supplier_id} className="border-top py-3">
            <div className="d-flex justify-content-between fw-semibold mb-2">
              <span>{supplier.supplier_name || 'Fournisseur supprimé'}</span>
              <span>{money(supplier.outstanding_amount)}</span>
            </div>
            <div className="row g-2">
              {supplier.stores.map(store => (
                <div className="col-md-6 small text-muted" key={store.store_id}>
                  {store.store_name || 'Magasin supprimé'} — {money(store.outstanding_amount)} ({store.purchase_count} achats)
                </div>
              ))}
            </div>
          </div>
        ))}
        {payables.suppliers.length === 0 && <div className="text-muted">Aucune dette fournisseur en cours.</div>}
      </section>
    </div>
  );
}
