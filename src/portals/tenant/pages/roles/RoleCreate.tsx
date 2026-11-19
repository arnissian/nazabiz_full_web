import React, { useState } from 'react';
import { Plus, Shield, CheckSquare, Square } from 'lucide-react';
import { useCreateRole } from '../../hooks/roles/useCreateRole';
import { usePermissions } from '../../hooks/roles/usePermissions';
import { AVAILABLE_PERMISSIONS } from '../../../shared/types/role';
import FormModal from '../../../shared/components/common/FormModal';

export default function RoleCreate({ isOpen, onClose, onSuccess }: any) {
  const [name, setName] = useState('');
  const [label, setLabel] = useState(''); // Champ label ajouté
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [error, setError] = useState('');

  const { createRole, submitting } = useCreateRole();
  const { groupedPermissions } = usePermissions();

  const permissionsList = groupedPermissions.length > 0 ? groupedPermissions : AVAILABLE_PERMISSIONS;

  if (!isOpen) return null;

  const togglePermission = (code: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  const toggleAllInModule = (codes: string[]) => {
    const allSelected = codes.every((c) => selectedPermissions.includes(c));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((c) => !codes.includes(c)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...codes])));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Le nom du rôle est obligatoire.');
      return;
    }

    const res = await createRole({
      name: name.trim(),
      label: label.trim(), // Inclusion du label dans l'appel
      description: description.trim(),
      permissions: selectedPermissions
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
      title="Créer un Rôle d'Utilisateur"
      icon={<Shield size={18} />}
      size="modal-lg"
      onSubmit={submit}
      submitting={submitting}
      submitLabel="Enregistrer le rôle"
      error={error}
    >
      <div className="mb-3">
        <fieldset className="custom-fieldset">
          <legend>Nom technique / Identifiant <span className="text-danger">*</span></legend>
          <input
            type="text"
            required
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: chef_rayon, commercial_terrain..."
          />
        </fieldset>
      </div>

      {/* Nouveau champ Label */}
      <div className="mb-3">
        <fieldset className="custom-fieldset">
          <legend>Label (Libellé affiché)</legend>
          <input
            type="text"
            className="form-control"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: Chef de rayon, Commercial terrain..."
          />
        </fieldset>
      </div>

      <div className="mb-3">
        <fieldset className="custom-fieldset">
          <legend>Description</legend>
          <input
            type="text"
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Missions ou responsabilités de ce rôle..."
          />
        </fieldset>
      </div>

      <div className="border-top pt-3">
        <h6 className="fw-bold text-dark mb-2">Permissions attribuées</h6>
        <div className="row g-3">
          {permissionsList.map((group) => {
            const groupCodes = group.permissions.map((p) => p.code);
            const isGroupFullySelected = groupCodes.every((c) => selectedPermissions.includes(c));

            return (
              <div key={group.module} className="col-md-6">
                <div className="card border rounded-3 p-3 h-100 bg-light-subtle">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-semibold text-dark small">{group.moduleName}</span>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-decoration-none text-muted"
                      style={{ fontSize: '11px' }}
                      onClick={() => toggleAllInModule(groupCodes)}
                    >
                      {isGroupFullySelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                  </div>

                  <div className="d-flex flex-column gap-1">
                    {group.permissions.map((perm) => {
                      const isChecked = selectedPermissions.includes(perm.code);
                      return (
                        <label
                          key={perm.code}
                          className="d-flex align-items-center gap-2 small cursor-pointer text-dark py-1"
                          style={{ userSelect: 'none' }}
                        >
                          <input
                            type="checkbox"
                            className="form-check-input mt-0"
                            checked={isChecked}
                            onChange={() => togglePermission(perm.code)}
                          />
                          <span>{perm.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </FormModal>
  );
}