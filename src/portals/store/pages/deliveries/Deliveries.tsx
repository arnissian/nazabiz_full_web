import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ClipboardList, FileText, Printer, Search, Truck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Loader } from '../../../shared/components/common/Loader';
import { Pagination } from '../../../shared/components/common/Pagination';
import { AppContext } from '../../../shared/context/AppContext';
import { TenantLogo } from '../../../shared/components/common/TenantLogo';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';
import type { DeliveryNote, Quotation } from '../../types/quotation';

interface PageResult<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: PageResult<T> | T[];
  message?: string;
}

const getErrorMessage = (error: unknown): string | undefined => {
  if (typeof error !== 'object' || error === null || !('response' in error)) return undefined;
  const response = error.response;
  if (typeof response !== 'object' || response === null || !('data' in response)) return undefined;
  const data = response.data;
  if (typeof data !== 'object' || data === null || !('message' in data)) return undefined;
  return typeof data.message === 'string' ? data.message : undefined;
};

const extractPage = <T,>(result: PaginatedResponse<T>): PageResult<T> => {
  if (Array.isArray(result.data)) {
    return { data: result.data, current_page: 1, last_page: 1, per_page: result.data.length, total: result.data.length };
  }
  if (typeof result.data === 'object' && result.data !== null && Array.isArray(result.data.data)) {
    return result.data;
  }
  throw new Error('Le serveur a retourné une réponse invalide.');
};

