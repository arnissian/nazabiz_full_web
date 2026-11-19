import React, { useState } from 'react';
import { useLanguages } from '../../../shared/hooks/languages/useLanguages';
import { useDeleteLanguage } from '../../hooks/languages/useDeleteLanguage';
import type { Language } from '../../../shared/types/language';
import { LanguageCreate } from './LanguageCreate';
import { LanguageEdit } from './LanguageEdit';
import { LanguageShow } from './LanguageShow';

import {
  Eye, Edit, Trash2, Loader2, AlertTriangle,
  ArrowUpDown, MoreHorizontal, Globe
} from 'lucide-react';
import { Pagination } from '../../../shared/components/common/Pagination';
import { type ExportFormat, TableToolbar } from '../../../shared/components/common/TableToolbar';
import { TableSkeletonRows } from '../../../shared/components/common/TableSkeleton';

export default function Languages() {
  const {
    languages,
    pagination,
    loading,
    error,
    params,
    setParams,
    reFetch
  } = useLanguages({ page: 1, per_page: 5 });

  const { deleteLanguage, loading: deleting } = useDeleteLanguage();

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLanguageForEdit, setSelectedLanguageForEdit] = useState<Language | null>(null);
  const [selectedLanguageForShow, setSelectedLanguageForShow] = useState<Language | null>(null);
  const [selectedLanguageForDelete, setSelectedLanguageForDelete] = useState<Language | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!selectedLanguageForDelete) return;
    setDeleteErrorMessage(null);

    const res = await deleteLanguage(selectedLanguageForDelete.id);
    if (res) {
      setSelectedLanguageForDelete(null);
      reFetch();
    } else {
      setDeleteErrorMessage('Erreur lors de la suppression de la langue');
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
        <h1 className="fw-bold text-dark mb-0 fs-5 mb-1">Langues</h1>

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
                      Drapeau <ArrowUpDown size={11} className="text-muted opacity-60" />
                    </div>
                  </th>
                  
                  <th scope="col" className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>
                    <div className="d-flex align-items-center gap-1 user-select-none">
                      Code <ArrowUpDown size={11} className="text-muted opacity-60" />
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
                ) : languages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted" style={{ fontSize: '13px' }}>
                      Aucune langue trouvée.
                    </td>
                  </tr>
                ) : (
                  languages.map((language) => (
                    <tr key={language?.id} className="border-bottom border-light-subtle">
                      <td className="ps-3 py-2 fw-semibold text-dark text-start" style={{ fontSize: '13px' }}>
                        {language?.name}
                      </td>

                      <td className="py-2 text-start" style={{ fontSize: '20px' }}>
                        {language?.flag}
                      </td>

                      <td className="py-2 text-start" style={{ fontSize: '13px' }}>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-medium rounded-2 px-2 py-0.5" style={{ fontSize: '11px' }}>
                          {language?.code}
                        </span>
                      </td>

                      <td className="py-2 text-start">
                        {Boolean(language?.is_active) ? (
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
                            onClick={() => setSelectedLanguageForShow(language)}
                            title="Voir"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-light text-warning border-0 rounded-2 p-1"
                            onClick={() => setSelectedLanguageForEdit(language)}
                            title="Modifier"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-light text-danger border-0 rounded-2 p-1"
                            onClick={() => setSelectedLanguageForDelete(language)}
                            title="Supprimer"
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
        <LanguageCreate
          show={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            reFetch();
          }}
        />
      )}

      {/* Modal Modification */}
      {selectedLanguageForEdit && (
        <LanguageEdit
          show={!!selectedLanguageForEdit}
          language={selectedLanguageForEdit}
          onClose={() => setSelectedLanguageForEdit(null)}
          onSuccess={() => {
            setSelectedLanguageForEdit(null);
            reFetch();
          }}
        />
      )}

      {/* Modal Affichage */}
      {selectedLanguageForShow && (
        <LanguageShow
          show={!!selectedLanguageForShow}
          language={selectedLanguageForShow}
          onClose={() => setSelectedLanguageForShow(null)}
        />
      )}

      {/* Modal Suppression */}
      {selectedLanguageForDelete && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-3">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-semibold">Confirmer la suppression</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedLanguageForDelete(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-0 text-muted" style={{ fontSize: '14px' }}>
                  Êtes-vous sûr de vouloir supprimer la langue <strong>{selectedLanguageForDelete.name}</strong> ?
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
                  onClick={() => setSelectedLanguageForDelete(null)}
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
