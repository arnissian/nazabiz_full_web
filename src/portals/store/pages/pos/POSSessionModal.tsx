import React, { useState } from 'react';
import { Lock, Unlock, AlertCircle, Store } from 'lucide-react';
import FormModal from '../../../shared/components/common/FormModal';
import type { POSSession } from '../../types/pos';

interface POSSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSession: POSSession | null;
  currentStoreId: string;
  currentStoreName: string;
  onOpenSession: (payload: { store_id: string; opening_balance: number; notes?: string }) => Promise<any>;
  onCloseSession: (payload: { session_id: string; closing_balance: number; notes?: string }) => Promise<any>;
  onSuccess: () => void;
}

export default function POSSessionModal({
  isOpen,
  onClose,
  activeSession,
  currentStoreId,
  currentStoreName,
  onOpenSession,
  onCloseSession,
  onSuccess
}: POSSessionModalProps) {
  const isClosing = !!activeSession && activeSession.status === 'open';

  const [openingBalance, setOpeningBalance] = useState('0');
  const [closingBalance, setClosingBalance] = useState('0');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isClosing) {
        const res = await onCloseSession({
          session_id: activeSession.id,
          closing_balance: Number(closingBalance) || 0,
          notes
        });
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.message || 'Erreur lors de la clôture');
        }
      } else {
        if (!currentStoreId) {
          setError('Aucun magasin actif ne vous est assigné. Veuillez contacter un administrateur.');
          setSubmitting(false);
          return;
        }
        const res = await onOpenSession({
          store_id: currentStoreId,
          opening_balance: Number(openingBalance) || 0,
          notes
        });
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.message || 'Erreur lors de l\'ouverture');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={isClosing ? 'Clôturer la session de caisse' : 'Ouvrir une session de caisse'}
      icon={isClosing ? <Lock size={18} /> : <Unlock size={18} />}
      size="modal-md"
      onSubmit={handleSubmit}
      submitting={submitting}
      submitLabel={isClosing ? 'Confirmer la clôture' : 'Ouvrir la caisse'}
      error={error}
    >
      {isClosing ? (
        <div>
          <div className="alert alert-warning border-0 d-flex align-items-center gap-2 py-2 px-3 mb-3 small">
            <AlertCircle size={16} />
            <span>
              Caisse ouverte depuis le <strong>{new Date(activeSession.opening_time).toLocaleString()}</strong>.
            </span>
          </div>

          <div className="bg-light p-3 rounded-3 mb-3">
            <div className="d-flex justify-content-between mb-1 small">
              <span className="text-muted">Fond de caisse initial :</span>
              <span className="fw-bold">{activeSession.opening_balance.toLocaleString()} $</span>
            </div>
            <div className="d-flex justify-content-between mb-1 small">
              <span className="text-muted">Total ventes enregistrées :</span>
              <span className="fw-bold text-success">+{activeSession.total_sales.toLocaleString()} $</span>
            </div>
            <div className="d-flex justify-content-between pt-1 border-top fw-bold text-dark">
              <span>Montant théorique attendu :</span>
              <span className="text-primary">
                {(activeSession.opening_balance + (activeSession.total_sales || 0)).toLocaleString()} $
              </span>
            </div>
          </div>

          <div className="mb-3">
            <fieldset className="custom-fieldset">
              <legend>Montant réel compté en caisse ($) <span className="text-danger">*</span></legend>
              <input
                type="number"
                step="0.01"
                required
                className="form-control"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                placeholder="0.00"
              />
            </fieldset>
            {Number(closingBalance) > 0 && (
              <div className="mt-1 small">
                {Number(closingBalance) - (activeSession.opening_balance + (activeSession.total_sales || 0)) === 0 ? (
                  <span className="text-success">✓ Caisse équilibrée, aucun écart.</span>
                ) : (
                  <span className={Number(closingBalance) - (activeSession.opening_balance + (activeSession.total_sales || 0)) > 0 ? 'text-info' : 'text-danger'}>
                    Écart constaté : {(Number(closingBalance) - (activeSession.opening_balance + (activeSession.total_sales || 0))).toFixed(2)} $
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mb-3">
            <fieldset className="custom-fieldset">
              <legend>Remarques / Observations de clôture</legend>
              <textarea
                className="form-control"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Raison d'un éventuel écart, dépense effectuée..."
              />
            </fieldset>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-3">
            <fieldset className="custom-fieldset">
              <legend>Point de vente / Magasin</legend>
              <div className="form-control bg-light d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <Store size={14} className="text-primary" />
                  <span className="fw-semibold">{currentStoreName || 'Aucun magasin actif'}</span>
                </div>
                <span className="badge bg-success-subtle text-success py-1 px-2 rounded-pill">Affectation active</span>
              </div>
            </fieldset>
          </div>

          <div className="mb-3">
            <fieldset className="custom-fieldset">
              <legend>Fond de caisse initial ($)</legend>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0.00"
              />
            </fieldset>
            <div className="form-text small text-muted">
              Montant en espèces laissé dans le tiroir-caisse pour rendre la monnaie.
            </div>
          </div>

          <div className="mb-3">
            <fieldset className="custom-fieldset">
              <legend>Remarques d'ouverture</legend>
              <textarea
                className="form-control"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Prise de poste caissier A..."
              />
            </fieldset>
          </div>
        </div>
      )}
    </FormModal>
  );
}
