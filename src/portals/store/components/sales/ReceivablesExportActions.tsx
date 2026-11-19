import { Download, FileText, Printer, Share2 } from 'lucide-react';
import { toast } from 'react-toastify';
import type { ReceivableCustomer } from '../../hooks/reports/useReceivables';
import { useStoreCurrencyConverter } from '../../hooks/currency/useStoreCurrencyConverter';

interface ReceivablesExportActionsProps {
  customers: ReceivableCustomer[];
  totalOutstanding: number;
  fileName: string;
  includeSales?: boolean;
  disabled?: boolean;
}

const getCustomerTotals = (customer: ReceivableCustomer) => customer.sales.reduce(
  (totals, sale) => ({
    total: totals.total + Number(sale.total || 0),
    paid: totals.paid + Number(sale.paid_amount || 0),
    remaining: totals.remaining + Number(sale.remaining_amount || 0),
  }),
  { total: 0, paid: 0, remaining: 0 },
);

export default function ReceivablesExportActions({
  customers,
  totalOutstanding,
  fileName,
  includeSales = false,
  disabled = false,
}: ReceivablesExportActionsProps) {
  const { formatFromUSD: formatCurrency } = useStoreCurrencyConverter();

  const createPdf = async () => {
    if (customers.length === 0) throw new Error('Aucune créance à exporter.');

    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let y = 20;

    const addCustomer = (customer: ReceivableCustomer) => {
      if (y + (includeSales ? 27 : 12) > pageHeight - margin) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(customer.name, margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      if (!includeSales) {
        const totals = getCustomerTotals(customer);
        const oldestDueDate = customer.oldest_due_date
          ? new Date(customer.oldest_due_date).toLocaleDateString()
          : '—';
        pdf.text(formatCurrency(totals.total), margin + 48, y, { maxWidth: 30 });
        pdf.text(formatCurrency(totals.paid), margin + 81, y, { maxWidth: 30 });
        pdf.text(formatCurrency(totals.remaining), margin + 114, y, { maxWidth: 30 });
        pdf.text(String(customer.sales_count), margin + 148, y, { maxWidth: 12 });
        pdf.text(oldestDueDate, pageWidth - margin, y, { align: 'right', maxWidth: 29 });
        y += 9;
        pdf.setDrawColor(225);
        pdf.line(margin, y - 3, pageWidth - margin, y - 3);
        return;
      }

      const customerInfo = [customer.phone, `Montant dû : ${formatCurrency(customer.total_outstanding)}`]
        .filter(Boolean)
        .join(' — ');
      pdf.text(customerInfo, margin, y + 5);
      y += 12;

      const columns = [
        { title: 'Référence', x: margin },
        { title: 'Date', x: margin + 39 },
        { title: 'Total', x: margin + 68 },
        { title: 'Payé', x: margin + 98 },
        { title: 'Restant', x: margin + 128 },
        { title: 'Échéance', x: margin + 158 },
      ];

      const addTableHeader = () => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        columns.forEach((column) => pdf.text(column.title, column.x, y));
        y += 3;
        pdf.setDrawColor(180);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 6;
        pdf.setFont('helvetica', 'normal');
      };

      addTableHeader();
      customer.sales.forEach((sale) => {
        if (y + 8 > pageHeight - margin) {
          pdf.addPage();
          y = 20;
          addTableHeader();
        }

        const values = [
          sale.reference || String(sale.id),
          new Date(sale.created_at).toLocaleDateString(),
          formatCurrency(sale.total),
          formatCurrency(sale.paid_amount),
          formatCurrency(sale.remaining_amount),
          sale.due_date ? new Date(sale.due_date).toLocaleDateString() : '—',
        ];
        values.forEach((value, index) => {
          pdf.text(value, columns[index].x, y, { maxWidth: index === 0 ? 37 : 28 });
        });
        y += 8;
        pdf.setDrawColor(225);
        pdf.line(margin, y - 3, pageWidth - margin, y - 3);
      });
      y += 6;
    };

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text(includeSales ? 'RELEVE DE CREANCES' : 'CREANCES PAR CLIENT', margin, y);
    y += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Date d'édition : ${new Date().toLocaleDateString()}`, margin, y);
    y += 6;
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Total des créances : ${formatCurrency(totalOutstanding)}`, margin, y);
    y += 12;

    if (!includeSales) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('Client', margin, y);
      pdf.text('Total', margin + 48, y);
      pdf.text('Payé', margin + 81, y);
      pdf.text('Restant', margin + 114, y);
      pdf.text('Nb ventes', margin + 148, y);
      pdf.text('Échéance', pageWidth - margin, y, { align: 'right' });
      y += 3;
      pdf.setDrawColor(180);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 6;
    }

    customers.forEach(addCustomer);
    return pdf;
  };

  const getFileName = (extension: string) => `${fileName}.${extension}`;

  const handlePdf = async () => {
    try {
      const pdf = await createPdf();
      pdf.save(getFileName('pdf'));
      toast.success('Le relevé PDF a été téléchargé.');
    } catch {
      toast.error('Impossible de générer le relevé PDF.');
    }
  };

  const handleCsv = () => {
    if (customers.length === 0) return;

    const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const rows = includeSales
      ? [
        ['Client', 'Téléphone', 'Référence', 'Date', 'Total', 'Payé', 'Restant', 'Échéance', 'Statut'],
        ...customers.flatMap((customer) => customer.sales.map((sale) => [
          customer.name,
          customer.phone || '',
          sale.reference || String(sale.id),
          new Date(sale.created_at).toLocaleDateString(),
          sale.total,
          sale.paid_amount,
          sale.remaining_amount,
          sale.due_date ? new Date(sale.due_date).toLocaleDateString() : '',
          sale.payment_status,
        ])),
      ]
      : [
        ['Client', 'Total', 'Payé', 'Restant', 'Nb ventes', 'Plus ancienne échéance'],
        ...customers.map((customer) => {
          const totals = getCustomerTotals(customer);
          return [
            customer.name,
            totals.total,
            totals.paid,
            totals.remaining,
            customer.sales_count,
            customer.oldest_due_date ? new Date(customer.oldest_due_date).toLocaleDateString() : '',
          ];
        }),
      ];
    const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(';')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = getFileName('csv');
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleShare = async () => {
    try {
      const pdf = await createPdf();
      const file = new File([pdf.output('blob')], getFileName('pdf'), { type: 'application/pdf' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'Relevé de créances', files: [file] });
      } else {
        pdf.save(getFileName('pdf'));
        toast.info('Le partage de fichier n’est pas disponible dans ce navigateur ; le PDF a été téléchargé.');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      toast.error('Impossible de générer ou partager le relevé PDF.');
    }
  };

  const isDisabled = disabled || customers.length === 0;

  return (
    <div className="d-flex align-items-center gap-2 flex-wrap">
      <button type="button" className="btn btn-sm btn-light border d-flex align-items-center gap-1" onClick={() => window.print()} disabled={isDisabled}>
        <Printer size={14} /> Imprimer
      </button>
      <button type="button" className="btn btn-sm btn-light border d-flex align-items-center gap-1" onClick={handlePdf} disabled={isDisabled}>
        <FileText size={14} /> PDF
      </button>
      <button type="button" className="btn btn-sm btn-light border d-flex align-items-center gap-1" onClick={handleCsv} disabled={isDisabled}>
        <Download size={14} /> CSV
      </button>
      <button type="button" className="btn btn-sm btn-light border d-flex align-items-center gap-1" onClick={handleShare} disabled={isDisabled}>
        <Share2 size={14} /> Partager
      </button>
    </div>
  );
}