export default function Deliveries() {
  const { activeStore, tenantSettings } = useContext(AppContext);
  const activeStoreId = activeStore?.id;
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'pending' | 'history'>(
    searchParams.get('tab') === 'history' ? 'history' : 'pending',
  );
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pendingOrders, setPendingOrders] = useState<PageResult<Quotation> | null>(null);
  const [history, setHistory] = useState<PageResult<DeliveryNote> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Quotation | null>(null);
  const [selectedNote, setSelectedNote] = useState<DeliveryNote | null>(null);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const requestId = useRef(0);

  const fetchData = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: 5,
        search: search || undefined,
        store_id: activeStoreId || undefined,
      };
      const endpoint = tab === 'pending' ? '/delivery-orders' : '/delivery-notes';
      const response = await axiosInstance.get<PaginatedResponse<Quotation | DeliveryNote>>(endpoint, { params });
      if (currentRequestId !== requestId.current) return;
      const result = extractPage(response.data);
      if (tab === 'pending') {
        setPendingOrders(result as PageResult<Quotation>);
      } else {
        setHistory(result as PageResult<DeliveryNote>);
      }
    } catch (fetchError: unknown) {
      if (currentRequestId === requestId.current) {
        setError(getErrorMessage(fetchError) || 'Impossible de récupérer les données de livraison.');
        if (tab === 'pending') setPendingOrders(null);
        else setHistory(null);
      }
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }, [activeStoreId, page, search, tab]);

  useEffect(() => {
    // Synchronize the current tab and filters with their server-side result.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const submitDelivery = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedOrder) return;

    const items = (selectedOrder.items || []).flatMap((item) => {
      const quantity = Number(quantities[item.id || ''] || 0);
      return item.id && quantity > 0
        ? [{ quotation_item_id: item.id, quantity }]
        : [];
    });
    if (items.length === 0) {
      toast.error('Saisissez au moins une quantité à livrer.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axiosInstance.post('/delivery-notes', {
        quotation_id: selectedOrder.id,
        items,
        notes: notes || null,
      });
      toast.success(response.data?.message || 'Bon de livraison enregistré.');
      setSelectedOrder(null);
      setQuantities({});
      setNotes('');
      await fetchData();
    } catch (submitError: unknown) {
      toast.error(getErrorMessage(submitError) || 'Impossible d’enregistrer le bon de livraison.');
    } finally {
      setSubmitting(false);
    }
  };

  const rows = tab === 'pending' ? pendingOrders : history;
  const data = rows?.data || [];

  return (
    <div className="container-fluid p-3 p-md-4 min-vh-100">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
        <div>
          <h1 className="fw-bold text-dark mb-1 fs-5">Livraisons</h1>
          <div className="small text-muted">Préparez les livraisons des commandes et consultez les bons enregistrés.</div>
        </div>
        <div className="btn-group" role="group" aria-label="Sections livraisons">
          <button
            type="button"
            className={`btn btn-sm ${tab === 'pending' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => { setTab('pending'); setPage(1); }}
          >
            <Truck size={14} className="me-1" /> À livrer
          </button>
          <button
            type="button"
            className={`btn btn-sm ${tab === 'history' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => { setTab('history'); setPage(1); }}
          >
            <ClipboardList size={14} className="me-1" /> Historique des bons
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2">
          <div className="position-relative" style={{ maxWidth: 420 }}>
            <Search size={15} className="position-absolute top-50 translate-middle-y text-muted" style={{ left: 10 }} />
            <input
              className="form-control form-control-sm ps-5"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder={tab === 'pending' ? 'Rechercher commande ou client...' : 'Rechercher bon, commande ou client...'}
              aria-label="Rechercher"
            />
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              {tab === 'pending' ? (
                <tr>
                  <th>Commande</th><th>Client</th><th>Magasin</th><th>Date</th><th>Articles à livrer</th><th />
                </tr>
              ) : (
                <tr>
                  <th>Bon de livraison</th><th>Date</th><th>Commande</th><th>Client</th><th>Magasin</th><th />
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4"><Loader height="90px" /></td></tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    {tab === 'pending' ? 'Aucune commande ne reste à livrer.' : 'Aucun bon de livraison trouvé.'}
                  </td>
                </tr>
              ) : tab === 'pending' ? (
                (data as Quotation[]).map((order) => {
                  const outstanding = (order.items || []).filter(
                    (item) => Number(item.quantity) > Number(item.delivered_quantity || 0),
                  ).length;
                  return (
                    <tr key={order.id}>
                      <td className="fw-semibold text-primary">{order.reference}</td>
                      <td>{order.customer?.name || 'Client Comptant'}</td>
                      <td>{order.store?.name || '—'}</td>
                      <td>{new Date(order.date).toLocaleDateString()}</td>
                      <td>{outstanding}</td>
                      <td className="text-end">
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => setSelectedOrder(order)}>
                          Préparer la livraison
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                (data as DeliveryNote[]).map((note) => (
                  <tr key={note.id}>
                    <td className="fw-semibold text-primary">{note.reference}</td>
                    <td>{new Date(note.delivery_date).toLocaleDateString()}</td>
                    <td>{note.quotation?.reference || '—'}</td>
                    <td>{note.quotation?.customer?.name || 'Client Comptant'}</td>
                    <td>{note.store?.name || '—'}</td>
                    <td className="text-end">
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setSelectedNote(note)}>
                        <FileText size={14} className="me-1" /> Voir le bon
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {rows && rows.last_page > 1 && (
          <div className="card-footer bg-white">
            <Pagination
              currentPage={rows.current_page}
              lastPage={rows.last_page}
              total={rows.total}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title">Préparer une livraison</h5>
                  <div className="small text-muted">Commande {selectedOrder.reference} · {selectedOrder.customer?.name || 'Client Comptant'}</div>
                </div>
                <button type="button" className="btn-close" onClick={() => setSelectedOrder(null)} />
              </div>
              <form onSubmit={submitDelivery}>
                <div className="modal-body">
                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <thead><tr><th>Produit</th><th>Commandée</th><th>Déjà livrée</th><th>Reste</th><th>À livrer</th></tr></thead>
                      <tbody>
                        {(selectedOrder.items || []).map((item) => {
                          const remaining = Math.max(
                            0,
                            Number(item.reserved_quantity ?? item.quantity) - Number(item.delivered_quantity || 0),
                          );
                          if (remaining <= 0) return null;
                          return (
                            <tr key={item.id}>
                              <td>{item.product?.name || 'Produit'}</td>
                              <td>{item.quantity}</td>
                              <td>{item.delivered_quantity || 0}</td>
                              <td>{remaining}</td>
                              <td>
                                <input
                                  className="form-control form-control-sm"
                                  type="number"
                                  min="0"
                                  max={remaining}
                                  step="0.001"
                                  value={quantities[item.id || ''] || ''}
                                  onChange={(event) => setQuantities((current) => ({
                                    ...current,
                                    [item.id || '']: event.target.value,
                                  }))}
                                  aria-label={`Quantité à livrer pour ${item.product?.name || 'produit'}`}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <label className="form-label small" htmlFor="delivery-notes">Note (facultatif)</label>
                  <textarea
                    id="delivery-notes"
                    className="form-control"
                    rows={2}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                  {selectedOrder.delivery_notes && selectedOrder.delivery_notes.length > 0 && (
                    <div className="mt-3">
                      <h6>Livraisons précédentes</h6>
                      {selectedOrder.delivery_notes.map((note) => (
                        <div className="small border-top py-2" key={note.id}>
                          <strong>{note.reference}</strong> — {new Date(note.delivery_date).toLocaleDateString()}
                          {note.items?.map((line) => (
                            <span className="ms-2 text-muted" key={line.id}>{line.product?.name}: {line.quantity}</span>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setSelectedOrder(null)}>Annuler</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Enregistrement…' : 'Enregistrer et créer le bon'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedNote && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1080 }}>
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              .delivery-note-print, .delivery-note-print * { visibility: visible !important; }
              .delivery-note-print { position: absolute !important; inset: 0 !important; width: 100% !important; padding: 24px !important; background: #fff !important; }
              .delivery-note-no-print { display: none !important; }
            }
          `}</style>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header delivery-note-no-print">
                <h5 className="modal-title">Bon de livraison — {selectedNote.reference}</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedNote(null)} />
              </div>
              <div className="modal-body delivery-note-print">
                <div className="text-center mb-4">
                  {tenantSettings?.logo_path && (
                    <TenantLogo className="d-block mx-auto mb-2" style={{ maxWidth: 160, maxHeight: 64 }} />
                  )}
                  <h3 className="fw-bold mb-1">{tenantSettings?.name || 'MYBUSINESS'}</h3>
                  <h4 className="text-uppercase">Bon de livraison</h4>
                  {tenantSettings?.address && <div>{tenantSettings.address}</div>}
                  {tenantSettings?.phone && <div>Tél : {tenantSettings.phone}</div>}
                </div>
                <div className="row mb-4">
                  <div className="col-6">
                    <div><strong>N° :</strong> {selectedNote.reference}</div>
                    <div><strong>Date :</strong> {new Date(selectedNote.delivery_date).toLocaleDateString()}</div>
                    <div><strong>Commande :</strong> {selectedNote.quotation?.reference || '—'}</div>
                    <div><strong>Magasin :</strong> {selectedNote.store?.name || '—'}</div>
                  </div>
                  <div className="col-6 text-end">
                    <div><strong>Client :</strong> {selectedNote.quotation?.customer?.name || 'Client Comptant'}</div>
                    {selectedNote.quotation?.customer?.phone && <div><strong>Téléphone :</strong> {selectedNote.quotation.customer.phone}</div>}
                    {selectedNote.quotation?.customer?.address && <div><strong>Adresse :</strong> {selectedNote.quotation.customer.address}</div>}
                  </div>
                </div>
                <table className="table table-bordered align-middle">
                  <thead className="table-light"><tr><th>Produit</th><th>Référence</th><th className="text-end">Quantité livrée</th></tr></thead>
                  <tbody>
                    {selectedNote.items?.map((line) => (
                      <tr key={line.id}>
                        <td>{line.product?.name || 'Produit'}</td><td>{line.product?.sku || '—'}</td>
                        <td className="text-end">{line.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selectedNote.notes && <div className="mt-3"><strong>Note :</strong> {selectedNote.notes}</div>}
                <div className="row mt-5 text-center">
                  <div className="col-6">Signature du livreur<br /><br /><br />_____________________</div>
                  <div className="col-6">Signature du client<br /><br /><br />_____________________</div>
                </div>
              </div>
              <div className="modal-footer delivery-note-no-print">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setSelectedNote(null)}>Fermer</button>
                <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                  <Printer size={15} className="me-1" /> Imprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
