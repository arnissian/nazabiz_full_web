import React from "react";
import {
  Package,
  Tag,
  Layers,
  Folder,
  Scale,
  Barcode,
  FileText,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { uploads } from "../../../shared/config/env";

export default function ProductShow({ item, isOpen, onClose }: any) {
  if (!isOpen || !item) return null;

  const imageUrl =
    typeof item.image === "string" && item.image
      ? item.image.startsWith("http")
        ? item.image
        : `${uploads}/${item.image}`
      : null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Header */}
          <div className="modal-header bg-white px-4 py-3 border-bottom border-light-subtle">
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center">
                <Package size={20} />
              </div>
              <div>
                <h6 className="modal-title fw-bold text-dark mb-0">Fiche Produit</h6>
                <small className="text-muted" style={{ fontSize: "11px" }}>
                  ID: #{item.id || "—"}
                </small>
              </div>
            </div>
            <button
              type="button"
              className="btn-close shadow-none"
              onClick={onClose}
            />
          </div>

          <div className="modal-body p-4 bg-light-subtle">
            <div className="row g-4">
              {/* Colonne Gauche: Image & Badge Status */}
              <div className="col-md-4 text-center">
                <div className="bg-white p-3 rounded-4 shadow-sm border border-light-subtle h-100 d-flex flex-column align-items-center justify-content-center">
                  <div
                    className="bg-light rounded-3 d-flex align-items-center justify-content-center mb-3 overflow-hidden position-relative"
                    style={{ width: "100%", height: "180px" }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="img-fluid h-100 w-100 object-fit-contain p-2"
                      />
                    ) : (
                      <Package size={56} className="text-secondary opacity-30" />
                    )}
                  </div>

                  <h6 className="fw-bold text-dark mb-2 text-break px-2">
                    {item.name || "—"}
                  </h6>

                  <div className="mt-auto pt-2">
                    {item.is_active ? (
                      <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1">
                        <CheckCircle2 size={13} /> Actif
                      </span>
                    ) : (
                      <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1">
                        <XCircle size={13} /> Inactif
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Colonne Droite: Informations de la fiche */}
              <div className="col-md-8">
                <div className="d-flex flex-column gap-3">
                  {/* Code-barres */}
                  <div className="row g-2">
                    <div className="col-12">
                      <div className="bg-white p-3 rounded-3 shadow-sm border border-light-subtle">
                        <small className="text-muted d-flex align-items-center gap-1 mb-1" style={{ fontSize: "11px" }}>
                          <Barcode size={13} className="text-primary" /> Code-barres
                        </small>
                        <span className="fw-bold text-dark text-break fs-7">
                          {item.barcode || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bloc Categorisation */}
                  <div className="bg-white p-3 rounded-3 shadow-sm border border-light-subtle">
                    <small className="text-muted fw-bold text-uppercase d-block mb-3" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>
                      Classification & Organisation
                    </small>
                    <div className="row g-3">
                      <div className="col-6">
                        <div className="d-flex align-items-center gap-2">
                          <Folder size={15} className="text-muted flex-shrink-0" />
                          <div>
                            <small className="text-muted d-block" style={{ fontSize: "10px" }}>Domaine</small>
                            <span className="fw-medium text-dark fs-7">
                              {item.domain?.name || item.domain_name || "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="col-6">
                        <div className="d-flex align-items-center gap-2">
                          <Layers size={15} className="text-muted flex-shrink-0" />
                          <div>
                            <small className="text-muted d-block" style={{ fontSize: "10px" }}>Catégorie</small>
                            <span className="fw-medium text-dark fs-7">
                              {item.category?.name || item.category_name || "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="col-6">
                        <div className="d-flex align-items-center gap-2">
                          <Layers size={15} className="text-muted flex-shrink-0" />
                          <div>
                            <small className="text-muted d-block" style={{ fontSize: "10px" }}>Sous-catégorie</small>
                            <span className="fw-medium text-dark fs-7">
                              {item.subcategory?.name || item.subcategory_name || "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="col-6">
                        <div className="d-flex align-items-center gap-2">
                          <Tag size={15} className="text-muted flex-shrink-0" />
                          <div>
                            <small className="text-muted d-block" style={{ fontSize: "10px" }}>Marque</small>
                            <span className="fw-medium text-dark fs-7">
                              {item.brand?.name || item.brand_name || "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="col-12 border-top pt-2 mt-2">
                        <div className="d-flex align-items-center gap-2">
                          <Scale size={15} className="text-muted flex-shrink-0" />
                          <div>
                            <small className="text-muted d-block" style={{ fontSize: "10px" }}>Unité de mesure</small>
                            <span className="fw-medium text-dark fs-7">
                              {item.unit?.name || item.unit_name || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bloc Description */}
                  <div className="bg-white p-3 rounded-3 shadow-sm border border-light-subtle">
                    <small className="text-muted fw-bold d-flex align-items-center gap-1 mb-2" style={{ fontSize: "11px" }}>
                      <FileText size={13} /> Description
                    </small>
                    <p className="mb-0 text-secondary fs-7" style={{ whiteSpace: "pre-line", lineHeight: "1.5" }}>
                      {item.description || "Aucune description renseignée."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer bg-white px-4 py-2 border-top border-light-subtle">
            <button
              type="button"
              className="btn btn-light border px-4 rounded-3 text-secondary fw-medium"
              onClick={onClose}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}