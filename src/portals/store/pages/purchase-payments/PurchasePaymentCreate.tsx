import React, { useState, type FormEvent } from "react";
import { Plus, CreditCard } from "lucide-react";
import { useCreatePurchasePayment } from "../../hooks/purchase-payments/useCreatePurchasePayment";
import { usePurchases } from "../../hooks/purchases/usePurchases";
import FormModal from "../../../shared/components/common/FormModal";
import { useFinancialAccounts } from "../../../shared/hooks/financial-accounts/useFinancialAccounts";

interface PurchasePaymentCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PurchaseOption extends Record<string, unknown> {
  id: string;
  reference: string;
  remaining_amount: number | string;
}

export default function PurchasePaymentCreate({ isOpen, onClose, onSuccess }: PurchasePaymentCreateProps) {
  const { purchases } = usePurchases({ page: 1, per_page: 100 });
  const unpaidPurchases = purchases.filter((purchase): purchase is PurchaseOption =>
    typeof purchase.id === 'string'
    && typeof purchase.reference === 'string'
    && Number(purchase.remaining_amount) > 0
  );
  const [purchase_id, setPurchase] = useState(""),
    [payment_method, setMethod] = useState("cash"),
    [account_id, setAccount] = useState(""),
    [amount, setAmount] = useState(""),
    [reference, setReference] = useState(""),
    [note, setNote] = useState(""),
    [error, setError] = useState("");
  const { createPurchasePayment, submitting } = useCreatePurchasePayment();
  const { accounts, loading: accountsLoading } = useFinancialAccounts(true, undefined, 'store');

  if (!isOpen) return null;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const r = await createPurchasePayment({
      purchase_id,
      payment_method,
      account_id,
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
      title="Nouveau paiement fournisseur"
      icon={<Plus size={18} />}
      onSubmit={submit}
      submitting={submitting}
      error={error}
    >
      <span className="text-secondary d-flex align-items-center gap-1 mb-2 fs-7 fw-normal">
        <CreditCard size={14} /> Paiement fournisseur
      </span>
      <fieldset className="custom-fieldset">
        <legend>
          Achat <span className="text-danger">*</span>
        </legend>
        <select value={purchase_id} onChange={(e) => setPurchase(e.target.value)} required>
          <option value="">Sélectionner</option>
          {unpaidPurchases.map((purchase) => (
              <option key={purchase.id} value={purchase.id}>
                {purchase.reference} — reste {purchase.remaining_amount}
              </option>
            ))}
        </select>
      </fieldset>
      <fieldset className="custom-fieldset">
        <legend>
          Compte payeur <span className="text-danger">*</span>
        </legend>
        <select value={account_id} onChange={(e) => setAccount(e.target.value)} required disabled={accountsLoading}>
          <option value="">Sélectionner</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}{account.store?.name ? ` — ${account.store.name}` : ' — Entreprise'}
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
