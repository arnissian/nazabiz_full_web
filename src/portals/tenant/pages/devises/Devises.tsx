import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDevises } from '../../../shared/hooks/devises/useDevises';
import { useDeleteDevise } from '../../hooks/devises/useDeleteDevise';
import type { Devise } from '../../../shared/types/devise';
import { DeviseCreate } from './DeviseCreate';
import { DeviseEdit } from './DeviseEdit';
import { DeviseShow } from './DeviseShow';

import {
  Eye, Edit, Trash2, Loader2, AlertTriangle,
  ArrowUpDown
} from 'lucide-react';
import { Pagination } from '../../../shared/components/common/Pagination';
import { TableToolbar } from '../../../shared/components/common/TableToolbar';
import { TableSkeletonRows } from '../../../shared/components/common/TableSkeleton';

export default function Devises() {
  const { id } = useParams<{ id: string }>();
  const isStoreCatalog = Boolean(id);
  const {
    devises,
    pagination,
    loading,
    error,
    params,
    setParams,
    reFetch
  } = useDevises(
    { page: 1, per_page: 5 },
    id,
    true,
    isStoreCatalog ? 'store' : 'tenant',
  );

  const { deleteDevise, loading: deleting } = useDeleteDevise();

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDeviseForEdit, setSelectedDeviseForEdit] = useState<Devise | null>(null);
  const [selectedDeviseForShow, setSelectedDeviseForShow] = useState<Devise | null>(null);
  const [selectedDeviseForDelete, setSelectedDeviseForDelete] = useState<Devise | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!selectedDeviseForDelete) return;
    setDeleteErrorMessage(null);

    const res = await deleteDevise(
      selectedDeviseForDelete.id,
      isStoreCatalog ? id : undefined,
      isStoreCatalog ? 'store' : 'tenant',
    );
    if (res) {
      setSelectedDeviseForDelete(null);
      reFetch();
    } else {
      setDeleteErrorMessage('Erreur lors de la suppression de la devise');
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

  return (
    <div className="container-fluid p-3 p-md-4 min-vh-100" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* En-tête : Titre + Toolbar */}
      <div className="d-flex align-items-center bg-light-subtle p-2 rounded-2 justify-content-between mb-3 gap-2 flex-wrap">
        <div>
          <h1 className="fw-bold text-dark mb-0 fs-5 mb-1">Devises</h1>
          <small className="text-muted">
            {isStoreCatalog ? 'Gérez les devises de ce magasin.' : 'Gérez les devises communes à l’entreprise.'}
            {' '}USD est la référence au taux fixe de 1.
          </small>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
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
            onAddClick={() => setShowCreateModal(true)}
            addButtonLabel="Nouveau"
          />
        </div>
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
                      Symbole <ArrowUpDown size={11} className="text-muted opacity-60" />
                    </div>
                  </th>
                  
                  <th scope="col" className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>
                    <div className="d-flex align-items-center gap-1 user-select-none">
                      Code <ArrowUpDown size={11} className="text-muted opacity-60" />
                    </div>
                  </th>
                  
                  <th scope="col" className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>
                    <div className="d-flex align-items-center gap-1 user-select-none">
                      Taux pour 1 USD <ArrowUpDown size={11} className="text-muted opacity-60" />
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
                  <TableSkeletonRows columns={6} />
                ) : devises.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted" style={{ fontSize: '13px' }}>
                      Aucune devise trouvée.
                    </td>
                  </tr>
                ) : (
                  devises.map((devise) => (
                    <tr key={devise?.id} className="border-bottom border-light-subtle">
                      <td className="ps-3 py-2 fw-semibold text-dark text-start" style={{ fontSize: '13px' }}>
                        {devise?.name}
                      </td>

                      <td className="py-2 text-start" style={{ fontSize: '13px' }}>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-medium rounded-2 px-2 py-0.5" style={{ fontSize: '11px' }}>
                          {devise?.symbol}
                        </span>
                      </td>

                      <td className="py-2 text-start" style={{ fontSize: '13px' }}>
                        {devise?.code}
                      </td>
                      
                      <td className="py-2 text-start" style={{ fontSize: '13px' }}>
                        {devise?.rate}
                      </td>

                      <td className="py-2 text-start">
                        {devise?.is_active ? (
                          <span 
                            className="badge bg-success-subtle text-success border border-success-subtle fw-medium rounded-pill px-2 py-0.5"
                            style={{ fontSize: '11px' }}
                          >
                            Actif
                          </span>
                        ) : (
                          <span 
                            className="badge bg-secondary-subtle text-secondary border border-secondary-subtle fw-medium rounded-pill px-2 py-0.5"
                            style={{ fontSize: '11px' }}
                          >
                            Inactif
                          </span>
                        )}
                      </td>

                      <td className="text-end pe-3 py-2">
                        <div className="d-flex justify-content-end gap-1">
                          <button
                            className="btn btn-sm btn-light text-primary border-0 rounded-2 p-1"
                            onClick={() => setSelectedDeviseForShow(devise)}
                            title="Voir"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-light text-warning border-0 rounded-2 p-1"
                            onClick={() => setSelectedDeviseForEdit(devise)}
                            title="Modifier"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-light text-danger border-0 rounded-2 p-1"
                            onClick={() => setSelectedDeviseForDelete(devise)}
                            title="Supprimer"
                            disabled={devise.code.toUpperCase() === 'USD'}
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* Pagination */}
      {pagination && (
        <Pagination
          meta={pagination}
          onPageChange={handlePageChange}
        />
      )}

      {/* Modal Création */}
      {showCreateModal && (
        <DeviseCreate
          storeId={isStoreCatalog ? id : undefined}
          show={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            reFetch();
          }}
        />
      )}

      {/* Modal Modification */}
      {selectedDeviseForEdit && (
        <DeviseEdit
          key={selectedDeviseForEdit.id}
          storeId={isStoreCatalog ? id : undefined}
          show={!!selectedDeviseForEdit}
          devise={selectedDeviseForEdit}
          onClose={() => setSelectedDeviseForEdit(null)}
          onSuccess={() => {
            setSelectedDeviseForEdit(null);
            reFetch();
          }}
        />
      )}

      {/* Modal Affichage */}
      {selectedDeviseForShow && (
        <DeviseShow
          show={!!selectedDeviseForShow}
          devise={selectedDeviseForShow}
          onClose={() => setSelectedDeviseForShow(null)}
        />
      )}

      {/* Modal Suppression */}
      {selectedDeviseForDelete && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-3">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-semibold">Confirmer la suppression</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedDeviseForDelete(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-0 text-muted" style={{ fontSize: '14px' }}>
                  Êtes-vous sûr de vouloir supprimer la devise <strong>{selectedDeviseForDelete.name}</strong> ?
                </p>
                {deleteErrorMessage && (
                  <div className="alert alert-danger border-0 shadow-2xs d-flex align-items-center gap-2 mt-3 py-2 px-3 rounded-2" role="alert" style={{ fontSize: '13px' }}>
                    <AlertTriangle size={16} className="text-danger flex-shrink-0" />
                    <div>{deleteErrorMessage}</div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-light rounded-2 px-3"
                  onClick={() => setSelectedDeviseForDelete(null)}
                  disabled={deleting}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-danger rounded-2 px-3"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="spinner-border spinner-border-sm me-2" size={14} />
                      Suppression...
                    </>
                  ) : (
                    'Supprimer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
