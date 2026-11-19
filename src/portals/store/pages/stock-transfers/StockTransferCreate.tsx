import React, { useContext, useState } from "react";
import { ArrowLeftRight, Plus, Store, Trash2 } from "lucide-react";
import { useCreateStockTransfer } from "../../hooks/stock-transfers/useCreateStockTransfer";
import { useTransferDestinationStores } from "../../hooks/stock-transfers/useTransferDestinationStores";
import { useStocks } from "../../hooks/stocks/useStocks";
import { AppContext } from "../../../shared/context/AppContext";
import FormModal from "../../../shared/components/common/FormModal";

type TransferLine = {
  id: string;
  stock_id: string;
  quantity: string;
};

type StockTransferCreateProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const createLine = (): TransferLine => ({
  id: `${Date.now()}-${Math.random()}`,
  stock_id: "",
  quantity: "1",
});

export default function StockTransferCreate({ isOpen, onClose, onSuccess }: StockTransferCreateProps) {
  const { activeStore } = useContext(AppContext);
  const { stores, loading: storesLoading, error: storesError, reFetch: reloadStores } = useTransferDestinationStores();
  const { stocks } = useStocks({ page: 1, per_page: 100, store_id: activeStore?.id || undefined, is_active: true });
  const [destinationStoreId, setDestinationStoreId] = useState("");
  const [items, setItems] = useState<TransferLine[]>([createLine()]);
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const { createStockTransfer, submitting } = useCreateStockTransfer();

  if (!isOpen) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!activeStore?.id) {
      setError("Aucun magasin actif ne vous est assigné. Veuillez contacter un administrateur.");
      return;
    }
    if (!destinationStoreId) {
      setError("Veuillez sélectionner un magasin destination.");
      return;
    }
    if (!stores.some((store) => String(store.id) === destinationStoreId)) {
      setError("Le magasin de destination sélectionné n'est pas disponible.");
      return;
    }
    if (items.length === 0 || items.some((item) => !item.stock_id || Number(item.quantity) <= 0)) {
      setError("Chaque ligne doit contenir un produit et une quantité positive.");
      return;
    }
    for (const item of items) {
      const stock = stocks.find((entry) => entry.id === item.stock_id);
      const available = Number(stock?.quantity || 0) - Number(stock?.reserved_quantity || 0);
      if (Number(item.quantity) > available) {
        setError(`Stock insuffisant pour ${stock?.product?.name || "le produit sélectionné"}. Disponible : ${Math.max(0, available)}.`);
        return;
      }
    }

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const result = await createStockTransfer({
        source_store_id: activeStore.id,
        destination_store_id: destinationStoreId,
        source_stock_id: item.stock_id,
        quantity: Number(item.quantity),
        reference: reference || null,
        reason: reason || null,
      });
      if (!result.success) {
        if (index > 0) {
          setItems(items.slice(index));
          onSuccess();
          setError(`Le transfert a été partiellement exécuté (${index} ligne(s) transférée(s)). Les lignes restantes sont conservées pour éviter de transférer à nouveau les produits déjà traités. ${result.message}`);
        } else {
          setError(result.message);
        }
        return;
      }
    }

    onSuccess();
    onClose();
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouveau transfert"
      icon={<Plus size={18} />}
      size="modal-xl"
      onSubmit={submit}
      submitting={submitting}
      submitLabel="Transférer"
      error={error}
    >
      <div className="row g-4">
        <div className="col-lg-8 border-end pe-lg-4">
          <span className="text-secondary d-flex align-items-center gap-1 mb-2 fs-7 fw-normal">
            <ArrowLeftRight size={14} /> Transfert de stock
          </span>
          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <fieldset className="custom-fieldset">
                <legend>Magasin source (verrouillé)</legend>
                <div className="form-control bg-light d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Store size={14} className="text-primary" />
                    <span className="fw-semibold text-dark">{activeStore?.name || "Aucun magasin actif"}</span>
                  </div>
                  <span className="badge bg-success-subtle text-success py-1 px-2 rounded-pill">Affectation active</span>
                </div>
              </fieldset>
            </div>
            <div className="col-md-6">
              <fieldset className="custom-fieldset">
                <legend>Magasin destination <span className="text-danger">*</span></legend>
                {storesError ? (
                  <div className="text-danger small" role="alert">
                    {storesError}{' '}
                    <button type="button" className="btn btn-link btn-sm p-0" onClick={() => void reloadStores()}>
                      Réessayer
                    </button>
                  </div>
                ) : (
                  <select
                    value={destinationStoreId}
                    onChange={(event) => setDestinationStoreId(event.target.value)}
                    required
                    disabled={storesLoading}
                  >
                  <option value="">{storesLoading ? "Chargement des magasins…" : "Sélectionner"}</option>
                  {stores.filter((store) => String(store.id) !== String(activeStore?.id)).map((store) => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                  </select>
                )}
              </fieldset>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="text-secondary fs-7 fw-normal">Lignes de transfert</span>
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setItems((current) => [...current, createLine()])}>
              <Plus size={14} className="me-1" /> Ajouter une ligne
            </button>
          </div>
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th style={{ width: 140 }}>Disponible</th>
                  <th style={{ width: 150 }}>Quantité à transférer</th>
                  <th style={{ width: 44 }} />
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const stock = stocks.find((entry) => entry.id === item.stock_id);
                  const selectedElsewhere = items.filter((line) => line.id !== item.id).map((line) => line.stock_id);
                  const available = Math.max(0, Number(stock?.quantity || 0) - Number(stock?.reserved_quantity || 0));
                  return (
                    <tr key={item.id}>
                      <td>
                        <select className="form-select form-select-sm" value={item.stock_id} required onChange={(event) => setItems((current) => current.map((line) => line.id === item.id ? { ...line, stock_id: event.target.value } : line))}>
                          <option value="">Sélectionner un produit</option>
                          {stocks.filter((entry) => entry.product).map((entry) => {
                            const entryAvailable = Number(entry.quantity || 0) - Number(entry.reserved_quantity || 0);
                            return (
                              <option key={entry.id} value={entry.id} disabled={selectedElsewhere.includes(entry.id) || entryAvailable <= 0}>
                                {entry.product.name}{entry.product.sku ? ` — ${entry.product.sku}` : ""}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td>{stock ? available.toLocaleString() : "—"}</td>
                      <td>
                        <input className="form-control form-control-sm" type="number" min="0.001" max={available || undefined} step="0.001" required value={item.quantity} onChange={(event) => setItems((current) => current.map((line) => line.id === item.id ? { ...line, quantity: event.target.value } : line))} />
                      </td>
                      <td>
                        <button type="button" className="btn btn-link text-danger p-1" aria-label={`Supprimer la ligne ${index + 1}`} onClick={() => setItems((current) => current.filter((line) => line.id !== item.id))}>
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {items.length > 1 && <small className="text-muted">Les lignes sont transférées l’une après l’autre. Si une opération échoue après les précédentes, le message indiquera le nombre de lignes déjà transférées.</small>}
        </div>

        <div className="col-lg-4 ps-lg-3">
          <div className="section-box">
            <fieldset className="custom-fieldset">
              <legend>Référence</legend>
              <input value={reference} onChange={(event) => setReference(event.target.value)} />
            </fieldset>
            <fieldset className="custom-fieldset mb-0">
              <legend>Motif</legend>
              <input value={reason} onChange={(event) => setReason(event.target.value)} />
            </fieldset>
          </div>
        </div>
      </div>
    </FormModal>
  );
}
