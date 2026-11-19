import React, { useContext, useMemo, useState } from "react";
import { CreditCard, Loader2, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useCreateSale } from "../../hooks/sales/useCreateSale";
import { useCustomers } from "../../hooks/customers/useCustomers";
import { useStocks } from "../../hooks/stocks/useStocks";
import { AppContext } from "../../../shared/context/AppContext";
import FormModal from "../../../shared/components/common/FormModal";

type SaleLine = {
  id: string;
  stock_id: string;
  quantity: string;
  unit_price: string;
};

type StockOption = {
  id: string;
  quantity?: number | string;
  reserved_quantity?: number | string;
  selling_price?: number | string;
  product?: { name?: string; sku?: string };
};

type CustomerOption = { id: string; name: string };

type PaymentLine = {
  payment_method: string;
  amount: string;
};

type SaleRecordType = 'completed' | 'draft';

type SaleCreateProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type SaleShowProps = {
  item?: Record<string, unknown>;
  isOpen: boolean;
  onClose: () => void;
};

const createLine = (): SaleLine => ({
  id: `${Date.now()}-${Math.random()}`,
  stock_id: "",
  quantity: "1",
  unit_price: "",
});

export default function SaleCreate({ isOpen, onClose, onSuccess }: SaleCreateProps) {
  const { activeStore } = useContext(AppContext);
  const { customers } = useCustomers({ page: 1, per_page: 100, is_active: true });
  const { stocks, loading: stocksLoading, error: stocksError } = useStocks({
    page: 1,
    per_page: 100,
    store_id: activeStore?.id || undefined,
    is_active: true,
  });
  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [recordType, setRecordType] = useState<SaleRecordType | "">("");
  const [items, setItems] = useState<SaleLine[]>([createLine()]);
  const [payments, setPayments] = useState<PaymentLine[]>([]);
  const [error, setError] = useState("");
  const { createSale, submitting } = useCreateSale();

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0),
    [items],
  );
  const discountAmount = Number(discount) || 0;
  const taxAmount = Number(tax) || 0;
  const total = Math.max(0, subtotal - discountAmount + taxAmount);

  if (!isOpen) return null;

  const updateLine = (id: string, changes: Partial<SaleLine>) => {
    setItems((current) => current.map((line) => line.id === id ? { ...line, ...changes } : line));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!activeStore?.id) {
      setError("Aucun magasin actif ne vous est assigné. Veuillez contacter un administrateur.");
      return;
    }
    if (!recordType) {
      setError("Choisissez le type d’enregistrement avant de continuer.");
      return;
    }
    if (
      items.length === 0 ||
      items.some((item) => (
        !item.stock_id ||
        !Number.isFinite(Number(item.quantity)) ||
        Number(item.quantity) <= 0 ||
        item.unit_price === "" ||
        !Number.isFinite(Number(item.unit_price)) ||
        Number(item.unit_price) < 0
      ))
    ) {
      setError("Chaque ligne doit contenir un produit, une quantité positive et un prix unitaire.");
      return;
    }
    if (
      !Number.isFinite(discountAmount) ||
      discountAmount < 0 ||
      !Number.isFinite(taxAmount) ||
      taxAmount < 0 ||
      discountAmount > subtotal
    ) {
      setError("La remise et la taxe doivent être valides, et la remise ne peut pas dépasser le sous-total.");
      return;
    }
    if (recordType === 'completed') {
      if (stocksLoading || stocksError) {
        setError(stocksError || "Attendez le chargement des stocks avant d’enregistrer la vente.");
        return;
      }
      for (const item of items) {
        const stock = stocks.find((entry: StockOption) => String(entry.id) === item.stock_id);
        const available = Number(stock?.quantity || 0) - Number(stock?.reserved_quantity || 0);
        if (!stock || Number(item.quantity) > available) {
          setError(`Stock insuffisant pour ${stock?.product?.name || "le produit sélectionné"}. Disponible : ${Math.max(0, available)}.`);
          return;
        }
      }
    }

    const result = await createSale({
      store_id: activeStore.id,
      customer_id: customerId || null,
      status: recordType,
      discount: discountAmount,
      tax: taxAmount,
      due_date: dueDate || null,
      items: items.map((item) => ({
        stock_id: item.stock_id,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      })),
      payments: recordType === 'draft' ? [] : payments
        .filter((payment) => payment.payment_method && Number(payment.amount) > 0)
        .map((payment) => ({ ...payment, amount: Number(payment.amount) })),
    });

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.message);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvelle vente"
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
            <div className="d-flex align-items-center gap-3" role="radiogroup" aria-label="Statut de la vente">
              {([
                { value: 'completed', label: 'Vente' },
                { value: 'draft', label: 'Brouillon' },
              ] as const).map((option) => (
                <label key={option.value} className="form-check d-flex align-items-center gap-2 mb-0">
                  <input
                    className="form-check-input m-0"
                    type="radio"
                    name="sale-record-type"
                    value={option.value}
                    checked={recordType === option.value}
                    onChange={() => setRecordType(option.value)}
                    disabled={submitting}
                  />
                  <span className="form-check-label">{option.label}</span>
                </label>
              ))}
            </div>
            <button type="submit" className="btn btn-primary px-4 fw-normal d-flex align-items-center gap-1" disabled={submitting || !recordType}>
              {submitting && <Loader2 size={14} className="spinner-border spinner-border-sm me-1" />}
              Enregistrer
            </button>
          </div>
          {recordType === 'draft' && (
            <small className="text-muted w-100 text-end">Le stock ne sera pas déduit et aucun paiement ne sera enregistré avant validation.</small>
          )}
        </div>
      )}
    >
      <div className="row g-4">
        <div className="col-lg-8 border-end pe-lg-4">
          <span className="text-secondary d-flex align-items-center gap-1 mb-2 fs-7 fw-normal">
            <ShoppingCart size={14} /> Informations générales
          </span>
          <fieldset className="custom-fieldset mb-3">
            <legend>Client</legend>
            <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              <option value="">Client comptant</option>
              {customers.map((customer: CustomerOption) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
          </fieldset>

          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="text-secondary fs-7 fw-normal">Lignes de vente</span>
          </div>
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th style={{ width: 115 }}>Quantité</th>
                  <th style={{ width: 140 }}>Prix unitaire</th>
                  <th className="text-end" style={{ width: 130 }}>Total</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const stock = stocks.find((entry: StockOption) => String(entry.id) === item.stock_id);
                  const selectedElsewhere = items.filter((line) => line.id !== item.id).map((line) => line.stock_id);
                  const lineTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
                  return (
                    <tr key={item.id}>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={item.stock_id}
                          required
                          onChange={(event) => {
                            const selected = stocks.find((entry: StockOption) => entry.id === event.target.value);
                            updateLine(item.id, {
                              stock_id: event.target.value,
                              unit_price: selected ? String(Number(selected.selling_price || 0)) : "",
                            });
                          }}
                        >
                          <option value="">Sélectionner un produit</option>
                          {stocks.map((entry: StockOption) => (
                            <option key={entry.id} value={entry.id} disabled={selectedElsewhere.includes(String(entry.id))}>
                              {entry.product?.name || "Produit"}{entry.product?.sku ? ` — ${entry.product.sku}` : ""} (disponible: {Math.max(0, Number(entry.quantity || 0) - Number(entry.reserved_quantity || 0))})
                            </option>
                          ))}
                        </select>
                        {stock && <small className="text-muted">Stock disponible : {Math.max(0, Number(stock.quantity || 0) - Number(stock.reserved_quantity || 0))}</small>}
                      </td>
                      <td>
                        <input className="form-control form-control-sm" type="number" min="0.001" step="0.001" required value={item.quantity} onChange={(event) => updateLine(item.id, { quantity: event.target.value })} />
                      </td>
                      <td>
                        <input className="form-control form-control-sm" type="number" min="0" step="0.01" required value={item.unit_price} onChange={(event) => updateLine(item.id, { unit_price: event.target.value })} />
                      </td>
                      <td className="text-end fw-semibold">{lineTotal.toLocaleString()} $</td>
                      <td>
                        <button type="button" className="btn btn-link text-danger p-1" aria-label={`Supprimer la ligne ${index + 1}`} onClick={() => setItems((current) => current.filter((line) => line.id !== item.id))}>
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn btn-sm btn-outline-primary mt-2" onClick={() => setItems((current) => [...current, createLine()])}>
            <Plus size={14} className="me-1" /> Ajouter une ligne
          </button>
        </div>

        <div className="col-lg-4 ps-lg-3">
          <div className="section-box mb-3">
            <span className="text-secondary d-block mb-2 fs-7 fw-normal">Montants</span>
            <div className="d-flex justify-content-between mb-1 small text-muted">
              <span>Sous-total :</span><span className="fw-semibold text-dark">{subtotal.toLocaleString()} $</span>
            </div>
            <fieldset className="custom-fieldset">
              <legend>Remise</legend>
              <input type="number" min="0" step="0.01" value={discount} onChange={(event) => setDiscount(event.target.value)} />
            </fieldset>
            <fieldset className="custom-fieldset">
              <legend>Taxe</legend>
              <input type="number" min="0" step="0.01" value={tax} onChange={(event) => setTax(event.target.value)} />
            </fieldset>
            <div className="d-flex justify-content-between mb-2 small">
              <span>Total :</span><span className="fw-bold text-primary">{total.toLocaleString()} $</span>
            </div>
            <fieldset className="custom-fieldset mb-0">
              <legend>Échéance</legend>
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </fieldset>
          </div>

          {recordType === 'completed' && <div className="section-box">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary fs-7 fw-normal d-flex align-items-center gap-1"><CreditCard size={14} /> Paiements initiaux</span>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setPayments((current) => [...current, { payment_method: "", amount: "" }])}>Ajouter</button>
            </div>
            {payments.map((payment, index) => (
              <div className="row g-2 mb-2" key={index}>
                <div className="col-6">
                  <fieldset className="custom-fieldset mb-0">
                    <legend>Mode</legend>
                    <select value={payment.payment_method} onChange={(event) => setPayments((current) => current.map((entry, i) => i === index ? { ...entry, payment_method: event.target.value } : entry))}>
                      <option value="">Mode</option>
                      <option value="cash">Espèces</option><option value="card">Carte</option><option value="mobile_money">Mobile money</option><option value="bank_transfer">Virement</option>
                    </select>
                  </fieldset>
                </div>
                <div className="col-5">
                  <fieldset className="custom-fieldset mb-0">
                    <legend>Montant</legend>
                    <input type="number" min="0.01" step="0.01" value={payment.amount} onChange={(event) => setPayments((current) => current.map((entry, i) => i === index ? { ...entry, amount: event.target.value } : entry))} />
                  </fieldset>
                </div>
                <div className="col-1 d-flex align-items-center">
                  <button type="button" className="btn btn-link text-danger p-0" aria-label="Supprimer le paiement" onClick={() => setPayments((current) => current.filter((_, i) => i !== index))}><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>}
        </div>
      </div>
    </FormModal>
  );
}

export function SaleShow({ item, isOpen, onClose }: SaleShowProps) {
  if (!isOpen || !item) return null;
  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,.5)" }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Détails Vente</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {Object.entries(item).map(([key, value]) => (
              <div className="mb-2" key={key}>
                <div className="text-muted" style={{ fontSize: 12 }}>{key}</div>
                <div className="fw-semibold">{String(value ?? "—")}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
