import React from 'react';
import { CalendarDays, CreditCard, FileText, Package, Store, Undo2, User, X } from 'lucide-react';

interface SaleReturnItem {
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

interface SaleReturnRefund {
  id: string;
  payment_method: string;
  amount: number | string;
  reference?: string | null;
  note?: string | null;
}

export interface SaleReturn {
  id: string;
  reference?: string | null;
  status?: string | null;
  total?: number | string | null;
  reason?: string | null;
  created_at?: string | null;
  sale?: {
    reference?: string | null;
  };
  customer?: {
    name?: string | null;
  };
  store?: {
    name?: string | null;
  };
  user?: {
    name?: string | null;
  };
  items?: SaleReturnItem[];
  refunds?: SaleReturnRefund[];
}

interface SaleReturnShowProps {
  item: SaleReturn | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatAmount = (amount: number | string | null | undefined) =>
  Number(amount || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const paymentMethodLabels: Record<string, string> = {
  cash: 'Espèces',
  card: 'Carte',
  mobile_money: 'Mobile money',
  bank_transfer: 'Virement',
};

export default function SaleReturnShow({ item, isOpen, onClose }: SaleReturnShowProps) {
  if (!isOpen || !item) return null;

  const statusClass = item.status === 'completed'
    ? 'bg-success-subtle text-success'
    : 'bg-secondary-subtle text-secondary';

  const refundTotal = (item.refunds || []).reduce(
    (sum, refund) => sum + Number(refund.amount || 0),
    0,
  );

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 rounded-2 overflow-hidden">
          
          {/* Header */}
          <div className="modal-header bg-light py-3 px-4">
            <div className="d-flex align-items-center gap-2">
              <Undo2 size={20} className="text-primary" />
              <h5 className="modal-title m-0 fw-bold text-dark">Retour de vente</h5>
              <span className="badge bg-secondary ms-2">{item.reference || item.id}</span>
            </div>
            <button type="button" onClick={onClose} className="btn-close shadow-none" aria-label="Fermer"></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4 bg-light">
            
            {/* Infos principales (Client / Magasin / Vente / Date / Statut) */}
            <div className="bg-white p-3 rounded-3 shadow-2xs mb-4 border">
              <div className="row g-3">
                <div className="col-sm-6 border-end">
                  <span className="text-muted small d-block">Client</span>
                  <strong className="text-dark d-flex align-items-center gap-1 mt-1">
                    <User size={14} className="text-primary" /> {item.customer?.name || '—'}
                  </strong>
                  <span className="text-muted small d-block mt-2">Magasin de rattachement</span>
                  <span className="text-dark d-flex align-items-center gap-1 mt-1">
                    <Store size={14} className="text-primary" /> {item.store?.name || '—'}
                  </span>
                </div>
                <div className="col-sm-6 ps-sm-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Vente d'origine :</span>
                    <strong className="small">{item.sale?.reference || '—'}</strong>
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

            {/* Articles concernés */}
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
                    {item.items?.length ? (
                      item.items.map((line) => (
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
                      ))
                    ) : (
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

            {/* Remboursements */}
            <div className="bg-white rounded-3 shadow-2xs border p-3 mb-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <CreditCard size={16} className="text-primary" /> Remboursements
              </h6>
              {item.refunds?.length ? (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="py-2">Mode</th>
                        <th className="py-2">Référence</th>
                        <th className="py-2">Note</th>
                        <th className="py-2 text-end">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.refunds.map((refund) => (
                        <tr key={refund.id}>
                          <td className="py-2">{paymentMethodLabels[refund.payment_method] || refund.payment_method}</td>
                          <td className="py-2">{refund.reference || '—'}</td>
                          <td className="py-2">{refund.note || '—'}</td>
                          <td className="py-2 text-end">{formatAmount(refund.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-top">
                        <th colSpan={3} className="text-end pt-3">Total remboursé</th>
                        <th className="text-end text-primary pt-3">{formatAmount(refundTotal)}</th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-muted small">Aucun remboursement enregistré.</div>
              )}
            </div>

            {/* Motif et Utilisateur */}
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

          {/* Footer */}
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