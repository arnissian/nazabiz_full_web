import { CalendarDays, FileText, Package, Store, Undo2, User, X } from 'lucide-react';

interface PurchaseReturnItem {
  id: string;
  product_id: string;
  quantity: number | string;
  unit_price: number | string;
  subtotal: number | string;
  product?: {
    name?: string;
    sku?: string | null;
  };
}

interface PurchaseReturn {
  id: string;
  reference?: string | null;
  status?: string | null;
  total?: number | string | null;
  reason?: string | null;
  created_at?: string | null;
  purchase?: {
    reference?: string | null;
  };
  supplier?: {
    name?: string | null;
  };
  store?: {
    name?: string | null;
  };
  user?: {
    name?: string | null;
  };
  items?: PurchaseReturnItem[];
}

interface PurchaseReturnShowProps {
  item: PurchaseReturn | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatAmount = (amount: number | string | null | undefined) =>
  Number(amount || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PurchaseReturnShowInvoiceStyle({ item, isOpen, onClose }: PurchaseReturnShowProps) {
  if (!isOpen || !item) return null;

  const statusClass = item.status === 'completed'
    ? 'bg-success-subtle text-success'
    : 'bg-secondary-subtle text-secondary';

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 rounded-2 overflow-hidden">
          <div className="modal-header bg-light text-white py-3 px-4">
            <div className="d-flex align-items-center gap-2">
              <Undo2 size={20} className="text-primary" />
              <h5 className="modal-title m-0 fw-bold">Retour d'achat</h5>
              <span className="badge bg-secondary ms-2">{item.reference || item.id}</span>
            </div>
            <button type="button" onClick={onClose} className="btn-close btn-close-white" aria-label="Fermer"></button>
          </div>

          <div className="modal-body p-4 bg-light">
            <div className="bg-white p-3 rounded-3 shadow-2xs mb-4 border">
              <div className="row g-3">
                <div className="col-sm-6 border-end">
                  <span className="text-muted small d-block">Fournisseur</span>
                  <strong className="text-dark d-flex align-items-center gap-1 mt-1">
                    <User size={14} className="text-primary" /> {item.supplier?.name || '—'}
                  </strong>
                  <span className="text-muted small d-block mt-2">Magasin de rattachement</span>
                  <span className="text-dark d-flex align-items-center gap-1 mt-1">
                    <Store size={14} className="text-primary" /> {item.store?.name || '—'}
                  </span>
                </div>
                <div className="col-sm-6 ps-sm-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Achat d'origine :</span>
                    <strong className="small">{item.purchase?.reference || '—'}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Date du retour :</span>
                    <strong className="small">{item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : '—'}</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small">Statut :</span>
                    <span className={`badge ${statusClass}`}>{item.status || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3 shadow-2xs border p-3 mb-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <FileText size={16} className="text-primary" /> Articles concernés
              </h6>
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="py-2">Produit</th>
                      <th className="py-2 text-end">Quantité</th>
                      <th className="py-2 text-end">Prix unitaire</th>
                      <th className="py-2 text-end">Sous-total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.items?.length ? item.items.map((line) => (
                      <tr key={line.id}>
                        <td className="py-2">
                          <div className="d-flex align-items-center gap-2">
                            <Package size={15} className="text-muted" />
                            <div>
                              <div className="fw-medium text-dark">{line.product?.name || line.product_id}</div>
                              {line.product?.sku && <small className="text-muted">SKU : {line.product.sku}</small>}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 text-end">{line.quantity}</td>
                        <td className="py-2 text-end">{formatAmount(line.unit_price)}</td>
                        <td className="py-2 text-end fw-semibold">{formatAmount(line.subtotal)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-3">Aucun article associé à ce retour.</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-top">
                      <th colSpan={3} className="text-end pt-3">Total du retour</th>
                      <th className="text-end text-primary pt-3">{formatAmount(item.total)}</th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="bg-white p-3 rounded-3 shadow-2xs border">
              <div className="row g-3">
                <div className="col-md-8">
                  <div className="small text-muted mb-1">Motif</div>
                  <div className="bg-light p-2 rounded text-dark">{item.reason || 'Aucun motif renseigné.'}</div>
                </div>
                <div className="col-md-4 d-flex flex-column justify-content-end">
                  {item.user?.name && (
                    <div className="text-muted small text-md-end">
                      Enregistré par : <strong>{item.user.name}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer bg-white border-top py-2 px-4">
            <button type="button" className="btn btn-outline-dark border-1 btn-sm px-3" onClick={onClose}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}