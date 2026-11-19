import React, { useState, useContext, useMemo, type FormEvent } from "react";
import { Plus, Trash2, ShoppingBag, CreditCard, Loader2 } from "lucide-react";
import { useCreatePurchase } from "../../hooks/purchases/useCreatePurchase";
import { useSuppliers } from "../../../shared/hooks/suppliers/useSuppliers";
import { useProducts } from "../../../shared/hooks/products/useProducts";
import { AppContext } from "../../../shared/context/AppContext";
import FormModal from "../../../shared/components/common/FormModal";
import { Loader } from "../../../shared/components/common/Loader";
import type { ProductOption, ProductQueryParams } from "../../../shared/hooks/products/useProducts";
import { useFinancialAccounts } from "../../../shared/hooks/financial-accounts/useFinancialAccounts";

interface PurchaseCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SupplierOption extends Record<string, unknown> {
  id: string;
  name: string;
}

interface PaymentDraft {
  payment_method: "" | "cash" | "card" | "mobile_money" | "bank_transfer";
  amount: string;
  account_id: string;
}

type PurchaseStatus = 'draft' | 'completed';

interface PurchaseLine {
  id: number;
  product_id: string;
  product_name: string;
  quantity: string;
  unit_price: string;
}

const createPurchaseLine = (): PurchaseLine => ({
  id: Date.now() + Math.random(),
  product_id: "",
  product_name: "",
  quantity: "1",
  unit_price: "",
});

