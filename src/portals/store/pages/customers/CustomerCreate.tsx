import React, { useEffect, useState } from "react";
import { Plus, Edit, User } from "lucide-react";
import { useCreateCustomer } from "../../hooks/customers/useCreateCustomer";
import { useUpdateCustomer } from "../../hooks/customers/useUpdateCustomer";
import FormModal from "../../../shared/components/common/FormModal";

export default function CustomerCreate({ isOpen, onClose, onSuccess }: any) {
  const [name, setName] = useState<any>("");
  const [phone, setPhone] = useState<any>("");
  const [email, setEmail] = useState<any>("");
  const [city, setCity] = useState<any>("");
  const [error, setError] = useState("");
  const { createCustomer, submitting } = useCreateCustomer();

  if (!isOpen) return null;

  const submit = async (e: any) => {
    e.preventDefault();
    const r = await createCustomer({ name: name, phone: phone, email: email, city: city });
    if (r.success) {
      onSuccess();
      onClose();
    } else setError(r.message);
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouveau Client"
      icon={<Plus size={18} />}
      onSubmit={submit}
      submitting={submitting}
      error={error}
    >
      <span className="text-secondary d-flex align-items-center gap-1 mb-2 fs-7 fw-normal">
        <User size={14} /> Informations du client
      </span>
      <div className="row g-2">
        <div className="col-md-6">
          <fieldset className="custom-fieldset">
            <legend>Nom</legend>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom complet" />
          </fieldset>
        </div>
        <div className="col-md-6">
          <fieldset className="custom-fieldset">
            <legend>Téléphone</legend>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex: 06..." />
          </fieldset>
        </div>
        <div className="col-md-6">
          <fieldset className="custom-fieldset mb-0">
            <legend>Email</legend>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" />
          </fieldset>
        </div>
        <div className="col-md-6">
          <fieldset className="custom-fieldset mb-0">
            <legend>Ville</legend>
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ville" />
          </fieldset>
        </div>
      </div>
    </FormModal>
  );
}

export function CustomerEdit({ item, isOpen, onClose, onSuccess }: any) {
  const [name, setName] = useState<any>("");
  const [phone, setPhone] = useState<any>("");
  const [email, setEmail] = useState<any>("");
  const [city, setCity] = useState<any>("");
  const [error, setError] = useState("");
  const { updateCustomer, submitting } = useUpdateCustomer();

  useEffect(() => {
    if (item) {
      setName(item.name ?? "");
      setPhone(item.phone ?? "");
      setEmail(item.email ?? "");
      setCity(item.city ?? "");
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const submit = async (e: any) => {
    e.preventDefault();
    const r = await updateCustomer(item.id, { name: name, phone: phone, email: email, city: city });
    if (r.success) {
      onSuccess();
      onClose();
    } else setError(r.message);
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier Client"
      icon={<Edit size={18} />}
      onSubmit={submit}
      submitting={submitting}
      submitLabel="Enregistrer"
      error={error}
    >
      <span className="text-secondary d-flex align-items-center gap-1 mb-2 fs-7 fw-normal">
        <User size={14} /> Informations du client
      </span>
      <div className="row g-2">
        <div className="col-md-6">
          <fieldset className="custom-fieldset">
            <legend>Nom</legend>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </fieldset>
        </div>
        <div className="col-md-6">
          <fieldset className="custom-fieldset">
            <legend>Téléphone</legend>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </fieldset>
        </div>
        <div className="col-md-6">
          <fieldset className="custom-fieldset mb-0">
            <legend>Email</legend>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </fieldset>
        </div>
        <div className="col-md-6">
          <fieldset className="custom-fieldset mb-0">
            <legend>Ville</legend>
            <input value={city} onChange={(e) => setCity(e.target.value)} />
          </fieldset>
        </div>
      </div>
    </FormModal>
  );
}

export function CustomerShow({ item, isOpen, onClose }: any) {
  if (!isOpen || !item) return null;
  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Détails Client</h5>
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
