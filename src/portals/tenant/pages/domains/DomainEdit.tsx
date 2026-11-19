import React, { useState, useEffect } from 'react';
import type { Domain } from '../../types/domain';
import { useUpdateDomain } from '../../hooks/domains/useUpdateDomain';
import { Edit, Loader2, Image as ImageIcon, Layers } from 'lucide-react';
import ImageUpload from '../../components/common/ImageUpload';
import { toast } from 'react-toastify';
import { uploads } from '../../../shared/config/env';

interface DomainEditProps {
  domain: Domain | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DomainEdit: React.FC<DomainEditProps> = ({ domain, isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [image, setImage] = useState('');
  const [existingImage, setExistingImage] = useState('');

  const { updateDomain, submitting } = useUpdateDomain();

  useEffect(() => {
    if (domain && isOpen) {
      setName(domain.name || '');
      setExistingImage(domain.image ? `${uploads}/${domain.image}` : '');
      setDescription(domain.description || '');
      setIsActive(domain.is_active ?? true);
      setErrorMessage(null);
    }
  }, [domain, isOpen]);

  if (!isOpen || !domain) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Le nom du domaine est requis');
      return;
    }

    const res = await updateDomain(domain.id, {
      name,
      image,
      description: description.trim() || null,
      is_active: isActive,
    });

    if (res.success) {
      onSuccess();
      onClose();
      toast.success('Domaine mis à jour avec succès');
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleImage = (_base64: any, object: any) => {
    setImage(object);
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 position-relative rounded-3 overflow-hidden">
          
          {/* Bouton fermeture */}
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="
              position-absolute 
              rounded-circle btn-turquoise 
              d-flex align-items-center 
              justify-content-center shadow-sm 
              bg-primary
            "
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
                <Edit size={18} />
              </div>
              Modifier le Domaine
            </h5>
          </div>

          <form onSubmit={handleUpdate}>
            <div className="modal-body p-4 bg-white fw-normal">
              {errorMessage && (
                <div className="alert alert-danger py-2 mb-3 fs-7" role="alert">
                  {errorMessage}
                </div>
              )}

              <div className="row g-4">
                {/* COLONNE GAUCHE : Informations Textuelles */}
                <div className="col-lg-7 border-end pe-lg-4">
                  <span className="text-secondary d-flex align-items-center gap-1 mb-2 fs-7 fw-normal">
                    <Layers size={14} /> Informations du domaine
                  </span>
                  
                  <fieldset className="custom-fieldset mb-3">
                    <legend>Nom du domaine <span className="text-danger">*</span></legend>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Électronique, Textile..."
                      disabled={submitting}
                      required
                    />
                  </fieldset>

                  <fieldset className="custom-fieldset mb-0">
                    <legend>Description</legend>
                    <textarea
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Description optionnelle..."
                      disabled={submitting}
                    />
                  </fieldset>
                </div>

                {/* COLONNE DROITE : Média & Statut */}
                <div className="col-lg-5 ps-lg-3">
                  <div className="mb-3">
                    <label className="text-secondary d-flex gap-1 mb-2 fs-7 fw-normal">
                      <ImageIcon size={14} /> Image du domaine
                    </label>
                    <ImageUpload
                      defaultImage={existingImage}
                      onImage={handleImage}
                    />
                  </div>

                  <div className="section-box">
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-dark fs-7 fw-normal">Domaine actif</span>
                      <div className="form-check form-switch m-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="editIsActiveSwitch"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          disabled={submitting}
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                    </div>
                    <small className="text-muted d-block mt-1 fw-normal" style={{ fontSize: "0.7rem" }}>
                      {isActive ? "Le domaine sera visible et utilisable." : "Domaine désactivé."}
                    </small>
                  </div>
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
};

export default DomainEdit;