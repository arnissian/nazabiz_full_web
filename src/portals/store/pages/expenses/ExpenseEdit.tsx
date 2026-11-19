import React, { useContext, useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import { useUpdateExpense } from '../../hooks/expenses/useUpdateExpense';
import { useExpenseCategories } from '../../hooks/expenses/useExpenseCategories';
import FormModal from '../../../shared/components/common/FormModal';
import type { Expense } from '../../types/expense';
import { AppContext } from '../../../shared/context/AppContext';
import { useFinancialAccounts } from '../../../shared/hooks/financial-accounts/useFinancialAccounts';

interface ExpenseEditProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  onSuccess: () => void;
}

export default function ExpenseEdit({ isOpen, onClose, expense, onSuccess }: ExpenseEditProps) {
  const { activeStore } = useContext(AppContext);
  const { categories } = useExpenseCategories();
  const { accounts, loading: accountsLoading, error: accountsError } = useFinancialAccounts(true, undefined, 'store');

  const [category_id, setCategory] = useState('');
  const [account_id, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [payment_method, setPaymentMethod] = useState('cash');
  const [reference_no, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const { updateExpense, submitting } = useUpdateExpense();

  useEffect(() => {
    if (expense) {
      setCategory(expense.category_id || expense.category?.id || '');
      setAccountId(expense.account_id || '');
      setAmount(expense.amount?.toString() || '');
      setDate(expense.date ? expense.date.split('T')[0] : '');
      setPaymentMethod(expense.payment_method || 'cash');
      setReferenceNo(expense.reference_no || '');
      setNotes(expense.notes || '');
    }
  }, [expense]);

  if (!isOpen || !expense) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore?.id || !category_id || !account_id || !amount || Number(amount) <= 0) {
      setError('Tous les champs requis doivent être renseignés.');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === category_id);

    const res = await updateExpense(expense.id, {
      store_id: activeStore.id,
      store: { id: activeStore.id, name: activeStore.name },
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
      title={`Modifier Dépense - ${expense.reference}`}
      icon={<Edit size={18} />}
      size="modal-lg"
      onSubmit={submit}
      submitting={submitting}
      submitLabel="Enregistrer les modifications"
      error={error}
    >
      <div className="row g-3">
        <div className="col-md-6">
          <fieldset className="custom-fieldset">
            <legend>Magasin actif</legend>
            <div className="form-control bg-light">{activeStore?.name || 'Aucun magasin actif'}</div>
          </fieldset>
        </div>

        <div className="col-md-6">
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
          </fieldset>
        </div>

        <div className="col-md-6">
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
            />
          </fieldset>
        </div>
      </div>
    </FormModal>
  );
}
