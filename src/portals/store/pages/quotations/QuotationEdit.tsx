import React, { useContext, useState, useEffect } from 'react';
import { Edit, Trash2, Plus, FileText } from 'lucide-react';
import { useUpdateQuotation } from '../../hooks/quotations/useUpdateQuotation';
import { useCustomers } from '../../hooks/customers/useCustomers';
import { useProducts } from '../../../shared/hooks/products/useProducts';
import FormModal from '../../../shared/components/common/FormModal';
import type { Quotation } from '../../types/quotation';
import { AppContext } from '../../../shared/context/AppContext';

interface QuotationEditProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
  onSuccess: () => void;
}

export default function QuotationEdit({ isOpen, onClose, quotation, onSuccess }: QuotationEditProps) {
  const { activeStore } = useContext(AppContext);
  const store_id = activeStore?.id || '';
  const { customers } = useCustomers({ page: 1, per_page: 100, is_active: true });
  const { products } = useProducts({ page: 1, per_page: 100, is_active: true });

  const [customer_id, setCustomer] = useState('');
  const [date, setDate] = useState('');
  const [expiry_date, setExpiryDate] = useState('');
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');
  const [status, setStatus] = useState<any>('draft');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');

  const { updateQuotation, submitting } = useUpdateQuotation();

  useEffect(() => {
    if (quotation) {
      setCustomer(quotation.customer_id || quotation.customer?.id || '');
      setDate(quotation.date ? quotation.date.split('T')[0] : '');
      setExpiryDate(quotation.expiry_date ? quotation.expiry_date.split('T')[0] : '');
      setDiscount(quotation.discount?.toString() || '0');
      setTax(quotation.tax?.toString() || '0');
      setStatus(quotation.status || 'draft');
      setNotes(quotation.notes || '');
      setTerms(quotation.terms || '');
      setItems(
        quotation.items && quotation.items.length > 0
          ? quotation.items.map((i) => ({
              product_id: i.product_id,
              quantity: i.quantity,
              unit_price: i.unit_price,
              discount: i.discount || 0
            }))
          : [{ product_id: '', quantity: 1, unit_price: 0, discount: 0 }]
      );
    }
  }, [quotation]);

  if (!isOpen || !quotation) return null;

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p: any) => p.id === productId);
    const unitPrice = product ? Number(product.selling_price || product.price || 0) : 0;
    const next = [...items];
    next[index] = { ...next[index], product_id: productId, unit_price: unitPrice };
    setItems(next);
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: val };
    setItems(next);
  };

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 1, unit_price: 0, discount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, idx) => idx !== index));
    }
  };

  const subtotal = items.reduce((sum, item) => {
    const q = Number(item.quantity) || 0;
    const p = Number(item.unit_price) || 0;
    const d = Number(item.discount) || 0;
    return sum + (q * p - d);
  }, 0);

  const taxAmount = (subtotal * (Number(tax) || 0)) / 100;
  const totalAmount = Math.max(0, subtotal - (Number(discount) || 0) + taxAmount);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store_id || !customer_id) {
      setError('Le magasin et le client sont obligatoires.');
      return;
    }

    const res = await updateQuotation(quotation.id, {
      store_id,
      customer_id,
      date,
      expiry_date: expiry_date || null,
      subtotal,
      discount: Number(discount) || 0,
      tax: taxAmount,
      total_amount: totalAmount,
      status,
      notes,
      terms,
      items: items.map((x) => ({
        product_id: x.product_id,
        quantity: Number(x.quantity),
        unit_price: Number(x.unit_price),
        discount: Number(x.discount) || 0,
        total: Number(x.quantity) * Number(x.unit_price) - (Number(x.discount) || 0)
      }))
    });

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Modifier Devis - ${quotation.reference}`}
      icon={<Edit size={18} />}
      size="modal-xl"
      onSubmit={submit}
      submitting={submitting}
      submitLabel="Enregistrer les modifications"
      error={error}
    >
      <div className="row g-4">
        <div className="col-lg-8 border-end pe-lg-4">
          <div className="row g-2 mb-3">
            <div className="col-md-4">
              <fieldset className="custom-fieldset">
                <legend>Statut</legend>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="draft">Brouillon</option>
                  <option value="sent">Envoyé</option>
                  <option value="accepted">Accepté</option>
                  <option value="rejected">Refusé</option>
                </select>
              </fieldset>
            </div>
            <div className="col-md-4">
              <fieldset className="custom-fieldset">
                <legend>Magasin actif</legend>
                <div className="form-control bg-light">{activeStore?.name || 'Aucun magasin actif'}</div>
              </fieldset>
            </div>
            <div className="col-md-4">
              <fieldset className="custom-fieldset">
                <legend>Client</legend>
                <select value={customer_id} onChange={(e) => setCustomer(e.target.value)} required>
                  <option value="">Sélectionner un client</option>
                  {customers.map((x: any) => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </select>
              </fieldset>
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <fieldset className="custom-fieldset">
                <legend>Date du devis</legend>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </fieldset>
            </div>
            <div className="col-md-6">
              <fieldset className="custom-fieldset">
                <legend>Date d'expiration</legend>
                <input type="date" value={expiry_date} onChange={(e) => setExpiryDate(e.target.value)} />
              </fieldset>
            </div>
          </div>

          <div className="section-box mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary fs-7 fw-normal">Articles du devis</span>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm py-1 px-2 d-flex align-items-center gap-1"
                onClick={addItem}
              >
                <Plus size={13} /> Ajouter une ligne
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr className="bg-light text-muted" style={{ fontSize: '11px' }}>
                    <th style={{ width: '40%' }}>Article</th>
                    <th style={{ width: '15%' }}>Qté</th>
                    <th style={{ width: '20%' }}>P.U ($)</th>
                    <th style={{ width: '15%' }}>Remise ($)</th>
                    <th style={{ width: '10%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={item.product_id}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          required
                        >
                          <option value="">Sélectionner</option>
                          {products.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          className="form-control form-control-sm text-center"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-sm text-end"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-sm text-end"
                          value={item.discount}
                          onChange={(e) => handleItemChange(idx, 'discount', e.target.value)}
                        />
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-link text-danger p-0"
                          onClick={() => removeItem(idx)}
                          disabled={items.length <= 1}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card bg-light border-0 p-3 rounded-3 mb-3">
            <div className="d-flex justify-content-between mb-2 small text-muted">
              <span>Sous-total brut :</span>
              <span className="fw-semibold text-dark">{subtotal.toLocaleString()} $</span>
            </div>
            <div className="mb-2">
              <fieldset className="custom-fieldset">
                <legend>Remise globale ($)</legend>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-sm"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </fieldset>
            </div>
            <div className="mb-2">
              <fieldset className="custom-fieldset">
                <legend>Taux TVA (%)</legend>
                <input
                  type="number"
                  step="0.1"
                  className="form-control form-control-sm"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                />
              </fieldset>
            </div>
            <hr className="my-2" />
            <div className="d-flex justify-content-between align-items-center pt-1">
              <span className="fw-bold text-dark fs-6">TOTAL TTC :</span>
              <span className="fw-black text-primary fs-5">{totalAmount.toLocaleString()} $</span>
            </div>
          </div>
        </div>
      </div>
    </FormModal>
  );
}
