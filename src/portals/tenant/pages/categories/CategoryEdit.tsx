import React, { useState, useEffect } from 'react';
import type { Category } from '../../../shared/types/category';
import { useUpdateCategory } from '../../hooks/categories/useUpdateCategory';
import { useDomains } from '../../hooks/domains/useDomains';
import { Edit, Loader2, Image as ImageIcon, FolderTree } from 'lucide-react';
import ImageUpload from '../../components/common/ImageUpload';
import { toast } from 'react-toastify';
import { uploads } from '../../../shared/config/env';

interface CategoryEditProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CategoryEdit: React.FC<CategoryEditProps> = ({ category, isOpen, onClose, onSuccess }) => {
  const [domainId, setDomainId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState('');
  const [existingImage, setExistingImage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { domains, loading: domainsLoading } = useDomains({ per_page: 100 });
  const { updateCategory, submitting } = useUpdateCategory();

  useEffect(() => {
    if (category && isOpen) {
      setDomainId(category.domain_id || '');
      setName(category.name || '');
      setExistingImage(category.image ? `${uploads}/${category.image}` : '');
      setDescription(category.description || '');
      setIsActive(category.is_active ?? true);
      setErrorMessage(null);
    }
  }, [category, isOpen]);

  if (!isOpen || !category) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!domainId) {
      setErrorMessage("Le domaine d'activité est requis");
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Le nom de la catégorie est requis');
      return;
    }

    const res = await updateCategory(category.id, {
      domain_id: domainId,
      name,
      image,
      description: description.trim() || null,
      is_active: isActive,
    });

    if (res.success) {
      onSuccess();
      onClose();
      toast.success('Catégorie mise à jour avec succès');
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
              Modifier la Catégorie
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
                    <FolderTree size={14} /> Informations de la catégorie
                  </span>

                  <fieldset className="custom-fieldset mb-3">
                    <legend>Domaine d'activité <span className="text-danger">*</span></legend>
                    <select
                      value={domainId}
                      onChange={(e) => setDomainId(e.target.value)}
                      disabled={submitting || domainsLoading}
                      required
                    >
                      <option value="">-- Sélectionner un domaine --</option>
                      {domains.map((dom) => (
                        <option key={dom.id} value={dom.id}>
                          {dom.name}
                        </option>
                      ))}
                    </select>
                  </fieldset>

                  <fieldset className="custom-fieldset mb-3">
                    <legend>Nom de la catégorie <span className="text-danger">*</span></legend>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Téléphones, Vêtements Homme..."
                      disabled={submitting}
                      required
                    />
                  </fieldset>

                  <fieldset className="custom-fieldset mb-0">
                    <legend>Description</legend>
                    <textarea
                      rows={4}
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
                      <ImageIcon size={14} /> Image de la catégorie
                    </label>
                    <ImageUpload
                      defaultImage={existingImage}
                      onImage={handleImage}
                    />
                  </div>

                  <div className="section-box">
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-dark fs-7 fw-normal">Catégorie active</span>
                      <div className="form-check form-switch m-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="catEditIsActiveSwitch"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          disabled={submitting}
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                    </div>
                    <small className="text-muted d-block mt-1 fw-normal" style={{ fontSize: "0.7rem" }}>
                      {isActive ? "La catégorie sera visible et sélectionnable." : "Catégorie désactivée."}
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

export default CategoryEdit;