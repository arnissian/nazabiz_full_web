import React, { useState } from 'react';
import { Loader } from '../../../shared/components/common/Loader';
import { FileText, Eye, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { TableToolbar } from '../../../shared/components/common/TableToolbar';
import { Pagination } from '../../../shared/components/common/Pagination';
import { useQuotations } from '../../hooks/quotations/useQuotations';
import { useDeleteQuotation } from '../../hooks/quotations/useDeleteQuotation';
import QuotationCreate from './QuotationCreate';
import QuotationEdit from './QuotationEdit';
import QuotationShow from './QuotationShow';
import type { Quotation } from '../../types/quotation';

export default function Quotations() {
  const { quotations, pagination, loading, error, params, setParams, reFetch } =
    useQuotations({ page: 1, per_page: 5 });
  const { deleteQuotation } = useDeleteQuotation();

  const [create, setCreate] = useState(false);
  const [edit, setEdit] = useState<Quotation | null>(null);
  const [show, setShow] = useState<Quotation | null>(null);
  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce devis ?')) {
      const res = await deleteQuotation(id);
      if (res.success) {
        reFetch();
      } else {
        alert(res.message);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="badge bg-secondary-subtle text-secondary rounded-pill px-2 py-1">Brouillon</span>;
      case 'sent':
        return <span className="badge bg-info-subtle text-info rounded-pill px-2 py-1">Envoyé</span>;
      case 'accepted':
        return <span className="badge bg-primary-subtle text-primary rounded-pill px-2 py-1">Accepté</span>;
      case 'rejected':
        return <span className="badge bg-danger-subtle text-danger rounded-pill px-2 py-1">Refusé</span>;
      case 'converted':
        return <span className="badge bg-secondary-subtle text-secondary rounded-pill px-2 py-1">Ancienne conversion</span>;
      case 'ordered':
        return <span className="badge bg-primary-subtle text-primary rounded-pill px-2 py-1">Commande</span>;
      case 'partially_delivered':
        return <span className="badge bg-warning-subtle text-warning rounded-pill px-2 py-1">Partiellement livré</span>;
      case 'delivered':
        return <span className="badge bg-success-subtle text-success rounded-pill px-2 py-1">Livré</span>;
      default:
        return <span className="badge bg-light text-dark rounded-pill px-2 py-1">{status}</span>;
    }
  };

  return (
    <div className="container-fluid p-3 p-md-4 min-vh-100" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="d-flex align-items-center bg-light-subtle p-2 rounded-2 justify-content-between mb-3 gap-2 flex-wrap">
        <div className="d-flex align-items-center gap-2">
          <h1 className="fw-bold text-dark mb-0 fs-5">Devis & Proformas</h1>
        </div>
        <TableToolbar
          searchValue={params.search || ''}
          onSearchChange={(q) => setParams((p) => ({ ...p, search: q || undefined, page: 1 }))}
          searchPlaceholder="Rechercher référence ou client..."
          statusValue={params.status || ''}
          onStatusChange={(s) => setParams((p) => ({ ...p, status: s || undefined, page: 1 }))}
          perPage={params.per_page || 5}
          onPerPageChange={(n) => setParams((p) => ({ ...p, per_page: n, page: 1 }))}
          onAddClick={() => setCreate(true)}
          addButtonLabel="Nouveau Devis"
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
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>
                    Référence
                  </th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>
                    Client
                  </th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>
                    Date
                  </th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>
                    Validité
                  </th>
                  <th className="py-2 text-muted fw-medium text-end" style={{ fontSize: '12px' }}>
                    Montant TTC
                  </th>
                  <th className="py-2 text-muted fw-medium text-center" style={{ fontSize: '12px' }}>
                    Statut
                  </th>
                  <th className="py-2 text-muted fw-medium text-end" style={{ fontSize: '12px' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      <Loader height="100px" />
                    </td>
                  </tr>
                ) : quotations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      <FileText size={32} className="mb-2 opacity-30" />
                      <div>Aucun devis trouvé.</div>
                    </td>
                  </tr>
                ) : (
                  quotations.map((q) => (
                    <tr key={q.id} className="border-bottom border-light">
                      <td className="py-3 text-start">
                        <span className="fw-semibold text-primary">{q.reference || q.id}</span>
                      </td>
                      <td className="py-3 text-start fw-medium text-dark">
                        {q.customer?.name || 'Client Comptant'}
                      </td>
                      <td className="py-3 text-start text-muted" style={{ fontSize: '12px' }}>
                        {new Date(q.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-start text-muted" style={{ fontSize: '12px' }}>
                        {q.expiry_date ? new Date(q.expiry_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 text-end fw-bold text-dark">
                        {Number(q.total_amount || 0).toLocaleString()} $
                      </td>
                      <td className="py-3 text-center">{getStatusBadge(q.status)}</td>
                      <td className="py-3 text-end">
                        <div className="d-flex justify-content-end align-items-center gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-light border p-1 text-secondary"
                            title="Visualiser et imprimer"
                            onClick={() => setShow(q)}
                          >
                            <Eye size={14} />
                          </button>
                          {!['converted', 'ordered', 'partially_delivered', 'delivered'].includes(q.status) && <>
                          <button
                            type="button"
                            className="btn btn-sm btn-light border p-1 text-primary"
                            title="Modifier"
                            onClick={() => setEdit(q)}
                          >
                            <Edit size={14} />
                          </button>
                          {!['converted', 'ordered', 'partially_delivered', 'delivered'].includes(q.status) && <button
                            type="button"
                            className="btn btn-sm btn-light border p-1 text-danger"
                            title="Supprimer"
                            onClick={() => handleDelete(q.id)}
                          >
                            <Trash2 size={14} />
                          </button>}
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {pagination && (
        <div className="mt-3">
          <Pagination
            currentPage={pagination.current_page || 1}
            lastPage={pagination.last_page || 1}
            total={pagination.total || quotations.length}
            onPageChange={(page) => setParams((p) => ({ ...p, page }))}
          />
        </div>
      )}

      {/* Modals */}
      <QuotationCreate
        isOpen={create}
        onClose={() => setCreate(false)}
        onSuccess={() => reFetch()}
      />

      <QuotationEdit
        isOpen={!!edit}
        onClose={() => setEdit(null)}
        quotation={edit}
        onSuccess={() => reFetch()}
      />

      <QuotationShow
        isOpen={!!show}
        onClose={() => setShow(null)}
        quotation={show}
        onConverted={() => reFetch()}
        onEdit={(quotation) => {
          setShow(null);
          setEdit(quotation);
        }}
      />
    </div>
  );
}
