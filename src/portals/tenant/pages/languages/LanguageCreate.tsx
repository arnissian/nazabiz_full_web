import React, { useState } from 'react';
import { useCreateLanguage } from '../../hooks/languages/useCreateLanguage';
import { Plus, Loader2, Globe } from 'lucide-react';
import { toast } from 'react-toastify';

interface LanguageCreateProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LanguageCreate: React.FC<LanguageCreateProps> = ({ show, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [flag, setFlag] = useState('');
  const [code, setCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { createLanguage, loading } = useCreateLanguage();

  if (!show) return null;

  const resetFields = () => {
    setName('');
    setFlag('');
    setCode('');
    setIsActive(true);
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Le nom de la langue est requis');
      return;
    }

    if (!flag.trim()) {
      setErrorMessage('Le drapeau de la langue est requis');
      return;
    }

    if (!code.trim()) {
      setErrorMessage('Le code de la langue est requis');
      return;
    }

    const res = await createLanguage({
      name,
      flag,
      code,
      is_active: isActive,
    });

    if (res) {
      resetFields();
      onSuccess();
      onClose();
      toast.success('Langue créée avec succès');
    } else {
      setErrorMessage('Erreur lors de la création de la langue');
    }
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 position-relative rounded-3 overflow-hidden">
          
          {/* Bouton fermeture */}
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
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
            <Plus size={16} className="text-white" style={{ transform: 'rotate(45deg)' }} />
          </button>

          <div className="modal-body p-4">
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="bg-primary bg-opacity-10 rounded-2 p-2">
                <Globe size={24} className="text-primary" />
              </div>
              <div>
                <h5 className="fw-bold mb-0">Nouvelle Langue</h5>
                <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                  Créer une nouvelle langue
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="alert alert-danger border-0 shadow-2xs d-flex align-items-center gap-2 mb-3 py-2 px-3 rounded-2" role="alert" style={{ fontSize: '13px' }}>
                <div>{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-medium" style={{ fontSize: '13px' }}>
                    Nom <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Français"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-medium" style={{ fontSize: '13px' }}>
                    Drapeau <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-2"
                    value={flag}
                    onChange={(e) => setFlag(e.target.value)}
                    placeholder="Ex: 🇫🇷"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-medium" style={{ fontSize: '13px' }}>
                    Code <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-2"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ex: fr"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="col-12">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      disabled={loading}
                    />
                    <label className="form-check-label" htmlFor="isActive" style={{ fontSize: '13px' }}>
                      Actif
                    </label>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-light rounded-2 px-4"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary rounded-2 px-4"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="spinner-border spinner-border-sm me-2" size={14} />
                      Création...
                    </>
                  ) : (
                    'Créer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
