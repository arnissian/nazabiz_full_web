import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  from?: number | null;
  to?: number | null;
  total: number;
  per_page?: number;
  next_page_url?: string | null;
  prev_page_url?: string | null;
  [key: string]: any;
}

export interface PaginationProps {
  meta?: PaginationMeta | null;
  currentPage?: number;
  lastPage?: number;
  total?: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
  showPerPageOptions?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  meta,
  currentPage,
  lastPage: propLastPage,
  total: propTotal,
  loading = false,
  onPageChange,
  onPerPageChange,
  perPageOptions = [5, 10, 20, 50, 100],
  showPerPageOptions = false,
}) => {
  const current_page = meta ? meta.current_page : (currentPage ?? 1);
  const last_page = meta ? meta.last_page : (propLastPage ?? 1);
  const total = meta ? meta.total : (propTotal ?? 0);
  const per_page = meta?.per_page ?? 5;
  const from = meta ? (meta.from ?? ((current_page - 1) * per_page + 1)) : ((current_page - 1) * per_page + 1);
  const to = meta ? (meta.to ?? Math.min(current_page * per_page, total)) : Math.min(current_page * per_page, total);

  if (total <= per_page || last_page <= 1) return null;

  // Calcul dynamique des numéros de pages à afficher (avec "...")
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 1; // Nombre de pages adjacentes à la page courante

    for (let i = 1; i <= last_page; i++) {
      if (
        i === 1 ||
        i === last_page ||
        (i >= current_page - delta && i <= current_page + delta)
      ) {
        pages.push(i);
      } else if (
        (i === current_page - delta - 1 && i > 1) ||
        (i === current_page + delta + 1 && i < last_page)
      ) {
        pages.push('...');
      }
    }

    // Filtrer les doublons de "..."
    return pages.filter((page, index, array) => page !== '...' || array[index - 1] !== '...');
  };

  return (
    <div 
      className="d-flex flex-column flex-sm-row justify-content-between align-items-center p-2 border-top border-light-subtle bg-light-subtle gap-2"
      style={{ backgroundColor: '#fafafa' }}
    >
      {/* Informations globales + Choix d'éléments par page si activé */}
      <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '12px' }}>
        <span>
          Affichage de <span className="fw-semibold text-dark">{from ?? 0}</span> à{' '}
          <span className="fw-semibold text-dark">{to ?? 0}</span> sur{' '}
          <span className="fw-semibold text-dark">{total}</span> résultats
        </span>

        {showPerPageOptions && onPerPageChange && (
          <div className="d-flex align-items-center gap-1 ms-2">
            <span>| Afficher</span>
            <select
              className="form-select form-select-sm border-0 fw-semibold text-dark py-0 ps-1 pe-3 bg-white border border-light-subtle shadow-2xs rounded-1"
              value={per_page}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              style={{ width: 'auto', fontSize: '12px', boxShadow: 'none' }}
              disabled={loading}
            >
              {perPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation des pages */}
      <div className="d-flex align-items-center gap-1">
        {/* Précédent */}
        <button
          className="btn btn-sm btn-link text-muted text-decoration-none d-flex align-items-center gap-1 p-1 fw-medium"
          style={{ fontSize: '12px' }}
          disabled={current_page <= 1 || loading}
          onClick={() => onPageChange(current_page - 1)}
        >
          <ChevronLeft size={14} /> Précédent
        </button>

        {/* Numéros de page */}
        {getPageNumbers().map((page, index) => {
          if (typeof page === 'string') {
            return (
              <span key={`ellipse-${index}`} className="px-1 text-muted" style={{ fontSize: '12px' }}>
                ...
              </span>
            );
          }

          const isCurrent = page === current_page;
          return (
            <button
              key={page}
              className={`btn btn-sm rounded-2 border-0 fw-medium p-0 d-flex align-items-center justify-content-center ${
                isCurrent ? 'btn-primary text-white' : 'text-muted bg-transparent'
              }`}
              style={{
                width: '26px',
                height: '26px',
                fontSize: '12px',
              }}
              disabled={loading}
              onClick={() => onPageChange(page)}
            >
              {page < 10 ? `0${page}` : page}
            </button>
          );
        })}

        {/* Suivant */}
        <button
          className="btn btn-sm btn-link text-muted text-decoration-none d-flex align-items-center gap-1 p-1 fw-medium"
          style={{ fontSize: '12px' }}
          disabled={current_page >= last_page || loading}
          onClick={() => onPageChange(current_page + 1)}
        >
          Suivant <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};