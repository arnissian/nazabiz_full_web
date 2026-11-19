import React, { useContext, useState } from 'react';
import { UserPlus, Shield, Store as StoreIcon } from 'lucide-react';
import FormModal from '../../../shared/components/common/FormModal';
import { OptionSkeleton } from '../../../shared/components/common/FormSkeletons';
import { useRoles } from '../../hooks/roles/useRoles';
import { useStores } from '../../hooks/stores/useStores';
import type { CreateUserPayload } from '../../../shared/types/user';
import { AppContext } from '../../../shared/context/AppContext';

interface UserCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateUserPayload) => Promise<{
    success: boolean;
    message?: string;
    errors?: Record<string, string[]>;
  }>;
}

export default function UserCreate({ isOpen, onClose, onSubmit }: UserCreateProps) {
  const { activeStore } = useContext(AppContext);
  const { roles, loading: rolesLoading, error: rolesError } = useRoles();
  const { stores, loading: storesLoading, error: storesError } = useStores({ page: 1, per_page: 100 });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('Active');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [storesTouched, setStoresTouched] = useState(false);
  const [activeStoreId, setActiveStoreId] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedStoreIds = storesTouched
    ? selectedStores
    : activeStore?.id && stores.some((store) => store.id === activeStore.id)
      ? [activeStore.id]
      : [];

  if (!isOpen) return null;

  const toggleRole = (roleId: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const toggleStore = (storeId: string) => {
    const current = selectedStoreIds;
    const next = current.includes(storeId)
      ? current.filter(id => id !== storeId)
      : [...current, storeId];

    setStoresTouched(true);
    setSelectedStores(next);
    setActiveStoreId(currentActiveStoreId =>
      next.includes(currentActiveStoreId) ? currentActiveStoreId : (next[0] || '')
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rolesLoading || storesLoading) {
      setError('Veuillez attendre le chargement des rôles et des magasins.');
      return;
    }
    if (rolesError) {
      setError(rolesError);
      return;
    }
    if (roles.length === 0) {
      setError('Aucun rôle disponible. Créez un rôle avant d’ajouter un utilisateur.');
      return;
    }
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Veuillez renseigner les champs obligatoires (Nom, Email, Mot de passe).');
      return;
    }
    if (selectedStoreIds.length === 0) {
      setError('Veuillez affecter au moins un magasin à cet utilisateur.');
      return;
    }
    if (selectedRoles.length === 0) {
      setError('Veuillez attribuer au moins un rôle à cet utilisateur.');
      return;
    }

    setSubmitting(true);
    setError('');

    let res: Awaited<ReturnType<typeof onSubmit>>;
    try {
      res = await onSubmit({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        status,
        role_ids: selectedRoles,
        store_ids: selectedStoreIds,
        active_store_id: activeStoreId || selectedStoreIds[0],
      });
    } catch {
      setSubmitting(false);
      setError('Une erreur inattendue est survenue lors de la création.');
      return;
    }
    setSubmitting(false);

    if (res.success) {
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setSelectedRoles([]);
      setSelectedStores([]);
      setStoresTouched(false);
      setActiveStoreId('');
      onClose();
    } else {
      const firstValidationError = Object.values(res.errors ?? {}).flat()[0];
      setError(firstValidationError || res.message || 'Erreur lors de la création');
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Créer un Utilisateur"
      icon={<UserPlus size={18} />}
      size="modal-lg"
      onSubmit={handleSubmit}
      submitting={submitting}
      error={error}
    >
      <div className="row g-3">
        {/* Identité */}
        <div className="col-md-6">
          <label className="form-label small fw-semibold text-dark mb-1">Nom complet *</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Jean Dupont"
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label small fw-semibold text-dark mb-1">Adresse Email *</label>
          <input
            type="email"
            className="form-control form-control-sm"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="jean.dupont@business.com"
            required
          />
        </div>

        <div className="col-md-4">
          <label className="form-label small fw-semibold text-dark mb-1">Mot de passe *</label>
          <input
            type="password"
            className="form-control form-control-sm"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min. 6 caractères"
            required
          />
        </div>

        <div className="col-md-4">
          <label className="form-label small fw-semibold text-dark mb-1">Téléphone</label>
          <input
            type="tel"
            className="form-control form-control-sm"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+243 ..."
          />
        </div>

        <div className="col-md-4">
          <label className="form-label small fw-semibold text-dark mb-1">Statut du compte</label>
          <select
            className="form-select form-select-sm"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="Active">Actif</option>
            <option value="Inactive">Inactif</option>
          </select>
        </div>

        {/* Attribution des Rôles Multiples */}
        <div className="col-12 mt-3">
          <div className="card border rounded-3 p-3 bg-light-subtle">
            <div className="d-flex align-items-center gap-2 mb-2">
              <Shield size={16} className="text-primary" />
              <h6 className="fw-bold text-dark mb-0 small">
                Rôles attribués (Un utilisateur peut avoir plusieurs rôles)
              </h6>
            </div>
            <p className="text-muted small mb-2" style={{ fontSize: '12px' }}>
              Cochez un ou plusieurs profils d'accès pour cet utilisateur. Les permissions seront cumulées.
            </p>

            {rolesLoading ? (
              <OptionSkeleton label="Chargement des rôles" />
            ) : rolesError ? (
              <div className="text-danger small" role="alert">{rolesError}</div>
            ) : roles.length === 0 ? (
              <div className="text-muted small">Aucun rôle disponible. Créez un rôle avant d’ajouter un utilisateur.</div>
            ) : (
              <div className="d-flex flex-wrap gap-2">
                {roles.map(r => {
                  const isChecked = selectedRoles.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      className={`btn btn-sm d-flex align-items-center gap-2 border ${
                        isChecked ? 'btn-primary' : 'btn-outline-secondary bg-white text-dark'
                      }`}
                      onClick={() => toggleRole(r.id)}
                    >
                      <input
                        type="checkbox"
                        className="form-check-input mt-0 cursor-pointer"
                        checked={isChecked}
                        onChange={() => {}}
                      />
                      <span>{r.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Affectation aux Magasins */}
        <div className="col-12 mt-2">
          <div className="card border rounded-3 p-3 bg-light-subtle">
            <div className="d-flex align-items-center gap-2 mb-2">
              <StoreIcon size={16} className="text-success" />
              <h6 className="fw-bold text-dark mb-0 small">
                Affectation aux Magasins (Un seul magasin actif à la fois)
              </h6>
            </div>
            <p className="text-muted small mb-2" style={{ fontSize: '12px' }}>
              Cochez les magasins auxquels l'utilisateur est habilité, puis cochez le bouton radio du <strong>Magasin Actif</strong> pour son travail immédiat.
            </p>

            {storesLoading ? (
              <OptionSkeleton label="Chargement des magasins" variant="rows" rows={3} />
            ) : storesError ? (
              <div className="text-danger small" role="alert">{storesError}</div>
            ) : stores.length === 0 ? (
              <div className="text-muted small">Aucun magasin disponible dans cette entreprise.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-bordered bg-white align-middle mb-0">
                  <thead className="table-light text-muted small">
                    <tr>
                      <th style={{ width: '40px' }} className="text-center">Habilité</th>
                      <th>Nom du Magasin</th>
                      <th>Code</th>
                      <th style={{ width: '130px' }} className="text-center">Magasin Actif</th>
                    </tr>
                  </thead>
                  <tbody className="small">
                    {stores.map(st => {
                      const isAssigned = selectedStoreIds.includes(st.id);
                      const isActive = (activeStoreId || activeStore?.id) === st.id;

                      return (
                        <tr key={st.id} className={isActive ? 'table-success' : ''}>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              className="form-check-input cursor-pointer"
                              checked={isAssigned}
                              onChange={() => toggleStore(st.id)}
                            />
                          </td>
                          <td className="fw-semibold text-dark">
                            {st.name}
                          </td>
                          <td className="text-muted font-monospace">{st.code || '-'}</td>
                          <td className="text-center">
                            <input
                              type="radio"
                              name="active_store_radio"
                              className="form-check-input cursor-pointer"
                              disabled={!isAssigned}
                              checked={isActive}
                              onChange={() => setActiveStoreId(st.id)}
                            />
                            {isActive && (
                              <span className="ms-1 badge bg-success" style={{ fontSize: '10px' }}>
                                Actif
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </FormModal>
  );
}
