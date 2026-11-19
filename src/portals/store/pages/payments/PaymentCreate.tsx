import React, { useState } from "react";
import { Plus, CreditCard } from "lucide-react";
import { useCreatePayment } from "../../hooks/payments/useCreatePayment";
import { useSales } from "../../hooks/sales/useSales";
import FormModal from "../../../shared/components/common/FormModal";

export default function PaymentCreate({ isOpen, onClose, onSuccess }: any) {
  const { sales } = useSales({ page: 1, per_page: 100 });
  const [sale_id, setSale] = useState(""),
    [payment_method, setMethod] = useState("cash"),
    [amount, setAmount] = useState(""),
    [reference, setReference] = useState(""),
    [note, setNote] = useState(""),
    [error, setError] = useState("");
  const { createPayment, submitting } = useCreatePayment();

  if (!isOpen) return null;

  const submit = async (e: any) => {
    e.preventDefault();
    const r = await createPayment({
      sale_id,
      payment_method,
      amount: Number(amount),
      reference: reference || null,
      note: note || null,
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
      title="Nouveau paiement"
      icon={<Plus size={18} />}
      onSubmit={submit}
      submitting={submitting}
      error={error}
    >
      <span className="text-secondary d-flex align-items-center gap-1 mb-2 fs-7 fw-normal">
        <CreditCard size={14} /> Paiement client
      </span>
      <fieldset className="custom-fieldset">
        <legend>
          Vente <span className="text-danger">*</span>
        </legend>
        <select value={sale_id} onChange={(e) => setSale(e.target.value)} required>
          <option value="">Sélectionner</option>
          {sales
            .filter((x: any) => Number(x.remaining_amount) > 0)
            .map((x: any) => (
              <option key={x.id} value={x.id}>
                {x.reference} — reste {x.remaining_amount}
              </option>
            ))}
        </select>
      </fieldset>
      <fieldset className="custom-fieldset">
        <legend>
          Mode de paiement <span className="text-danger">*</span>
        </legend>
        <select value={payment_method} onChange={(e) => setMethod(e.target.value)}>
          <option value="cash">Espèces</option>
          <option value="card">Carte</option>
          <option value="mobile_money">Mobile money</option>
          <option value="bank_transfer">Virement</option>
        </select>
      </fieldset>
      <fieldset className="custom-fieldset">
        <legend>
          Montant <span className="text-danger">*</span>
        </legend>
        <input type="number" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </fieldset>
      <fieldset className="custom-fieldset">
        <legend>Référence</legend>
        <input value={reference} onChange={(e) => setReference(e.target.value)} />
      </fieldset>
      <fieldset className="custom-fieldset mb-0">
        <legend>Note</legend>
        <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </fieldset>
    </FormModal>
  );
}
