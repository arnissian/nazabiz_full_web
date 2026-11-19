import React, { useState, useContext } from 'react';
import { Plus } from 'lucide-react';
import { useCreateExpense } from '../../hooks/expenses/useCreateExpense';
import { useExpenseCategories } from '../../hooks/expenses/useExpenseCategories';
import { AppContext } from '../../../shared/context/AppContext';
import FormModal from '../../../shared/components/common/FormModal';
import { useFinancialAccounts } from '../../../shared/hooks/financial-accounts/useFinancialAccounts';

interface ExpenseCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExpenseCreate({ isOpen, onClose, onSuccess }: ExpenseCreateProps) {
  const { activeStore } = useContext(AppContext);
  const { categories } = useExpenseCategories();
  const { accounts, loading: accountsLoading, error: accountsError } = useFinancialAccounts(true, undefined, 'store');

  const store_id = activeStore?.id || '';
  const [category_id, setCategory] = useState('');
  const [account_id, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payment_method, setPaymentMethod] = useState('cash');
  const [reference_no, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const { createExpense, submitting } = useCreateExpense();

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store_id) {
      setError('Aucun magasin actif ne vous est assigné. Veuillez contacter un administrateur.');
      return;
    }
    if (!category_id || !account_id || !amount || Number(amount) <= 0) {
      setError('La catégorie, le compte payeur et un montant valide sont requis.');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === category_id);

    const res = await createExpense({
      store_id,
      category_id,
      account_id,
      category: selectedCategory,
      amount: Number(amount),
      date,
      payment_method,
      reference_no,
      notes
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
      title="Enregistrer une dépense"
      icon={<Plus size={18} />}
      size="modal-lg"
      onSubmit={submit}
      submitting={submitting}
      submitLabel="Enregistrer la dépense"
      error={error}
    >
      <div className="row g-3">
        <div className="col-md-12">
          <fieldset className="custom-fieldset">
            <legend>Catégorie de dépense <span className="text-danger">*</span></legend>
            <select value={category_id} onChange={(e) => setCategory(e.target.value)} required>
              <option value="">Sélectionner une catégorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </fieldset>
        </div>

        <div className="col-md-12">
          <fieldset className="custom-fieldset">
            <legend>Compte payeur <span className="text-danger">*</span></legend>
            <select
              value={account_id}
              onChange={(event) => setAccountId(event.target.value)}
              required
              disabled={accountsLoading}
            >
              <option value="">{accountsLoading ? 'Chargement des comptes…' : 'Sélectionner un compte'}</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}{account.store?.name ? ` — ${account.store.name}` : ' — Entreprise'}
                </option>
              ))}
            </select>
            {!accountsLoading && accountsError && <small className="text-danger">{accountsError}</small>}
            {!accountsLoading && !accountsError && accounts.length === 0 && (
              <small className="text-danger">Configurez un compte financier avant d’enregistrer la dépense.</small>
            )}
          </fieldset>
        </div>

        <div className="col-md-6">
          <fieldset className="custom-fieldset">
            <legend>Montant ($) <span className="text-danger">*</span></legend>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-control fw-bold"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </fieldset>
        </div>

        <div className="col-md-6">
          <fieldset className="custom-fieldset">
            <legend>Date de la dépense <span className="text-danger">*</span></legend>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </fieldset>
        </div>

        <div className="col-md-6">
          <fieldset className="custom-fieldset">
            <legend>Moyen de paiement</legend>
            <select value={payment_method} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="cash">Espèces / Caisse</option>
              <option value="bank_transfer">Virement bancaire</option>
              <option value="check">Chèque</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="card">Carte bancaire</option>
            </select>
          </fieldset>
        </div>

        <div className="col-md-6">
          <fieldset className="custom-fieldset">
            <legend>N° de pièce / Facture justificative</legend>
            <input
              type="text"
              className="form-control"
              value={reference_no}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="Ex: FACT-2026-089"
            />
          </fieldset>
        </div>

        <div className="col-12">
          <fieldset className="custom-fieldset">
            <legend>Description / Motif de la dépense</legend>
            <textarea
              className="form-control"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Précisez la nature de la dépense (ex: Facture électricité bureau mois d'août)..."
            />
          </fieldset>
        </div>
      </div>
    </FormModal>
  );
}
