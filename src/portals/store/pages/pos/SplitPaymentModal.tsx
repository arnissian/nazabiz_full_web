import React, { useState, useEffect } from 'react';
import { Banknote, CreditCard, Smartphone, Building2, Plus, Trash2 } from 'lucide-react';

interface PaymentLine {
  id: string;
  payment_method: string;
  amount: number;
  reference?: string;
}

interface SplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  onValidate: (payments: Array<{ payment_method: string; amount: number; reference?: string }>) => Promise<any>;
  processing: boolean;
  formatCurrency: (amount: number) => string;
}

const paymentMethods = [
  { id: 'cash', label: 'Espèces', icon: Banknote },
  { id: 'card', label: 'Carte', icon: CreditCard },
  { id: 'mobile_money', label: 'Mobile', icon: Smartphone },
  { id: 'bank_transfer', label: 'Virement', icon: Building2 },
];

const SplitPaymentModal: React.FC<SplitPaymentModalProps> = ({
  isOpen,
  onClose,
  grandTotal,
  onValidate,
  processing,
  formatCurrency
}) => {
  const [payments, setPayments] = useState<PaymentLine[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPayments([{ id: Date.now().toString(), payment_method: 'cash', amount: grandTotal }]);
      setError(null);
    }
  }, [isOpen, grandTotal]);

  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remaining = grandTotal - totalPaid;

  const handleAddPayment = () => {
    setPayments([
      ...payments,
      { id: Date.now().toString(), payment_method: 'cash', amount: remaining > 0 ? remaining : 0 }
    ]);
  };

  const handleRemovePayment = (id: string) => {
    if (payments.length > 1) {
      setPayments(payments.filter(p => p.id !== id));
    }
  };

  const handleUpdatePayment = (id: string, field: keyof PaymentLine, value: any) => {
    setPayments(payments.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSubmit = async () => {
    if (totalPaid < grandTotal) {
      const hasCash = payments.some(p => p.payment_method === 'cash');
      if (!hasCash) {
         setError('Le montant total payé doit être au moins égal au total à payer.');
         return;
      }
    }
    setError(null);
    try {
      await onValidate(payments.map(({ payment_method, amount, reference }) => ({ payment_method, amount, reference })));
    } catch (err: any) {
      setError(err.message || 'Erreur lors du paiement');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1049, backgroundColor: 'rgba(0,0,0,0.7)' }}></div>
      <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content border-0 shadow-lg rounded-3 overflow-hidden">
            
            {/* Header avec la couleur primaire */}
            <div className="modal-header bg-light text-white px-4 py-3">
              <h5 className="modal-title fw-semibold d-flex align-items-center gap-2">
                <Banknote className="text-primary" /> Encaissement Partagé
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={processing}></button>
            </div>
            
            <div className="modal-body p-4 bg-white">
              {error && <div className="alert alert-danger py-2 mb-3 rounded-3">{error}</div>}

              <div className="row g-4">
                {/* Colonne gauche : Liste des paiements */}
                <div className="col-lg-7 border-end pe-lg-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fw-bold text-secondary">Lignes de règlement ({payments.length})</span>
                    <button 
                      className="btn btn-sm btn-light text-primary fw-semibold border rounded-3"
                      onClick={handleAddPayment}
                      disabled={remaining <= 0}
                    >
                      <Plus size={16} className="me-1" /> Ajouter un mode
                    </button>
                  </div>

                  <div className="d-flex flex-column gap-3" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                    {payments.map((payment, index) => (
                      <div key={payment.id} className="p-3 border rounded-3 bg-light position-relative">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="badge bg-secondary rounded-3">Paiement #{index + 1}</span>
                          {payments.length > 1 && (
                            <button className="btn btn-link text-danger p-0" onClick={() => handleRemovePayment(payment.id)}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        {/* Boutons de choix de mode */}
                        <div className="btn-group w-100 mb-3 rounded-3 overflow-hidden" role="group">
                          {paymentMethods.map(m => {
                            const Icon = m.icon;
                            const active = payment.payment_method === m.id;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                className={`btn btn-sm d-flex flex-column align-items-center py-2 ${active ? 'btn-dark text-white shadow-none' : 'btn-outline-secondary bg-white text-secondary'}`}
                                onClick={() => handleUpdatePayment(payment.id, 'payment_method', m.id)}
                              >
                                <Icon size={16} className="mb-1" />
                                <small>{m.label}</small>
                              </button>
                            );
                          })}
                        </div>

                        <div className="row g-2">
                          <div className={payment.payment_method !== 'cash' ? 'col-6' : 'col-12'}>
                            <label className="form-label text-muted small mb-1">Montant</label>
                            <input 
                              type="number" 
                              className="form-control form-control-sm fw-bold rounded-3" 
                              value={payment.amount === 0 ? '' : payment.amount}
                              onChange={(e) => handleUpdatePayment(payment.id, 'amount', parseFloat(e.target.value) || 0)}
                              step="0.01"
                            />
                          </div>
                          {payment.payment_method !== 'cash' && (
                            <div className="col-6">
                              <label className="form-label text-muted small mb-1">Réf.</label>
                              <input 
                                type="text" 
                                className="form-control form-control-sm rounded-3" 
                                value={payment.reference || ''}
                                onChange={(e) => handleUpdatePayment(payment.id, 'reference', e.target.value)}
                                placeholder="N° transaction"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Colonne droite : Résumé financier et validation */}
                <div className="col-lg-5 d-flex flex-column justify-content-between ps-lg-2">
                  <div className="bg-light p-4 rounded-3 text-center border">
                    <p className="text-secondary text-uppercase small fw-bold mb-1">Total Général</p>
                    <h2 className="fw-bold text-primary mb-4">{formatCurrency(grandTotal)}</h2>
                    
                    <hr className="text-muted opacity-25" />

                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-secondary">Total Payé :</span>
                      <span className="fw-semibold">{formatCurrency(totalPaid)}</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold text-secondary">{remaining > 0 ? 'Reste à payer :' : 'Monnaie à rendre :'}</span>
                      <span className={`fs-5 fw-bold ${remaining > 0 ? 'text-danger' : 'text-success'}`}>
                        {formatCurrency(Math.abs(remaining))}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 d-grid gap-2">
                    <button 
                      type="button" 
                      className="btn btn-primary btn-lg py-2 fw-bold shadow-sm rounded-3" 
                      onClick={handleSubmit}
                      disabled={processing || (totalPaid < grandTotal && !payments.some(p => p.payment_method === 'cash'))}
                    >
                      {processing ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                      Valider ({formatCurrency(totalPaid)})
                    </button>
                    {/* Bouton Annuler corrigé avec une bordure propre et un arrondi rounded-3 */}
                    <button type="button" className="btn btn-outline-secondary border-1 rounded-3 py-2" onClick={onClose} disabled={processing}>
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default SplitPaymentModal;