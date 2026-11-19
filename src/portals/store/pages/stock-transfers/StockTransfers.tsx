import { Loader } from '../../../shared/components/common/Loader';
import React, { useState } from 'react';
import { Eye, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { TableToolbar } from '../../../shared/components/common/TableToolbar';
import { Pagination } from '../../../shared/components/common/Pagination';
import { useStockTransfers } from '../../hooks/stock-transfers/useStockTransfers';
import StockTransferCreate from './StockTransferCreate';
import StockTransferShow from './StockTransferShow';

export default function StockTransfers() {
  const { stocktransfers, pagination, loading, error, params, setParams, reFetch } = useStockTransfers({ page: 1, per_page: 5 });
  const [create, setCreate] = useState(false);
  const [show, setShow] = useState<any>(null);

  return (
    <div className="container-fluid p-3 p-md-4 min-vh-100" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="d-flex align-items-center bg-light-subtle p-2 rounded-2 justify-content-between mb-3 gap-2 flex-wrap">
        <h1 className="fw-bold text-dark mb-0 fs-5">Transferts de stock</h1>
        <TableToolbar
          searchValue={params.search || ''}
          onSearchChange={q => setParams((p: any) => ({ ...p, search: q || undefined, page: 1 }))}
          searchPlaceholder="Rechercher..."
          perPage={params.per_page || 5}
          onPerPageChange={n => setParams((p: any) => ({ ...p, per_page: n, page: 1 }))}
          onAddClick={() => setCreate(true)}
          addButtonLabel="Nouveau"
        />
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
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>Magasin source</th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>Magasin destination</th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>Produit</th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>Quantité</th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>Référence</th>
                  <th className="text-end pe-3 py-2 text-muted fw-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <Loader height="100px" />
                    </td>
                  </tr>
                ) : stocktransfers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">Aucun élément trouvé.</td>
                  </tr>
                ) : (
                  stocktransfers.map((item: any) => (
                    <tr key={item.id} className="border-bottom border-light-subtle">
                      <td className="py-2 text-start" style={{ fontSize: '13px' }}>{item.stock?.store?.name ?? <span className="text-muted">—</span>}</td>
                      <td className="py-2 text-start" style={{ fontSize: '13px' }}>{item.destination_store_id ?? <span className="text-muted">—</span>}</td>
                      <td className="py-2 text-start" style={{ fontSize: '13px' }}>{item.stock?.product?.name ?? <span className="text-muted">—</span>}</td>
                      <td className="py-2 text-start" style={{ fontSize: '13px' }}>{item.quantity ?? <span className="text-muted">—</span>}</td>
                      <td className="py-2 text-start" style={{ fontSize: '13px' }}>{item.reference ?? <span className="text-muted">—</span>}</td>
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

      <StockTransferCreate isOpen={create} onClose={() => setCreate(false)} onSuccess={reFetch} />
      <StockTransferShow item={show} isOpen={!!show} onClose={() => setShow(null)} />
    </div>
  );
}