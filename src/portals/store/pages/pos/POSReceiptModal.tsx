import React, { useContext, useRef } from 'react';
import { Printer, CheckCircle2, X, MessageCircle } from 'lucide-react';
import { AppContext } from '../../../shared/context/AppContext';
import { TenantLogo } from '../../../shared/components/common/TenantLogo';

interface POSReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: {
    receiptNumber: string;
    date: string;
    storeName: string;
    customerName?: string;
    customerPhone?: string | null;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      total: number;
    }>;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paid: number;
    change: number;
    paymentMethod: string;
  } | null;
}

export default function POSReceiptModal({ isOpen, onClose, saleData }: POSReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { tenantSettings } = useContext(AppContext);

  if (!isOpen || !saleData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header bg-primary text-white border-0 py-3">
            <div className="d-flex align-items-center gap-2">
              <CheckCircle2 size={20} />
              <h6 className="modal-title fw-bold mb-0">Ticket de caisse</h6>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} />
          </div>

          <div className="modal-body p-4 bg-light" ref={receiptRef}>
            <div className="bg-white p-4 rounded-3 border shadow-xs" style={{ fontFamily: 'monospace', fontSize: '13px' }}>
              <div className="text-center mb-3">
                {tenantSettings?.logo_path && (
                  <TenantLogo className="d-block mx-auto mb-2" style={{ maxWidth: 140, maxHeight: 56 }} />
                )}
                <h5 className="fw-bold mb-0" style={{ letterSpacing: '1px' }}>
                  {tenantSettings?.name || 'MYBUSINESS'}
                </h5>
                <div className="text-muted small">{saleData.storeName}</div>
                {tenantSettings?.phone && <div className="text-muted small">Tél : {tenantSettings.phone}</div>}
                <hr className="my-2 border-dashed" />
                <div className="d-flex justify-content-between text-muted" style={{ fontSize: '11px' }}>
                  <span>N° {saleData.receiptNumber}</span>
                  <span>{new Date(saleData.date).toLocaleDateString()} {new Date(saleData.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {saleData.customerName && (
                  <div className="text-start mt-1 text-muted" style={{ fontSize: '11px' }}>
                    Client : <strong>{saleData.customerName}</strong>
                  </div>
                )}
              </div>

              <hr className="my-2 border-dashed" />

              <table className="w-100 mb-2">
                <thead>
                  <tr className="border-bottom text-muted" style={{ fontSize: '11px' }}>
                    <th className="pb-1 text-start">Article</th>
                    <th className="pb-1 text-center">Qté</th>
                    <th className="pb-1 text-end">P.U</th>
                    <th className="pb-1 text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {saleData.items.map((item, idx) => (
                    <tr key={idx} className="border-bottom border-light">
                      <td className="py-1 text-start">{item.name}</td>
                      <td className="py-1 text-center">{item.quantity}</td>
                      <td className="py-1 text-end">{item.price.toLocaleString()}</td>
                      <td className="py-1 text-end fw-semibold">{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <hr className="my-2 border-dashed" />

              <div className="d-flex justify-content-between py-1">
                <span>Sous-total:</span>
                <span>{saleData.subtotal.toLocaleString()} $</span>
              </div>
              {saleData.discount > 0 && (
                <div className="d-flex justify-content-between py-1 text-danger">
                  <span>Remise:</span>
                  <span>-{saleData.discount.toLocaleString()} $</span>
                </div>
              )}
              {saleData.tax > 0 && (
                <div className="d-flex justify-content-between py-1 text-muted">
                  <span>TVA / Taxe:</span>
                  <span>+{saleData.tax.toLocaleString()} $</span>
                </div>
              )}
              <div className="d-flex justify-content-between py-1 border-top fw-bold fs-6 mt-1 text-dark">
                <span>TOTAL À PAYER:</span>
                <span className="text-primary">{saleData.total.toLocaleString()} $</span>
              </div>

              <div className="d-flex justify-content-between py-1 text-muted mt-2" style={{ fontSize: '11px' }}>
                <span>Mode: {saleData.paymentMethod}</span>
                <span>Reçu: {saleData.paid.toLocaleString()} $</span>
              </div>
              <div className="d-flex justify-content-between py-1 text-muted" style={{ fontSize: '11px' }}>
                <span>Rendu monnaie:</span>
                <span className="fw-semibold text-success">{saleData.change.toLocaleString()} $</span>
              </div>

              <div className="text-center mt-3 pt-2 border-top border-dashed text-muted" style={{ fontSize: '11px' }}>
                Merci de votre visite ! À bientôt.<br />
                <em>Les articles vendus ne sont ni repris ni échangés au-delà de 48h.</em>
              </div>
            </div>
          </div>

          <div className="modal-footer bg-white border-top p-3 d-flex justify-content-between">
            <button type="button" className="btn btn-outline-secondary d-flex align-items-center gap-1" onClick={onClose}>
              <X size={16} /> Fermer
            </button>
            {saleData.customerPhone && (
              <button
                type="button"
                className="btn btn-success d-flex align-items-center gap-2"
                onClick={() => {
                  const text = `*${tenantSettings?.name || 'MYBUSINESS'} - Re\u00e7u*%0A`
                    + `N\u00b0 ${saleData.receiptNumber}%0A`
                    + `Date: ${new Date(saleData.date).toLocaleDateString()}%0A`
                    + `Total: ${saleData.total.toLocaleString()} $%0A`
                    + `Pay\u00e9: ${saleData.paid.toLocaleString()} $%0A`
                    + `Monnaie: ${saleData.change.toLocaleString()} $%0A`
                    + `Mode: ${saleData.paymentMethod}%0A`
                    + `%0AMerci de votre visite !`;
                  const phone = saleData.customerPhone.replace(/[^0-9+]/g, '');
                  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                }}
              >
                <MessageCircle size={16} /> WhatsApp
              </button>
            )}
            <button type="button" className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm" onClick={handlePrint}>
              <Printer size={16} /> Imprimer le ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
