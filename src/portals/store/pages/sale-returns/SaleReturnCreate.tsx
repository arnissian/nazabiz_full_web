import React, { useEffect, useState, type FormEvent } from 'react';
import { CreditCard, Plus, Trash2, Undo2 } from 'lucide-react';
import { useCreateSaleReturn } from '../../hooks/sale-returns/useCreateSaleReturn';
import { useSales } from '../../hooks/sales/useSales';
import type { Sale } from '../../hooks/sales/useSale';
import FormModal from '../../../shared/components/common/FormModal';
import { Loader } from '../../../shared/components/common/Loader';
import { useFinancialAccounts } from '../../../shared/hooks/financial-accounts/useFinancialAccounts';

interface SaleReturnCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ReturnableSaleItem {
  id: string | number;
  product_id: string | number;
  quantity: number;
  unit_price: number;
  available_return_quantity: number | string;
  product?: {
    name?: string;
    sku?: string | null;
  } | null;
}

type ReturnableSale = Omit<Sale, 'items' | 'reference'> & {
  reference: string;
  items: ReturnableSaleItem[];
};

interface ReturnLine {
  product_id: string;
  quantity: string;
}

interface RefundDraft {
  payment_method: '' | 'cash' | 'card' | 'mobile_money' | 'bank_transfer';
  account_id: string;
  amount: string;
}

function isNumericValue(value: unknown): value is number | string {
  return (typeof value === 'number' || (typeof value === 'string' && value.trim() !== ''))
    && Number.isFinite(Number(value));
}

function isValidProduct(product: Sale['items'][number]['product']): boolean {
  return product == null
    || (typeof product === 'object'
      && (product.name === undefined || typeof product.name === 'string')
      && (product.sku === undefined || product.sku === null || typeof product.sku === 'string'));
}

function isValidCustomer(customer: Sale['customer']): boolean {
  return customer == null
    || (typeof customer === 'object'
      && (customer.name === undefined || typeof customer.name === 'string'));
}

function isReturnableSale(sale: Sale): sale is ReturnableSale {
  return (typeof sale.id === 'string' || typeof sale.id === 'number')
    && typeof sale.reference === 'string'
    && isValidCustomer(sale.customer)
    && Array.isArray(sale.items)
    && sale.items.every((item) =>
      (typeof item.id === 'string' || typeof item.id === 'number')
      && (typeof item.product_id === 'string' || typeof item.product_id === 'number')
      && isNumericValue(item.quantity)
      && isNumericValue(item.unit_price)
      && isNumericValue(item.available_return_quantity)
      && isValidProduct(item.product),
    );
}

