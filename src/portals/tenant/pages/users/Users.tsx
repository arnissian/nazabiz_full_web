import React, { useState } from 'react';
import { UserPlus, Shield, Store as StoreIcon, Edit, Trash2, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { useUsers } from '../../hooks/users/useUsers';
import { Pagination } from '../../../shared/components/common/Pagination';
import { TableExportButton } from '../../../shared/components/common/TableToolbar';
import UserCreate from './UserCreate';
import UserEdit from './UserEdit';
import type { AppUser } from '../../../shared/types/user';
import { TableSkeletonRows } from '../../../shared/components/common/TableSkeleton';

export default function Users() {
  const {
    users,
    loading,
    error,
    pagination,
    params,
    setParams,
    reFetch,
    createUser,
    updateUser,
    deleteUser,
    activateUserStore,
  } = useUsers();

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [switchingStoreUserId, setSwitchingStoreUserId] = useState<string | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Voulez-vous vraiment supprimer l'utilisateur "${name}" ?`)) {
      const res = await deleteUser(id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const handleActivateStore = async (userId: string, storeId: string) => {
    setSwitchingStoreUserId(userId);
    const res = await activateUserStore(userId, storeId);
    setSwitchingStoreUserId(null);
    if (!res.success) {
      alert(res.message);
    }
  };

  return (
    <div className="container-fluid p-3 p-md-4 min-vh-100" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap">
        <div>
          <h1 className="fw-bold text-dark mb-0 fs-5">Gestion des Utilisateurs</h1>
          <div className="text-muted small">
            Gestion des profils d'accès, attribution des rôles multiples et affectation aux magasins
          </div>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-primary border-0 shadow-2xs d-flex align-items-center gap-1 px-3 py-1 rounded-2 fw-medium"
          onClick={() => setCreateOpen(true)}
        >
          <UserPlus size={15} /> Nouvel Utilisateur
        </button>
        <TableExportButton />
      </div>

      {/* Main Card */}
      <div className="card border shadow-2xs rounded-3 p-3 bg-white">
        {/* Barre de recherche */}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div style={{ maxWidth: '320px' }} className="w-100">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white"><Search size={14} /></span>
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher par nom, email, téléphone..."
                value={params.search || ''}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          <div className="text-muted small">
            Total: <strong>{pagination?.total ?? users.length}</strong> utilisateur(s)
          </div>
        </div>

        {error && (
          <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 mb-3">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Tableau */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted small">
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Utilisateur</th>
                <th>Téléphone</th>
                <th>Rôles attribués</th>
                <th>Magasin Actif & Affectations</th>
                <th>Statut</th>
                <th className="text-end" style={{ width: '90px' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="small">
              {loading ? (
                <TableSkeletonRows columns={7} />
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => {
                  const activeStore = u.active_store || (u.stores ? u.stores.find(s => s.is_active) : null);
                  const otherStores = u.stores ? u.stores.filter(s => !s.is_active) : [];

                  return (
                    <tr key={u.id}>
                      <td className="text-muted">
                        {(params.page ? (params.page - 1) * (params.per_page || 15) : 0) + idx + 1}
                      </td>

                      {/* Utilisateur */}
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center"
                            style={{ width: '34px', height: '34px', fontSize: '13px' }}
                          >
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="fw-semibold text-dark">{u.name}</div>
                            <div className="text-muted" style={{ fontSize: '12px' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Téléphone */}
                      <td className="text-muted">
                        {u.phone || '-'}
                      </td>

                      {/* Rôles Multiples */}
                      <td>
                        {u.roles && u.roles.length > 0 ? (
                          <div className="d-flex flex-wrap gap-1">
                            {u.roles.map(r => (
                              <span
                                key={r.id}
                                className="badge bg-primary-subtle text-primary border border-primary-subtle d-inline-flex align-items-center gap-1"
                                style={{ fontSize: '11px', fontWeight: 500 }}
                              >
                                <Shield size={10} />
                                {r.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted font-italic" style={{ fontSize: '12px' }}>
                            Aucun rôle
                          </span>
                        )}
                      </td>

                      {/* Magasin Actif & Affectations */}
                      <td>
                        <div className="d-flex flex-column gap-1">
                          {/* Magasin Actif */}
                          {activeStore ? (
                            <div className="d-flex align-items-center gap-1">
                              <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1">
                                <CheckCircle2 size={11} />
                                <strong>{activeStore.name}</strong>
                              </span>
                              <span className="text-muted" style={{ fontSize: '10px' }}>(Actif)</span>
                            </div>
                          ) : (
                            <span className="text-danger small" style={{ fontSize: '12px' }}>
                              Non affecté
                            </span>
                          )}

                          {/* Autres magasins affectés avec bascule rapide */}
                          {otherStores.length > 0 && (
                            <div className="d-flex align-items-center gap-1 mt-1 flex-wrap">
                              <span className="text-muted" style={{ fontSize: '11px' }}>
                                Basculer sur :
                              </span>
                              {otherStores.map(s => (
                                <button
                                  key={s.id}
                                  type="button"
                                  className="btn btn-xs btn-outline-secondary py-0 px-1 border"
                                  style={{ fontSize: '10px' }}
                                  disabled={switchingStoreUserId === u.id}
                                  onClick={() => handleActivateStore(u.id, s.id)}
                                  title="Activer ce magasin (désactivera l'ancien)"
                                >
                                  <StoreIcon size={10} className="me-1 inline-block" />
                                  {s.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Statut */}
                      <td>
                        <span
                          className={`badge ${
                            u.status?.toLowerCase() === 'active'
                              ? 'bg-success-subtle text-success'
                              : 'bg-secondary-subtle text-secondary'
                          }`}
                          style={{ fontSize: '11px' }}
                        >
                          {u.status?.toLowerCase() === 'active' ? 'Actif' : 'Inactif'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-light border p-1 text-primary"
                            title="Modifier"
                            onClick={() => setEditUser(u)}
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-light border p-1 text-danger"
                            title="Supprimer"
                            onClick={() => handleDelete(u.id, u.name)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="mt-3 pt-2 border-top">
            <Pagination
              meta={pagination}
              loading={loading}
              onPageChange={page => setParams(prev => ({ ...prev, page }))}
            />
          </div>
        )}
      </div>

      {/* Modal Création */}
      <UserCreate
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={createUser}
      />

      {/* Modal Édition */}
      <UserEdit
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        user={editUser}
        onSubmit={updateUser}
      />
    </div>
  );
}