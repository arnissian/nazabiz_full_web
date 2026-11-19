import React, { useContext, useRef, useState } from 'react';
import { Printer, FileText, ArrowRight, User, Truck, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Quotation } from '../../types/quotation';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';
import { toast } from 'react-toastify';
import { AppContext } from '../../../shared/context/AppContext';
import { TenantLogo } from '../../../shared/components/common/TenantLogo';

interface QuotationShowProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
  onConverted?: () => void;
  onEdit?: (quotation: Quotation) => void;
}

const getApiErrorMessage = (error: unknown): string | undefined => {
  if (typeof error !== 'object' || error === null || !('response' in error)) return undefined;
  const response = error.response;
  if (typeof response !== 'object' || response === null || !('data' in response)) return undefined;
  const data = response.data;
  if (typeof data !== 'object' || data === null) return undefined;
  if ('errors' in data && typeof data.errors === 'object' && data.errors !== null) {
    const validationMessage = Object.values(data.errors)
      .flatMap((messages) => Array.isArray(messages) ? messages : [])
      .find((message): message is string => typeof message === 'string');
    if (validationMessage) return validationMessage;
  }
  return 'message' in data && typeof data.message === 'string' ? data.message : undefined;
};

export default function QuotationShow({ isOpen, onClose, quotation, onConverted, onEdit }: QuotationShowProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const { tenantSettings } = useContext(AppContext);

  if (!isOpen || !quotation) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCreateOrder = async () => {
    setSubmitting(true);
    try {
      const response = await axiosInstance.post(`/quotations/${quotation.id}/order`);
      toast.success(response.data?.message || 'Commande validée et stock réservé.');
      onConverted?.();
      onClose();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error) || 'Impossible de valider la commande.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="badge bg-secondary-subtle text-secondary">Brouillon</span>;
      case 'sent':
        return <span className="badge bg-info-subtle text-info">Envoyé</span>;
      case 'accepted':
        return <span className="badge bg-primary-subtle text-primary">Accepté</span>;
      case 'rejected':
        return <span className="badge bg-danger-subtle text-danger">Refusé</span>;
      case 'converted':
        return <span className="badge bg-secondary-subtle text-secondary">Ancienne conversion</span>;
      case 'ordered':
        return <span className="badge bg-primary-subtle text-primary">Commande validée · stock réservé</span>;
      case 'partially_delivered':
        return <span className="badge bg-warning-subtle text-warning">Partiellement livré</span>;
      case 'delivered':
        return <span className="badge bg-success-subtle text-success">Livré</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header bg-light border-bottom py-3">
            <div className="d-flex align-items-center gap-2">
              <FileText size={20} className="text-primary" />
              <div>
                <h6 className="modal-title fw-bold mb-0">Devis / Facture Proforma</h6>
                <span className="text-muted small">{quotation.reference}</span>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body p-4 bg-white" ref={printRef}>
            {/* Header Proforma */}
            <div className="row justify-content-between align-items-start mb-4">
              <div className="col-sm-6">
                <div className="d-flex align-items-center gap-2 mb-2">
                  {tenantSettings?.logo_path
                    ? <TenantLogo style={{ width: 48, height: 48 }} />
                    : <div className="bg-primary text-white p-2 rounded-2 fw-bold fs-5">MB</div>}
                  <h4 className="fw-bold mb-0 text-dark">{tenantSettings?.name || 'MYBUSINESS'}</h4>
                </div>
                <div className="text-muted small">
                  <div>Magasin / Agence : {quotation.store?.name || 'Agence Centrale'}</div>
                  {tenantSettings?.address && <div>{tenantSettings.address}</div>}
                  {tenantSettings?.phone && <div>Tél : {tenantSettings.phone}</div>}
                  {tenantSettings?.email && <div>Email : {tenantSettings.email}</div>}
                </div>
              </div>

              <div className="col-sm-5 text-sm-end mt-3 mt-sm-0">
                <h3 className="text-primary fw-black mb-1">DEVIS</h3>
                <div className="fw-bold text-dark">{quotation.reference}</div>
                <div className="text-muted small">Date : {new Date(quotation.date).toLocaleDateString()}</div>
                {quotation.expiry_date && (
                  <div className="text-muted small">
                    Validité : jusqu'au {new Date(quotation.expiry_date).toLocaleDateString()}
                  </div>
                )}
                <div className="mt-2">{getStatusBadge(quotation.status)}</div>
              </div>
            </div>

            {/* Client Info Box */}
            <div className="card bg-light border-0 p-3 rounded-3 mb-4">
              <span className="text-muted small fw-semibold text-uppercase d-flex align-items-center gap-1 mb-1">
                <User size={13} /> Destinataire (Client)
              </span>
              <div className="fw-bold text-dark fs-6">{quotation.customer?.name || 'Client Comptant'}</div>
              {quotation.customer?.phone && (
                <div className="text-muted small">Tél : {quotation.customer.phone}</div>
              )}
              {quotation.customer?.address && (
                <div className="text-muted small">Adresse : {quotation.customer.address}</div>
              )}
            </div>

            {/* Items Table */}
            <div className="table-responsive mb-4">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr style={{ fontSize: '12px' }}>
                    <th className="py-2 text-start">Désignation</th>
                    <th className="py-2 text-center" style={{ width: '80px' }}>Qté</th>
                    {['ordered', 'partially_delivered', 'delivered'].includes(quotation.status) && (
                      <>
                        <th className="py-2 text-center">Réservée</th>
                        <th className="py-2 text-center">Livrée</th>
                      </>
                    )}
                    <th className="py-2 text-end" style={{ width: '120px' }}>Prix unitaire ($)</th>
                    <th className="py-2 text-end" style={{ width: '100px' }}>Remise ($)</th>
                    <th className="py-2 text-end" style={{ width: '130px' }}>Total ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {(quotation.items || []).map((item, idx) => (
                    <tr key={idx} style={{ fontSize: '13px' }}>
                      <td className="py-2">
                        <div className="fw-semibold text-dark">{item.product?.name || 'Article'}</div>
                        {item.product?.sku && (
                          <div className="text-muted" style={{ fontSize: '11px' }}>Réf: {item.product.sku}</div>
                        )}
                      </td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      {['ordered', 'partially_delivered', 'delivered'].includes(quotation.status) && (
                        <>
                          <td className="py-2 text-center">{item.reserved_quantity ?? 0}</td>
                          <td className="py-2 text-center">{item.delivered_quantity ?? 0}</td>
                        </>
                      )}
                      <td className="py-2 text-end">{Number(item.unit_price).toLocaleString()}</td>
                      <td className="py-2 text-end text-muted">{Number(item.discount || 0).toLocaleString()}</td>
                      <td className="py-2 text-end fw-bold text-dark">{Number(item.total).toLocaleString()} $</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {['ordered', 'partially_delivered', 'delivered'].includes(quotation.status) && (
              <div className="card border-light p-3 mb-4">
                <h6 className="d-flex align-items-center gap-2 mb-3">
                  <Truck size={17} /> Historique des bons de livraison
                </h6>
                {quotation.delivery_notes?.length ? (
                  quotation.delivery_notes.map((note) => (
                    <div className="border-top py-2" key={note.id}>
                      <strong>{note.reference}</strong>
                      <span className="text-muted small ms-2">
                        {new Date(note.delivery_date).toLocaleDateString()}
                      </span>
                      <div className="small text-muted mt-1">
                        {note.items?.map((line) => (
                          <span className="me-3" key={line.id}>
                            {line.product?.name || 'Produit'} : {line.quantity}
                          </span>
                        ))}
                      </div>
                      {note.notes && <div className="small text-muted mt-1">Note : {note.notes}</div>}
                    </div>
                  ))
                ) : (
                  <div className="text-muted small border-top pt-2">Aucun bon de livraison enregistré pour le moment.</div>
                )}
                <Link to="/pos/deliveries?tab=history" className="btn btn-sm btn-outline-primary mt-2">
                  Consulter le module Livraisons
                </Link>
              </div>
            )}

            {/* Totals Summary */}
            <div className="row justify-content-end mb-4">
              <div className="col-sm-6">
                <div className="bg-light p-3 rounded-3">
                  <div className="d-flex justify-content-between mb-1 small text-muted">
                    <span>Sous-total HT :</span>
                    <span className="fw-semibold text-dark">{Number(quotation.subtotal).toLocaleString()} $</span>
                  </div>
                  {Number(quotation.discount) > 0 && (
                    <div className="d-flex justify-content-between mb-1 small text-danger">
                      <span>Remise accordée :</span>
                      <span>-{Number(quotation.discount).toLocaleString()} $</span>
                    </div>
                  )}
                  {Number(quotation.tax) > 0 && (
                    <div className="d-flex justify-content-between mb-1 small text-muted">
                      <span>TVA :</span>
                      <span>+{Number(quotation.tax).toLocaleString()} $</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between pt-2 border-top fw-bold fs-6 text-dark mt-2">
                    <span>TOTAL TTC :</span>
                    <span className="text-primary fs-5">{Number(quotation.total_amount).toLocaleString()} $</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and conditions */}
            {quotation.terms && (
              <div className="p-3 bg-light-subtle rounded-2 mb-3 small text-muted">
                <strong>Conditions de l'offre :</strong>
                <div>{quotation.terms}</div>
              </div>
            )}
            {quotation.notes && (
              <div className="small text-muted">
                <strong>Note :</strong> {quotation.notes}
              </div>
            )}
            {['draft', 'sent', 'rejected'].includes(quotation.status) && (
              <div className="alert alert-info py-2 mt-3 mb-0 small">
                Pour réserver le stock, modifiez ce devis et passez son statut à « Accepté ».
                Vous pourrez ensuite le valider en commande.
              </div>
            )}
            {quotation.status === 'accepted' && (
              <div className="alert alert-primary py-2 mt-3 mb-0 small">
                Ce devis est accepté. Validez-le en commande pour réserver les quantités avant livraison.
              </div>
            )}
            {['ordered', 'partially_delivered'].includes(quotation.status) && (
              <div className="alert alert-info py-2 mt-3 mb-0 small">
                La commande est validée. Enregistrez une livraison pour diminuer le stock ; plusieurs livraisons partielles sont possibles.
              </div>
            )}
          </div>

          <div className="modal-footer bg-light border-top p-3 d-flex justify-content-between">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
              Fermer
            </button>
            <div className="d-flex align-items-center gap-2">
              {['draft', 'sent', 'accepted', 'rejected'].includes(quotation.status) && onEdit && (
                <button
                  type="button"
                  className="btn btn-outline-secondary d-flex align-items-center gap-1"
                  onClick={() => onEdit(quotation)}
                >
                  <Edit size={16} /> Modifier le devis
                </button>
              )}
              <button type="button" className="btn btn-outline-primary d-flex align-items-center gap-1" onClick={handlePrint}>
                <Printer size={16} /> Imprimer Proforma
              </button>
              {quotation.status === 'accepted' && (
                <button
                  type="button"
                  className="btn btn-success d-flex align-items-center gap-2"
                  disabled={submitting}
                  onClick={handleCreateOrder}
                >
                  {submitting ? <span className="spinner-border spinner-border-sm" /> : <ArrowRight size={16} />}
                  Valider en commande · réserver
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
