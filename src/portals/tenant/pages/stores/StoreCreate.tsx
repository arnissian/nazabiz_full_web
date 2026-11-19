import React, { useContext, useEffect, useState } from "react";
import { Plus, Edit3, Eye, Loader2, Store, Phone, Mail, MapPin, Hash } from "lucide-react";
import { useCreateStore } from "../../hooks/stores/useCreateStore";
import { useUpdateStore } from "../../hooks/stores/useUpdateStore";
import { toast } from "react-toastify";
import { AppContext } from "../../../shared/context/AppContext";

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface StoreEditProps extends StoreModalProps {
  item: any | null;
}

interface StoreShowProps {
  item: any | null;
  isOpen: boolean;
  onClose: () => void;
}

/* ==========================================================================
   1. STORE CREATE MODAL
   ========================================================================== */
export default function StoreCreate({ isOpen, onClose, onSuccess }: StoreModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { auth, saveAuth } = useContext(AppContext);
  const { createStore, submitting } = useCreateStore();

  if (!isOpen) return null;

  const resetFields = () => {
    setName("");
    setCode("");
    setAddress("");
    setPhone("");
    setEmail("");
    setError(null);
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !code.trim()) {
      setError("Le nom et le code du magasin sont requis.");
      return;
    }

    const r = await createStore({
      name: name.trim(),
      code: code.trim(),
      address,
      phone,
      email,
    });

    if (r.success) {
      if (auth && r.user) {
        saveAuth({
          ...auth,
          user: {
            ...auth.user,
            stores: r.user.stores ?? auth.user.stores,
            active_store: r.active_store ?? r.user.active_store ?? auth.user.active_store,
          },
          active_store: r.active_store ?? r.user.active_store ?? auth.active_store,
        });
      }
      resetFields();
      onSuccess();
      onClose();
      toast.success("Magasin créé avec succès");
    } else {
      setError(r.message);
    }
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(15, 23, 42, 0.6)" }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 position-relative rounded-3 overflow-hidden">
          
          {/* Bouton Fermeture */}
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="position-absolute rounded-circle btn-turquoise d-flex align-items-center justify-content-center shadow-sm bg-primary"
            style={{
              top: "12px",
              right: "12px",
              width: "28px",
              height: "28px",
              zIndex: 1055,
              cursor: "pointer",
            }}
          >
            ✕
          </button>

          {/* En-tête */}
          <div className="modal-header border-bottom bg-white py-3 px-4">
            <h5 className="modal-title text-dark d-flex align-items-center text-primary gap-2 m-0 fs-6 fw-normal">
              <div className="bg-primary-subtle p-2 rounded bg-light text-turquoise d-flex align-items-center justify-content-center">
                <Plus size={18} />
              </div>
              Nouveau Magasin
            </h5>
          </div>

          <form onSubmit={submit}>
            <div className="modal-body p-4 bg-white fw-normal">
              {error && (
                <div className="alert alert-danger py-2 mb-3 fs-7" role="alert">
                  {error}
                </div>
              )}

              <div className="row g-4">
                {/* COLONNE GAUCHE : Identité du Magasin */}
                <div className="col-lg-6 border-end pe-lg-4">
                  <span className="text-secondary d-flex align-items-center gap-1 mb-2 fs-7 fw-normal">
                    <Store size={14} /> Identification
                  </span>

                  <fieldset className="custom-fieldset mb-3">
                    <legend>
                      Nom du magasin <span className="text-danger">*</span>
                    </legend>
                    <input
                      type="text"
                      placeholder="Ex: Magasin Principal, Dépôt Central..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </fieldset>

                  <fieldset className="custom-fieldset mb-3">
                    <legend>
                      Code Magasin <span className="text-danger">*</span>
                    </legend>
                    <input
                      type="text"
                      placeholder="Ex: STORE-001"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </fieldset>

                  <fieldset className="custom-fieldset mb-0">
                    <legend>Adresse physique</legend>
                    <textarea
                      rows={3}
                      placeholder="Adresse, rue, ville..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={submitting}
                    />
                  </fieldset>
                </div>

                {/* COLONNE DROITE : Contacts */}
                <div className="col-lg-6 ps-lg-4">
                  <span className="text-secondary d-flex align-items-center gap-1 mb-2 fs-7 fw-normal">
                    <Phone size={14} /> Coordonnées & Contact
                  </span>

                  <fieldset className="custom-fieldset mb-3">
                    <legend>Numéro Téléphone</legend>
                    <input
                      type="tel"
                      placeholder="Ex: +243 900 000 000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={submitting}
                    />
                  </fieldset>

                  <fieldset className="custom-fieldset mb-3">
                    <legend>Adresse Email</legend>
                    <input
                      type="email"
                      placeholder="contact@magasin.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={submitting}
                    />
                  </fieldset>
                </div>
              </div>
            </div>

            {/* Pied de page */}
            <div className="modal-footer border-top bg-light py-2 px-4">
              <button
                type="button"
                className="btn btn-outline-dark px-3 fw-normal"
                onClick={handleClose}
                disabled={submitting}
                style={{ fontSize: "0.8rem" }}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary px-4 fw-normal d-flex align-items-center gap-1"
                disabled={submitting}
                style={{ fontSize: "0.8rem" }}
              >
                {submitting && <Loader2 size={14} className="spinner-border spinner-border-sm me-1" />}
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   2. STORE EDIT MODAL
   ========================================================================== */
export function StoreEdit({ item, isOpen, onClose, onSuccess }: StoreEditProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { updateStore, submitting } = useUpdateStore();

  useEffect(() => {
    if (item) {
      setName(item.name ?? "");
      setCode(item.code ?? "");
      setAddress(item.address ?? "");
      setPhone(item.phone ?? "");
      setEmail(item.email ?? "");
      setError(null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !code.trim()) {
      setError("Le nom et le code du magasin sont requis.");
      return;
    }

    const r = await updateStore(item.id, {
      name,
      code,
      address,
      phone,
      email,
    });

    if (r.success) {
      onSuccess();
      onClose();
      toast.success("Magasin mis à jour avec succès");
    } else {
      setError(r.message);
    }
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(15, 23, 42, 0.6)" }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 position-relative rounded-3 overflow-hidden">
          
          {/* Bouton Fermeture */}
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="position-absolute rounded-circle btn-turquoise d-flex align-items-center justify-content-center shadow-sm bg-primary"
            style={{
              top: "12px",
              right: "12px",
              width: "28px",
              height: "28px",
              zIndex: 1055,
              cursor: "pointer",
            }}
          >
            ✕
          </button>

          {/* En-tête */}
          <div className="modal-header border-bottom bg-white py-3 px-4">
            <h5 className="modal-title text-dark d-flex align-items-center text-primary gap-2 m-0 fs-6 fw-normal">
              <div className="bg-primary-subtle p-2 rounded bg-light text-turquoise d-flex align-items-center justify-content-center">
                <Edit3 size={18} />
              </div>
              Modifier le Magasin
            </h5>
          </div>

          <form onSubmit={submit}>
            <div className="modal-body p-4 bg-white fw-normal">
              {error && (
                <div className="alert alert-danger py-2 mb-3 fs-7" role="alert">
                  {error}
                </div>
              )}

              <div className="row g-4">
                {/* COLONNE GAUCHE */}
                <div className="col-lg-6 border-end pe-lg-4">
                  <span className="text-secondary d-flex align-items-center gap-1 mb-2 fs-7 fw-normal">
                    <Store size={14} /> Identification
                  </span>

                  <fieldset className="custom-fieldset mb-3">
                    <legend>
                      Nom du magasin <span className="text-danger">*</span>
                    </legend>
                    <input
                      type="text"
                      placeholder="Ex: Magasin Principal..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </fieldset>

                  <fieldset className="custom-fieldset mb-3">
                    <legend>
                      Code Magasin <span className="text-danger">*</span>
                    </legend>
                    <input
                      type="text"
                      placeholder="Ex: STORE-001"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </fieldset>

                  <fieldset className="custom-fieldset mb-0">
                    <legend>Adresse physique</legend>
                    <textarea
                      rows={3}
                      placeholder="Adresse, rue, ville..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={submitting}
                    />
                  </fieldset>
                </div>

                {/* COLONNE DROITE */}
                <div className="col-lg-6 ps-lg-4">
                  <span className="text-secondary d-flex align-items-center gap-1 mb-2 fs-7 fw-normal">
                    <Phone size={14} /> Coordonnées & Contact
                  </span>

                  <fieldset className="custom-fieldset mb-3">
                    <legend>Numéro Téléphone</legend>
                    <input
                      type="tel"
                      placeholder="Ex: +243 900 000 000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={submitting}
                    />
                  </fieldset>

                  <fieldset className="custom-fieldset mb-3">
                    <legend>Adresse Email</legend>
                    <input
                      type="email"
                      placeholder="contact@magasin.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={submitting}
                    />
                  </fieldset>
                </div>
              </div>
            </div>

            {/* Pied de page */}
            <div className="modal-footer border-top bg-light py-2 px-4">
              <button
                type="button"
                className="btn btn-outline-dark px-3 fw-normal"
                onClick={onClose}
                disabled={submitting}
                style={{ fontSize: "0.8rem" }}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary px-4 fw-normal d-flex align-items-center gap-1"
                disabled={submitting}
                style={{ fontSize: "0.8rem" }}
              >
                {submitting && <Loader2 size={14} className="spinner-border spinner-border-sm me-1" />}
                Mettre à jour
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   3. STORE SHOW MODAL (CONSULTATION)
   ========================================================================== */
export function StoreShow({ item, isOpen, onClose }: StoreShowProps) {
  if (!isOpen || !item) return null;

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(15, 23, 42, 0.6)" }}>
      <div className="modal-dialog modal-md modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 position-relative rounded-3 overflow-hidden">
          
          {/* Bouton Fermeture */}
          <button
            type="button"
            onClick={onClose}
            className="position-absolute rounded-circle btn-turquoise d-flex align-items-center justify-content-center shadow-sm bg-primary"
            style={{
              top: "12px",
              right: "12px",
              width: "28px",
              height: "28px",
              zIndex: 1055,
              cursor: "pointer",
            }}
          >
            ✕
          </button>

          {/* En-tête */}
          <div className="modal-header border-bottom bg-white py-3 px-4">
            <h5 className="modal-title text-dark d-flex align-items-center text-primary gap-2 m-0 fs-6 fw-normal">
              <div className="bg-primary-subtle p-2 rounded bg-light text-turquoise d-flex align-items-center justify-content-center">
                <Eye size={18} />
              </div>
              Détails du Magasin
            </h5>
          </div>

          <div className="modal-body p-4 bg-white fw-normal">
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-start gap-3 p-3 bg-light rounded-3">
                <Store size={20} className="text-primary mt-1" />
                <div>
                  <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "0.65rem" }}>
                    Nom du magasin
                  </small>
                  <span className="fs-6 fw-semibold text-dark">{item.name || "—"}</span>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-6">
                  <div className="p-2 border rounded">
                    <small className="text-muted d-flex align-items-center gap-1 mb-1" style={{ fontSize: "0.7rem" }}>
                      <Hash size={12} /> Code
                    </small>
                    <span className="fw-medium text-dark fs-7">{item.code || "—"}</span>
                  </div>
                </div>

                <div className="col-6">
                  <div className="p-2 border rounded">
                    <small className="text-muted d-flex align-items-center gap-1 mb-1" style={{ fontSize: "0.7rem" }}>
                      <Phone size={12} /> Téléphone
                    </small>
                    <span className="fw-medium text-dark fs-7">{item.phone || "—"}</span>
                  </div>
                </div>

                <div className="col-12">
                  <div className="p-2 border rounded">
                    <small className="text-muted d-flex align-items-center gap-1 mb-1" style={{ fontSize: "0.7rem" }}>
                      <Mail size={12} /> Email
                    </small>
                    <span className="fw-medium text-dark fs-7">{item.email || "—"}</span>
                  </div>
                </div>

                <div className="col-12">
                  <div className="p-2 border rounded">
                    <small className="text-muted d-flex align-items-center gap-1 mb-1" style={{ fontSize: "0.7rem" }}>
                      <MapPin size={12} /> Adresse
                    </small>
                    <span className="fw-medium text-dark fs-7">{item.address || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pied de page */}
          <div className="modal-footer border-top bg-light py-2 px-4">
            <button
              type="button"
              className="btn btn-outline-dark px-4 fw-normal"
              onClick={onClose}
              style={{ fontSize: "0.8rem" }}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}