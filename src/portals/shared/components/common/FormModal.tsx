import React from "react";
import { Loader2 } from "lucide-react";

type FormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  size?: "modal-md" | "modal-lg" | "modal-xl";
  onSubmit?: (e: React.FormEvent) => void;
  submitting?: boolean;
  submitLabel?: string;
  error?: string | null;
  children: React.ReactNode;
  closeLabel?: string;
  footer?: React.ReactNode;
};

export default function FormModal({
  isOpen,
  onClose,
  title,
  icon,
  size = "modal-lg",
  onSubmit,
  submitting,
  submitLabel = "Enregistrer",
  error,
  children,
  closeLabel,
  footer,
}: FormModalProps) {
  if (!isOpen) return null;

  const body = (
    <>
      <div className="modal-body p-4 bg-white fw-normal">
        {error && <div className="alert alert-danger py-2 mb-3 fs-7">{error}</div>}
        {children}
      </div>
      {footer ?? <div className="modal-footer border-top bg-light py-2 px-4">
        <button
          type="button"
          className="btn btn-outline-dark px-3 fw-normal"
          onClick={onClose}
          style={{ fontSize: "0.8rem" }}
        >
          {closeLabel || (onSubmit ? "Annuler" : "Fermer")}
        </button>
        {onSubmit && (
          <button
            type="submit"
            className="btn btn-primary px-4 fw-normal d-flex align-items-center gap-1"
            disabled={submitting}
            style={{ fontSize: "0.8rem" }}
          >
            {submitting && <Loader2 size={14} className="spinner-border spinner-border-sm me-1" />}
            {submitLabel}
          </button>
        )}
      </div>}
    </>
  );

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(15, 23, 42, 0.6)" }}>
      <div className={`modal-dialog ${size} modal-dialog-centered`}>
        <div className="modal-content shadow-lg border-0 position-relative rounded-3 overflow-hidden">
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

          <div className="modal-header border-bottom bg-white py-3 px-4">
            <h5 className="modal-title text-dark d-flex align-items-center text-primary gap-2 m-0 fs-6 fw-normal">
              <div className="bg-primary-subtle p-2 rounded bg-light text-turquoise d-flex align-items-center justify-content-center">
                {icon}
              </div>
              {title}
            </h5>
          </div>

          {onSubmit ? <form onSubmit={onSubmit}>{body}</form> : body}
        </div>
      </div>
    </div>
  );
}
