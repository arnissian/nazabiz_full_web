import React, { useContext, useMemo, useState, type FormEvent } from 'react';
import { Plus, Trash2, FileText, ShoppingBag } from 'lucide-react';
import { useCreateQuotation } from '../../hooks/quotations/useCreateQuotation';
import { useCustomers } from '../../hooks/customers/useCustomers';
import { useProducts } from '../../../shared/hooks/products/useProducts';
import type { ProductOption, ProductQueryParams } from '../../../shared/hooks/products/useProducts';
import { AppContext } from '../../../shared/context/AppContext';
import FormModal from '../../../shared/components/common/FormModal';
import { Loader } from '../../../shared/components/common/Loader';

interface QuotationCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface QuotationLine {
  id: number;
  product_id: string;
  product_name: string;
  quantity: string;
  unit_price: string;
}

const createQuotationLine = (id: number): QuotationLine => ({
  id,
  product_id: '',
  product_name: '',
  quantity: '1',
  unit_price: '',
});

export default function QuotationCreate({ isOpen, onClose, onSuccess }: QuotationCreateProps) {
  const { activeStore } = useContext(AppContext);
  const { customers } = useCustomers({ page: 1, per_page: 100, is_active: true });
  const {
    products,
    loading: productsLoading,
    error: productsError,
    params: productParams,
    setParams: setProductParams,
  } = useProducts({ page: 1, per_page: 100, is_active: true });

  const store_id = activeStore?.id || '';
  const [customer_id, setCustomer] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiry_date, setExpiryDate] = useState('');
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Validité de l\'offre : 30 jours à compter de la date d\'émission.');
  const [items, setItems] = useState<QuotationLine[]>([createQuotationLine(0)]);
  const [error, setError] = useState('');
  const { createQuotation, submitting } = useCreateQuotation();

  const subtotal = useMemo(
    () => items.reduce(
      (sum, item) => sum + (Number(item.unit_price) || 0) * (Number(item.quantity) || 0),
      0,
    ),
    [items],
  );
  const taxAmount = (subtotal * (Number(tax) || 0)) / 100;
  const discountAmount = Number(discount) || 0;
  const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);
  const searchTerm = productParams.search || '';

  if (!isOpen) return null;

  const updateItem = (lineId: number, changes: Partial<QuotationLine>) => {
    setItems((current) =>
      current.map((item) => item.id === lineId ? { ...item, ...changes } : item),
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!store_id) {
      setError('Aucun magasin actif ne vous est assigné. Veuillez contacter un administrateur.');
      return;
    }
    if (!customer_id) {
      setError('Le client est requis.');
      return;
    }
    if (items.length === 0 || items.some((item) => !item.product_id)) {
      setError('Sélectionnez un produit pour chaque ligne du devis.');
      return;
    }
    if (items.some((item) => !item.quantity.trim() || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0)) {
      setError('La quantité de chaque ligne doit être supérieure à zéro.');
      return;
    }
    if (items.some((item) => !item.unit_price.trim() || !Number.isFinite(Number(item.unit_price)) || Number(item.unit_price) < 0)) {
      setError('Renseignez un prix unitaire valide pour chaque ligne.');
      return;
    }

    const response = await createQuotation({
      store_id,
      customer_id,
      date,
      expiry_date: expiry_date || null,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total_amount: totalAmount,
      status: 'draft',
      notes,
      terms,
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        discount: 0,
      })),
    });

    if (response.success) {
      onSuccess();
      onClose();
    } else {
      setError(response.message);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouveau Devis"
      icon={<FileText size={18} />}
      size="modal-xl"
      onSubmit={submit}
      submitting={submitting}
      submitLabel="Créer le devis"
      error={error}
    >
      <div className="row g-4">
        <div className="col-lg-8 border-end pe-lg-4">
          <span className="text-secondary d-flex align-items-center gap-1 mb-2 fs-7 fw-normal">
            <ShoppingBag size={14} /> Informations générales
          </span>
          <div className="row g-2 mb-3">
            <div className="col-md-12">
              <fieldset className="custom-fieldset mb-0">
                <legend>Client</legend>
                <select value={customer_id} onChange={(event) => setCustomer(event.target.value)} required>
                  <option value="">Sélectionner un client</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </fieldset>
            </div>
            <div className="col-md-6">
              <fieldset className="custom-fieldset">
                <legend>Date du devis</legend>
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
              </fieldset>
            </div>
            <div className="col-md-6">
              <fieldset className="custom-fieldset">
                <legend>Date d'expiration</legend>
                <input type="date" value={expiry_date} onChange={(event) => setExpiryDate(event.target.value)} />
              </fieldset>
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
            <span className="text-secondary d-flex align-items-center gap-1 fs-7 fw-normal">
              <ShoppingBag size={14} /> Lignes du devis
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              onClick={() => setItems((current) => [...current, createQuotationLine(Date.now() + Math.random())])}
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
              onChange={(event) => setProductParams((previous: ProductQueryParams) => ({
                ...previous,
                search: event.target.value || undefined,
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
                    <th style={{ width: '125px' }}>Quantité</th>
                    <th style={{ width: '160px' }}>Prix unitaire</th>
                    <th style={{ width: '140px' }} className="text-end">Total ligne</th>
                    <th style={{ width: '44px' }} />
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
                                product_name: product?.name || '',
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
                                {product.name}{product.sku ? ` — ${product.sku}` : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            className="form-control form-control-sm"
                            type="number"
                            min="0.01"
                            step="0.01"
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
                        <td className="text-end fw-semibold">{lineTotal.toLocaleString()} $</td>
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
              <legend>Remise ($)</legend>
              <input type="number" min="0" step="0.01" value={discount} onChange={(event) => setDiscount(event.target.value)} />
            </fieldset>
            <fieldset className="custom-fieldset">
              <legend>Taxe (%)</legend>
              <input type="number" min="0" step="0.01" value={tax} onChange={(event) => setTax(event.target.value)} />
            </fieldset>
            <div className="d-flex justify-content-between mb-1 small text-muted">
              <span>Total:</span>
              <span className="fw-bold text-primary">{totalAmount.toLocaleString()} $</span>
            </div>
          </div>

          <div className="section-box">
            <fieldset className="custom-fieldset mb-2">
              <legend>Notes</legend>
              <textarea
                className="form-control"
                rows={2}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Notes supplémentaires..."
              />
            </fieldset>
            <fieldset className="custom-fieldset mb-0">
              <legend>Conditions</legend>
              <textarea className="form-control" rows={2} value={terms} onChange={(event) => setTerms(event.target.value)} />
            </fieldset>
          </div>
        </div>
      </div>
    </FormModal>
  );
}
