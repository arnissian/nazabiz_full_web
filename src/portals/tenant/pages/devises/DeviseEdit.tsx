import React, { useState } from 'react';
import type { Devise } from '../../../shared/types/devise';
import { useUpdateDevise } from '../../hooks/devises/useUpdateDevise';
import { Edit, Loader2, DollarSign } from 'lucide-react';
import { toast } from 'react-toastify';

interface DeviseEditProps {
  storeId?: string;
  devise: Devise | null;
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeviseEdit: React.FC<DeviseEditProps> = ({ storeId, devise, show, onClose, onSuccess }) => {
  const [name, setName] = useState(devise?.name || '');
  const [symbol, setSymbol] = useState(devise?.symbol || '');
  const [code, setCode] = useState(devise?.code || '');
  const [rate, setRate] = useState(devise?.rate?.toString() || '');
  const [isActive, setIsActive] = useState(devise?.is_active ?? true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { updateDevise, loading } = useUpdateDevise();

  if (!show || !devise) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Le nom de la devise est requis');
      return;
    }

    if (!symbol.trim()) {
      setErrorMessage('Le symbole de la devise est requis');
      return;
    }

    if (!code.trim()) {
      setErrorMessage('Le code de la devise est requis');
      return;
    }

    if (code.trim().toUpperCase() !== 'USD' && !rate.trim()) {
      setErrorMessage('Le taux de la devise est requis');
      return;
    }

    const res = await updateDevise(devise.id, {
      name,
      symbol,
      code,
      rate: code.trim().toUpperCase() === 'USD' ? 1 : parseFloat(rate),
      is_active: isActive,
    }, storeId, storeId ? 'store' : 'tenant');

    if (res) {
      onSuccess();
      onClose();
      toast.success('Devise mise à jour avec succès');
    } else {
      setErrorMessage('Erreur lors de la mise à jour de la devise');
    }
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 position-relative rounded-3 overflow-hidden">
          
          {/* Bouton fermeture */}
          <button
            type="button"
            onClick={onClose}
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
            <Edit size={16} className="text-white" style={{ transform: 'rotate(45deg)' }} />
          </button>

          <div className="modal-body p-4">
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="bg-primary bg-opacity-10 rounded-2 p-2">
                <DollarSign size={24} className="text-primary" />
              </div>
              <div>
                <h5 className="fw-bold mb-0">Modifier la Devise</h5>
                <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                  Mettre à jour les informations de la devise
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="alert alert-danger border-0 shadow-2xs d-flex align-items-center gap-2 mb-3 py-2 px-3 rounded-2" role="alert" style={{ fontSize: '13px' }}>
                <div>{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleUpdate}>
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
                    placeholder="Ex: Euro"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-medium" style={{ fontSize: '13px' }}>
                    Symbole <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-2"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="Ex: €"
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
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ex: EUR"
                    disabled={loading || devise.code.toUpperCase() === 'USD'}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-medium" style={{ fontSize: '13px' }}>
                    Taux pour 1 USD <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control rounded-2"
                    value={devise.code.toUpperCase() === 'USD' ? '1' : rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="Ex: 1.00"
                    disabled={loading || devise.code.toUpperCase() === 'USD'}
                    required={devise.code.toUpperCase() !== 'USD'}
                  />
                  <small className="text-muted">USD est toujours fixe à 1. Pour les autres devises, indiquez la quantité reçue pour 1 USD.</small>
                </div>

                <div className="col-12">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      disabled={loading || devise.code.toUpperCase() === 'USD'}
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
                  onClick={onClose}
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
                      Mise à jour...
                    </>
                  ) : (
                    'Mettre à jour'
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
