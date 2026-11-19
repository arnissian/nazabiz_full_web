import React, { useState } from "react";
import {
  Trash2,
  Edit,
  Eye,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { TableToolbar } from "../../../shared/components/common/TableToolbar";
import { Pagination } from "../../../shared/components/common/Pagination";
import { TableActionButton } from "../../../shared/components/common/TableActionButton";
import { useProducts } from "../../../shared/hooks/products/useProducts";
import ProductCreate from "./ProductCreate";
import ProductEdit from "./ProductEdit";
import ProductShow from "./ProductShow";
import { useDeleteProduct } from "../../hooks/products/useDeleteProduct";
import {uploads } from '../../../shared/config/env';
import { TableSkeletonRows } from '../../../shared/components/common/TableSkeleton';
export default function Products() {
  const { products, pagination, loading, error, params, setParams, reFetch } =
    useProducts({ page: 1, per_page: 5 });
  const { deleteProduct, deleting } = useDeleteProduct();

  const [create, setCreate] = useState(false);
  const [showItem, setShowItem] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [del, setDel] = useState<any>(null);

  const confirmDelete = async () => {
    if (!del) return;
    const r = await deleteProduct(del.id);
    if (r.success) {
      setDel(null);
      reFetch();
    }
  };

  return (
    <div
      className="container-fluid p-3 p-md-4 min-vh-100"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className="d-flex align-items-center bg-light-subtle p-2 rounded-2 justify-content-between mb-3 gap-2 flex-wrap">
        <h1 className="fw-bold text-dark mb-0 fs-5">Produits</h1>
        <TableToolbar
          searchValue={params.search || ""}
          onSearchChange={(q) =>
            setParams((p: any) => ({ ...p, search: q || undefined, page: 1 }))
          }
          searchPlaceholder="Rechercher..."
          statusValue={
            params.is_active === true
              ? "true"
              : params.is_active === false
                ? "false"
                : ""
          }
          onStatusChange={(s) =>
            setParams((p: any) => ({
              ...p,
              is_active: s === "" ? undefined : s === "true",
              page: 1,
            }))
          }
          perPage={params.per_page || 5}
          onPerPageChange={(n) =>
            setParams((p: any) => ({ ...p, per_page: n, page: 1 }))
          }
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
                  <th
                    className="py-2 text-muted fw-medium text-start"
                    style={{ fontSize: "12px" }}
                  >
                    Nom
                  </th>
                  <th
                    className="py-2 text-muted fw-medium text-start"
                    style={{ fontSize: "12px" }}
                  >
                    Code-barres
                  </th>
                  <th
                    className="py-2 text-muted fw-medium text-start"
                    style={{ fontSize: "12px" }}
                  >
                    Statut
                  </th>
                  <th className="text-end pe-3 py-2 text-muted fw-medium">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonRows columns={4} />
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-muted">
                      Aucun élément trouvé.
                    </td>
                  </tr>
                ) : (
                  products.map((item: any) => (
                    <tr
                      key={item.id}
                      className="border-bottom border-light-subtle"
                    >
                      <td
                        className="py-2 text-start"
                        style={{ fontSize: "13px" }}
                      >

                                <span className="table-user">
  <img src={`${uploads}/${item?.image}`} className="me-2 rounded-2" />
</span>
                        {item.name ?? <span className="text-muted">—</span>}
                      </td>
                      <td
                        className="py-2 text-start"
                        style={{ fontSize: "13px" }}
                      >
                        {item.barcode ?? <span className="text-muted">—</span>}
                      </td>
                      <td
                        className="py-2 text-start"
                        style={{ fontSize: "13px" }}
                      >
                        {item.is_active ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            Actif
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                            Inactif
                          </span>
                        )}
                      </td>
                      <td className="text-end pe-3 py-2">
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <TableActionButton label="Voir" icon={<Eye size={13} />} onClick={() => setShowItem(item)} />
                          <TableActionButton label="Modifier" icon={<Edit size={13} />} variant="primary" onClick={() => setEditItem(item)} />
                          <TableActionButton label="Supprimer" icon={<Trash2 size={13} />} variant="danger" onClick={() => setDel(item)} />
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
            onPageChange={(p) => setParams((x: any) => ({ ...x, page: p }))}
          />
        </div>
      </div>

      <ProductCreate
        isOpen={create}
        onClose={() => setCreate(false)}
        onSuccess={reFetch}
      />

      <ProductShow
        item={showItem}
        isOpen={!!showItem}
        onClose={() => setShowItem(null)}
      />

      <ProductEdit
        item={editItem}
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onSuccess={reFetch}
      />

      {del && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow">
              <div className="modal-header">
                <h5 className="modal-title">Confirmer la suppression</h5>
                <button className="btn-close" onClick={() => setDel(null)} />
              </div>
              <div className="modal-body">
                Voulez-vous supprimer cet élément ?
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setDel(null)}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-danger"
                  disabled={deleting}
                  onClick={confirmDelete}
                >
                  {deleting && <Loader2 size={15} className="spinner-border spinner-border-sm me-1" />} Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}