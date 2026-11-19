import React, { useEffect, useState } from "react";
import { Plus, Edit, Ruler } from "lucide-react";
import { useCreateUnit } from "../../hooks/units/useCreateUnit";
import { useUpdateUnit } from "../../hooks/units/useUpdateUnit";
import FormModal from "../../../shared/components/common/FormModal";

export default function UnitCreate({ isOpen, onClose, onSuccess }: any) {
  const [name, setName] = useState<any>("");
  const [abbreviation, setAbbreviation] = useState<any>("");
  const [error, setError] = useState("");
  const { createUnit, submitting } = useCreateUnit();

  if (!isOpen) return null;

  const submit = async (e: any) => {
    e.preventDefault();
    const r = await createUnit({ name: name, abbreviation: abbreviation });
    if (r.success) {
      onSuccess();
      onClose();
    } else setError(r.message);
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouveau Unité"
      icon={<Plus size={18} />}
      onSubmit={submit}
      submitting={submitting}
      error={error}
    >
      <span className="text-secondary d-flex align-items-center gap-1 mb-2 fs-7 fw-normal">
        <Ruler size={14} /> Informations de l'unité
      </span>
      <fieldset className="custom-fieldset">
        <legend>Nom</legend>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Pièce" />
      </fieldset>
      <fieldset className="custom-fieldset mb-0">
        <legend>Abréviation</legend>
        <input value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} placeholder="Ex: pcs" />
      </fieldset>
    </FormModal>
  );
}

export function UnitEdit({ item, isOpen, onClose, onSuccess }: any) {
  const [name, setName] = useState<any>("");
  const [abbreviation, setAbbreviation] = useState<any>("");
  const [error, setError] = useState("");
  const { updateUnit, submitting } = useUpdateUnit();

  useEffect(() => {
    if (item) {
      setName(item.name ?? "");
      setAbbreviation(item.abbreviation ?? "");
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const submit = async (e: any) => {
    e.preventDefault();
    const r = await updateUnit(item.id, { name: name, abbreviation: abbreviation });
    if (r.success) {
      onSuccess();
      onClose();
    } else setError(r.message);
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier Unité"
      icon={<Edit size={18} />}
      onSubmit={submit}
      submitting={submitting}
      error={error}
    >
      <span className="text-secondary d-flex align-items-center gap-1 mb-2 fs-7 fw-normal">
        <Ruler size={14} /> Informations de l'unité
      </span>
      <fieldset className="custom-fieldset">
        <legend>Nom</legend>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </fieldset>
      <fieldset className="custom-fieldset mb-0">
        <legend>Abréviation</legend>
        <input value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} />
      </fieldset>
    </FormModal>
  );
}

export function UnitShow({ item, isOpen, onClose }: any) {
  if (!isOpen || !item) return null;
  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Détails Unité</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {Object.entries(item).map(([k, v]: any) => (
              <div className="mb-2" key={k}>
                <div className="text-muted" style={{ fontSize: "12px" }}>
                  {k}
                </div>
                <div className="fw-semibold">{String(v ?? "—")}</div>
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
