import React from 'react';
import type { Subcategory } from '../../types/subcategory';
import { 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Hash, 
  Package, 
  Link2, 
  FileText, 
  Image as ImageIcon,
  Folder
} from 'lucide-react';
import { uploads } from '../../../shared/config/env';

interface SubcategoryShowProps {
  subcategory: Subcategory | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SubcategoryShow: React.FC<SubcategoryShowProps> = ({ subcategory, isOpen, onClose }) => {
  if (!isOpen || !subcategory) return null;

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
              Détails de la Sous-Catégorie
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
              
              {/* Section Image & Infos principales */}
              <div className="col-12 col-md-4 text-center border-end-md border-light-subtle">
                <div className="mb-3 position-relative d-inline-block">
                  {subcategory.image ? (
                    <img
                      src={`${uploads}/${subcategory.image}`}
                      alt={subcategory.name}
                      className="img-fluid rounded-3 border border-light-subtle object-fit-cover shadow-2xs"
                      style={{ width: '140px', height: '140px' }}
                    />
                  ) : (
                    <div 
                      className="rounded-3 bg-light border border-light-subtle d-flex align-items-center justify-content-center text-muted mx-auto"
                      style={{ width: '140px', height: '140px' }}
                    >
                      <ImageIcon size={40} className="opacity-50" />
                    </div>
                  )}
                </div>

                <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '16px' }}>
                  {subcategory.name}
                </h5>

                {subcategory.category && (
                  <div className="mb-2">
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-medium px-2 py-1" style={{ fontSize: '11px' }}>
                      <Folder size={11} className="me-1" /> {subcategory.category.name}
                    </span>
                  </div>
                )}

                <div className="mt-2 mb-3">
                  {subcategory.is_active ? (
                    <span className="badge bg-success-subtle text-success border border-success-subtle fw-medium rounded-pill px-2.5 py-1" style={{ fontSize: '11px' }}>
                      <CheckCircle2 size={12} className="me-1" /> Actif
                    </span>
                  ) : (
                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle fw-medium rounded-pill px-2.5 py-1" style={{ fontSize: '11px' }}>
                      <XCircle size={12} className="me-1" /> Inactif
                    </span>
                  )}
                </div>

                {subcategory.slug && (
                  <div className="text-muted" style={{ fontSize: '12px' }}>
                    <span className="d-flex align-items-center justify-content-center gap-1">
                      <Link2 size={13} className="text-secondary" />
                      <code>{subcategory.slug}</code>
                    </span>
                  </div>
                )}
              </div>

              {/* Details & Description */}
              <div className="col-12 col-md-8 d-flex flex-column justify-content-between">
                <div>
                  {/* Description */}
                  <div className="mb-3">
                    <label className="text-muted fw-medium d-flex align-items-center gap-1 mb-1" style={{ fontSize: '12px' }}>
                      <FileText size={14} /> Description
                    </label>
                    <div className="p-3 bg-light-subtle border border-light-subtle rounded-3 text-secondary" style={{ fontSize: '13px', minHeight: '80px' }}>
                      {subcategory.description ? (
                        subcategory.description
                      ) : (
                        <span className="text-muted fst-italic">Aucune description renseignée pour cette sous-catégorie.</span>
                      )}
                    </div>
                  </div>

                  {/* Produits associés */}
                  {subcategory.products && subcategory.products.length > 0 && (
                    <div className="mb-3">
                      <label className="text-muted fw-medium d-flex align-items-center gap-1 mb-2" style={{ fontSize: '12px' }}>
                        <Package size={14} /> Produits associés ({subcategory.products.length})
                      </label>
                      <div className="d-flex flex-wrap gap-1.5">
                        {subcategory.products.map((prod: any) => (
                          <span 
                            key={prod.id || prod.name} 
                            className="badge bg-white text-dark border border-light-subtle fw-normal rounded-2 px-2 py-1" 
                            style={{ fontSize: '12px' }}
                          >
                            {prod.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Métadonnées au pied du panneau */}
                <div className="pt-3 border-top border-light-subtle text-muted" style={{ fontSize: '11px' }}>
                  <div className="row g-2">
                    <div className="col-6 d-flex align-items-center gap-1">
                      <Hash size={13} className="text-secondary" />
                      <span>ID :</span>
                      <span className="font-monospace fw-medium text-dark">{subcategory.id}</span>
                    </div>
                    {subcategory.created_at && (
                      <div className="col-6 d-flex align-items-center gap-1 justify-content-end">
                        <Calendar size={13} className="text-secondary" />
                        <span>Créé le :</span>
                        <span className="fw-medium text-dark">
                          {new Date(subcategory.created_at).toLocaleDateString('fr-FR', {
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

export default SubcategoryShow;
