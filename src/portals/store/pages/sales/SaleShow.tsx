import React, { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Printer, Edit, Trash2, Download, FileText, User, Store, Share2,
  Calendar, CreditCard, ShoppingCart, Package, Clock, Mail, Phone,
  MapPin, Receipt, ShieldCheck, AlertTriangle, X
} from 'lucide-react';
import { AppContext } from '../../../shared/context/AppContext';
import { useStoreCurrencyConverter } from '../../hooks/currency/useStoreCurrencyConverter';
import { useSale, type Sale } from '../../hooks/sales/useSale';
import { useCreatePayment } from '../../hooks/payments/useCreatePayment';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';
import { toast } from 'react-toastify';
import { Loader } from '../../../shared/components/common/Loader';
import { TenantDocumentHeader } from '../../../shared/components/common/TenantDocumentHeader';
import { uploads } from '../../../shared/config/env';

const getPaymentSummary = (sale: Sale) => {
  const total = Math.max(0, Number(sale.total || 0));
  const paymentsTotal = (sale.payments || []).reduce(
    (sum: number, payment) => sum + Math.max(0, Number(payment.amount || 0)),
    0,
  );
  const paid = Math.max(paymentsTotal, Math.max(0, Number(sale.paid_amount || 0)));
  const reportedBalance = Number(sale.balance ?? sale.remaining_amount);
  const balance = total > 0
    ? Math.max(0, total - paid)
    : Number.isFinite(reportedBalance)
      ? Math.max(0, reportedBalance)
      : 0;
  const previousStatus = String(sale.payment_status || '').toLowerCase();
  const status = balance > 0
    ? paid > 0 ? 'partial' : 'unpaid'
    : total > 0 || paid > 0 || ['paid', 'completed', 'payé'].includes(previousStatus)
      ? 'paid'
      : previousStatus;

  return { total, paid, balance, status };
};

