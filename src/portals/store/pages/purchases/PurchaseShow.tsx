import React, { useContext, useState } from 'react';
import {
  Printer, Edit, Download, FileText, User, Store, CreditCard,
  Calendar, CheckCircle, AlertCircle, Clock,
  Package, ShoppingCart, DollarSign, MapPin, Mail, Phone
} from 'lucide-react';
import { AppContext } from '../../../shared/context/AppContext';
import { useStoreCurrencyConverter } from '../../hooks/currency/useStoreCurrencyConverter';
import { toast } from 'react-toastify';
import { useReceivePurchase } from '../../hooks/purchases/useReceivePurchase';
import { useCreatePurchasePayment } from '../../hooks/purchase-payments/useCreatePurchasePayment';
import { useFinancialAccounts } from '../../../shared/hooks/financial-accounts/useFinancialAccounts';
import { TenantDocumentHeader } from '../../../shared/components/common/TenantDocumentHeader';
import FormModal from '../../../shared/components/common/FormModal';

interface PurchaseItem {
  id: string;
  quantity: number;
  received_quantity?: number;
  unit_price: number;
  subtotal: number;
  product?: {
    name?: string;
    sku?: string;
    selling_price?: number;
  };
}

interface PurchasePayment {
  amount: number;
  payment_method: string;
  created_at: string;
  reference?: string | null;
  note?: string | null;
}

interface PurchaseDetails {
  id: string;
  reference?: string;
  status: string;
  receipt_status?: string;
  total?: number | string;
  paid_amount?: number | string;
  remaining_amount?: number | string;
  date?: string;
  created_at: string;
  due_date?: string;
  discount?: number;
  tax?: number;
  items?: PurchaseItem[];
  payments?: PurchasePayment[];
  supplier?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  store?: {
    name?: string;
  };
}

interface PurchaseShowProps {
  item: PurchaseDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onReceived?: () => void;
  onPaymentAdded?: () => void;
  onEdit?: (purchase: PurchaseDetails) => void;
}

