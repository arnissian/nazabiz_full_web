import { useMemo, useState, type FormEvent } from 'react';
import { Calendar, CreditCard, Edit, Loader2, Plus, Trash2 } from 'lucide-react';
import FormModal from '../../../shared/components/common/FormModal';
import { useUpdatePurchase } from '../../hooks/purchases/useUpdatePurchase';
import { useSuppliers } from '../../../shared/hooks/suppliers/useSuppliers';
import { useProducts } from '../../../shared/hooks/products/useProducts';
import type { ProductOption } from '../../../shared/hooks/products/useProducts';
import { useFinancialAccounts } from '../../../shared/hooks/financial-accounts/useFinancialAccounts';

type PurchaseStatus = 'draft' | 'completed';
type PaymentMethod = '' | 'cash' | 'card' | 'mobile_money' | 'bank_transfer';

interface PurchaseLine {
  id: string;
  product_id: string;
  product_name: string;
  quantity: string;
  unit_price: string;
  discount: string;
}

interface PurchasePayment {
  payment_method: PaymentMethod;
  amount: string;
  account_id: string;
}

interface PurchaseEditItem {
  id?: string | number;
  product_id?: string | number;
  quantity?: string | number;
  unit_price?: string | number;
  discount?: string | number;
  product?: { name?: string };
}

interface PurchaseEditData {
  id: string;
  reference?: string;
  status: string;
  store_id?: string;
  supplier_id?: string | null;
  supplier?: { name?: string } | null;
  due_date?: string | null;
  discount?: string | number;
  tax?: string | number;
  items?: PurchaseEditItem[];
}

interface SupplierOption extends Record<string, unknown> {
  id: string;
  name: string;
}

