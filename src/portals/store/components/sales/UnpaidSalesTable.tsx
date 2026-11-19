import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormModal from '../../../shared/components/common/FormModal';
import { useStoreCurrencyConverter } from '../../hooks/currency/useStoreCurrencyConverter';
import { useCreatePayment } from '../../hooks/payments/useCreatePayment';
import type { ReceivableSale } from '../../hooks/reports/useReceivables';

interface UnpaidSalesTableProps {
  sales: ReceivableSale[];
  onPaymentSuccess: () => void | Promise<void>;
}

const isOverdue = (dateString: string) => new Date(dateString) < new Date();

export default function UnpaidSalesTable({ sales, onPaymentSuccess }: UnpaidSalesTableProps) {
  const { formatFromUSD: formatCurrency } = useStoreCurrencyConverter();
  const { createPayment, submitting } = useCreatePayment();
  const [selectedSale, setSelectedSale] = useState<ReceivableSale | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const openPaymentModal = (sale: ReceivableSale) => {
    setSelectedSale(sale);
    setPaymentMethod('cash');
    setAmount(String(sale.remaining_amount));
    setReference('');
    setNote('');
    setError('');
  };

  const closePaymentModal = () => {
    if (submitting) return;
    setSelectedSale(null);
  };

  const submitPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSale) return;

    const paymentAmount = Number(amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setError('Saisissez un montant supérieur à zéro.');
      return;
    }
    if (paymentAmount > selectedSale.remaining_amount) {
      setError(`Le montant ne peut pas dépasser le solde restant (${formatCurrency(selectedSale.remaining_amount)}).`);
      return;
    }

    const result = await createPayment({
      sale_id: selectedSale.id,
      payment_method: paymentMethod,
      amount: paymentAmount,
      reference: reference.trim() || null,
      note: note.trim() || null,
    });

    if (!result.success) {
      setError(result.message);
      return;
    }

    setSelectedSale(null);
    toast.success(result.message || 'Paiement enregistré.');
    await onPaymentSuccess();
  };

  return (
    <>
      <div className="bg-light p-3 p-md-4 border-bottom">
        <h6 className="mb-3 text-muted fs-6">Détail des ventes impayées</h6>
        <div className="table-responsive bg-white rounded-3 border">
          <table className="table table-sm table-borderless mb-0">
            <thead className="border-bottom bg-light-subtle">
              <tr>
                <th className="px-3 py-2 text-muted fw-medium" style={{ fontSize: '12px' }}>Référence</th>
                <th className="px-3 py-2 text-muted fw-medium" style={{ fontSize: '12px' }}>Date</th>
                <th className="px-3 py-2 text-muted fw-medium text-end" style={{ fontSize: '12px' }}>Total</th>
                <th className="px-3 py-2 text-muted fw-medium text-end" style={{ fontSize: '12px' }}>Payé</th>
                <th className="px-3 py-2 text-muted fw-medium text-end" style={{ fontSize: '12px' }}>Restant</th>
                <th className="px-3 py-2 text-muted fw-medium" style={{ fontSize: '12px' }}>Échéance</th>
                <th className="px-3 py-2 text-muted fw-medium text-center" style={{ fontSize: '12px' }}>Statut</th>
                <th className="px-3 py-2 text-muted fw-medium text-end" style={{ fontSize: '12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-bottom border-light-subtle">
                  <td className="px-3 py-2 fw-medium" style={{ fontSize: '13px' }}>
                    <Link
                      to={`/pos/sales/${sale.id}`}
                      className="text-primary text-decoration-none"
                      aria-label={`Ouvrir la facture ${sale.reference}`}
                    >
                      {sale.reference}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted" style={{ fontSize: '13px' }}>{new Date(sale.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-end" style={{ fontSize: '13px' }}>{formatCurrency(sale.total)}</td>
                  <td className="px-3 py-2 text-end text-success" style={{ fontSize: '13px' }}>{formatCurrency(sale.paid_amount)}</td>
                  <td className="px-3 py-2 text-end fw-bold text-danger" style={{ fontSize: '13px' }}>{formatCurrency(sale.remaining_amount)}</td>
                  <td className="px-3 py-2" style={{ fontSize: '13px' }}>
                    {sale.due_date && (
                      <span className={isOverdue(sale.due_date) ? 'text-danger' : ''}>
                        {new Date(sale.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center" style={{ fontSize: '13px' }}>
                    <span className={`badge ${sale.payment_status === 'unpaid' ? 'bg-danger' : 'bg-warning'} text-white`}>
                      {sale.payment_status === 'unpaid' ? 'Non payé' : 'Payé partiel.'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                      onClick={() => openPaymentModal(sale)}
                      aria-label={`Ajouter un paiement à la facture ${sale.reference}`}
                    >
                      <CreditCard size={14} />
                      Payer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <FormModal
        isOpen={Boolean(selectedSale)}
        onClose={closePaymentModal}
        title={`Paiement de la facture ${selectedSale?.reference ?? ''}`}
        icon={<CreditCard size={18} />}
        onSubmit={submitPayment}
        submitting={submitting}
        error={error}
        submitLabel="Enregistrer le paiement"
      >
        <p className="text-muted small mb-3">
          Solde restant : <strong className="text-danger">{formatCurrency(selectedSale?.remaining_amount ?? 0)}</strong>
        </p>
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
            max={selectedSale?.remaining_amount}
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </fieldset>
        <fieldset className="custom-fieldset">
          <legend>Référence</legend>
          <input value={reference} onChange={(event) => setReference(event.target.value)} maxLength={100} />
        </fieldset>
        <fieldset className="custom-fieldset mb-0">
          <legend>Note</legend>
          <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} maxLength={255} />
        </fieldset>
      </FormModal>
    </>
  );
}
