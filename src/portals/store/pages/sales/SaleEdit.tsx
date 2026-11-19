import React, { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, CreditCard, ShoppingCart, Trash2, Plus, User,
  Calendar, Receipt, Package
} from 'lucide-react';
import { useStoreCurrencyConverter } from '../../hooks/currency/useStoreCurrencyConverter';
import { useSale, type Sale } from '../../hooks/sales/useSale';
import { useUpdateSale } from '../../hooks/sales/useUpdateSale';
import { useCustomers } from '../../hooks/customers/useCustomers';
import { toast } from 'react-toastify';
import { Loader } from '../../../shared/components/common/Loader';
import { AppContext } from '../../../shared/context/AppContext';
import { useStocks } from '../../hooks/stocks/useStocks';

interface StockOption {
  id: string | number;
  quantity?: number | string;
  reserved_quantity?: number | string;
  selling_price?: number | string;
  product?: { name?: string; sku?: string };
}

interface EditableSaleLine {
  id: string;
  stock_id: string;
  quantity: string;
  unit_price: string;
}

const createSaleLine = (): EditableSaleLine => ({
  id: `${Date.now()}-${Math.random()}`,
  stock_id: '',
  quantity: '1',
  unit_price: '',
});

interface CustomerOption {
  id: string | number;
  name: string;
}

function isCustomerOption(customer: unknown): customer is CustomerOption {
  return typeof customer === 'object'
    && customer !== null
    && ('id' in customer)
    && (typeof customer.id === 'string' || typeof customer.id === 'number')
    && ('name' in customer)
    && typeof customer.name === 'string';
}

function formatDateInput(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export default function SaleEdit() {
  const { id } = useParams<{ id: string }>();
  const { item, loading: loadingSale } = useSale(id);

  if (loadingSale) {
    return <Loader />;
  }

  if (!item) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning">Vente introuvable.</div>
      </div>
    );
  }

  return <SaleEditForm key={item.id} id={id} item={item} />;
}

