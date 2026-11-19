import { useState } from 'react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';
import { toast } from 'react-toastify';
import { AlertTriangle, Edit, Eye } from 'lucide-react';
import { Loader } from '../../../shared/components/common/Loader';
import { Pagination } from '../../../shared/components/common/Pagination';
import { TableActionButton } from '../../../shared/components/common/TableActionButton';
import { TableToolbar } from '../../../shared/components/common/TableToolbar';
import { usePurchases } from '../../hooks/purchases/usePurchases';
import PurchaseCreate from './PurchaseCreate';
import PurchaseEdit from './PurchaseEdit';
import PurchaseShow from './PurchaseShow';

const purchaseStatusLabel: Record<string, string> = {
  draft: 'Brouillon',
  completed: 'Confirmé',
  cancelled: 'Annulé',
};

const receiptStatusLabel: Record<string, string> = {
  pending: 'À réceptionner',
  partially_received: 'Partiellement reçu',
  completed: 'Réceptionné',
};

export default function Purchases() {
  const { purchases, pagination, loading, error, params, setParams, reFetch } =
    usePurchases({ page: 1, per_page: 5 });
  const [create, setCreate] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [show, setShow] = useState<any>(null);

  return (
    <div className="container-fluid p-3 p-md-4 min-vh-100" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="d-flex align-items-center bg-light-subtle p-2 rounded-2 justify-content-between mb-3 gap-2 flex-wrap">
        <h1 className="fw-bold text-dark mb-0 fs-5">Achats</h1>
        <TableToolbar
          searchValue={params.search || ''}
          onSearchChange={(query) => setParams((previous: any) => ({ ...previous, search: query || undefined, page: 1 }))}
          searchPlaceholder="Rechercher..."
          perPage={params.per_page || 5}
          onPerPageChange={(perPage) => setParams((previous: any) => ({ ...previous, per_page: perPage, page: 1 }))}
          onAddClick={() => setCreate(true)}
          addButtonLabel="Nouvel achat"
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
                  <th className="py-2 text-muted fw-medium">Référence</th>
                  <th className="py-2 text-muted fw-medium">Fournisseur</th>
                  <th className="py-2 text-muted fw-medium">Total</th>
                  <th className="py-2 text-muted fw-medium">Payé</th>
                  <th className="py-2 text-muted fw-medium">Reste</th>
                  <th className="py-2 text-muted fw-medium">Paiement</th>
                  <th className="py-2 text-muted fw-medium">Statut / réception</th>
                  <th className="text-end pe-3 py-2 text-muted fw-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-4"><Loader height="100px" /></td></tr>
                ) : purchases.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-4 text-muted">Aucun achat trouvé.</td></tr>
                ) : purchases.map((purchase: any) => (
                  <tr key={purchase.id} className="border-bottom border-light-subtle">
                    <td className="py-2">{purchase.reference || '—'}</td>
                    <td className="py-2">{purchase.supplier?.name || 'Fournisseur comptant'}</td>
                    <td className="py-2">{purchase.total ?? '—'}</td>
                    <td className="py-2">{purchase.paid_amount ?? '—'}</td>
                    <td className="py-2">{purchase.remaining_amount ?? '—'}</td>
                    <td className="py-2">{purchase.payment_status ?? '—'}</td>
                    <td className="py-2">
                      <div>{purchaseStatusLabel[purchase.status] || purchase.status || '—'}</div>
                      {purchase.status === 'completed' && purchase.receipt_status && (
                        <small className="text-muted">
                          {receiptStatusLabel[purchase.receipt_status] || purchase.receipt_status}
                        </small>
                      )}
                    </td>
                    <td className="text-end pe-3 py-2">
                      <div className="d-flex align-items-center justify-content-end gap-1">
                        <TableActionButton label="Détails et réception" icon={<Eye size={13} />} onClick={() => setShow(purchase)} />
                        {purchase.status !== 'cancelled' && (
                          <TableActionButton
                            label={purchase.status === 'draft' ? 'Modifier le brouillon' : "Modifier l'échéance"}
                            icon={<Edit size={13} />}
                            variant="primary"
                            onClick={() => setEdit(purchase)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            meta={pagination}
            loading={loading}
            onPageChange={(page) => setParams((previous: any) => ({ ...previous, page }))}
          />
        </div>
      </div>

      <PurchaseCreate isOpen={create} onClose={() => setCreate(false)} onSuccess={reFetch} />
      <PurchaseEdit
        item={edit}
        isOpen={!!edit}
        onClose={() => setEdit(null)}
        onSuccess={reFetch}
      />
      <PurchaseShow
        item={show}
        isOpen={!!show}
        onClose={() => setShow(null)}
        onReceived={() => {
          setShow(null);
          reFetch();
        }}
        onPaymentAdded={async () => {
          await reFetch();
          if (!show?.id) return;
          try {
            const response = await axiosInstance.get(`/purchases/${show.id}`);
            if (response.data?.data) setShow(response.data.data);
          } catch {
            toast.error('Paiement enregistré, mais le détail de l’achat n’a pas pu être actualisé.');
          }
        }}
        onEdit={(purchase: any) => {
          setShow(null);
          setEdit(purchase);
        }}
      />
    </div>
  );
}
