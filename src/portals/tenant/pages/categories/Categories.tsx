import React, { useState } from 'react';
import { useCategories } from '../../../shared/hooks/categories/useCategories';
import { useDeleteCategory } from '../../hooks/categories/useDeleteCategory';
import type { Category } from '../../../shared/types/category';
import CategoryCreate from './CategoryCreate';
import CategoryEdit from './CategoryEdit';
import CategoryShow from './CategoryShow';

import {
  Eye, Edit, Trash2, Loader2, AlertTriangle,
  ArrowUpDown, Layers
} from 'lucide-react';
import { Pagination } from '../../../shared/components/common/Pagination';
import { TableActionButton } from '../../../shared/components/common/TableActionButton';
import { type ExportFormat, TableToolbar } from '../../../shared/components/common/TableToolbar';
import { uploads } from '../../../shared/config/env';
import { TableSkeletonRows } from '../../../shared/components/common/TableSkeleton';

export default function Categories() {
  const {
    categories,
    pagination,
    loading,
    error,
    params,
    setParams,
    reFetch
  } = useCategories({ page: 1, per_page: 5 });

  const { deleteCategory, deleting } = useDeleteCategory();

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<Category | null>(null);
  const [selectedCategoryForShow, setSelectedCategoryForShow] = useState<Category | null>(null);
  const [selectedCategoryForDelete, setSelectedCategoryForDelete] = useState<Category | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!selectedCategoryForDelete) return;
    setDeleteErrorMessage(null);

    const res = await deleteCategory(selectedCategoryForDelete.id);
    if (res.success) {
      setSelectedCategoryForDelete(null);
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
        <h1 className="fw-bold text-dark mb-0 fs-5 mb-1">Catégories</h1>

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
                      Domaine <ArrowUpDown size={11} className="text-muted opacity-60" />
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
                  <TableSkeletonRows columns={5} />
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted" style={{ fontSize: '13px' }}>
                      Aucune catégorie trouvée.
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category?.id} className="border-bottom border-light-subtle">
                      <td className="ps-3 py-2 fw-semibold text-dark text-start" style={{ fontSize: '13px' }}>
                        <span className="table-user">
                          {category.image ? (
                            <img src={`${uploads}/${category.image}`} className="me-2 rounded-2" alt={category.name} />
                          ) : null}
                        </span>
                        {category?.name}
                      </td>

                      <td className="py-2 text-start" style={{ fontSize: '13px' }}>
                        {category.domain ? (
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-medium rounded-2 px-2 py-0.5" style={{ fontSize: '11px' }}>
                            <Layers size={10} className="me-1" />
                            {category.domain.name}
                          </span>
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
                      </td>

                      <td className="py-2 text-secondary text-start" style={{ maxWidth: '280px', fontSize: '13px' }}>
                        <span className="text-truncate d-block">
                          {category?.description || <span className="text-muted fst-italic">Sans description</span>}
                        </span>
                      </td>

                      <td className="py-2 text-start">
                        {Boolean(category?.is_active) ? (
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
                          <TableActionButton label="Détails" icon={<Eye size={13} />} onClick={() => setSelectedCategoryForShow(category)} />
                          <TableActionButton label="Modifier" icon={<Edit size={13} />} variant="primary" onClick={() => setSelectedCategoryForEdit(category)} />
                          <TableActionButton
                            label="Supprimer"
                            icon={<Trash2 size={13} />}
                            variant="danger"
                            onClick={() => {
                              setDeleteErrorMessage(null);
                              setSelectedCategoryForDelete(category);
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
      <CategoryCreate
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => reFetch()}
      />

      <CategoryEdit
        category={selectedCategoryForEdit}
        isOpen={!!selectedCategoryForEdit}
        onClose={() => setSelectedCategoryForEdit(null)}
        onSuccess={() => reFetch()}
      />

      {/* Show Modal */}
      <CategoryShow
        category={selectedCategoryForShow}
        isOpen={!!selectedCategoryForShow}
        onClose={() => setSelectedCategoryForShow(null)}
      />

      {/* Modal Supprimer */}
      {selectedCategoryForDelete && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow-sm rounded-3 p-1 text-start">
              <div className="modal-body text-center p-3">
                <div className="p-2 bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex mb-2">
                  <AlertTriangle size={20} />
                </div>
                <h6 className="fw-bold mb-1" style={{ fontSize: '14px' }}>Supprimer la catégorie</h6>
                <p className="text-muted mb-3" style={{ fontSize: '12px' }}>
                  Êtes-vous sûr de vouloir supprimer <strong className="text-dark">{selectedCategoryForDelete.name}</strong> ?
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
                    onClick={() => setSelectedCategoryForDelete(null)}
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