export default function SaleReturnCreate({ isOpen, onClose, onSuccess }: SaleReturnCreateProps) {
  const {
    sales: saleData,
    loading,
    error: salesError,
    reFetch,
  } = useSales({ page: 1, per_page: 100, returnable: true });
  const sales = saleData.filter(isReturnableSale);
  const hasInvalidSaleData = sales.length !== saleData.length;
  const [saleId, setSaleId] = useState('');
  const [reason, setReason] = useState('');
  const [items, setItems] = useState<ReturnLine[]>([]);
  const [refunds, setRefunds] = useState<RefundDraft[]>([]);
  const [error, setError] = useState('');
  const { createSaleReturn, submitting } = useCreateSaleReturn();
  const { accounts, loading: accountsLoading, error: accountsError } = useFinancialAccounts(true, undefined, 'store');
  const selectedSale = sales.find((sale) => String(sale.id) === saleId);

  useEffect(() => {
    if (isOpen) {
      void reFetch();
    }
  }, [isOpen, reFetch]);

  if (!isOpen) return null;

  const closeForm = () => {
    setSaleId('');
    setReason('');
    setItems([]);
    setRefunds([]);
    setError('');
    onClose();
  };

  const selectSale = (id: string) => {
    const sale = sales.find((candidate) => String(candidate.id) === id);
    setSaleId(String(id));
    setItems((sale?.items || []).map((line) => ({
      product_id: String(line.product_id),
      quantity: '0',
    })));
    setRefunds([]);
    setError('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const returnItems = items
      .filter((line) => Number(line.quantity) > 0)
      .map((line) => ({ product_id: line.product_id, quantity: Number(line.quantity) }));

    if (!saleId || returnItems.length === 0) {
      setError('Sélectionnez une vente et indiquez au moins une quantité à retourner.');
      return;
    }

    const requestedQuantityByProduct = returnItems.reduce((quantities, line) => {
      quantities.set(line.product_id, (quantities.get(line.product_id) || 0) + line.quantity);
      return quantities;
    }, new Map<string, number>());
    const exceedsAvailableQuantity = selectedSale?.items.some((line) =>
      (requestedQuantityByProduct.get(String(line.product_id)) || 0) > Number(line.available_return_quantity),
    );

    if (exceedsAvailableQuantity) {
      setError('La quantité demandée dépasse la quantité disponible au retour.');
      return;
    }

    if (refunds.some((refund) => !refund.payment_method || !refund.account_id || !Number(refund.amount))) {
      setError('Complétez le mode, le compte et le montant de chaque remboursement, ou supprimez la ligne vide.');
      return;
    }

    const result = await createSaleReturn({
      sale_id: saleId,
      reason: reason || null,
      items: returnItems,
      refunds: refunds.map((refund) => ({ ...refund, amount: Number(refund.amount) })),
    });

    if (result.success) {
      onSuccess();
      closeForm();
    } else {
      setError(result.message);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={closeForm}
      title="Nouveau retour de vente"
      icon={<Plus size={18} />}
      size="modal-xl"
      onSubmit={submit}
      submitting={submitting}
      submitLabel="Enregistrer le retour"
      error={error}
    >
      <div className="row g-4">
        <div className="col-lg-8 border-end pe-lg-4">
          <span className="text-secondary d-flex align-items-center gap-1 mb-2 fs-7 fw-normal">
            <Undo2 size={14} /> Retour client
          </span>
          <fieldset className="custom-fieldset">
            <legend>
              Vente <span className="text-danger">*</span>
            </legend>
            <select
              value={saleId}
              onChange={(event) => selectSale(event.target.value)}
              required
              disabled={loading || sales.length === 0}
            >
              <option value="">Sélectionner une vente</option>
              {sales.map((sale) => (
                <option key={sale.id} value={sale.id}>
                  {sale.reference} — {sale.customer?.name || 'Client'}
                </option>
              ))}
            </select>
          </fieldset>

          {loading ? (
            <Loader height="60px" />
          ) : salesError ? (
            <div className="alert alert-danger py-2">{salesError}</div>
          ) : hasInvalidSaleData ? (
            <div className="alert alert-danger py-2">
              Certaines données de vente reçues sont incomplètes et ne peuvent pas être proposées au retour.
            </div>
          ) : sales.length === 0 ? (
            <div className="alert alert-info py-2">
              Aucune vente terminée ne contient de quantité encore disponible au retour.
            </div>
          ) : null}

          <fieldset className="custom-fieldset">
            <legend>Motif</legend>
            <input value={reason} onChange={(event) => setReason(event.target.value)} />
          </fieldset>

          <div className="section-box">
            <span className="text-secondary d-block mb-2 fs-7 fw-normal">Produits retournés</span>
            {selectedSale?.items.map((line, index) => (
              <div className="row g-2 mb-2" key={line.id}>
                <div className="col-md-8">
                  <fieldset className="custom-fieldset mb-0">
                    <legend>Produit</legend>
                    <input
                      value={`${line.product?.name || line.product_id}${line.product?.sku ? ` — ${line.product.sku}` : ''}`}
                      readOnly
                    />
                    <small className="text-muted">
                      Vendu : {line.quantity} · Disponible au retour : {line.available_return_quantity}
                    </small>
                  </fieldset>
                </div>
                <div className="col-md-4">
                  <fieldset className="custom-fieldset mb-0">
                    <legend>Quantité à retourner</legend>
                    <input
                      type="number"
                      min="0"
                      max={line.available_return_quantity}
                      step="0.001"
                      value={items[index]?.quantity ?? '0'}
                      onChange={(event) => setItems((current) => current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, quantity: event.target.value } : item,
                      ))}
                    />
                  </fieldset>
                </div>
              </div>
            ))}
            {!selectedSale && (
              <div className="text-muted small">Les produits de la vente apparaîtront après sélection.</div>
            )}
          </div>
        </div>

        <div className="col-lg-4 ps-lg-3">
          <div className="section-box">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary fs-7 fw-normal d-flex align-items-center gap-1">
                <CreditCard size={14} /> Remboursements
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary fw-normal"
                style={{ fontSize: '0.75rem' }}
                onClick={() => setRefunds((current) => [...current, { payment_method: '', account_id: '', amount: '' }])}
              >
                Ajouter
              </button>
            </div>
            {refunds.length === 0 && (
              <p className="text-muted small mb-2">
                Facultatif. Les remboursements enregistrés ne peuvent pas dépasser le montant payé.
              </p>
            )}
            {accountsError && <p className="text-danger small">{accountsError}</p>}
            {refunds.map((refund, index) => (
              <div className="row g-2 mb-3" key={index}>
                <div className="col-12">
                  <fieldset className="custom-fieldset mb-0">
                    <legend>Compte rembourseur <span className="text-danger">*</span></legend>
                    <select
                      value={refund.account_id}
                      required
                      disabled={accountsLoading}
                      onChange={(event) => setRefunds((current) => current.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, account_id: event.target.value } : entry,
                      ))}
                    >
                      <option value="">{accountsLoading ? 'Chargement des comptes…' : 'Sélectionner un compte'}</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}{account.store?.name ? ` — ${account.store.name}` : ' — Entreprise'}
                        </option>
                      ))}
                    </select>
                  </fieldset>
                </div>
                <div className="col-5">
                  <fieldset className="custom-fieldset mb-0">
                    <legend>Mode <span className="text-danger">*</span></legend>
                    <select
                      value={refund.payment_method}
                      onChange={(event) => setRefunds((current) => current.map((entry, entryIndex) =>
                        entryIndex === index
                          ? { ...entry, payment_method: event.target.value as RefundDraft['payment_method'] }
                          : entry,
                      ))}
                    >
                      <option value="">Mode</option>
                      <option value="cash">Espèces</option>
                      <option value="card">Carte</option>
                      <option value="mobile_money">Mobile money</option>
                      <option value="bank_transfer">Virement</option>
                    </select>
                  </fieldset>
                </div>
                <div className="col-5">
                  <fieldset className="custom-fieldset mb-0">
                    <legend>Montant</legend>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={refund.amount}
                      onChange={(event) => setRefunds((current) => current.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, amount: event.target.value } : entry,
                      ))}
                    />
                  </fieldset>
                </div>
                <div className="col-2 d-flex align-items-center">
                  <button
                    type="button"
                    className="btn btn-link text-danger p-0"
                    onClick={() => setRefunds((current) => current.filter((_, refundIndex) => refundIndex !== index))}
                    aria-label="Supprimer le remboursement"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FormModal>
  );
}
