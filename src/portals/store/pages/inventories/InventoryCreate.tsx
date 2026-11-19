import React, { useContext, useState } from "react";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { useCreateInventory } from "../../hooks/inventories/useCreateInventory";
import { useStocks } from "../../hooks/stocks/useStocks";
import { AppContext } from "../../../shared/context/AppContext";
import FormModal from "../../../shared/components/common/FormModal";

type InventoryLine = {
  id: string;
  stock_id: string;
  physical_quantity: string;
};

type InventoryCreateProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const createLine = (): InventoryLine => ({
  id: `${Date.now()}-${Math.random()}`,
  stock_id: "",
  physical_quantity: "",
});

export default function InventoryCreate({ isOpen, onClose, onSuccess }: InventoryCreateProps) {
  const { activeStore } = useContext(AppContext);
  const { stocks } = useStocks({ page: 1, per_page: 100, store_id: activeStore?.id || undefined, is_active: true });
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<InventoryLine[]>([createLine()]);
  const [error, setError] = useState("");
  const { createInventory, submitting } = useCreateInventory();

  if (!isOpen) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!activeStore?.id) {
      setError("Aucun magasin actif ne vous est assigné. Veuillez contacter un administrateur.");
      return;
    }
    if (items.length === 0 || items.some((item) => !item.stock_id || item.physical_quantity === "" || Number(item.physical_quantity) < 0)) {
      setError("Chaque ligne doit contenir un produit et une quantité physique positive ou nulle.");
      return;
    }

    const result = await createInventory({
      store_id: activeStore.id,
      reference: reference || null,
      reason: reason || null,
      items: items.map((item) => ({ stock_id: item.stock_id, physical_quantity: Number(item.physical_quantity) })),
    });
    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.message);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvel inventaire"
      icon={<Plus size={18} />}
      size="modal-xl"
      onSubmit={submit}
      submitting={submitting}
      submitLabel="Valider l'inventaire"
      error={error}
    >
      <div className="row g-4">
        <div className="col-lg-8 border-end pe-lg-4">
          <span className="text-secondary d-flex align-items-center gap-1 mb-2 fs-7 fw-normal">
            <ClipboardList size={14} /> Informations générales
          </span>
          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <fieldset className="custom-fieldset">
                <legend>Référence</legend>
                <input value={reference} onChange={(event) => setReference(event.target.value)} />
              </fieldset>
            </div>
            <div className="col-md-6">
              <fieldset className="custom-fieldset mb-0">
                <legend>Motif</legend>
                <input value={reason} onChange={(event) => setReason(event.target.value)} />
              </fieldset>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="text-secondary fs-7 fw-normal">Lignes d’inventaire</span>
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setItems((current) => [...current, createLine()])}>
              <Plus size={14} className="me-1" /> Ajouter une ligne
            </button>
          </div>
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th style={{ width: 135 }}>Stock théorique</th>
                  <th style={{ width: 150 }}>Quantité physique</th>
                  <th style={{ width: 44 }} />
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const stock = stocks.find((entry) => entry.id === item.stock_id);
                  const selectedElsewhere = items.filter((line) => line.id !== item.id).map((line) => line.stock_id);
                  return (
                    <tr key={item.id}>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={item.stock_id}
                          required
                          onChange={(event) => {
                            const selectedId = event.target.value;
                            const selected = stocks.find((entry) => entry.id === selectedId);
                            setItems((current) => current.map((line) => line.id === item.id ? {
                              ...line,
                              stock_id: selectedId,
                              physical_quantity: selected ? String(Number(selected.quantity || 0)) : "",
                            } : line));
                          }}
                        >
                          <option value="">Sélectionner un produit</option>
                          {stocks.filter((entry) => entry.product).map((entry) => (
                            <option key={entry.id} value={entry.id} disabled={selectedElsewhere.includes(entry.id)}>
                              {entry.product.name}{entry.product.sku ? ` — ${entry.product.sku}` : ""}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{stock ? Number(stock.quantity || 0).toLocaleString() : "—"}</td>
                      <td>
                        <input className="form-control form-control-sm" type="number" min="0" step="0.001" required value={item.physical_quantity} onChange={(event) => setItems((current) => current.map((line) => line.id === item.id ? { ...line, physical_quantity: event.target.value } : line))} />
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
        </div>
        <div className="col-lg-4 ps-lg-3">
          <div className="section-box">
            <span className="text-secondary d-block mb-2 fs-7 fw-normal">Comptage physique ({items.length})</span>
            <p className="small text-muted mb-0">Ajoutez une ligne par produit à compter. La quantité physique est préremplie avec le stock théorique ; ajustez-la après le comptage.</p>
          </div>
        </div>
      </div>
    </FormModal>
  );
}
