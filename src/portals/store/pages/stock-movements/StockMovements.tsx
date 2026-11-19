import { Loader } from '../../../shared/components/common/Loader';
import React, { useState, useEffect } from 'react';
import { Eye, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { TableToolbar } from '../../../shared/components/common/TableToolbar';
import { Pagination } from '../../../shared/components/common/Pagination';
import { useStockMovements } from '../../hooks/stock-movements/useStockMovements';
import { useSearchParams } from 'react-router-dom';
import StockAdjustmentCreate from './StockAdjustmentCreate';
import StockMovementShow from './StockMovementShow';

export default function StockMovements() {
  const [searchParams] = useSearchParams();
  const { stockmovements, pagination, loading, error, params, setParams, reFetch } = useStockMovements({ page: 1, per_page: 5 });
  const [adjustment, setAdjustment] = useState(false);
  const [show, setShow] = useState<any>(null);

  // Ouvrir le modal d'ajustement si le paramètre est présent
  useEffect(() => {
    if (searchParams.get('adjustment') === 'true') {
      setAdjustment(true);
    }
  }, [searchParams]);

  return (
    <div className="container-fluid p-3 p-md-4 min-vh-100" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="d-flex align-items-center bg-light-subtle p-2 rounded-2 justify-content-between mb-3 gap-2 flex-wrap">
        <h1 className="fw-bold text-dark mb-0 fs-5">Mouvements de stock</h1>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-warning fw-normal"
            style={{ fontSize: "0.75rem" }}
            onClick={() => setAdjustment(true)}
          >
            <AlertTriangle size={14} className="me-1" />
            Ajustement
          </button>
          <TableToolbar
            searchValue={params.search || ''}
            onSearchChange={q => setParams((p: any) => ({ ...p, search: q || undefined, page: 1 }))}
            searchPlaceholder="Rechercher..."
            perPage={params.per_page || 5}
            onPerPageChange={n => setParams((p: any) => ({ ...p, per_page: n, page: 1 }))}
          />
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 shadow-2xs d-flex align-items-center gap-2 mb-3 py-2 px-3 rounded-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="card border border-light shadow-2xs rounded-3 overflow-hidden bg-white">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr className="border-bottom border-light-subtle bg-light-subtle">
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>Type</th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>Quantité</th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>Avant</th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>Après</th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>Référence</th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>Motif</th>
                  <th className="text-end pe-3 py-2 text-muted fw-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      <Loader height="100px" />
                    </td>
                  </tr>
                ) : stockmovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">Aucun élément trouvé.</td>
                  </tr>
                ) : (
                  stockmovements.map((item: any) => (
                    <tr key={item.id} className="border-bottom border-light-subtle">
                      <td className="py-2 text-start" style={{ fontSize: '13px' }}>{item.type ?? <span className="text-muted">—</span>}</td>
                      <td className="py-2 text-start" style={{ fontSize: '13px' }}>{item.quantity ?? <span className="text-muted">—</span>}</td>
                      <td className="py-2 text-start" style={{ fontSize: '13px' }}>{item.previous_quantity ?? <span className="text-muted">—</span>}</td>
                      <td className="py-2 text-start" style={{ fontSize: '13px' }}>{item.new_quantity ?? <span className="text-muted">—</span>}</td>
                      <td className="py-2 text-start" style={{ fontSize: '13px' }}>{item.reference ?? <span className="text-muted">—</span>}</td>
                      <td className="py-2 text-start" style={{ fontSize: '13px' }}>{item.reason ?? <span className="text-muted">—</span>}</td>
                      <td className="text-end pe-3 py-2">
                        <button className="btn btn-sm btn-link text-muted p-1 border-0" onClick={() => setShow(item)}>
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination meta={pagination} loading={loading} onPageChange={p => setParams((x: any) => ({ ...x, page: p }))} />
        </div>
      </div>

      <StockAdjustmentCreate isOpen={adjustment} onClose={() => setAdjustment(false)} onSuccess={reFetch} />
      <StockMovementShow item={show} isOpen={!!show} onClose={() => setShow(null)} />
    </div>
  );
}