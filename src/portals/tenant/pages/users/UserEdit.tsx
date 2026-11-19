import React, { useState, useEffect } from 'react';
import { UserCheck, Shield, Store as StoreIcon } from 'lucide-react';
import FormModal from '../../../shared/components/common/FormModal';
import { OptionSkeleton } from '../../../shared/components/common/FormSkeletons';
import { useRoles } from '../../hooks/roles/useRoles';
import { useStores } from '../../hooks/stores/useStores';
import type { AppUser, UpdateUserPayload } from '../../../shared/types/user';

interface UserEditProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser | null;
  onSubmit: (id: string, payload: UpdateUserPayload) => Promise<{ success: boolean; message?: string }>;
}

export default function UserEdit({ isOpen, onClose, user, onSubmit }: UserEditProps) {
  const { roles, loading: rolesLoading } = useRoles();
  const { stores, loading: storesLoading } = useStores({ page: 1, per_page: 100 });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('Active');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPassword('');
      setPhone(user.phone || '');
      setStatus(user.status || 'Active');
      setSelectedRoles(user.roles ? user.roles.map(r => r.id) : []);

      const assignedStoreIds = user.stores ? user.stores.map(s => s.id) : [];
      setSelectedStores(assignedStoreIds);

      const active = user.stores ? user.stores.find(s => s.is_active) : null;
      setActiveStoreId(active?.id || user.active_store?.id || assignedStoreIds[0] || '');
      setError('');
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const toggleRole = (roleId: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const toggleStore = (storeId: string) => {
    setSelectedStores(prev => {
      const next = prev.includes(storeId)
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId];

      if (!next.includes(activeStoreId)) {
        setActiveStoreId(next[0] || '');
      } else if (!activeStoreId && next.length > 0) {
        setActiveStoreId(next[0]);
      }

      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Veuillez renseigner le Nom et l\'Email.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload: UpdateUserPayload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      status,
      role_ids: selectedRoles,
      store_ids: selectedStores,
      active_store_id: activeStoreId || (selectedStores[0] ?? undefined),
    };

    if (password.trim()) {
      payload.password = password.trim();
    }

    const res = await onSubmit(user.id, payload);
    setSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.message || 'Erreur lors de la modification');
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Modifier l'Utilisateur : ${user.name}`}
      icon={<UserCheck size={18} />}
      size="modal-lg"
      onSubmit={handleSubmit}
      submitting={submitting}
      error={error}
    >
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label small fw-semibold text-dark mb-1">Nom complet *</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={name}
            onChange={e => setName(e.target.value)}
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
            required
          />
        </div>

        <div className="col-md-4">
          <label className="form-label small fw-semibold text-dark mb-1">Nouveau mot de passe</label>
          <input
            type="password"
            className="form-control form-control-sm"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Laisser vide pour ne pas changer"
          />
        </div>

        <div className="col-md-4">
          <label className="form-label small fw-semibold text-dark mb-1">Téléphone</label>
          <input
            type="tel"
            className="form-control form-control-sm"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>

        <div className="col-md-4">
          <label className="form-label small fw-semibold text-dark mb-1">Statut</label>
          <select
            className="form-select form-select-sm"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="Active">Actif</option>
            <option value="Inactive">Inactif</option>
          </select>
        </div>

        {/* Attribution Rôles Multiples */}
        <div className="col-12 mt-3">
          <div className="card border rounded-3 p-3 bg-light-subtle">
            <div className="d-flex align-items-center gap-2 mb-2">
              <Shield size={16} className="text-primary" />
              <h6 className="fw-bold text-dark mb-0 small">
                Rôles attribués (Cumul de plusieurs rôles possible)
              </h6>
            </div>

            {rolesLoading ? (
              <OptionSkeleton label="Chargement des rôles" />
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

        {/* Affectation Magasins */}
        <div className="col-12 mt-2">
          <div className="card border rounded-3 p-3 bg-light-subtle">
            <div className="d-flex align-items-center gap-2 mb-2">
              <StoreIcon size={16} className="text-success" />
              <h6 className="fw-bold text-dark mb-0 small">
                Affectations aux Magasins (Un seul magasin actif)
              </h6>
            </div>

            {storesLoading ? (
              <OptionSkeleton label="Chargement des magasins" variant="rows" rows={3} />
            ) : stores.length === 0 ? (
              <div className="text-muted small">Aucun magasin disponible.</div>
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
                      const isAssigned = selectedStores.includes(st.id);
                      const isActive = activeStoreId === st.id;

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
                          <td className="fw-semibold text-dark">{st.name}</td>
                          <td className="text-muted font-monospace">{st.code || '-'}</td>
                          <td className="text-center">
                            <input
                              type="radio"
                              name="edit_active_store_radio"
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