function SaleEditForm({ id, item }: { id?: string; item: Sale }) {
  const navigate = useNavigate();
  const { activeStore } = useContext(AppContext);
  const { formatFromUSD } = useStoreCurrencyConverter();
  const { updateSale, submitting } = useUpdateSale();
  const { customers } = useCustomers({ page: 1, per_page: 100, is_active: true });
  const isDraft = item.status?.toLowerCase() === 'draft';
  const { stocks, loading: loadingStocks, error: stocksError } = useStocks({
    page: 1,
    per_page: 100,
    store_id: item.store_id ?? activeStore?.id,
    is_active: true,
  });

  const [customerId, setCustomerId] = useState(item.customer_id?.toString() || '');
  const [discount, setDiscount] = useState(item.discount ?? 0);
  const [tax, setTax] = useState(item.tax ?? 0);
  const [dueDate, setDueDate] = useState(item.due_date ? formatDateInput(item.due_date) : '');
  const [recordStatus, setRecordStatus] = useState<'completed' | 'draft'>('draft');
  const [lines, setLines] = useState<EditableSaleLine[]>(() => (item.items ?? []).map((saleItem, index) => ({
    id: String(saleItem.id ?? `existing-${index}`),
    stock_id: saleItem.stock_id == null ? '' : String(saleItem.stock_id),
    quantity: String(saleItem.quantity),
    unit_price: String(saleItem.unit_price),
  })));
  const [formError, setFormError] = useState('');
  const customerOptions = customers.filter(isCustomerOption);
  const stockOptions = stocks as StockOption[];

  const handleLineChange = (lineId: string, changes: Partial<EditableSaleLine>) => {
    setLines((current) => current.map((line) => (
      line.id === lineId ? { ...line, ...changes } : line
    )));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setFormError('');

    if (isDraft && (
      lines.length === 0
      || lines.some((line) => (
        !line.stock_id
        || !Number.isFinite(Number(line.quantity))
        || Number(line.quantity) <= 0
        || line.unit_price === ''
        || !Number.isFinite(Number(line.unit_price))
        || Number(line.unit_price) < 0
      ))
    )) {
      setFormError('Chaque ligne doit contenir un produit, une quantité positive et un prix unitaire valide.');
      return;
    }

    if (isDraft && (
      !Number.isFinite(Number(discount))
      || Number(discount) < 0
      || !Number.isFinite(Number(tax))
      || Number(tax) < 0
    )) {
      setFormError('La remise et la taxe doivent être des montants positifs ou nuls.');
      return;
    }

    if (isDraft && recordStatus === 'completed') {
      const total = Math.round((
        lines.reduce((sum, line) => sum + Number(line.quantity) * Number(line.unit_price), 0)
        - Number(discount)
        + Number(tax)
      ) * 100) / 100;
      if (total > 0 && !customerId) {
        setFormError('Sélectionnez un client avant de convertir le brouillon en vente.');
        return;
      }
      if (loadingStocks) {
        setFormError('Attendez le chargement des stocks avant d’enregistrer la vente.');
        return;
      }
      if (stocksError) {
        setFormError(stocksError);
        return;
      }

      const quantitiesByStock = new Map<string, number>();
      lines.forEach((line) => {
        quantitiesByStock.set(
          line.stock_id,
          (quantitiesByStock.get(line.stock_id) || 0) + Number(line.quantity),
        );
      });
      for (const [stockId, quantity] of quantitiesByStock) {
        const stock = stockOptions.find((entry) => String(entry.id) === stockId);
        const available = Number(stock?.quantity || 0) - Number(stock?.reserved_quantity || 0);
        if (!stock || quantity > available) {
          setFormError(`Stock insuffisant pour ${stock?.product?.name || 'le produit sélectionné'}. Disponible : ${Math.max(0, available)}.`);
          return;
        }
      }
    }

    const payload = isDraft ? {
      customer_id: customerId || null,
      discount: Number(discount),
      tax: Number(tax),
      due_date: dueDate || null,
      status: recordStatus,
      items: lines.map((line) => ({
        stock_id: line.stock_id,
        quantity: Number(line.quantity),
        unit_price: Number(line.unit_price),
      })),
    } : { due_date: dueDate || null };

    try {
      const result = await updateSale(id, payload);
      if (!result.success) {
        setFormError(result.message);
        return;
      }
      toast.success("Vente mise à jour avec succès");
      navigate(`/pos/sales/${id}`);
    } catch (error) {
      setFormError("Erreur lors de la mise à jour de la vente");
      console.error("Update Sale Error:", error);
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn btn-link text-decoration-none p-0 mb-2 d-flex align-items-center" onClick={() => navigate(`/pos/sales/${id}`)}>
            <ArrowLeft className="me-2" size={20} />
            Retour aux détails
          </button>
          <h2 className="mb-0 d-flex align-items-center">
            <Receipt className="me-3" size={28} />
            Modifier la Vente {item?.reference && <span className="text-muted ms-2">#{item.reference}</span>}
          </h2>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary d-flex align-items-center" onClick={() => navigate(`/pos/sales/${id}`)}>
            Annuler
          </button>
          <button 
            type="submit"
            form="sale-edit-form"
            className="btn btn-primary d-flex align-items-center" 
            disabled={submitting}
          >
            <Save size={18} className="me-2" /> 
            {submitting
              ? 'Enregistrement...'
              : isDraft && recordStatus === 'draft'
                ? 'Enregistrer le brouillon'
                : 'Enregistrer'}
          </button>
        </div>
      </div>

      <form id="sale-edit-form" onSubmit={handleSubmit}>
        {formError && <div className="alert alert-danger" role="alert">{formError}</div>}
        <div className="row g-4">
          {/* Left Column - Form Fields */}
          <div className="col-lg-8">
            <div className="card shadow-sm rounded-3 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title d-flex align-items-center mb-4">
                  <User className="me-2 text-primary" size={20} />
                  Informations Générales
                </h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Client</label>
                    <select 
                      className="form-select" 
                      value={customerId} 
                      onChange={(e) => setCustomerId(e.target.value)}
                      disabled={!isDraft}
                    >
                      <option value="">Sélectionner un client</option>
                      {customerOptions.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Date d'échéance</label>
                    <div className="input-group">
                      <span className="input-group-text"><Calendar size={18} /></span>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Remise</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      disabled={!isDraft}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Taxe</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={tax}
                      onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      disabled={!isDraft}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card shadow-sm rounded-3">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="card-title d-flex align-items-center mb-0">
                    <ShoppingCart className="me-2 text-primary" size={20} />
                    {isDraft ? 'Articles du brouillon' : 'Articles vendus (lecture seule)'}
                  </h5>
                </div>
                {isDraft && stocksError && <div className="alert alert-danger py-2">{stocksError}</div>}
                {isDraft && loadingStocks && <p className="text-muted small">Chargement des stocks…</p>}
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Produit</th>
                        <th className="text-center">Quantité</th>
                        <th className="text-end">Prix unitaire</th>
                        <th className="text-end">Total</th>
                        {isDraft && <th />}
                      </tr>
                    </thead>
                    <tbody>
                      {(isDraft ? lines.length > 0 : Boolean(item.items?.length)) ? (
                        isDraft ? (
                          lines.map((line, index) => {
                            const selectedStock = stockOptions.find((stock) => String(stock.id) === line.stock_id);
                            const selectedElsewhere = lines
                              .filter((otherLine) => otherLine.id !== line.id)
                              .map((otherLine) => otherLine.stock_id);
                            return (
                              <tr key={line.id}>
                                <td>
                                  <select
                                    className="form-select form-select-sm"
                                    value={line.stock_id}
                                    required
                                    onChange={(event) => {
                                      const selected = stockOptions.find((stock) => String(stock.id) === event.target.value);
                                      handleLineChange(line.id, {
                                        stock_id: event.target.value,
                                        unit_price: selected ? String(Number(selected.selling_price || 0)) : '',
                                      });
                                    }}
                                  >
                                    <option value="">Sélectionner un produit</option>
                                    {stockOptions.map((stock) => (
                                      <option
                                        key={stock.id}
                                        value={stock.id}
                                        disabled={selectedElsewhere.includes(String(stock.id))}
                                      >
                                        {stock.product?.name || `Produit #${stock.id}`}
                                        {stock.product?.sku ? ` — ${stock.product.sku}` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <input
                                    className="form-control form-control-sm text-center"
                                    type="number"
                                    min="0.001"
                                    step="0.001"
                                    required
                                    value={line.quantity}
                                    onChange={(event) => handleLineChange(line.id, { quantity: event.target.value })}
                                  />
                                </td>
                                <td>
                                  <input
                                    className="form-control form-control-sm text-end"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    value={line.unit_price}
                                    onChange={(event) => handleLineChange(line.id, { unit_price: event.target.value })}
                                  />
                                </td>
                                <td className="text-end fw-bold">
                                  {formatFromUSD((Number(line.quantity) || 0) * (Number(line.unit_price) || 0))}
                                  {selectedStock && (
                                    <small className="d-block text-muted">
                                      Disponible : {Math.max(0, Number(selectedStock.quantity || 0) - Number(selectedStock.reserved_quantity || 0))}
                                    </small>
                                  )}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-link text-danger p-0"
                                    aria-label={`Supprimer la ligne ${index + 1}`}
                                    onClick={() => setLines((current) => current.filter((currentLine) => currentLine.id !== line.id))}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          item.items.map((saleItem, index) => (
                            <tr key={saleItem.id ?? index}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <Package size={16} className="me-2 text-muted" />
                                  {saleItem.product?.name || saleItem.product_name || `Produit #${saleItem.product_id}`}
                                </div>
                              </td>
                              <td className="text-center">{saleItem.quantity}</td>
                              <td className="text-end">{formatFromUSD(saleItem.unit_price)}</td>
                              <td className="text-end fw-bold">
                                {formatFromUSD(saleItem.subtotal ?? saleItem.quantity * saleItem.unit_price)}
                              </td>
                            </tr>
                          ))
                        )
                      ) : (
                        <tr>
                          <td colSpan={isDraft ? 5 : 4} className="text-center text-muted py-4">Aucun article</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {isDraft && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary mt-3 d-flex align-items-center"
                    onClick={() => setLines((current) => [...current, createSaleLine()])}
                  >
                    <Plus size={16} className="me-1" /> Ajouter une ligne de vente
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Payments */}
          <div className="col-lg-4">
            <div className="card shadow-sm rounded-3">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="card-title d-flex align-items-center mb-0">
                    <CreditCard className="me-2 text-primary" size={20} />
                    {isDraft ? 'Paiements' : 'Paiements enregistrés'}
                  </h5>
                </div>
                {isDraft ? (
                  <p className="text-muted text-center py-4 mb-0">
                    Aucun paiement n’est enregistré tant que la vente reste en brouillon.
                  </p>
                ) : item.payments?.length ? (
                  <div className="d-flex flex-column gap-3">
                    {item.payments.map((payment, index) => (
                      <div key={index} className="p-3 border rounded bg-light">
                        <strong>Paiement #{index + 1}</strong>
                        <div className="small text-muted mt-1">
                          {payment.payment_method} · {formatFromUSD(payment.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center py-4 mb-0">Aucun paiement enregistré.</p>
                )}
              </div>
            </div>
            {isDraft && (
              <fieldset className="custom-fieldset mt-3">
                <legend>Type d’enregistrement</legend>
                <div className="d-flex flex-wrap gap-3" role="radiogroup" aria-label="Statut du brouillon">
                  {([
                    { value: 'draft', label: 'Brouillon' },
                    { value: 'completed', label: 'Vente enregistrée' },
                  ] as const).map((option) => (
                    <label key={option.value} className="form-check d-flex align-items-center gap-2 mb-0">
                      <input
                        className="form-check-input m-0"
                        type="radio"
                        name="sale-edit-record-status"
                        value={option.value}
                        checked={recordStatus === option.value}
                        onChange={() => setRecordStatus(option.value)}
                      />
                      <span className="form-check-label">{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}