const createSalePdf = async (
  sale: Sale,
  storeName: string,
  formatAmount: (amount: number) => string,
  tenantName: string,
  tenantLogoPath: string | null | undefined,
) => {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const summary = getPaymentSummary(sale);
  let y = 20;

  if (tenantLogoPath) {
    try {
      const response = await fetch(`${uploads}/${tenantLogoPath.replace(/^\/+/, '')}`);
      if (!response.ok) throw new Error(`Chargement du logo impossible (${response.status}).`);
      const logoBlob = await response.blob();
      const logoDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string'
          ? resolve(reader.result)
          : reject(new Error('Format de logo invalide.'));
        reader.onerror = () => reject(reader.error || new Error('Lecture du logo impossible.'));
        reader.readAsDataURL(logoBlob);
      });
      pdf.addImage(logoDataUrl, 'PNG', margin, y, 28, 18, undefined, 'FAST');
      y += 22;
    } catch (error) {
      console.error('Impossible d’ajouter le logo de l’entreprise au reçu PDF:', error);
    }
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(tenantName, margin, y);
  y += 8;

  const addText = (value: string, x: number, maxWidth: number, fontSize = 10) => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(value, maxWidth) as string[];
    const height = lines.length * 5;
    if (y + height > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(lines, x, y);
    y += height;
  };

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text('REÇU DE VENTE', margin, y);
  y += 9;
  pdf.setFont('helvetica', 'normal');
  addText(storeName, margin, contentWidth, 10);
  addText(`Référence : ${sale.reference || sale.id}`, margin, contentWidth, 10);
  addText(`Date : ${new Date(sale.created_at).toLocaleDateString()}`, margin, contentWidth, 10);
  addText(`Client : ${sale.customer?.name || 'Client comptoir'}`, margin, contentWidth, 10);
  y += 3;
  pdf.setDrawColor(190);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 7;

  pdf.setFont('helvetica', 'bold');
  addText('Articles vendus', margin, contentWidth, 12);
  pdf.setFont('helvetica', 'normal');
  (sale.items || []).forEach((line) => {
    const productName = line.product?.name || line.product_name || `Produit #${line.product_id || '—'}`;
    const detail = `${line.quantity} × ${formatAmount(Number(line.unit_price || 0))}`;
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(productName, contentWidth - 36) as string[];
    const rowHeight = Math.max(lines.length * 5, 6) + 6;
    if (y + rowHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(lines, margin, y);
    pdf.text(formatAmount(Number(line.subtotal || 0)), pageWidth - margin, y, { align: 'right' });
    y += Math.max(lines.length * 5, 6);
    pdf.setFontSize(9);
    pdf.setTextColor(100);
    pdf.text(detail, margin, y);
    pdf.setTextColor(0);
    y += 6;
    pdf.setDrawColor(225);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 4;
  });

  y += 2;
  const addTotal = (label: string, value: string, bold = false) => {
    if (y + 7 > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.text(label, margin, y);
    pdf.text(value, pageWidth - margin, y, { align: 'right' });
    y += 7;
  };

  addTotal('Sous-total', formatAmount(Number(sale.subtotal || 0)));
  addTotal('Remise', `-${formatAmount(Number(sale.discount || 0))}`);
  addTotal('Taxe', formatAmount(Number(sale.tax || 0)));
  addTotal('Total', formatAmount(summary.total), true);
  addTotal('Montant payé', formatAmount(summary.paid));
  if (summary.balance > 0) addTotal('Reste à payer', formatAmount(summary.balance), true);

  if (sale.payments?.length) {
    y += 3;
    pdf.setFont('helvetica', 'bold');
    addText('Historique des paiements', margin, contentWidth, 11);
    pdf.setFont('helvetica', 'normal');
    sale.payments.forEach((payment) => {
      const date = payment.created_at || payment.date;
      addText(
        `${payment.payment_method}${date ? ` — ${new Date(date).toLocaleDateString()}` : ''} : ${formatAmount(Number(payment.amount || 0))}`,
        margin,
        contentWidth,
        9,
      );
    });
  }

  return pdf;
};

export default function SaleShow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatFromUSD } = useStoreCurrencyConverter();
  const { activeStore, tenantSettings } = useContext(AppContext);
  const { item, loading, refresh } = useSale(id);
  const { createPayment, submitting } = useCreatePayment();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const handleDelete = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette vente ?")) {
      try {
        await axiosInstance.delete(`/sales/${id}`);
        toast.success("Vente supprimée avec succès");
        navigate('/pos/sales');
      } catch {
        toast.error("Erreur lors de la suppression de la vente");
      }
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await axiosInstance.get(`/sales/${id}/export-csv`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `vente_${item?.reference || id}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error("Erreur lors de l'export CSV");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getPdfFileName = () =>
    `vente_${String(item.reference || item.id).replace(/[^\w.-]+/g, '_')}.pdf`;

  const handleDownloadPdf = async () => {
    try {
      const pdf = await createSalePdf(
        item,
        item.store?.name || activeStore?.name || 'Magasin principal',
        formatFromUSD,
        tenantSettings?.name || 'Entreprise',
        tenantSettings?.logo_path,
      );
      pdf.save(getPdfFileName());
      toast.success('Le reçu PDF a été téléchargé.');
    } catch {
      toast.error('Impossible de générer le reçu PDF.');
    }
  };

  const handleSharePdf = async () => {
    const summary = getPaymentSummary(item);
    const text = [
      `Vente ${item.reference ? `#${item.reference}` : `#${item.id}`}`,
      `Client : ${item.customer?.name || 'Client comptoir'}`,
      `Total : ${formatFromUSD(summary.total)}`,
      `Payé : ${formatFromUSD(summary.paid)}`,
      ...(summary.balance > 0 ? [`Reste à payer : ${formatFromUSD(summary.balance)}`] : []),
    ].join('\n');

    try {
      const pdf = await createSalePdf(
        item,
        item.store?.name || activeStore?.name || 'Magasin principal',
        formatFromUSD,
        tenantSettings?.name || 'Entreprise',
        tenantSettings?.logo_path,
      );
      const file = new File([pdf.output('blob')], getPdfFileName(), { type: 'application/pdf' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Vente ${item.reference || item.id}`,
          text,
          files: [file],
        });
      } else {
        pdf.save(getPdfFileName());
        toast.info('Ce navigateur ne permet pas de partager un fichier; le PDF a été téléchargé.');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      toast.error('Impossible de générer ou partager le PDF.');
    }
  };

  const openPaymentModal = () => {
    const summary = getPaymentSummary(item);
    setPaymentAmount(String(summary.balance));
    setPaymentMethod('cash');
    setPaymentReference('');
    setPaymentNote('');
    setPaymentError('');
    setPaymentModalOpen(true);
  };

  const handleSubmitPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const summary = getPaymentSummary(item);
    const amount = Number(paymentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError('Saisissez un montant supérieur à zéro.');
      return;
    }
    if (amount > summary.balance) {
      setPaymentError(`Le montant ne peut pas dépasser le solde restant (${formatFromUSD(summary.balance)}).`);
      return;
    }

    const result = await createPayment({
      sale_id: item.id,
      payment_method: paymentMethod,
      amount,
      reference: paymentReference.trim() || null,
      note: paymentNote.trim() || null,
    });

    if (!result.success) {
      setPaymentError(result.message);
      return;
    }

    setPaymentModalOpen(false);
    toast.success(result.message || 'Paiement enregistré.');
    refresh();
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
      case 'payé':
        return <span className="badge bg-success-subtle text-success px-3  rounded-pill fw-semibold d-inline-flex align-items-center gap-1"><ShieldCheck size={14} /> Payé</span>;
      case 'partial':
      case 'partiel':
        return <span className="badge bg-warning-subtle text-warning px-3 py-2 rounded-pill fw-semibold d-inline-flex align-items-center gap-1"><Clock size={14} /> Partiel</span>;
      case 'unpaid':
        return <span className="badge bg-danger-subtle text-danger px-3 py-2 rounded-pill fw-semibold">Non payé</span>;
      default:
        return <span className="badge bg-secondary-subtle text-secondary px-3 py-2 rounded-pill fw-semibold">{status || 'Inconnu'}</span>;
    }
  };

  const getSaleStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return <span className="badge bg-warning-subtle text-warning px-3 py-2 rounded-pill fw-semibold">Brouillon</span>;
      case 'completed':
        return <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill fw-semibold">Enregistrée</span>;
      case 'cancelled':
        return <span className="badge bg-secondary-subtle text-secondary px-3 py-2 rounded-pill fw-semibold">Annulée</span>;
      default:
        return null;
    }
  };

  if (loading || !item) {
    return <Loader />;
  }

  const paymentSummary = getPaymentSummary(item);
  const isCompleted = item.status?.toLowerCase() === 'completed';
  const isBalanceDue = isCompleted && paymentSummary.balance > 0;

  return (
    <div className="container-fluid py-4 px-lg-4">
      <TenantDocumentHeader />
      {/* Header section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom">
        <div>
          {/* <button 
            className="btn btn-link text-decoration-none p-0 mb-2 d-inline-flex align-items-center text-muted fw-medium hover-primary transition" 
            onClick={() => navigate('/pos/sales')}
          >
            <ArrowLeft className="me-2" size={18} />
            Retour 
          </button> */}
          <div className="d-flex align-items-center flex-wrap gap-2">
            <h6 className="mb-0 fw-bold text-dark d-flex align-items-center">
              <Receipt className="me-2 text-primary" size={28} />
              Vente {item.reference && <span className="text-primary ms-2">#{item.reference}</span>}
            </h6>
            {getSaleStatusBadge(item.status)}
            {isCompleted && getStatusBadge(paymentSummary.status)}
          </div>
        </div>
        

        {/* Action buttons */}
        <div className="d-flex flex-wrap gap-2">
          {isBalanceDue && (
            <button className="btn btn-success d-flex align-items-center shadow-sm px-3" onClick={openPaymentModal}>
              <CreditCard size={16} className="me-2" /> Enregistrer un paiement
            </button>
          )}
          <button className="btn btn-light border d-flex align-items-center shadow-sm px-3" onClick={handlePrint}>
            <Printer size={16} className="me-2 text-secondary" /> Imprimer
          </button>
          <button className="btn btn-light border d-flex align-items-center shadow-sm px-3" onClick={handleDownloadPdf}>
            <Download size={16} className="me-2 text-secondary" /> PDF
          </button>
          <button className="btn btn-light border d-flex align-items-center shadow-sm px-3" onClick={handleSharePdf}>
            <Share2 size={16} className="me-2 text-secondary" /> Partager
          </button>
          <button className="btn btn-light border d-flex align-items-center shadow-sm px-3" onClick={handleExportCSV}>
            <Download size={16} className="me-2 text-secondary" /> CSV
          </button>
          <button className="btn btn-primary d-flex align-items-center shadow-sm px-3" onClick={() => navigate(`/pos/sales/${id}/edit`)}>
            <Edit size={16} className="me-2" /> Modifier
          </button>
          <button className="btn btn-outline-danger d-flex align-items-center px-3" onClick={handleDelete}>
            <Trash2 size={16} className="me-2" /> Supprimer
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column */}
        <div className="col-lg-8">
          {/* Customer & Sale Metadata */}
          <div className="row g-4 mb-4">
            {/* Customer Card */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm rounded-3 h-100 bg-white">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-primary-subtle text-primary p-2 rounded-3 me-3">
                      <User size={20} />
                    </div>
                    <h5 className="card-title fw-bold mb-0 text-dark">Informations Client</h5>
                  </div>
                  {item.customer ? (
                    <ul className="list-unstyled mb-0 text-secondary">
                      <li className="mb-2 fw-semibold text-dark fs-6">{item.customer.name}</li>
                      {item.customer.phone && (
                        <li className="mb-2 d-flex align-items-center">
                          <Phone size={15} className="me-2 text-muted" /> {item.customer.phone}
                        </li>
                      )}
                      {item.customer.email && (
                        <li className="mb-2 d-flex align-items-center">
                          <Mail size={15} className="me-2 text-muted" /> {item.customer.email}
                        </li>
                      )}
                      {item.customer.address && (
                        <li className="d-flex align-items-start">
                          <MapPin size={15} className="me-2 text-muted mt-1 flex-shrink-0" /> 
                          <span>{item.customer.address}</span>
                        </li>
                      )}
                    </ul>
                  ) : (
                    <div className="text-muted fst-italic py-2">Client occasionnel (Comptoir)</div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Sale Metadata Card */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm rounded-3 h-100 bg-white">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-primary-subtle text-primary p-2 rounded-3 me-3">
                      <FileText size={20} />
                    </div>
                    <h5 className="card-title fw-bold mb-0 text-dark">Détails de la Vente</h5>
                  </div>
                  <ul className="list-unstyled mb-0 text-secondary">
                    <li className="mb-2 d-flex justify-content-between align-items-center">
                      <span className="d-flex align-items-center text-muted">
                        <Calendar size={15} className="me-2" /> Date
                      </span>
                      <strong className="text-dark">{new Date(item.created_at).toLocaleDateString()}</strong>
                    </li>
                    <li className="mb-2 d-flex justify-content-between align-items-center">
                      <span className="d-flex align-items-center text-muted">
                        <Store size={15} className="me-2" /> Magasin
                      </span>
                      <strong className="text-dark">{item.store?.name || activeStore?.name || 'Principal'}</strong>
                    </li>
                    {item.due_date && (
                      <li className="d-flex justify-content-between align-items-center">
                        <span className="d-flex align-items-center text-muted">
                          <Clock size={15} className="me-2" /> Échéance
                        </span>
                        <strong className="text-danger">{new Date(item.due_date).toLocaleDateString()}</strong>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table Card */}
          <div className="card border-0 shadow-sm rounded-3 bg-white">
            <div className="card-body p-3">
              <div className="d-flex align-items-center mb-4">
                <div className="bg-primary-subtle text-primary p-2 rounded-3 me-3">
                  <ShoppingCart size={20} />
                </div>
                <h5 className="card-title fw-bold mb-0 text-dark">Articles Vendus</h5>
              </div>
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="table-light text-uppercase  text-muted">
                    <tr>
                      <th className="py-3 rounded-start">Produit</th>
                      <th className="text-center py-3">Quantité</th>
                      <th className="text-end py-3">Prix unitaire</th>
                      <th className="text-end py-3 rounded-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.items && item.items.length > 0 ? (
                      item.items.map((saleItem, index: number) => (
                        <tr key={index} className="border-bottom">
                          <td className="py-3">
                            <div className="d-flex align-items-center">
                              <div className="bg-light p-2 rounded-2 me-3 text-muted">
                                <Package size={16} />
                              </div>
                              <span className="fw-semibold text-dark">
                                {saleItem.product?.name || saleItem.product_name || `Produit #${saleItem.product_id}`}
                              </span>
                            </div>
                          </td>
                          <td className="text-center py-3 fw-medium">{saleItem.quantity}</td>
                          <td className="text-end py-3 text-muted">{formatFromUSD(saleItem.unit_price)}</td>
                          <td className="text-end py-3 fw-bold text-dark">
                            {formatFromUSD(saleItem.subtotal ?? saleItem.quantity * saleItem.unit_price)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-5">
                          Aucun article trouvé pour cette vente.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-lg-4">
          {/* Financial Summary */}
          <div className="card border-0 shadow-sm rounded-3 bg-white mb-4">
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-4 text-dark">Résumé Financier</h5>
              
              <div className="d-flex justify-content-between mb-2 text-secondary">
                <span>Sous-total</span>
                <span className="fw-medium text-dark">{formatFromUSD(item.subtotal)}</span>
              </div>
              
              <div className="d-flex justify-content-between mb-2 text-secondary">
                <span>Remise</span>
                <span className="text-danger fw-medium">-{formatFromUSD(item.discount || 0)}</span>
              </div>
              
              <div className="d-flex justify-content-between mb-3 text-secondary">
                <span>Taxe</span>
                <span className="fw-medium text-dark">{formatFromUSD(item.tax || 0)}</span>
              </div>
              
              <hr className="text-muted opacity-25" />
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fw-bold fs-6 text-dark">Total Net</span>
                <span className="fw-bold fs-5 text-primary">{formatFromUSD(item.total)}</span>
              </div>
              
              <div className="d-flex justify-content-between mb-2">
                <span className="text-success fw-medium">Montant payé</span>
                <span className="text-success fw-bold">{formatFromUSD(paymentSummary.paid)}</span>
              </div>
              
              {isBalanceDue && (
                <div className="d-flex justify-content-between">
                  <span className="text-danger fw-bold">Reste à payer</span>
                  <span className="text-danger fw-bold fs-6">{formatFromUSD(paymentSummary.balance)}</span>
                </div>
              )}
              {paymentModalOpen && (
                <div
                  className="modal d-block"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="sale-payment-title"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                >
                  <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                      <form onSubmit={handleSubmitPayment}>
                        <div className="modal-header">
                          <h5 className="modal-title fw-bold" id="sale-payment-title">Enregistrer un paiement</h5>
                          <button
                            type="button"
                            className="btn btn-light btn-sm"
                            aria-label="Fermer"
                            onClick={() => setPaymentModalOpen(false)}
                            disabled={submitting}
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="modal-body">
                          <div className="alert alert-info py-2">
                            Solde restant : <strong>{formatFromUSD(paymentSummary.balance)}</strong>
                          </div>
                          {paymentError && <div className="alert alert-danger py-2" role="alert">{paymentError}</div>}
                          <div className="mb-3">
                            <label htmlFor="sale-payment-method" className="form-label">Mode de paiement</label>
                            <select
                              id="sale-payment-method"
                              className="form-select"
                              value={paymentMethod}
                              onChange={(event) => setPaymentMethod(event.target.value)}
                              required
                            >
                              <option value="cash">Espèces</option>
                              <option value="card">Carte</option>
                              <option value="mobile_money">Mobile Money</option>
                              <option value="bank_transfer">Virement</option>
                            </select>
                          </div>
                          <div className="mb-3">
                            <label htmlFor="sale-payment-amount" className="form-label">Montant</label>
                            <input
                              id="sale-payment-amount"
                              className="form-control"
                              type="number"
                              min="0.01"
                              max={paymentSummary.balance}
                              step="0.01"
                              value={paymentAmount}
                              onChange={(event) => setPaymentAmount(event.target.value)}
                              required
                            />
                          </div>
                          <div className="mb-3">
                            <label htmlFor="sale-payment-reference" className="form-label">Référence</label>
                            <input
                              id="sale-payment-reference"
                              className="form-control"
                              value={paymentReference}
                              onChange={(event) => setPaymentReference(event.target.value)}
                            />
                          </div>
                          <div>
                            <label htmlFor="sale-payment-note" className="form-label">Note</label>
                            <textarea
                              id="sale-payment-note"
                              className="form-control"
                              rows={2}
                              value={paymentNote}
                              onChange={(event) => setPaymentNote(event.target.value)}
                            />
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button
                            type="button"
                            className="btn btn-light"
                            onClick={() => setPaymentModalOpen(false)}
                            disabled={submitting}
                          >
                            Annuler
                          </button>
                          <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Enregistrement…' : 'Enregistrer le paiement'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payments History */}
          <div className="card border-0 shadow-sm rounded-3 bg-white">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-4">
                <div className="bg-primary-subtle text-primary p-2 rounded-3 me-3">
                  <CreditCard size={20} />
                </div>
                <h5 className="card-title fw-bold mb-0 text-dark">Paiements</h5>
              </div>

              {item.payments && item.payments.length > 0 ? (
                <div className="list-group list-group-flush">
                  {item.payments.map((payment, index: number) => (
                    <div key={index} className="list-group-item px-0 py-3 d-flex justify-content-between align-items-center border-bottom">
                      <div>
                        <h6 className="mb-1 fw-bold text-dark">{payment.payment_method}</h6>
                        <small className="text-muted">{new Date(payment.created_at || payment.date).toLocaleDateString()}</small>
                      </div>
                      <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2 fw-bold">
                        {formatFromUSD(payment.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-4 bg-light rounded-3">
                  <AlertTriangle size={24} className="mb-2 text-warning" />
                  <p className="mb-0 small fw-medium">Aucun paiement enregistré</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}