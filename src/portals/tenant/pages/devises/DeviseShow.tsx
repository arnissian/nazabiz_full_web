import React from 'react';
import type { Devise } from '../../../shared/types/devise';
import { 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Hash, 
  DollarSign
} from 'lucide-react';

interface DeviseShowProps {
  devise: Devise | null;
  show: boolean;
  onClose: () => void;
}

export const DeviseShow: React.FC<DeviseShowProps> = ({ devise, show, onClose }) => {
  if (!show || !devise) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      onClick={onClose}
      style={{
        backgroundColor: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div 
        className="modal-dialog modal-dialog-centered modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg rounded-3 bg-white overflow-hidden">
          
          {/* En-tête */}
          <div className="modal-header border-bottom border-light-subtle py-3 px-4 bg-light-subtle">
            <h5 className="modal-title fw-bold text-dark fs-6 d-flex align-items-center gap-2 mb-0">
              <Eye className="text-primary" size={18} />
              Détails de la Devise
            </h5>
            <button 
              type="button" 
              className="btn-close shadow-none" 
              onClick={onClose}
              aria-label="Fermer"
            ></button>
          </div>

          {/* Corps de la modal */}
          <div className="modal-body p-4">
            <div className="row g-4">
              
              {/* Section Icône & Infos principales */}
              <div className="col-12 col-md-4 text-center border-end-md border-light-subtle">
                <div className="mb-3 position-relative d-inline-block">
                  <div 
                    className="rounded-3 bg-primary bg-opacity-10 d-flex align-items-center justify-content-center text-primary mx-auto"
                    style={{ width: '140px', height: '140px' }}
                  >
                    <DollarSign size={60} />
                  </div>
                </div>

                <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '16px' }}>
                  {devise.name}
                </h5>

                <div className="mb-2">
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-medium px-2 py-1" style={{ fontSize: '11px' }}>
                    {devise.symbol}
                  </span>
                </div>

                <div className="mt-2 mb-3">
                  {devise.is_active ? (
                    <span className="badge bg-success-subtle text-success border border-success-subtle fw-medium rounded-pill px-2.5 py-1" style={{ fontSize: '11px' }}>
                      <CheckCircle2 size={12} className="me-1" /> Actif
                    </span>
                  ) : (
                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle fw-medium rounded-pill px-2.5 py-1" style={{ fontSize: '11px' }}>
                      <XCircle size={12} className="me-1" /> Inactif
                    </span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="col-12 col-md-8 d-flex flex-column justify-content-between">
                <div>
                  {/* Code */}
                  <div className="mb-3">
                    <label className="text-muted fw-medium d-flex align-items-center gap-1 mb-1" style={{ fontSize: '12px' }}>
                      Code
                    </label>
                    <div className="p-3 bg-light-subtle border border-light-subtle rounded-3 text-dark fw-semibold" style={{ fontSize: '14px' }}>
                      {devise.code}
                    </div>
                  </div>

                  {/* Taux */}
                  <div className="mb-3">
                    <label className="text-muted fw-medium d-flex align-items-center gap-1 mb-1" style={{ fontSize: '12px' }}>
                      Taux de change
                    </label>
                    <div className="p-3 bg-light-subtle border border-light-subtle rounded-3 text-dark fw-semibold" style={{ fontSize: '14px' }}>
                      {devise.rate}
                    </div>
                  </div>
                </div>

                {/* Métadonnées au pied du panneau */}
                <div className="pt-3 border-top border-light-subtle text-muted" style={{ fontSize: '11px' }}>
                  <div className="row g-2">
                    <div className="col-6 d-flex align-items-center gap-1">
                      <Hash size={13} className="text-secondary" />
                      <span>ID :</span>
                      <span className="font-monospace fw-medium text-dark">{devise.id}</span>
                    </div>
                    {devise.created_at && (
                      <div className="col-6 d-flex align-items-center gap-1 justify-content-end">
                        <Calendar size={13} className="text-secondary" />
                        <span>Créé le :</span>
                        <span className="fw-medium text-dark">
                          {new Date(devise.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Pied de la modal */}
          <div className="modal-footer border-top border-light-subtle py-2 px-4 bg-light-subtle">
            <button
              type="button"
              className="btn btn-sm btn-light border border-light-subtle px-3 rounded-2 fw-medium"
              style={{ fontSize: '12px' }}
              onClick={onClose}
            >
              Fermer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DeviseShow;

