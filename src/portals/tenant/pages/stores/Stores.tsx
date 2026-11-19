import React, { useState } from 'react';
import { Edit, Eye, AlertTriangle, Plus, Store as StoreIcon, MapPin, Phone, Users, CheckCircle2, Trash2, Settings, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CardGridSkeleton } from '../../../shared/components/common/TableSkeleton';
import { Pagination } from '../../../shared/components/common/Pagination';
import { TableToolbar } from '../../../shared/components/common/TableToolbar';
import { useStores, type StoreSummary } from '../../hooks/stores/useStores';
import StoreEdit from './StoreEdit';
import StoreCreate from './StoreCreate';
import StoreShow from './StoreShow';

export default function Stores() {
  const navigate = useNavigate();
  const { stores, pagination, loading, error, params, setParams, reFetch } = useStores({
    page: 1,
    per_page: 6,
  });
  const [edit, setEdit] = useState<StoreSummary | null>(null);
  const [show, setShow] = useState<StoreSummary | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Fonction de suppression (à adapter selon votre service/hook)
  const handleDeleteStore = () => {
    if (window.confirm("Voulez-vous vraiment supprimer ce magasin ?")) {
      // Logic de suppression ici
    }
  };

  return (
    <div className="container-fluid p-3 p-md-4 min-vh-100" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Toolbar / Header */}
      <div className="d-flex align-items-center bg-light-subtle p-3 rounded-3 justify-content-between mb-4 gap-2 flex-wrap shadow-2xs">
        <div className="d-flex align-items-center gap-2">
          <h1 className="fw-bold text-dark mb-0 fs-5">Magasins</h1>
          <button type="button" className="btn btn-primary btn-sm d-flex align-items-center gap-1 px-3 shadow-2xs" onClick={() => setCreateOpen(true)}>
            <Plus size={15} /> Nouveau magasin
          </button>
        </div>
        <TableToolbar
          searchValue={params.search || ''}
          onSearchChange={(search) => setParams((current) => ({ ...current, search: search || undefined, page: 1 }))}
          searchPlaceholder="Rechercher un magasin..."
          statusValue={params.is_active === true ? 'true' : params.is_active === false ? 'false' : ''}
          onStatusChange={(status) => setParams((current) => ({
            ...current,
            is_active: status === '' ? undefined : status === 'true',
            page: 1,
          }))}
          perPage={params.per_page || 6}
          onPerPageChange={(perPage) => setParams((current) => ({ ...current, per_page: perPage, page: 1 }))}
        />
      </div>

      {error && (
        <div className="alert alert-danger border-0 shadow-2xs d-flex align-items-center gap-2 mb-3 py-2 px-3 rounded-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <CardGridSkeleton cards={6} />
      ) : stores.length === 0 ? (
        <div className="card border border-light shadow-2xs rounded-3 p-5 text-center text-muted bg-white">
          <StoreIcon size={40} className="mx-auto mb-2 text-secondary opacity-50" />
          <p className="mb-1 fw-semibold">Aucun magasin trouvé.</p>
          <p className="text-muted small mb-0">Essayez de modifier vos filtres ou créez un nouveau magasin.</p>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
          {stores.map((store) => {
            const isActive = store.is_active === true || store.is_active === 1;
            const usersCount = store.users_count ?? store.users?.length ?? 0;

            return (
              <div key={store.id} className="col">
                <div className="card border shadow-2xs rounded-3 p-3 h-100 bg-white d-flex flex-column">
                  
                  {/* En-tête de la carte */}
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="p-2 bg-primary-subtle text-primary rounded-2">
                        <StoreIcon size={18} />
                      </span>
                      <div>
                        <h6 className="fw-bold text-dark mb-0">{store.name}</h6>
                        {store.code && (
                          <div className="text-muted font-monospace" style={{ fontSize: '11px' }}>
                            {store.code}
                          </div>
                        )}
                        <span className={`badge ${isActive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} mt-1`} style={{ fontSize: '10px' }}>
                          {isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>

                    {/* Menu déroulant des actions (Dropdown Bootstrap) */}
                    <div className="dropdown">
                      <button
                        className="btn btn-light btn-sm border-0 text-secondary p-1 rounded-2 shadow-2xs d-flex align-items-center justify-content-center"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        style={{ width: '28px', height: '28px' }}
                        title="Actions"
                      >
                        <MoreVertical size={16} />
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 py-1" style={{ fontSize: '13px' }}>
                        <li>
                          <button 
                            className="dropdown-item d-flex align-items-center gap-2 py-1.5" 
                            onClick={() => setShow(store)}
                          >
                            <Eye size={14} className="text-secondary" /> Détails
                          </button>
                        </li>
                        <li>
                          <button 
                            className="dropdown-item d-flex align-items-center gap-2 py-1.5" 
                            onClick={() => setEdit(store)}
                          >
                            <Edit size={14} className="text-primary" /> Modifier
                          </button>
                        </li>
                        <li>
                          <button 
                            className="dropdown-item d-flex align-items-center gap-2 py-1.5" 
                            onClick={() => navigate(`/stores/${store.id}/settings`)}
                          >
                            <Settings size={14} className="text-info" /> Paramètres store
                          </button>
                        </li>
                        <li><hr className="dropdown-divider my-1" /></li>
                        <li>
                          <button 
                            className="dropdown-item d-flex align-items-center gap-2 py-1.5 text-danger" 
                            onClick={() => handleDeleteStore()}
                          >
                            <Trash2 size={14} /> Supprimer
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Description / Informations du magasin */}
                  <div className="text-muted small mb-3 flex-grow-1 d-flex flex-column gap-1 mt-1">
                    {store.address ? (
                      <div className="d-flex align-items-center gap-1.5 text-truncate">
                        <MapPin size={13} className="text-secondary flex-shrink-0 me-1" />
                        <span className="text-truncate">{store.address}</span>
                      </div>
                    ) : (
                      <p className="mb-0 text-muted italic opacity-75">Aucune adresse définie pour ce magasin.</p>
                    )}
                    {store.phone && (
                      <div className="d-flex align-items-center gap-1.5">
                        <Phone size={13} className="text-secondary flex-shrink-0 me-1" />
                        <span>{store.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-auto pt-2 border-top d-flex justify-content-between align-items-center text-muted small">
                    <span className="d-flex align-items-center gap-1">
                      <CheckCircle2 size={13} className={isActive ? "text-success" : "text-muted"} />
                      <strong>{isActive ? 'En service' : 'Hors service'}</strong>
                    </span>
                    <span className="d-flex align-items-center gap-1">
                      <Users size={13} />
                      {usersCount} utilisateur(s)
                    </span>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="mt-4">
        <Pagination meta={pagination} loading={loading} onPageChange={(page) => setParams((current) => ({ ...current, page }))} />
      </div>

      <StoreEdit item={edit} isOpen={!!edit} onClose={() => setEdit(null)} onSuccess={reFetch} />
      <StoreCreate isOpen={createOpen} onClose={() => setCreateOpen(false)} onSuccess={reFetch} />
      <StoreShow item={show} isOpen={!!show} onClose={() => setShow(null)} />
    </div>
  );
}