export default function PurchaseShow({ item, isOpen, onClose, onReceived, onPaymentAdded, onEdit }: PurchaseShowProps) {
  const { formatFromUSD } = useStoreCurrencyConverter();
  const { activeStore } = useContext(AppContext);
  const { receivePurchase, submitting: receiving } = useReceivePurchase();
  const { createPurchasePayment, submitting: paymentSubmitting } = useCreatePurchasePayment();
  const { accounts, loading: accountsLoading, error: accountsError } = useFinancialAccounts(true, activeStore?.id, 'store');
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, string>>({});
  const [sellingPrices, setSellingPrices] = useState<Record<string, string>>({});
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentError, setPaymentError] = useState('');

  if (!isOpen || !item) return null;

  const isReceivable = item.status === 'completed'
    && ['pending', 'partially_received'].includes(item.receipt_status || 'pending');
  const remainingQuantity = (purchaseItem: PurchaseItem) =>
    Math.max(0, Number(purchaseItem.quantity || 0) - Number(purchaseItem.received_quantity || 0));

  const handleReceive = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const lines = (item.items || [])
      .map((purchaseItem) => {
        const quantity = Number(receiveQuantities[purchaseItem.id] ?? remainingQuantity(purchaseItem));
        return {
          purchase_item_id: purchaseItem.id,
          quantity,
          ...(sellingPrices[purchaseItem.id] === undefined
            ? purchaseItem.product?.selling_price
              ? { selling_price: Number(purchaseItem.product.selling_price) }
              : {}
            : sellingPrices[purchaseItem.id] !== ''
              ? { selling_price: Number(sellingPrices[purchaseItem.id]) }
              : {}),
        };
      })
      .filter((line) => line.quantity > 0);

    if (!lines.length) {
      toast.error('Saisissez une quantité à réceptionner.');
      return;
    }

    const result = await receivePurchase(item.id, lines);
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    onReceived?.();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvContent = [
      ['Référence', 'Date', 'Fournisseur', 'Magasin', 'Produit', 'Quantité', 'Prix unitaire', 'Total'],
      ...(item.items || []).map((i) => [
        item.reference || item.id,
        new Date(item.date || item.created_at).toLocaleDateString(),
        item.supplier?.name || 'Fournisseur',
        item.store?.name || 'Magasin',
        i.product?.name || 'Produit',
        i.quantity,
        i.unit_price,
        i.subtotal
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `achat_${item.reference || item.id}.csv`;
    link.click();
  };

  const subtotal = item.items?.reduce((sum, i) => sum + Number(i.subtotal || 0), 0) || 0;
  const discount = Number(item.discount || 0);
  const tax = Number(item.tax || 0);
  const total = Math.max(0, Number(item.total ?? subtotal - discount + tax));
  const paymentTotal = item.payments?.reduce((sum, p) => sum + Math.max(0, Number(p.amount || 0)), 0) || 0;
  const paid = Math.max(paymentTotal, Number(item.paid_amount || 0));
  const reportedRemaining = item.remaining_amount;
  const reportedRemainingValue = reportedRemaining == null ? Number.NaN : Number(reportedRemaining);
  const remaining = Math.max(0, Number.isFinite(reportedRemainingValue)
    ? reportedRemainingValue
    : total - paid);

  const openPaymentModal = () => {
    setPaymentAmount(String(remaining));
    setPaymentMethod('cash');
    setPaymentAccountId('');
    setPaymentReference('');
    setPaymentNote('');
    setPaymentError('');
    setPaymentModalOpen(true);
  };

  const handleSubmitPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(paymentAmount);
    if (!paymentAccountId || !Number.isFinite(amount) || amount <= 0) {
      setPaymentError('Sélectionnez un compte payeur et saisissez un montant supérieur à zéro.');
      return;
    }
    if (amount > remaining) {
      setPaymentError(`Le montant ne peut pas dépasser le reste à payer (${formatFromUSD(remaining)}).`);
      return;
    }

    const result = await createPurchasePayment({
      purchase_id: item.id,
      payment_method: paymentMethod,
      account_id: paymentAccountId,
      amount,
      reference: paymentReference.trim() || null,
      note: paymentNote.trim() || null,
    });
    if (!result.success) {
      setPaymentError(result.message);
      return;
    }

    setPaymentModalOpen(false);
    toast.success(result.message || 'Paiement enregistré.');
    onPaymentAdded?.();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'draft': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Confirmé';
      case 'draft': return 'Brouillon';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const getReceiptStatusLabel = (status?: string) => {
    switch (status) {
      case 'completed': return 'Réceptionné';
      case 'partially_received': return 'Partiellement reçu';
      case 'pending': return 'À réceptionner';
      default: return status || 'À réceptionner';
    }
  };

  return (
    <>
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 rounded-3 overflow-hidden">
          
          {/* Header */}
          <div className="modal-header border-bottom bg-white py-3 px-4">
            <div className="d-flex align-items-center justify-content-between w-100">
              <h5 className="modal-title text-dark d-flex align-items-center gap-2 m-0 fs-6 fw-normal">
                <span className="bg-light text-primary p-2 rounded d-flex align-items-center justify-content-center">
                  <ShoppingCart size={18} />
                </span>
                Détails de l'Achat
                <span className="badge bg-secondary ms-2">{item.reference || item.id}</span>
              </h5>
              
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                  onClick={handlePrint}
                  title="Imprimer"
                >
                  <Printer size={14} /> Imprimer
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                  onClick={handleExport}
                  title="Exporter"
                >
                  <Download size={14} /> Exporter
                </button>
                {item.status?.toLowerCase() !== 'cancelled' && (
                  <button
                    type="button"
                    className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1"
                    onClick={() => onEdit?.(item)}
                    title="Modifier"
                  >
                    <Edit size={14} /> Modifier
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-close shadow-none ms-2"
                  aria-label="Fermer"
                ></button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="modal-body p-4 bg-light fw-normal">
            <TenantDocumentHeader />
            <div className="row g-4">
              
              {/* Informations principales (Colonnes de gauche) */}
              <div className="col-lg-8">
                
                {/* Informations fournisseur */}
                <div className="bg-white p-3 rounded-3 shadow-2xs mb-4 border">
                  <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                    <User size={16} className="text-primary" />
                    <h6 className="fw-bold mb-0 text-dark">Informations Fournisseur</h6>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <span className="text-muted small d-block mb-1">Nom du fournisseur</span>
                      <strong className="text-dark">
                        {item.supplier?.name || 'Fournisseur comptant'}
                      </strong>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted small d-block mb-1">Téléphone</span>
                      <div className="d-flex align-items-center gap-1 text-dark">
                        <Phone size={14} className="text-muted" />
                        <span>{item.supplier?.phone || 'Non renseigné'}</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted small d-block mb-1">Email</span>
                      <div className="d-flex align-items-center gap-1 text-dark">
                        <Mail size={14} className="text-muted" />
                        <span>{item.supplier?.email || 'Non renseigné'}</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted small d-block mb-1">Adresse</span>
                      <div className="d-flex align-items-center gap-1 text-dark">
                        <MapPin size={14} className="text-muted" />
                        <span>{item.supplier?.address || 'Non renseignée'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Détails de l'achat */}
                <div className="bg-white p-3 rounded-3 shadow-2xs mb-4 border">
                  <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                    <FileText size={16} className="text-primary" />
                    <h6 className="fw-bold mb-0 text-dark">Détails de l'Achat</h6>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <span className="text-muted small d-block mb-1">Date d'achat</span>
                      <div className="d-flex align-items-center gap-1 text-dark">
                        <Calendar size={14} className="text-muted" />
                        <span>{new Date(item.date || item.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <span className="text-muted small d-block mb-1">Magasin</span>
                      <div className="d-flex align-items-center gap-1 text-dark">
                        <Store size={14} className="text-muted" />
                        <span>{item.store?.name || activeStore?.name || 'Magasin'}</span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <span className="text-muted small d-block mb-1">Statut</span>
                      <div className="d-flex align-items-center gap-1">
                        {item.status === 'completed' ? (
                          <CheckCircle size={14} className="text-success" />
                        ) : item.status === 'draft' ? (
                          <Clock size={14} className="text-warning" />
                        ) : (
                          <AlertCircle size={14} className="text-danger" />
                        )}
                        <span className={`badge bg-${getStatusColor(item.status)}-subtle text-${getStatusColor(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                        {item.status === 'completed' && (
                          <span className={`badge bg-${item.receipt_status === 'completed' ? 'success' : item.receipt_status === 'partially_received' ? 'info' : 'warning'}-subtle text-${item.receipt_status === 'completed' ? 'success' : item.receipt_status === 'partially_received' ? 'info' : 'warning'}`}>
                            {getReceiptStatusLabel(item.receipt_status)}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.due_date && (
                      <div className="col-md-4">
                        <span className="text-muted small d-block mb-1">Échéance</span>
                        <span className="text-dark fw-medium">
                          {new Date(item.due_date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Articles achetés */}
                <div className="bg-white p-3 rounded-3 shadow-2xs border mb-4">
                  <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                    <Package size={16} className="text-primary" />
                    <h6 className="fw-bold mb-0 text-dark">Articles Achetés ({item.items?.length || 0})</h6>
                  </div>

                  {isReceivable && (
                    <form onSubmit={handleReceive} className="mb-4 p-3 bg-light rounded-3 border">
                      <div className="fw-semibold mb-1 text-dark">Enregistrer une réception</div>
                      <div className="text-muted small mb-3">
                        La réception augmente le stock du magasin. Pour un produit sans stock existant, renseignez son prix de vente initial.
                      </div>
                      <div className="d-flex flex-column gap-3">
                        {item.items?.filter((purchaseItem) => remainingQuantity(purchaseItem) > 0).map((purchaseItem) => (
                          <div className="row g-2 align-items-end p-2 bg-white rounded border" key={purchaseItem.id}>
                            <div className="col-md-5">
                              <label className="form-label small mb-1 fw-semibold text-dark">{purchaseItem.product?.name || 'Produit'}</label>
                              <div className="text-muted small">
                                Restant : {remainingQuantity(purchaseItem)} / {purchaseItem.quantity}
                              </div>
                            </div>
                            <div className="col-md-3">
                              <label className="form-label small mb-1">Quantité reçue</label>
                              <input
                                className="form-control form-control-sm"
                                type="number"
                                min="0"
                                max={remainingQuantity(purchaseItem)}
                                step="0.001"
                                value={receiveQuantities[purchaseItem.id] ?? String(remainingQuantity(purchaseItem))}
                                onChange={(event) => setReceiveQuantities((current) => ({
                                  ...current,
                                  [purchaseItem.id]: event.target.value,
                                }))}
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label small mb-1">Prix de vente initial</label>
                              <input
                                className="form-control form-control-sm"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Si nouveau stock"
                                value={sellingPrices[purchaseItem.id] ?? purchaseItem.product?.selling_price ?? ''}
                                onChange={(event) => setSellingPrices((current) => ({
                                  ...current,
                                  [purchaseItem.id]: event.target.value,
                                }))}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <button type="submit" className="btn btn-primary btn-sm mt-3" disabled={receiving}>
                        {receiving ? 'Enregistrement...' : 'Enregistrer la réception'}
                      </button>
                    </form>
                  )}

                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="py-2">Produit</th>
                          <th className="py-2 text-center">Quantité</th>
                          <th className="py-2 text-center">Reçue</th>
                          <th className="py-2 text-end">Prix unitaire</th>
                          <th className="py-2 text-end">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.items?.length ? item.items.map((i, idx) => (
                          <tr key={idx}>
                            <td className="py-2">
                              <div className="d-flex align-items-center gap-2">
                                <Package size={15} className="text-muted" />
                                <div>
                                  <div className="fw-medium text-dark">{i.product?.name || 'Produit'}</div>
                                  {i.product?.sku && <small className="text-muted">SKU : {i.product.sku}</small>}
                                </div>
                              </div>
                            </td>
                            <td className="py-2 text-center text-dark fw-medium">{i.quantity}</td>
                            <td className="py-2 text-center text-dark fw-medium">
                              {i.received_quantity ?? (item.status === 'completed' ? i.quantity : 0)}
                            </td>
                            <td className="py-2 text-end text-muted">{formatFromUSD(i.unit_price)}</td>
                            <td className="py-2 text-end fw-semibold text-primary">{formatFromUSD(i.subtotal)}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="text-center text-muted py-3">Aucun article associé à cet achat.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Résumé financier (Colonne de droite) */}
              <div className="col-lg-4">
                <div className="bg-white p-3 rounded-3 shadow-2xs border sticky-top" style={{ top: '20px' }}>
                  <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                    <DollarSign size={16} className="text-primary" />
                    <h6 className="fw-bold mb-0 text-dark">Résumé Financier</h6>
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Sous-total</span>
                    <span className="fw-semibold text-dark">{formatFromUSD(subtotal)}</span>
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Remise</span>
                    <span className="fw-semibold text-danger">-{formatFromUSD(discount)}</span>
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Taxe</span>
                    <span className="fw-semibold text-info">{formatFromUSD(tax)}</span>
                  </div>

                  <div className="d-flex justify-content-between mb-3 p-2 bg-light rounded-2 border">
                    <span className="fw-bold text-dark">Total</span>
                    <span className="fw-bold text-primary fs-5">{formatFromUSD(total)}</span>
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Payé</span>
                    <span className="fw-semibold text-success">{formatFromUSD(paid)}</span>
                  </div>

                  <div className="d-flex justify-content-between mb-3 pb-3 border-bottom">
                    <span className="text-muted small">Reste à payer</span>
                    <span className={`fw-bold ${remaining > 0 ? 'text-danger' : 'text-success'}`}>
                      {formatFromUSD(remaining)}
                    </span>
                  </div>

                  {item.status?.toLowerCase() === 'completed' && remaining > 0 && (
                    <button
                      type="button"
                      className="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2 mb-3"
                      onClick={openPaymentModal}
                    >
                      <CreditCard size={16} /> Ajouter un paiement
                    </button>
                  )}

                  <div className="mb-3">
                    <span className="text-secondary fw-semibold small d-block mb-2">Paiements enregistrés</span>
                    {item.payments?.length > 0 ? (
                      <div className="d-flex flex-column gap-2">
                        {item.payments.map((p, idx) => (
                          <div key={idx} className="d-flex justify-content-between align-items-center p-2 bg-light rounded-2 border">
                            <div>
                              <div className="fw-semibold text-dark text-capitalize" style={{ fontSize: '12px' }}>
                                {p.payment_method}
                              </div>
                              <div className="text-muted" style={{ fontSize: '10px' }}>
                                {new Date(p.created_at).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                            <div className="fw-bold text-success" style={{ fontSize: '12px' }}>
                              {formatFromUSD(p.amount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-muted small bg-light rounded border">
                        Aucun paiement enregistré
                      </div>
                    )}
                  </div>

                  <div className="d-flex gap-2 pt-2 border-top">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
                      onClick={handlePrint}
                    >
                      <Printer size={14} /> Imprimer
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
                      onClick={handleExport}
                    >
                      <Download size={14} /> Exporter
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer border-top bg-white py-2 px-4">
            <button
              type="button"
              className="btn btn-outline-dark btn-sm px-3"
              onClick={onClose}
            >
              Fermer
            </button>
          </div>

        </div>
      </div>
    </div>
      <FormModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Ajouter un paiement fournisseur"
        icon={<CreditCard size={18} />}
        onSubmit={handleSubmitPayment}
        submitting={paymentSubmitting}
        submitLabel="Enregistrer le paiement"
        error={paymentError}
      >
        <fieldset className="custom-fieldset">
          <legend>Achat</legend>
          <input value={`${item.reference || item.id} — reste ${formatFromUSD(remaining)}`} readOnly />
        </fieldset>
        <fieldset className="custom-fieldset">
          <legend>Compte payeur <span className="text-danger">*</span></legend>
          <select
            value={paymentAccountId}
            onChange={(event) => setPaymentAccountId(event.target.value)}
            required
            disabled={accountsLoading}
          >
            <option value="">Sélectionner un compte</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}{account.store?.name ? ` — ${account.store.name}` : ' — Entreprise'}
              </option>
            ))}
          </select>
        </fieldset>
        {accountsError && <div className="alert alert-danger py-2">{accountsError}</div>}
        <fieldset className="custom-fieldset">
          <legend>Mode de paiement <span className="text-danger">*</span></legend>
          <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} required>
            <option value="cash">Espèces</option>
            <option value="card">Carte</option>
            <option value="mobile_money">Mobile money</option>
            <option value="bank_transfer">Virement</option>
          </select>
        </fieldset>
        <fieldset className="custom-fieldset">
          <legend>Montant <span className="text-danger">*</span></legend>
          <input
            type="number"
            min="0.01"
            max={remaining}
            step="0.01"
            value={paymentAmount}
            onChange={(event) => setPaymentAmount(event.target.value)}
            required
          />
        </fieldset>
        <fieldset className="custom-fieldset">
          <legend>Référence</legend>
          <input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} />
        </fieldset>
        <fieldset className="custom-fieldset mb-0">
          <legend>Note</legend>
          <textarea rows={3} value={paymentNote} onChange={(event) => setPaymentNote(event.target.value)} />
        </fieldset>
      </FormModal>
    </>
  );
}