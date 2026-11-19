import { Loader } from '../../../shared/components/common/Loader';
import React, { useState, useContext } from 'react';
import { Clock, Plus, AlertCircle, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePOSSessions } from '../../hooks/pos/usePOSSessions';
import { AppContext } from '../../../shared/context/AppContext';
import POSSessionModal from './POSSessionModal';
import { Pagination } from '../../../shared/components/common/Pagination';

export default function POSSessions() {
  const navigate = useNavigate();
  const { activeStore, hasPermission } = useContext(AppContext);
  const canManagePosSession = hasPermission('pos.session_manage');
  const {
    sessions,
    activeSession,
    pagination,
    loading,
    error,
    params,
    setParams,
    openSession,
    closeSession,
    reFetch
  } = usePOSSessions({ page: 1, per_page: 5 });

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="container-fluid p-3 p-md-4 min-vh-100" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap">
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-light btn-sm border"
            onClick={() => navigate('/pos')}
            title="Retour à la caisse"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="fw-bold text-dark mb-0 fs-5">Sessions de Caisse</h1>
            <div className="text-muted small">Historique des ouvertures et clôtures de caisse</div>
          </div>
        </div>

        {canManagePosSession && (
          <div className="d-flex align-items-center gap-2">
            {activeSession && activeSession.status === 'open' ? (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                onClick={() => setIsModalOpen(true)}
              >
                <Lock size={14} /> Clôturer la caisse en cours
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus size={14} /> Ouvrir une session
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Sessions Table */}
      <div className="card border border-light shadow-2xs rounded-3 overflow-hidden bg-white">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr className="border-bottom border-light-subtle bg-light-subtle">
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>
                    Magasin
                  </th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>
                    Ouverture
                  </th>
                  <th className="py-2 text-muted fw-medium text-start" style={{ fontSize: '12px' }}>
                    Clôture
                  </th>
                  <th className="py-2 text-muted fw-medium text-end" style={{ fontSize: '12px' }}>
                    Fond initial
                  </th>
                  <th className="py-2 text-muted fw-medium text-end" style={{ fontSize: '12px' }}>
                    Total ventes
                  </th>
                  <th className="py-2 text-muted fw-medium text-end" style={{ fontSize: '12px' }}>
                    Montant final
                  </th>
                  <th className="py-2 text-muted fw-medium text-center" style={{ fontSize: '12px' }}>
                    Statut
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
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      <Clock size={32} className="mb-2 opacity-30" />
                      <div>Aucune session de caisse enregistrée.</div>
                    </td>
                  </tr>
                ) : (
                  sessions.map((session) => (
                    <tr key={session.id} className="border-bottom border-light">
                      <td className="py-3 text-start fw-medium text-dark">
                        {session.store_name || 'Boutique'}
                      </td>
                      <td className="py-3 text-start text-muted" style={{ fontSize: '12px' }}>
                        {new Date(session.opening_time).toLocaleString()}
                      </td>
                      <td className="py-3 text-start text-muted" style={{ fontSize: '12px' }}>
                        {session.closing_time ? new Date(session.closing_time).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 text-end fw-semibold text-dark">
                        {Number(session.opening_balance || 0).toLocaleString()} $
                      </td>
                      <td className="py-3 text-end fw-bold text-success">
                        +{Number(session.total_sales || 0).toLocaleString()} $
                      </td>
                      <td className="py-3 text-end fw-semibold text-dark">
                        {session.closing_balance != null ? `${Number(session.closing_balance).toLocaleString()} $` : 'En cours'}
                      </td>
                      <td className="py-3 text-center">
                        {session.status === 'open' ? (
                          <span className="badge bg-success-subtle text-success rounded-pill px-2 py-1">
                            <span className="spinner-grow spinner-grow-sm me-1" style={{ width: 6, height: 6 }} />
                            Ouverte
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary rounded-pill px-2 py-1">
                            <CheckCircle2 size={11} className="me-1" />
                            Clôturée
                          </span>
                        )}
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
            total={pagination.total || sessions.length}
            onPageChange={(page) => setParams((p: any) => ({ ...p, page }))}
          />
        </div>
      )}

      {canManagePosSession && (
        <POSSessionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          activeSession={activeSession}
          currentStoreId={activeStore?.id || ''}
          currentStoreName={activeStore?.name || 'Aucun magasin actif'}
          onOpenSession={openSession}
          onCloseSession={closeSession}
          onSuccess={() => {
            reFetch();
          }}
        />
      )}
    </div>
  );
}
