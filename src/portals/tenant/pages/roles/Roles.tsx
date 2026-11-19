import React, { useState } from 'react';
import { Shield, Plus, Edit, Trash2, Users, CheckCircle2, Key, Search } from 'lucide-react';
import { useRoles } from '../../hooks/roles/useRoles';
import { useDeleteRole } from '../../hooks/roles/useDeleteRole';
import { usePermissions } from '../../hooks/roles/usePermissions';
import RoleCreate from './RoleCreate';
import RoleEdit from './RoleEdit';
import FormModal from '../../../shared/components/common/FormModal';
import { TableExportButton } from '../../../shared/components/common/TableToolbar';
import type { Role } from '../../../shared/types/role';
import { CardGridSkeleton, TableSkeletonRows } from '../../../shared/components/common/TableSkeleton';

export default function Roles() {
  const { roles, loading: rolesLoading, error: rolesError, reFetch: reFetchRoles } = useRoles();
  const {
    permissions,
    loading: permsLoading,
    error: permsError,
    reFetch: reFetchPerms,
    createPermission,
    updatePermission,
    deletePermission,
  } = usePermissions();
  const { deleteRole } = useDeleteRole();

  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);

  // New permission form state
  const [permSearch, setPermSearch] = useState('');
  const [newPermCode, setNewPermCode] = useState('');
  const [newPermLabel, setNewPermLabel] = useState('');
  const [newPermModule, setNewPermModule] = useState('pos');
  const [isCreatingPerm, setIsCreatingPerm] = useState(false);
  const [permError, setPermError] = useState('');

  // Edit permission state
  const [editPerm, setEditPerm] = useState<any | null>(null);
  const [editPermCode, setEditPermCode] = useState('');
  const [editPermLabel, setEditPermLabel] = useState('');
  const [editPermModule, setEditPermModule] = useState('pos');
  const [isUpdatingPerm, setIsUpdatingPerm] = useState(false);
  const [editPermError, setEditPermError] = useState('');

  const MODULE_OPTIONS = [
    { key: 'pos', name: 'Point de Vente (POS / Caisse)' },
    { key: 'sales', name: 'Ventes & Facturation' },
    { key: 'quotations', name: 'Devis & Proformas' },
    { key: 'stocks', name: 'Produits & Stocks' },
    { key: 'purchases', name: 'Achats & Fournisseurs' },
    { key: 'expenses', name: 'Dépenses & Charges' },
    { key: 'reports', name: 'Rapports & Statistiques' },
    { key: 'settings', name: 'Paramètres & Utilisateurs' },
    { key: 'general', name: 'Général / Système' },
  ];

  const handleLabelChange = (val: string) => {
    setNewPermLabel(val);
    const slug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '');
    if (slug) {
      setNewPermCode(`${newPermModule}.${slug}`);
    }
  };

  const handleModuleChange = (mod: string) => {
    setNewPermModule(mod);
    if (newPermLabel.trim()) {
      const slug = newPermLabel
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '');
      setNewPermCode(`${mod}.${slug}`);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce rôle ?')) {
      const res = await deleteRole(id);
      if (res.success) {
        reFetchRoles();
      } else {
        alert(res.message);
      }
    }
  };

  const handleCreatePerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPermCode.trim() || !newPermLabel.trim()) return;

    setIsCreatingPerm(true);
    setPermError('');
    const selectedMod = MODULE_OPTIONS.find(m => m.key === newPermModule);
    const res = await createPermission({
      name: newPermCode.trim().toLowerCase(),
      label: newPermLabel.trim(),
      module: newPermModule,
      module_name: selectedMod?.name || ucfirst(newPermModule),
    });
    setIsCreatingPerm(false);

    if (res.success) {
      setNewPermCode('');
      setNewPermLabel('');
    } else {
      setPermError(res.message || 'Erreur lors de la création');
    }
  };

  const openEditPerm = (perm: any) => {
    setEditPerm(perm);
    setEditPermCode(perm.name || perm.code || '');
    setEditPermLabel(perm.label || perm.name || '');
    setEditPermModule(perm.module || 'pos');
    setEditPermError('');
  };

  const handleUpdatePerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPerm) return;

    setIsUpdatingPerm(true);
    setEditPermError('');
    const selectedMod = MODULE_OPTIONS.find(m => m.key === editPermModule);
    const res = await updatePermission(editPerm.id, {
      name: editPermCode.trim().toLowerCase(),
      label: editPermLabel.trim(),
      module: editPermModule,
      module_name: selectedMod?.name || ucfirst(editPermModule),
    });
    setIsUpdatingPerm(false);

    if (res.success) {
      setEditPerm(null);
    } else {
      setEditPermError(res.message || 'Erreur lors de la modification');
    }
  };

  const handleDeletePerm = async (id: string, name: string) => {
    if (window.confirm(`Voulez-vous vraiment supprimer la permission "${name}" ?`)) {
      const res = await deletePermission(id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const ucfirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  const filteredPermissions = permissions.filter(p =>
    p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
    (p.label && p.label.toLowerCase().includes(permSearch.toLowerCase())) ||
    (p.module && p.module.toLowerCase().includes(permSearch.toLowerCase()))
  );

  return (
    <div className="container-fluid p-3 p-md-4 min-vh-100" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
     {/* <pre>{JSON.stringify(roles, null, 2)}</pre> */}
     
      <div className="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap">
        <div>
          <h1 className="fw-bold text-dark mb-0 fs-5">Rôles & Permissions</h1>
          <div className="text-muted small">Gestion des profils d'accès et de la table des permissions en base de données</div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <TableExportButton />
          {activeTab === 'roles' ? (
            <button
              type="button"
              className="btn btn-sm btn-primary border-0 shadow-2xs d-flex align-items-center gap-1 px-3 py-1 rounded-2 fw-medium"
              onClick={() => setCreateRoleOpen(true)}
            >
              <Plus size={15} /> Nouveau Rôle
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => reFetchPerms()}
            >
              Actualiser
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'roles' ? 'active fw-bold text-primary' : 'text-muted'}`}
            onClick={() => setActiveTab('roles')}
          >
            <Shield size={16} className="me-2 inline-block" />
            Rôles Utilisateurs ({roles.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'permissions' ? 'active fw-bold text-primary' : 'text-muted'}`}
            onClick={() => setActiveTab('permissions')}
          >
            <Key size={16} className="me-2 inline-block" />
            Table Permissions ({permissions.length})
          </button>
        </li>
      </ul>

      {/* Roles Tab Content */}
      {activeTab === 'roles' && (
        <>
          {rolesLoading && <CardGridSkeleton cards={3} />}
          {rolesError && <div className="alert alert-danger py-2">{rolesError}</div>}

          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
            {roles.map((r) => (
              <div key={r.id} className="col">
                <div className="card border shadow-2xs rounded-3 p-3 h-100 bg-white d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="p-2 bg-primary-subtle text-primary rounded-2">
                        <Shield size={18} />
                      </span>
                      <div>
                        {/* Affichage du label en priorité, et du nom technique en sous-titre si présent */}
                        <h6 className="fw-bold text-dark mb-0">{r.label || r.name}</h6>
                        {r.label && (
                          <div className="text-muted font-monospace" style={{ fontSize: '11px' }}>
                            {r.name}
                          </div>
                        )}
                        {r.is_system && (
                          <span className="badge bg-secondary-subtle text-secondary mt-1" style={{ fontSize: '10px' }}>
                            Système
                          </span>
                        )}
                      </div>
                    </div>

                    {!r.is_system && (
                      <div className="d-flex align-items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-light border p-1 text-primary"
                          title="Modifier"
                          onClick={() => setEditRole(r)}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-light border p-1 text-danger"
                          title="Supprimer"
                          onClick={() => handleDeleteRole(r.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-muted small mb-3 flex-grow-1">
                    {r.description || 'Aucune description définie pour ce rôle.'}
                  </p>

                  <div className="mt-auto pt-2 border-top d-flex justify-content-between align-items-center text-muted small">
                    <span className="d-flex align-items-center gap-1">
                      <CheckCircle2 size={13} className="text-success" />
                      <strong>{r.permissions?.length || 0}</strong> permissions
                    </span>
                    <span className="d-flex align-items-center gap-1">
                      <Users size={13} />
                      {r.users_count || 0} utilisateur(s)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Permissions Tab Content */}
      {activeTab === 'permissions' && (
        <div className="card border shadow-2xs rounded-3 p-3 bg-white">
          <div className="card bg-light p-3 rounded-3 mb-3">
            <h6 className="fw-bold text-dark mb-2 small">Ajouter une nouvelle permission</h6>
            <form onSubmit={handleCreatePerm} className="row g-2 align-items-end">
              <div className="col-md-3">
                <label className="form-label text-muted small mb-1">Module</label>
                <select
                  className="form-select form-select-sm"
                  value={newPermModule}
                  onChange={(e) => handleModuleChange(e.target.value)}
                >
                  {MODULE_OPTIONS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label text-muted small mb-1">Libellé en clair (label)</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Ex: Créer un devis"
                  value={newPermLabel}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-3">
                <label className="form-label text-muted small mb-1">Code technique (ex: module.action)</label>
                <input
                  type="text"
                  className="form-control form-control-sm font-monospace"
                  placeholder="Ex: quotations.create"
                  value={newPermCode}
                  onChange={(e) => setNewPermCode(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-2">
                <button
                  type="submit"
                  className="btn btn-sm btn-primary w-100 d-flex align-items-center justify-content-center gap-1"
                  disabled={isCreatingPerm || !newPermCode.trim() || !newPermLabel.trim()}
                >
                  <Plus size={14} /> Ajouter
                </button>
              </div>
            </form>
            {permError && <div className="text-danger small mt-2">{permError}</div>}
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-muted small">
              Total: <strong>{filteredPermissions.length}</strong> permission(s) enregistrée(s)
            </span>
            <div style={{ maxWidth: '300px' }} className="w-100">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white"><Search size={14} /></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filtrer par code, label ou module..."
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {permsError && <div className="alert alert-danger py-2">{permsError}</div>}

          <div className="table-responsive">
            <table className="table table-hover table-sm align-middle mb-0">
              <thead className="table-light text-muted small">
                <tr>
                  <th scope="col" style={{ width: '40px' }}>#</th>
                  <th scope="col">Module</th>
                  <th scope="col">Libellé (Label)</th>
                  <th scope="col">Code unique (Name)</th>
                  <th scope="col">UUID</th>
                  <th scope="col" className="text-end" style={{ width: '90px' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="small">
                {permsLoading ? (
                  <TableSkeletonRows columns={6} />
                ) : filteredPermissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      Aucune permission trouvée.
                    </td>
                  </tr>
                ) : (
                  filteredPermissions.map((perm, idx) => (
                    <tr key={perm.id}>
                      <td className="text-muted">{idx + 1}</td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary px-2 py-1">
                          {perm.module_name || perm.module || 'Général'}
                        </span>
                      </td>
                      <td className="fw-semibold text-dark">
                        {perm.label || perm.name}
                      </td>
                      <td>
                        <span className="badge bg-primary-subtle text-primary font-monospace px-2 py-1">
                          {perm.name}
                        </span>
                      </td>
                      <td className="text-muted font-monospace" style={{ fontSize: '11px' }}>
                        {perm.id}
                      </td>
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-light border p-1 text-primary"
                            title="Modifier cette permission"
                            onClick={() => openEditPerm(perm)}
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-light border p-1 text-danger"
                            title="Supprimer cette permission"
                            onClick={() => handleDeletePerm(perm.id, perm.label || perm.name)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Permission Modal */}
      <FormModal
        isOpen={!!editPerm}
        onClose={() => setEditPerm(null)}
        title="Modifier la Permission"
        icon={<Key size={18} />}
        onSubmit={handleUpdatePerm}
        submitting={isUpdatingPerm}
        error={editPermError}
      >
        <div className="d-flex flex-column gap-3">
          <div>
            <label className="form-label small fw-semibold text-dark mb-1">Module</label>
            <select
              className="form-select form-select-sm"
              value={editPermModule}
              onChange={(e) => setEditPermModule(e.target.value)}
            >
              {MODULE_OPTIONS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label small fw-semibold text-dark mb-1">Libellé en clair (label)</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={editPermLabel}
              onChange={(e) => setEditPermLabel(e.target.value)}
              placeholder="Ex: Réimprimer un ticket de caisse"
              required
            />
          </div>

          <div>
            <label className="form-label small fw-semibold text-dark mb-1">Code technique unique (code)</label>
            <input
              type="text"
              className="form-control form-control-sm font-monospace"
              value={editPermCode}
              onChange={(e) => setEditPermCode(e.target.value)}
              placeholder="Ex: pos.ticket.reprint"
              required
            />
          </div>
        </div>
      </FormModal>

      <RoleCreate
        isOpen={createRoleOpen}
        onClose={() => setCreateRoleOpen(false)}
        onSuccess={() => {
          reFetchRoles();
          reFetchPerms();
        }}
      />

      <RoleEdit
        isOpen={!!editRole}
        onClose={() => setEditRole(null)}
        role={editRole}
        onSuccess={() => {
          reFetchRoles();
          reFetchPerms();
        }}
      />
    </div>
  );
}