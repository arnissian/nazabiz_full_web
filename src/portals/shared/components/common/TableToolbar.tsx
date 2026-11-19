import React from 'react';
import { Search, Download, Plus, FileText, FileSpreadsheet, Printer } from 'lucide-react';
import { TenantDocumentHeader } from './TenantDocumentHeader';

export type ExportFormat = 'csv' | 'excel' | 'pdf';

const getTableRows = (button: HTMLButtonElement) => {
  const table = button.closest('.container-fluid')?.querySelector('table');
  if (!table) {
    console.error('Aucun tableau disponible pour l’export.');
    return null;
  }

  return Array.from(table.rows)
    .filter((row) => !Array.from(row.cells).some((cell) => cell.colSpan > 1))
    .map((row) =>
      Array.from(row.cells)
        .filter((_, index) => {
          const header = table.tHead?.rows[0]?.cells[index]?.textContent?.trim().toLowerCase();
          return header !== 'action' && header !== 'actions';
        })
        .map((cell) => cell.innerText.trim()),
    );
};

const downloadTable = (
  button: HTMLButtonElement,
  format: Exclude<ExportFormat, 'pdf'>,
  providedRows?: string[][],
) => {
  const rows = providedRows ?? getTableRows(button);
  if (!rows) return;

  const sanitizeCell = (value: string) => (/^\s*[=+\-@]/.test(value) ? `'${value}` : value);
  const escapeCsv = (value: string) => `"${sanitizeCell(value).replace(/"/g, '""')}"`;
  const content = format === 'csv'
    ? `\uFEFF${rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n')}`
    : rows.map((row) => row.map((value) => sanitizeCell(value).replace(/[\t\r\n]/g, ' ')).join('\t')).join('\r\n');
  const mimeType = format === 'csv' ? 'text/csv;charset=utf-8' : 'application/vnd.ms-excel;charset=utf-8';
  const extension = format === 'csv' ? 'csv' : 'xls';
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `export_${new Date().toISOString().slice(0, 10)}.${extension}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

interface TableExportButtonProps {
  onExport?: (format: ExportFormat) => void;
  exporting?: boolean;
  rows?: string[][];
}

export const TableExportButton: React.FC<TableExportButtonProps> = ({
  onExport,
  exporting = false,
  rows,
}) => {
  const handleExport = (format: ExportFormat, button: HTMLButtonElement) => {
    if (onExport) {
      onExport(format);
      return;
    }
    if (format === 'pdf') {
      window.print();
      return;
    }
    downloadTable(button, format, rows);
  };

  return (
    <div className="dropdown">
      <TenantDocumentHeader />
      <button
        className="btn btn-sm btn-white bg-white border-light-subtle text-secondary shadow-2xs d-flex align-items-center gap-1.5 px-2.5 py-1 rounded-2 dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        style={{ fontSize: '12.5px', boxShadow: 'none' }}
        disabled={exporting}
      >
        <Download size={14} className="text-muted" />
        <span>Exporter</span>
      </button>
      <ul
        className="dropdown-menu dropdown-menu-end border border-light-subtle shadow-sm rounded-2 py-1"
        style={{ fontSize: '12px', minWidth: '150px' }}
      >
        <li>
          <button
            className="dropdown-item d-flex align-items-center gap-2 py-1.5"
            onClick={(event) => handleExport('excel', event.currentTarget)}
          >
            <FileSpreadsheet size={14} className="text-success" />
            <span>Excel (.xls)</span>
          </button>
        </li>
        <li>
          <button
            className="dropdown-item d-flex align-items-center gap-2 py-1.5"
            onClick={(event) => handleExport('csv', event.currentTarget)}
          >
            <FileText size={14} className="text-primary" />
            <span>CSV (.csv)</span>
          </button>
        </li>
        <li>
          <button
            className="dropdown-item d-flex align-items-center gap-2 py-1.5"
            onClick={(event) => handleExport('pdf', event.currentTarget)}
          >
            <Printer size={14} className="text-danger" />
            <span>PDF / Imprimer</span>
          </button>
        </li>
      </ul>
    </div>
  );
};

interface TableToolbarProps {
  // Recherche
  searchValue?: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  // Filtre par Statut (Actif / Inactif)
  statusValue?: string;
  onStatusChange?: (status: string) => void;
  statusOptions?: { value: string; label: string }[];

  // Sélection du per_page
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];

  // Exportation
  onExport?: (format: ExportFormat) => void;
  exporting?: boolean;

  // Action Principale
  onAddClick?: () => void;
  addButtonLabel?: string;

  // Slot optionnel pour filtres personnalisés
  extraFilters?: React.ReactNode;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Rechercher...',
  statusValue = '',
  onStatusChange,
  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'true', label: 'Actif' },
    { value: 'false', label: 'Inactif' },
  ],
  perPage = 5,
  onPerPageChange,
  perPageOptions = [5, 10, 20, 50, 100],
  onExport,
  exporting = false,
  onAddClick,
  addButtonLabel = 'Nouveau',
  extraFilters,
}) => {
  return (
    <div className="d-flex align-items-center gap-2 flex-wrap ms-auto">
      {/* Slot optionnel pour les filtres externes */}
      {extraFilters && <div className="d-flex align-items-center gap-2 me-1">{extraFilters}</div>}

      {/* Barre de recherche avec icône espacée */}
      <div className="position-relative" style={{ width: '200px' }}>
        <Search
          size={14}
          className="position-absolute top-50 start-0 translate-middle-y text-muted"
          style={{ left: '10px' }}
        />
        <input
          type="text"
          className="form-control form-control-sm bg-white border-light-subtle shadow-2xs rounded-2"
          placeholder={searchPlaceholder}
          style={{ fontSize: '12px', paddingLeft: '32px' }}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Select Filtre Statut */}
      {onStatusChange && (
        <div className="position-relative" style={{ minWidth: '130px' }}>
          <select
            className="form-select form-select-sm bg-white border-light-subtle text-secondary shadow-2xs rounded-2 fw-medium"
            value={statusValue}
            onChange={(e) => onStatusChange(e.target.value)}
            style={{ fontSize: '12px', boxShadow: 'none' }}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Choix des éléments par page (Show/PerPage) */}
      {onPerPageChange && (
        <div
          className="btn btn-sm btn-white bg-white border-light-subtle text-secondary shadow-2xs d-flex align-items-center gap-1.5 px-2.5 py-1 rounded-2"
          style={{ fontSize: '12px' }}
        >
          <span>Afficher</span>
          <select
            className="form-select form-select-sm border-0 fw-semibold text-dark py-0 ps-1 pe-3"
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            style={{ width: 'auto', fontSize: '12px', boxShadow: 'none' }}
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Dropdown Options d'exportation */}
      <TableExportButton onExport={onExport} exporting={exporting} />

      {/* Bouton Action Principale */}
      {onAddClick && (
        <button
          className="btn btn-sm btn-primary border-0 shadow-2xs d-flex align-items-center gap-1 px-3 py-1 rounded-2 fw-medium"
          onClick={onAddClick}
        >
          <Plus size={15} />
          <span>{addButtonLabel}</span>
        </button>
      )}
    </div>
  );
};