interface PurchaseEditProps {
  item: PurchaseEditData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PurchaseEditFormProps extends Omit<PurchaseEditProps, 'item'> {
  item: PurchaseEditData;
}

const createLine = (): PurchaseLine => ({
  id: `${Date.now()}-${Math.random()}`,
  product_id: '',
  product_name: '',
  quantity: '1',
  unit_price: '',
  discount: '0',
});

export default function PurchaseEdit({ item, isOpen, onClose, onSuccess }: PurchaseEditProps) {
  if (!isOpen || !item) return null;
  return (
    <PurchaseEditForm
      key={`${item.id}-${isOpen}`}
      item={item}
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function PurchaseEditForm({ item, isOpen, onClose, onSuccess }: PurchaseEditFormProps) {
  const [dueDate, setDueDate] = useState(item.due_date ? String(item.due_date).slice(0, 10) : '');
  const [status, setStatus] = useState<PurchaseStatus>(item.status === 'completed' ? 'completed' : 'draft');
  const [supplierId, setSupplierId] = useState(item.supplier_id ? String(item.supplier_id) : '');
  const [discount, setDiscount] = useState(String(item.discount ?? 0));
  const [tax, setTax] = useState(String(item.tax ?? 0));
  const [lines, setLines] = useState<PurchaseLine[]>(item.items?.length
    ? item.items.map((line, index) => ({
        id: String(line.id ?? `existing-${index}`),
        product_id: String(line.product_id ?? ''),
        product_name: line.product?.name || '',
        quantity: String(line.quantity ?? ''),
        unit_price: String(line.unit_price ?? ''),
        discount: String(line.discount ?? 0),
      }))
    : [createLine()]);
  const [payments, setPayments] = useState<PurchasePayment[]>([]);
  const [error, setError] = useState('');
  const { updatePurchase, submitting } = useUpdatePurchase();
  const { suppliers, loading: suppliersLoading } = useSuppliers({ page: 1, per_page: 100, is_active: true });
  const supplierOptions = suppliers.filter((supplier): supplier is SupplierOption =>
    typeof supplier.id === 'string' && typeof supplier.name === 'string'
  );
  const { products, loading: productsLoading, error: productsError } = useProducts({
    page: 1,
    per_page: 100,
    is_active: true,
    ...(item?.store_id ? { store_id: item.store_id } : {}),
  });
  const { accounts, loading: accountsLoading, error: accountsError } = useFinancialAccounts(
    true,
    item?.store_id,
    'store',
  );
  const isDraft = item.status === 'draft';

  const subtotal = useMemo(
    () => lines.reduce(
      (sum, line) => sum + Math.max(0, Number(line.quantity) || 0) * Math.max(0, Number(line.unit_price) || 0)
        - Math.max(0, Number(line.discount) || 0),
      0,
    ),
    [lines],
  );
  const total = Math.max(0, subtotal - (Number(discount) || 0) + (Number(tax) || 0));

  const updateLine = (id: string, changes: Partial<PurchaseLine>) => {
    setLines(current => current.map(line => line.id === id ? { ...line, ...changes } : line));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (item.status === 'cancelled') {
      setError('Un achat annulé ne peut pas être modifié.');
      return;
    }

    if (!isDraft) {
      const result = await updatePurchase(item.id, { due_date: dueDate || null });
      if (!result.success) {
        setError(result.message);
        return;
      }
      onSuccess();
      onClose();
      return;
    }

    if (lines.length === 0 || lines.some(line =>
      !line.product_id ||
      !Number.isFinite(Number(line.quantity)) ||
      Number(line.quantity) <= 0 ||
      !Number.isFinite(Number(line.unit_price)) ||
      Number(line.unit_price) < 0 ||
      !Number.isFinite(Number(line.discount)) ||
      Number(line.discount) < 0 ||
      Number(line.discount) > Number(line.quantity) * Number(line.unit_price)
    )) {
      setError('Chaque article doit avoir un produit, une quantité et un prix valides; sa remise ne peut pas dépasser son montant.');
      return;
    }

    const discountAmount = Number(discount);
    const taxAmount = Number(tax);
    if (!Number.isFinite(discountAmount) || discountAmount < 0 || discountAmount > subtotal ||
        !Number.isFinite(taxAmount) || taxAmount < 0) {
      setError('La remise globale et la taxe doivent être des montants valides.');
      return;
    }

    const hasPayment = payments.some(payment => payment.payment_method || payment.account_id || payment.amount.trim());
    if (status === 'draft' && hasPayment) {
      setError('Un brouillon ne peut pas enregistrer de paiement.');
      return;
    }
    if (status === 'completed' && payments.some(payment => {
      const amount = Number(payment.amount);
      return (payment.payment_method || payment.account_id || payment.amount.trim())
        && (!payment.payment_method || !payment.account_id || !Number.isFinite(amount) || amount <= 0);
    })) {
      setError('Chaque paiement doit avoir un mode, un compte payeur et un montant supérieur à zéro.');
      return;
    }
    const validPayments = payments.filter(payment => payment.payment_method && Number(payment.amount) > 0);
    const paymentTotal = validPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    if (paymentTotal > total) {
      setError('Le total des paiements ne peut pas dépasser le total de l’achat.');
      return;
    }

    const result = await updatePurchase(item.id, {
      supplier_id: supplierId || null,
      status,
      discount: discountAmount,
      tax: taxAmount,
      due_date: dueDate || null,
      items: lines.map(line => ({
        product_id: line.product_id,
        quantity: Number(line.quantity),
        unit_price: Number(line.unit_price),
        discount: Number(line.discount) || 0,
      })),
      payments: status === 'completed'
        ? validPayments.map(payment => ({ ...payment, amount: Number(payment.amount) }))
        : [],
    });
    if (!result.success) {
      setError(result.message);
      return;
    }
    onSuccess();
    onClose();
  };

  const draftFooter = (
    <div className="modal-footer border-top bg-light py-2 px-4 d-flex align-items-center justify-content-between gap-3 flex-wrap">
      <button type="button" className="btn btn-outline-dark px-3 fw-normal" onClick={onClose} disabled={submitting}>
        Annuler
      </button>
      <div className="d-flex align-items-center gap-3 flex-wrap ms-auto">
        <div className="d-flex align-items-center gap-3" role="radiogroup" aria-label="Statut de l’achat">
          {([
            { value: 'completed', label: 'Achat' },
            { value: 'draft', label: 'Brouillon' },
          ] as const).map(option => (
            <label key={option.value} className="form-check d-flex align-items-center gap-2 mb-0">
              <input
                className="form-check-input m-0"
                type="radio"
                name={`purchase-status-${item.id}`}
                value={option.value}
                checked={status === option.value}
                onChange={() => {
                  setStatus(option.value);
                  if (option.value === 'draft') setPayments([]);
                }}
                disabled={submitting}
              />
              <span className="form-check-label">{option.label}</span>
            </label>
          ))}
        </div>
        <button type="submit" className="btn btn-primary px-4 fw-normal d-flex align-items-center gap-1" disabled={submitting}>
          {submitting && <Loader2 size={14} className="spinner-border spinner-border-sm me-1" />}
          {status === 'draft' ? 'Enregistrer' : 'Confirmer'}
        </button>
      </div>
    </div>
  );

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={isDraft
        ? status === 'draft' ? `Modifier le brouillon — ${item.reference || ''}` : `Confirmer le brouillon — ${item.reference || ''}`
        : `Modifier l'échéance — ${item.reference || ''}`}
      icon={<Edit size={18} />}
      size={isDraft ? 'modal-xl' : 'modal-md'}
      onSubmit={submit}
      submitting={submitting}
      submitLabel="Enregistrer"
      error={error}
      {...(isDraft ? { footer: draftFooter } : {})}
    >
      {isDraft ? (
        <div className="row g-4">
          <div className="col-lg-8 border-end pe-lg-4">
            <fieldset className="custom-fieldset mb-3">
              <legend>Fournisseur</legend>
              <select value={supplierId} onChange={event => setSupplierId(event.target.value)} disabled={suppliersLoading}>
                <option value="">Fournisseur comptant</option>
                {supplierOptions.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </fieldset>

            {suppliersLoading && <div className="text-muted small mb-2">Chargement des fournisseurs…</div>}
            <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
              <span className="text-secondary fs-7 fw-normal">Articles achetés</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                onClick={() => setLines(current => [...current, createLine()])}
                disabled={productsLoading}
              >
                <Plus size={14} /> Ajouter une ligne
              </button>
            </div>
            {productsError && <div className="alert alert-danger py-2">{productsError}</div>}
            {lines.map((line, index) => {
              const selectedElsewhere = lines.filter(other => other.id !== line.id).map(other => other.product_id);
              const lineTotal = Number(line.quantity || 0) * Number(line.unit_price || 0) - Number(line.discount || 0);
              return (
                <div className="row g-2 align-items-end mb-3 p-2 bg-light rounded border" key={line.id}>
                  <div className="col-12">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <label className="form-label small mb-0 fw-semibold">Article {index + 1}</label>
                      {lines.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-link text-danger p-0"
                          aria-label={`Supprimer l’article ${index + 1}`}
                          onClick={() => setLines(current => current.filter(entry => entry.id !== line.id))}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                    <select
                      className="form-select form-select-sm"
                      value={line.product_id}
                      required
                      disabled={productsLoading}
                      onChange={event => {
                        const product = products.find((entry: ProductOption) => entry.id === event.target.value);
                        updateLine(line.id, {
                          product_id: event.target.value,
                          product_name: product?.name || '',
                          unit_price: product?.purchase_price != null ? String(product.purchase_price) : '',
                        });
                      }}
                    >
                      <option value="">Sélectionner un produit</option>
                      {line.product_id && !products.some(product => product.id === line.product_id) && (
                        <option value={line.product_id}>{line.product_name || 'Produit existant'}</option>
                      )}
                      {products.map((product: ProductOption) => (
                        <option key={product.id} value={product.id} disabled={selectedElsewhere.includes(product.id)}>
                          {product.name}{product.sku ? ` — ${product.sku}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-sm-4">
                    <label className="form-label small mb-1">Quantité</label>
                    <input className="form-control form-control-sm" type="number" min="0.001" step="0.001" value={line.quantity} onChange={event => updateLine(line.id, { quantity: event.target.value })} required />
                  </div>
                  <div className="col-sm-4">
                    <label className="form-label small mb-1">Prix unitaire</label>
                    <input className="form-control form-control-sm" type="number" min="0" step="0.01" value={line.unit_price} onChange={event => updateLine(line.id, { unit_price: event.target.value })} required />
                  </div>
                  <div className="col-sm-4">
                    <label className="form-label small mb-1">Remise ligne</label>
                    <input className="form-control form-control-sm" type="number" min="0" step="0.01" value={line.discount} onChange={event => updateLine(line.id, { discount: event.target.value })} />
                  </div>
                  <div className="col-12 text-end small fw-semibold text-primary">Total ligne : {lineTotal.toLocaleString()} $</div>
                </div>
              );
            })}
          </div>

          <div className="col-lg-4">
            <fieldset className="custom-fieldset">
              <legend>Remise globale</legend>
              <input type="number" min="0" step="0.01" value={discount} onChange={event => setDiscount(event.target.value)} />
            </fieldset>
            <fieldset className="custom-fieldset">
              <legend>Taxe</legend>
              <input type="number" min="0" step="0.01" value={tax} onChange={event => setTax(event.target.value)} />
            </fieldset>
            <div className="d-flex justify-content-between mb-2 small">
              <span>Sous-total</span><strong>{subtotal.toLocaleString()} $</strong>
            </div>
            <div className="d-flex justify-content-between mb-3 p-2 bg-light rounded border">
              <strong>Total</strong><strong className="text-primary">{total.toLocaleString()} $</strong>
            </div>
            <fieldset className="custom-fieldset">
              <legend><Calendar size={14} className="me-1" />Date d’échéance</legend>
              <input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} />
            </fieldset>

            {status === 'completed' && (
              <div className="section-box mt-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-secondary fs-7 fw-normal d-flex align-items-center gap-1"><CreditCard size={14} /> Paiement initial</span>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setPayments(current => [...current, { payment_method: '', amount: '', account_id: '' }])}>
                    Ajouter
                  </button>
                </div>
                {accountsError && <div className="alert alert-danger py-2">{accountsError}</div>}
                {accountsLoading && <div className="text-muted small">Chargement des comptes…</div>}
                {payments.map((payment, index) => (
                  <div className="row g-2 mb-2" key={index}>
                    <div className="col-5">
                      <label className="form-label small mb-1">Mode</label>
                      <select className="form-select form-select-sm" value={payment.payment_method} onChange={event => setPayments(current => current.map((entry, i) => i === index ? { ...entry, payment_method: event.target.value as PaymentMethod } : entry))}>
                        <option value="">Sélectionner</option>
                        <option value="cash">Espèces</option><option value="card">Carte</option><option value="mobile_money">Mobile money</option><option value="bank_transfer">Virement</option>
                      </select>
                    </div>
                    <div className="col-5">
                      <label className="form-label small mb-1">Montant</label>
                      <input className="form-control form-control-sm" type="number" min="0.01" step="0.01" value={payment.amount} onChange={event => setPayments(current => current.map((entry, i) => i === index ? { ...entry, amount: event.target.value } : entry))} />
                    </div>
                    <div className="col-10">
                      <label className="form-label small mb-1">Compte payeur</label>
                      <select className="form-select form-select-sm" value={payment.account_id} required={Number(payment.amount) > 0} disabled={accountsLoading} onChange={event => setPayments(current => current.map((entry, i) => i === index ? { ...entry, account_id: event.target.value } : entry))}>
                        <option value="">Sélectionner un compte</option>
                        {accounts.map(account => <option key={account.id} value={account.id}>{account.name}{account.store?.name ? ` — ${account.store.name}` : ' — Entreprise'}</option>)}
                      </select>
                    </div>
                    <div className="col-2 d-flex align-items-end justify-content-center">
                      <button type="button" className="btn btn-link text-danger p-1" aria-label="Supprimer le paiement initial" onClick={() => setPayments(current => current.filter((_, i) => i !== index))}><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <fieldset className="custom-fieldset mb-0">
          <legend>
            <Calendar size={14} className="me-1" />
            Date d’échéance
          </legend>
          <input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} />
        </fieldset>
      )}
    </FormModal>
  );
}