export default function PurchaseCreate({ isOpen, onClose, onSuccess }: PurchaseCreateProps) {
  const { activeStore } = useContext(AppContext);
  const { suppliers, loading: suppliersLoading } = useSuppliers({ page: 1, per_page: 100, is_active: true });
  const supplierOptions = suppliers.filter((supplier): supplier is SupplierOption =>
    typeof supplier.id === 'string' && typeof supplier.name === 'string'
  );
  const {
    products,
    loading: productsLoading,
    error: productsError,
    params: productParams,
    setParams: setProductParams,
  } = useProducts({ page: 1, per_page: 100, is_active: true });

  const store_id = activeStore?.id || "";
  const [supplier_id, setSupplier] = useState(""),
    [discount, setDiscount] = useState("0"),
    [tax, setTax] = useState("0"),
    [due_date, setDue] = useState(""),
    [status, setStatus] = useState<PurchaseStatus>('draft'),
    [items, setItems] = useState<PurchaseLine[]>([createPurchaseLine()]),
    [payments, setPayments] = useState<PaymentDraft[]>([]),
    [error, setError] = useState("");
  const { createPurchase, submitting } = useCreatePurchase();
  const { accounts, loading: accountsLoading } = useFinancialAccounts(true, undefined, 'store');

  const searchTerm = productParams.search || "";

  // Calculs automatiques
  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + (Number(item.unit_price) || 0) * (Number(item.quantity) || 0),
      0,
    );
  }, [items]);

  const taxAmount = Number(tax) || 0;
  const discountAmount = Number(discount) || 0;
  const total = Math.max(0, subtotal - discountAmount + taxAmount);

  if (!isOpen) return null;

  const updateItem = (lineId: number, changes: Partial<PurchaseLine>) => {
    setItems((current) =>
      current.map((item) => item.id === lineId ? { ...item, ...changes } : item),
    );
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!store_id) {
      setError("Aucun magasin actif ne vous est assigné. Veuillez contacter un administrateur.");
      return;
    }
    if (items.length === 0 || items.some((item) => !item.product_id)) {
      setError("Sélectionnez un produit pour chaque ligne d'achat.");
      return;
    }
    if (items.some((item) => !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0)) {
      setError("La quantité de chaque ligne doit être supérieure à zéro.");
      return;
    }
    if (items.some((item) => !Number.isFinite(Number(item.unit_price)) || Number(item.unit_price) < 0)) {
      setError("Renseignez un prix unitaire valide pour chaque ligne.");
      return;
    }
    if (status === 'draft' && payments.some(payment =>
      payment.payment_method || payment.account_id || payment.amount.trim()
    )) {
      setError("Un brouillon ne peut pas enregistrer de paiement.");
      return;
    }
    if (status === 'completed' && payments.some((payment) => {
      const hasPaymentData = payment.payment_method || payment.account_id || payment.amount.trim();
      const amount = Number(payment.amount);
      return hasPaymentData && (!payment.payment_method || !payment.account_id || !Number.isFinite(amount) || amount <= 0);
    })) {
      setError("Sélectionnez le mode et le compte payeur pour chaque paiement.");
      return;
    }
    const validPayments = payments.filter(payment => payment.payment_method && Number(payment.amount) > 0);
    if (validPayments.reduce((sum, payment) => sum + Number(payment.amount), 0) > total) {
      setError("Le total des paiements ne peut pas dépasser le total de l’achat.");
      return;
    }

    const r = await createPurchase({
      store_id,
      supplier_id: supplier_id || null,
      status,
      discount: discountAmount,
      tax: taxAmount,
      due_date: due_date || null,
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        discount: 0,
      })),
      payments: status === 'completed'
        ? validPayments.map((payment) => ({ ...payment, amount: Number(payment.amount) }))
        : [],
    });
    if (r.success) {
      onSuccess();
      onClose();
    } else setError(r.message);
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvel Achat"
      icon={<Plus size={18} />}
      size="modal-xl"
      onSubmit={submit}
      submitting={submitting}
      error={error}
      footer={(
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
                    name="purchase-create-status"
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
      )}
    >
      <div className="row g-4">
        <div className="col-lg-8 border-end pe-lg-4">
          <span className="text-secondary d-flex align-items-center gap-1 mb-2 fs-7 fw-normal">
            <ShoppingBag size={14} /> Informations générales
          </span>
          <div className="row g-2 mb-3">
            <div className="col-md-12">
              <fieldset className="custom-fieldset mb-0">
                <legend>
                  Fournisseur
                </legend>
                <select value={supplier_id} onChange={(e) => setSupplier(e.target.value)} disabled={suppliersLoading}>
                  <option value="">Fournisseur comptant</option>
                  {supplierOptions.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </fieldset>
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
            <span className="text-secondary d-flex align-items-center gap-1 fs-7 fw-normal">
              <ShoppingBag size={14} /> Lignes d'achat
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              onClick={() => setItems((current) => [...current, createPurchaseLine()])}
            >
              <Plus size={14} /> Ajouter une ligne
            </button>
          </div>
          <div className="mb-2">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Rechercher par nom, SKU ou code-barres..."
              value={searchTerm}
              onChange={(e) => setProductParams((previous: ProductQueryParams) => ({
                ...previous,
                search: e.target.value || undefined,
                page: 1,
              }))}
              disabled={productsLoading}
            />
          </div>
          {productsLoading ? (
            <Loader height="100px" />
          ) : productsError ? (
            <div className="alert alert-danger py-2 mb-0">{productsError}</div>
          ) : products.length === 0 ? (
            <div className="text-muted small py-3">Aucun produit trouvé.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th style={{ width: "125px" }}>Quantité</th>
                    <th style={{ width: "160px" }}>Prix unitaire</th>
                    <th style={{ width: "140px" }} className="text-end">Total ligne</th>
                    <th style={{ width: "44px" }} />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const lineTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
                    const selectedProductIds = items
                      .filter((other) => other.id !== item.id)
                      .map((other) => other.product_id);

                    return (
                      <tr key={item.id}>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={item.product_id}
                            onChange={(event) => {
                              const product = products.find((entry: ProductOption) => entry.id === event.target.value);
                              updateItem(item.id, {
                                product_id: event.target.value,
                                product_name: product?.name || "",
                                unit_price: product?.purchase_price != null
                                  ? String(product.purchase_price)
                                  : "",
                              });
                            }}
                            required
                            disabled={productsLoading}
                          >
                            <option value="">Sélectionner un produit</option>
                            {item.product_id && !products.some((product) => product.id === item.product_id) && (
                              <option value={item.product_id}>{item.product_name}</option>
                            )}
                            {products.map((product: ProductOption) => (
                              <option
                                key={product.id}
                                value={product.id}
                                disabled={selectedProductIds.includes(product.id)}
                              >
                                {product.name}{product.sku ? ` — ${product.sku}` : ""}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            className="form-control form-control-sm"
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={item.quantity}
                            onChange={(event) => updateItem(item.id, { quantity: event.target.value })}
                            required
                          />
                        </td>
                        <td>
                          <input
                            className="form-control form-control-sm"
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(event) => updateItem(item.id, { unit_price: event.target.value })}
                            required
                          />
                        </td>
                        <td className="text-end fw-semibold">
                          {lineTotal.toLocaleString()} $
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-link text-danger p-1"
                            onClick={() => setItems((current) => current.filter((line) => line.id !== item.id))}
                            aria-label={`Supprimer la ligne ${index + 1}`}
                            title="Supprimer la ligne"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="col-lg-4 ps-lg-3">
          <div className="section-box mb-3">
            <span className="text-secondary d-block mb-2 fs-7 fw-normal">Montants</span>
            <div className="d-flex justify-content-between mb-1 small text-muted">
              <span>Sous-total:</span>
              <span className="fw-semibold text-dark">{subtotal.toLocaleString()} $</span>
            </div>
            <fieldset className="custom-fieldset">
              <legend>Remise globale</legend>
              <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </fieldset>
            <fieldset className="custom-fieldset">
              <legend>Taxe</legend>
              <input type="number" min="0" value={tax} onChange={(e) => setTax(e.target.value)} />
            </fieldset>
            <div className="d-flex justify-content-between mb-1 small text-muted">
              <span>Total:</span>
              <span className="fw-bold text-primary">{total.toLocaleString()} $</span>
            </div>
            <fieldset className="custom-fieldset mb-0">
              <legend>Échéance</legend>
              <input type="date" value={due_date} onChange={(e) => setDue(e.target.value)} />
            </fieldset>
          </div>

          {status === 'completed' && (
            <div className="section-box">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-secondary fs-7 fw-normal d-flex align-items-center gap-1">
                  <CreditCard size={14} /> Paiements
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary fw-normal"
                  style={{ fontSize: "0.75rem" }}
                  onClick={() => setPayments((current) => [...current, { payment_method: "", amount: "", account_id: "" }])}
                >
                  Ajouter
                </button>
              </div>
            {payments.map((p, i) => (
              <div className="row g-2 mb-2" key={i}>
                <div className="col-4">
                  <fieldset className="custom-fieldset mb-0">
                    <legend>Mode</legend>
                    <select
                      value={p.payment_method}
                      onChange={(e) => {
                        setPayments((current) => current.map((payment, index) =>
                          index === i ? { ...payment, payment_method: e.target.value as PaymentDraft["payment_method"] } : payment,
                        ));
                      }}
                    >
                      <option value="">Mode</option>
                      <option value="cash">Espèces</option>
                      <option value="card">Carte</option>
                      <option value="mobile_money">Mobile money</option>
                      <option value="bank_transfer">Virement</option>
                    </select>
                  </fieldset>
                </div>
                <div className="col-3">
                  <fieldset className="custom-fieldset mb-0">
                    <legend>Montant</legend>
                    <input
                      type="number"
                      min="0.01"
                      value={p.amount}
                      onChange={(e) => {
                        setPayments((current) => current.map((payment, index) =>
                          index === i ? { ...payment, amount: e.target.value } : payment,
                        ));
                      }}
                    />
                  </fieldset>
                </div>
                <div className="col-4">
                  <fieldset className="custom-fieldset mb-0">
                    <legend>Compte payeur</legend>
                    <select
                      value={p.account_id}
                      required={Number(p.amount) > 0}
                      disabled={accountsLoading}
                      onChange={(e) => setPayments((current) => current.map((payment, index) =>
                        index === i ? { ...payment, account_id: e.target.value } : payment,
                      ))}
                    >
                      <option value="">Sélectionner</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}{account.store?.name ? ` — ${account.store.name}` : ' — Entreprise'}
                        </option>
                      ))}
                    </select>
                  </fieldset>
                </div>
                <div className="col-1 d-flex align-items-center">
                  <button type="button" className="btn btn-link text-danger p-0" onClick={() => setPayments(payments.filter((_, j) => j !== i))}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      </div>
    </FormModal>
  );
}
