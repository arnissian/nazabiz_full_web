import React, { useState } from 'react';
import { useDomains } from '../../hooks/domains/useDomains';
import { useDeleteDomain } from '../../hooks/domains/useDeleteDomain';
import type { Domain } from '../../types/domain';
import DomainCreate from './DomainCreate';
import DomainEdit from './DomainEdit';
import DomainShow from './DomainShow';

import {
  Eye, Edit, Trash2, Loader2, AlertTriangle,
  ArrowUpDown
} from 'lucide-react';
import { Pagination } from '../../../shared/components/common/Pagination';
import { TableActionButton } from '../../../shared/components/common/TableActionButton';
import { type ExportFormat, TableToolbar } from '../../../shared/components/common/TableToolbar';
import { TenantDocumentHeader } from '../../../shared/components/common/TenantDocumentHeader';
import { uploads } from '../../../shared/config/env';
import { TableSkeletonRows } from '../../../shared/components/common/TableSkeleton';

export default function Domains() {
  const {
    domains,
    pagination,
    loading,
    error,
    params,
    setParams,
    reFetch
  } = useDomains({ page: 1, per_page: 5 });

  const { deleteDomain, deleting } = useDeleteDomain();

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDomainForEdit, setSelectedDomainForEdit] = useState<Domain | null>(null);
  const [selectedDomainForShow, setSelectedDomainForShow] = useState<Domain | null>(null);
  const [selectedDomainForDelete, setSelectedDomainForDelete] = useState<Domain | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!selectedDomainForDelete) return;
    setDeleteErrorMessage(null);

    const res = await deleteDomain(selectedDomainForDelete.id);
    if (res.success) {
      setSelectedDomainForDelete(null);
      reFetch();
    } else {
      setDeleteErrorMessage(res.message);
    }
  };

  const handlePerPageChange = (newPerPage: number) => {
    setParams((prev) => ({
      ...prev,
      per_page: newPerPage,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setParams((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleSearchChange = (query: string) => {
    setParams((prev) => ({
      ...prev,
      search: query || undefined,
      page: 1,
    }));
  };

  // Transmet 'is_active' au format booléen attendu par Laravel
  const handleStatusChange = (statusStr: string) => {
    let isActiveBool: boolean | undefined = undefined;
    if (statusStr === 'true') isActiveBool = true;
    if (statusStr === 'false') isActiveBool = false;

    setParams((prev) => ({
      ...prev,
      is_active: isActiveBool,
      page: 1,
    }));
  };

  const handleExport = (format: ExportFormat) => {
    if (!domains || domains.length === 0) return;

    switch (format) {
      case 'csv': {
        const headers = ['ID', 'Nom', 'Description', 'Statut'];
        const rows = domains.map((d) => [
          d.id,
          `"${d.name}"`,
          `"${d.description || ''}"`,
          d.is_active ? 'Actif' : 'Inactif',
        ]);
        const csvContent =
          'data:text/csv;charset=utf-8,' +
          [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `domaines_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
      }

      case 'excel': {
        const headers = ['ID', 'Nom', 'Description', 'Statut'];
        const rows = domains.map((d) => [
          d.id,
          d.name,
          d.description || '',
          d.is_active ? 'Actif' : 'Inactif',
        ]);
        const tsvContent =
          'data:application/vnd.ms-excel;charset=utf-8,' +
          [headers.join('\t'), ...rows.map((e) => e.join('\t'))].join('\n');

        const encodedUri = encodeURI(tsvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `domaines_${new Date().toISOString().slice(0, 10)}.xls`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
      }

      case 'pdf': {
        window.print();
        break;
      }
    }
  };

  return (
    <div className="container-fluid p-3 p-md-4 min-vh-100" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <TenantDocumentHeader />
      
      {/* En-tête : Titre + Toolbar */}
      <div className="d-flex align-items-center bg-light-subtle p-2 rounded-2 justify-content-between mb-3 gap-2 flex-wrap">
        <h1 className="fw-bold text-dark mb-0 fs-5 mb-1">Domaines</h1>

        <TableToolbar
          searchValue={params.search || ''}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Rechercher..."
          statusValue={
            params.is_active === true ? 'true' : params.is_active === false ? 'false' : ''
          }
          onStatusChange={handleStatusChange}
          perPage={params.per_page || 5}
          onPerPageChange={handlePerPageChange}
          onExport={handleExport}
          onAddClick={() => setShowCreateModal(true)}
          addButtonLabel="Nouveau"
        />
      </div>

      {/* Alerte d'erreur */}
      {error && (
        <div className="alert alert-danger border-0 shadow-2xs d-flex align-items-center gap-2 mb-3 py-2 px-3 rounded-2" role="alert" style={{ fontSize: '13px' }}>
          <AlertTriangle size={16} className="text-danger flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* Tableau */}
      <div className="card border border-light shadow-2xs rounded-3 overflow-hidden bg-white">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr className="border-bottom border-light-subtle bg-light-subtle" style={{ backgroundColor: '#fafafa' }}>
                  <th scope="col" className="ps-3 py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>
                    <div className="d-flex align-items-center gap-1 user-select-none">
                      Nom <ArrowUpDown size={11} className="text-muted opacity-60" />
                    </div>
                  </th>
                  
                  <th scope="col" className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>
                    <div className="d-flex align-items-center gap-1 user-select-none">
                      Description <ArrowUpDown size={11} className="text-muted opacity-60" />
                    </div>
                  </th>
                  <th scope="col" className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>
                    <div className="d-flex align-items-center gap-1 user-select-none">
                      Statut <ArrowUpDown size={11} className="text-muted opacity-60" />
                    </div>
                  </th>
                  <th scope="col" className="text-end pe-3 py-2 text-muted fw-medium" style={{ fontSize: '12px' }}>
                    <div className="d-flex align-items-center justify-content-end gap-1 user-select-none">
                      Action <ArrowUpDown size={11} className="text-muted opacity-60" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonRows columns={4} />
                ) : domains.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-muted" style={{ fontSize: '13px' }}>
                      Aucun domaine trouvé.
                    </td>
                  </tr>
                ) : (
                  domains.map((domain) => (
                    <tr key={domain?.id} className="border-bottom border-light-subtle">
                      <td className="ps-3 py-2 fw-semibold text-dark text-start" style={{ fontSize: '13px' }}>
                    <span className="table-user">
  <img src={`${uploads}/${domain.image}`} className="me-2 rounded-2" />
</span>

                        
                        {domain?.name}
                      </td>

                      <td className="py-2 text-secondary text-start" style={{ maxWidth: '280px', fontSize: '13px' }}>
                        <span className="text-truncate d-block">
                          {domain?.description || <span className="text-muted fst-italic">Sans description</span>}
                        </span>
                      </td>

                      <td className="py-2 text-start">
                        {domain?.is_active ? (
                          <span 
                            className="badge bg-success-subtle text-success border border-success-subtle fw-medium rounded-pill px-2 py-0.5"
                            style={{ fontSize: '11px' }}
                          >
                            Actif
                          </span>
                        ) : (
                          <span 
                            className="badge bg-danger-subtle text-danger border border-danger-subtle fw-medium rounded-pill px-2 py-0.5"
                            style={{ fontSize: '11px' }}
                          >
                            Inactif
                          </span>
                        )}
                      </td>

                      <td className="text-end pe-3 py-2">
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <TableActionButton label="Détails" icon={<Eye size={13} />} onClick={() => setSelectedDomainForShow(domain)} />
                          <TableActionButton label="Modifier" icon={<Edit size={13} />} variant="primary" onClick={() => setSelectedDomainForEdit(domain)} />
                          <TableActionButton
                            label="Supprimer"
                            icon={<Trash2 size={13} />}
                            variant="danger"
                            onClick={() => {
                              setDeleteErrorMessage(null);
                              setSelectedDomainForDelete(domain);
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            meta={pagination}
            loading={loading}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Modales */}
      <DomainCreate
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => reFetch()}
      />

      <DomainEdit
        domain={selectedDomainForEdit}
        isOpen={!!selectedDomainForEdit}
        onClose={() => setSelectedDomainForEdit(null)}
        onSuccess={() => reFetch()}
      />

      <DomainShow
        domain={selectedDomainForShow}
        isOpen={!!selectedDomainForShow}
        onClose={() => setSelectedDomainForShow(null)}
      />

      {/* Modal Supprimer */}
      {selectedDomainForDelete && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow-sm rounded-3 p-1 text-start">
              <div className="modal-body text-center p-3">
                <div className="p-2 bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex mb-2">
                  <AlertTriangle size={20} />
                </div>
                <h6 className="fw-bold mb-1" style={{ fontSize: '14px' }}>Supprimer le domaine</h6>
                <p className="text-muted mb-3" style={{ fontSize: '12px' }}>
                  Êtes-vous sûr de vouloir supprimer <strong className="text-dark">{selectedDomainForDelete.name}</strong> ?
                </p>

                {deleteErrorMessage && (
                  <div className="alert alert-danger py-1 px-2 mb-2 text-start" role="alert" style={{ fontSize: '11px' }}>
                    {deleteErrorMessage}
                  </div>
                )}

                <div className="d-flex justify-content-center gap-2 mt-3">
                  <button
                    type="button"
                    className="btn btn-sm btn-light border border-light-subtle px-3 rounded-2 fw-medium"
                    style={{ fontSize: '12px' }}
                    onClick={() => setSelectedDomainForDelete(null)}
                    disabled={deleting}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger d-flex align-items-center gap-1.5 px-3 rounded-2 fw-medium"
                    style={{ fontSize: '12px' }}
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                  >
                    {deleting && <Loader2 className="spinner-border spinner-border-sm" size={12} />}
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}