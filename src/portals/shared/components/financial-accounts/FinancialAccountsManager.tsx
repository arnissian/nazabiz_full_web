import { useState, type FormEvent } from 'react';
import axios from 'axios';
import { ArrowDownToLine, Landmark, Pencil, Plus, RefreshCw, Smartphone, Trash2, Wallet } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosInstance from '../../services/api/axiosInterceptor';
import { useFinancialAccounts } from '../../hooks/financial-accounts/useFinancialAccounts';
import type { StoreSummary } from '../../../tenant/hooks/stores/useStores';
import FormModal from '../common/FormModal';

const accountTypes = [
  { value: 'cash', label: 'Caisse' },
  { value: 'bank', label: 'Banque' },
  { value: 'mobile_money', label: 'Mobile money' },
];

type Props = {
  mode: 'tenant' | 'store';
  activeStore: StoreSummary | null;
  formatBalance: (amountInUSD: number) => string;
  stores?: StoreSummary[];
};

export default function FinancialAccountsManager({
  mode,
  activeStore,
  formatBalance,
  stores = [],
}: Props) {
  const isStoreMode = mode === 'store';
  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [storeId, setStoreId] = useState(activeStore?.id || '');
  const [submitting, setSubmitting] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountIsActive, setAccountIsActive] = useState(true);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAccountId, setDepositAccountId] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDate, setDepositDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [depositPaymentMethod, setDepositPaymentMethod] = useState('cash');
  const [depositReference, setDepositReference] = useState('');
  const [depositDescription, setDepositDescription] = useState('');
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const { accounts, dashboard, loading, error, reload } = useFinancialAccounts(
    'all',
    isStoreMode ? activeStore?.id : undefined,
    mode,
    !isStoreMode,
  );

  const openAccountForm = (account?: { id: string; name: string; type: string; is_active: boolean }) => {
    setEditingAccountId(account?.id ?? null);
    setName(account?.name ?? '');
    setType(account?.type ?? 'cash');
    setAccountIsActive(account?.is_active ?? true);
    setOpeningBalance('0');
    setStoreId('');
    setCreateModalOpen(true);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const basePath = isStoreMode ? '/pos/financial-accounts' : '/financial-accounts';
      const payload = editingAccountId
        ? { name: name.trim(), type, is_active: accountIsActive }
        : {
          name: name.trim(),
          type,
          opening_balance: Number(openingBalance),
          store_id: isStoreMode ? activeStore?.id : storeId || null,
        };
      if (editingAccountId) {
        await axiosInstance.patch(`${basePath}/${editingAccountId}`, payload);
      } else {
        await axiosInstance.post(basePath, payload);
      }
      setName('');
      setOpeningBalance('0');
      setType('cash');
      setAccountIsActive(true);
      setStoreId('');
      setEditingAccountId(null);
      setCreateModalOpen(false);
      toast.success(editingAccountId ? 'Compte modifié avec succès.' : 'Compte créé avec succès.');
      await reload();
    } catch (saveError: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(saveError)
        ? saveError.response?.data?.message
        : null;
      toast.error(message || (editingAccountId ? 'Impossible de modifier le compte.' : 'Impossible de créer le compte.'));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAccount = async (account: { id: string; name: string }) => {
    if (!window.confirm(
      `Supprimer le compte « ${account.name} » ? Les comptes avec un solde initial ou des mouvements ne peuvent pas être supprimés ; désactivez-les plutôt.`,
    )) return;

    try {
      const basePath = isStoreMode ? '/pos/financial-accounts' : '/financial-accounts';
      await axiosInstance.delete(`${basePath}/${account.id}`);
      toast.success('Compte supprimé avec succès.');
      await reload();
    } catch (deleteError: unknown) {
      const message = axios.isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(deleteError)
        ? deleteError.response?.data?.errors?.account?.[0] || deleteError.response?.data?.message
        : null;
      toast.error(message || 'Impossible de supprimer le compte.');
    }
  };

  const submitDeposit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(depositAmount);
    if (!depositAccountId || !Number.isFinite(amount) || amount <= 0 || !depositDate || !depositPaymentMethod) {
      toast.error('Sélectionnez un compte, une date et un mode de paiement, puis saisissez un montant supérieur à zéro.');
      return;
    }

    setDepositSubmitting(true);
    try {
      await axiosInstance.post(
        isStoreMode ? '/pos/financial-accounts/deposits' : '/financial-accounts/deposits',
        {
          account_id: depositAccountId,
          amount,
          transaction_date: depositDate,
          payment_method: depositPaymentMethod,
          reference: depositReference.trim() || null,
          description: depositDescription.trim() || null,
        },
      );
      setDepositAmount('');
      setDepositDate(new Date().toISOString().slice(0, 10));
      setDepositPaymentMethod('cash');
      setDepositReference('');
      setDepositDescription('');
      setDepositModalOpen(false);
      toast.success('Compte alimenté avec succès.');
      await reload();
    } catch (depositError: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(depositError)
        ? depositError.response?.data?.message
        : null;
      toast.error(message || 'Impossible d’alimenter le compte.');
    } finally {
      setDepositSubmitting(false);
    }
  };

  return (
    <div className="container-fluid p-3 p-md-4 min-vh-100">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="fw-bold text-dark mb-0 fs-5">Comptes de trésorerie</h1>
          <div className="text-muted small">
            {isStoreMode
              ? `Comptes de l’entreprise et du magasin ${activeStore?.name || 'actif'}, utilisés pour les paiements fournisseurs.`
              : 'Comptes de l’entreprise et de ses magasins, utilisés pour les paiements fournisseurs.'}
          </div>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-success btn-sm d-flex align-items-center gap-2"
            onClick={() => setDepositModalOpen(true)}
            disabled={!accounts.some(account => account.is_active)}
          >
            <ArrowDownToLine size={15} /> Alimenter
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-2"
            onClick={() => openAccountForm()}
            disabled={isStoreMode && !activeStore?.id}
          >
            <Plus size={15} /> Nouveau compte
          </button>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => void reload()} aria-label="Actualiser les comptes">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12">
          <div className="row g-3 mb-3">
            {accountTypes.map(accountType => {
              const group = dashboard.groups.find(item => item.type === accountType.value);
              const Icon = accountType.value === 'cash'
                ? Wallet
                : accountType.value === 'bank' ? Landmark : Smartphone;
              const palette = accountType.value === 'cash'
                ? { background: '#fff0f3', icon: '#f53268' }
                : accountType.value === 'bank'
                  ? { background: '#eef5ff', icon: '#398be8' }
                  : { background: '#eaf8f0', icon: '#37bc7b' };
              return (
                <div className="col-sm-6 col-xl-4" key={accountType.value}>
                  <div className="stat-card h-100" style={{ background: palette.background }}>
                    <div>
                      <span className="stat-title light">{accountType.label}</span>
                      <strong className="stat-value light">{formatBalance(Number(group?.balance || 0))}</strong>
                      <small className="stat-yesterday light">
                        {group?.account_count || 0} compte{group?.account_count === 1 ? '' : 's'}
                      </small>
                    </div>
                    <div className="stat-icon" style={{ background: palette.icon }}>
                      <Icon size={16} color="#FFFFFF" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="card border-0 shadow-sm rounded-3 p-4">
            <h2 className="h6 fw-bold mb-3">Comptes disponibles</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            {loading ? <div className="text-muted">Chargement…</div> : accounts.length === 0 ? (
              <div className="text-muted">Aucun compte n’a été configuré pour l’entreprise ou ce magasin.</div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead><tr><th>Compte</th><th>Type</th><th>Magasin</th><th className="text-end">Solde actuel</th><th className="text-end">Actions</th></tr></thead>
                  <tbody>
                    {accounts.map(account => (
                      <tr key={account.id}>
                        <td>
                          <Wallet size={15} className="me-2 text-primary" />{account.name}
                          {!account.is_active && <span className="badge text-bg-secondary ms-2">Désactivé</span>}
                        </td>
                        <td>{accountTypes.find(option => option.value === account.type)?.label || account.type}</td>
                        <td>{account.store?.name || 'Entreprise'}</td>
                        <td className="text-end">{formatBalance(Number(account.current_balance))}</td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => openAccountForm(account)}
                              aria-label={`Modifier ${account.name}`}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => void deleteAccount(account)}
                              aria-label={`Supprimer ${account.name}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="card border-0 shadow-sm rounded-3 p-4 mt-3">
            <h2 className="h6 fw-bold mb-3">Mouvements récents</h2>
            {dashboard.recent_transactions.length === 0 ? (
              <div className="text-muted">Aucun mouvement enregistré.</div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead><tr><th>Date</th><th>Compte</th><th>Description</th><th className="text-end">Montant</th></tr></thead>
                  <tbody>
                    {dashboard.recent_transactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td>{new Date(
                          transaction.transaction_date ? `${transaction.transaction_date}T00:00:00` : transaction.created_at,
                        ).toLocaleDateString()}</td>
                        <td>{transaction.account?.name || 'Compte'}</td>
                        <td>
                          {transaction.description || 'Mouvement financier'}
                          {(transaction.payment_method || transaction.reference) && (
                            <small className="d-block text-muted">
                              {[transaction.payment_method, transaction.reference].filter(Boolean).join(' · ')}
                            </small>
                          )}
                        </td>
                        <td className={`text-end ${Number(transaction.amount) < 0 ? 'text-danger' : 'text-success'}`}>
                          {formatBalance(Number(transaction.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <FormModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingAccountId(null);
        }}
        title={editingAccountId ? 'Modifier le compte' : 'Nouveau compte financier'}
        icon={<Plus size={18} />}
        onSubmit={submit}
        submitting={submitting}
        submitLabel={editingAccountId ? 'Enregistrer' : 'Créer le compte'}
      >
        <label className="form-label">Nom <span className="text-danger">*</span></label>
        <input
          className="form-control mb-3"
          value={name}
          onChange={event => setName(event.target.value)}
          required
          maxLength={150}
          autoFocus
        />
        <label className="form-label">Type de compte <span className="text-danger">*</span></label>
        <select className="form-select mb-3" value={type} onChange={event => setType(event.target.value as typeof type)} required>
          {accountTypes.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        {editingAccountId && (
          <div className="form-check mb-3">
            <input
              id="financial-account-active"
              type="checkbox"
              className="form-check-input"
              checked={accountIsActive}
              onChange={event => setAccountIsActive(event.target.checked)}
            />
            <label htmlFor="financial-account-active" className="form-check-label">Compte actif</label>
          </div>
        )}
        {!editingAccountId && (
          <>
            <label className="form-label">Solde initial</label>
            <input
              type="number"
              step="0.01"
              className="form-control mb-3"
              value={openingBalance}
              onChange={event => setOpeningBalance(event.target.value)}
              required
            />
            <label className="form-label">Rattachement</label>
            {isStoreMode ? (
              <input className="form-control" value={activeStore?.name || 'Aucun magasin actif'} readOnly />
            ) : (
              <select className="form-select" value={storeId} onChange={event => setStoreId(event.target.value)}>
                <option value="">Compte entreprise</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name || store.id}</option>
                ))}
              </select>
            )}
          </>
        )}
      </FormModal>
      <FormModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        title="Alimenter un compte"
        icon={<ArrowDownToLine size={18} />}
        onSubmit={submitDeposit}
        submitting={depositSubmitting}
        submitLabel="Enregistrer le dépôt"
      >
        <label className="form-label">Compte à alimenter <span className="text-danger">*</span></label>
        <select
          className="form-select mb-3"
          value={depositAccountId}
          onChange={event => setDepositAccountId(event.target.value)}
          required
        >
          <option value="">Sélectionner un compte</option>
          {accounts.filter(account => account.is_active).map(account => (
            <option key={account.id} value={account.id}>
              {account.name} — {account.store?.name || 'Entreprise'}
            </option>
          ))}
        </select>
        <label className="form-label">Montant du dépôt <span className="text-danger">*</span></label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          className="form-control mb-3"
          value={depositAmount}
          onChange={event => setDepositAmount(event.target.value)}
          required
        />
        <label className="form-label">Date du dépôt <span className="text-danger">*</span></label>
        <input
          type="date"
          className="form-control mb-3"
          value={depositDate}
          onChange={event => setDepositDate(event.target.value)}
          required
        />
        <label className="form-label">Mode de paiement <span className="text-danger">*</span></label>
        <select
          className="form-select mb-3"
          value={depositPaymentMethod}
          onChange={event => setDepositPaymentMethod(event.target.value)}
          required
        >
          <option value="cash">Espèces</option>
          <option value="card">Carte</option>
          <option value="mobile_money">Mobile money</option>
          <option value="bank_transfer">Virement bancaire</option>
        </select>
        <label className="form-label">Référence</label>
        <input
          className="form-control mb-3"
          value={depositReference}
          onChange={event => setDepositReference(event.target.value)}
          maxLength={100}
          placeholder="Ex. DEP-001"
        />
        <label className="form-label">Description</label>
        <input
          className="form-control"
          value={depositDescription}
          onChange={event => setDepositDescription(event.target.value)}
          maxLength={255}
          placeholder="Ex. dépôt espèces"
        />
      </FormModal>
    </div>
  );
}
