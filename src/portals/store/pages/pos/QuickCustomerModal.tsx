import React, { useState } from 'react';
import { UserPlus, Phone, User, AlertCircle, Check, X } from 'lucide-react';
import { useQuickCreateCustomer } from '../../hooks/customers/useQuickCreateCustomer';

interface QuickCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerSelected: (customer: { id: string; name: string; phone: string }) => void;
}

export default function QuickCustomerModal({
  isOpen,
  onClose,
  onCustomerSelected,
}: QuickCustomerModalProps) {
  const { quickCreateCustomer, submitting } = useQuickCreateCustomer();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setPhone('');
    setError('');
    setSuccessMsg('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setError('Le nom du client est obligatoire.');
      return;
    }
    if (!phone.trim()) {
      setError('Le numéro de téléphone est obligatoire.');
      return;
    }

    const res = await quickCreateCustomer({
      name: name.trim(),
      phone: phone.trim(),
    });

    if (res.success && res.data) {
      const msg = res.isExisting
        ? `Client "${res.data.name}" trouvé et sélectionné !`
        : `Client "${res.data.name}" créé et sélectionné !`;
      setSuccessMsg(msg);

      // Petit délai pour laisser l'utilisateur voir le message de succès
      setTimeout(() => {
        onCustomerSelected({
          id: res.data.id,
          name: res.data.name,
          phone: res.data.phone,
        });
        handleClose();
      }, 800);
    } else {
      setError(res.message || "Erreur lors de l'enregistrement.");
    }
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Header */}
          <div className="modal-header bg-primary text-white border-0 py-3">
            <div className="d-flex align-items-center gap-2">
              <UserPlus size={20} />
              <h6 className="modal-title fw-bold mb-0">Enregistrement rapide du client</h6>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={handleClose}
              disabled={submitting}
            />
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {/* Info box */}
              <div className="bg-primary-subtle p-3 rounded-3 mb-3 d-flex align-items-start gap-2">
                <AlertCircle size={16} className="text-primary mt-1 flex-shrink-0" />
                <span className="small text-primary">
                  Entrez le numéro de téléphone du client. S'il existe déjà dans
                  le système, il sera automatiquement sélectionné. Sinon, un
                  nouveau client sera créé.
                </span>
              </div>

              {/* Error alert */}
              {error && (
                <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {/* Success alert */}
              {successMsg && (
                <div className="alert alert-success py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                  <Check size={14} /> {successMsg}
                </div>
              )}

              {/* Phone field */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">
                  <Phone size={14} className="me-1" />
                  Numéro de téléphone <span className="text-danger">*</span>
                </label>
                <input
                  type="tel"
                  className="form-control form-control-lg"
                  placeholder="Ex : +243 812 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={submitting}
                  autoFocus
                />
              </div>

              {/* Name field */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">
                  <User size={14} className="me-1" />
                  Nom du client <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Ex : Jean Mukendi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                />
                <div className="form-text" style={{ fontSize: '11px' }}>
                  Les autres informations (email, adresse…) pourront être complétées plus tard.
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer bg-light border-0 py-3">
              <button
                type="button"
                className="btn btn-outline-secondary d-flex align-items-center gap-1"
                onClick={handleClose}
                disabled={submitting}
              >
                <X size={16} /> Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  <UserPlus size={16} />
                )}
                Enregistrer le client
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
