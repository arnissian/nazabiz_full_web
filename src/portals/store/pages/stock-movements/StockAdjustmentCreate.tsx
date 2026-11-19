import React, { useState, useContext, useMemo } from "react";
import { Plus, AlertTriangle, Store, Trash2, Info } from "lucide-react";
import { useCreateStockMovement } from "../../hooks/stock-movements/useCreateStockMovement";
import { useStocks } from "../../hooks/stocks/useStocks";
import { AppContext } from "../../../shared/context/AppContext";
import FormModal from "../../../shared/components/common/FormModal";

interface StockAdjustmentCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AdjustmentItem {
  stock_id: string;
  new_quantity: number;
  reference: string;
  reason: string;
  customReason: string;
}

const ADJUSTMENT_REASONS = [
  "Produit défectueux",
  "Produit périmé",
  "Produit cassé",
  "Vol",
  "Perte",
  "Consommation interne",
  "Destruction",
  "Erreur de stock",
  "Échantillon",
  "Autre (à préciser)"
];

export default function StockAdjustmentCreate({ isOpen, onClose, onSuccess }: StockAdjustmentCreateProps) {
  const { activeStore } = useContext(AppContext);
  const { stocks } = useStocks({ page: 1, per_page: 100, is_active: true, store_id: activeStore?.id });
  
  const [items, setItems] = useState<AdjustmentItem[]>([{
    stock_id: "",
    new_quantity: 0,
    reference: "",
    reason: "",
    customReason: ""
  }]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string>("");

  const { createStockMovement, submitting } = useCreateStockMovement();

  // Filtrer les stocks
  const filteredStocks = useMemo(() => {
    return stocks.filter((s: any) => {
      const matchesSearch =
        !searchTerm ||
        s.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.product?.barcode?.includes(searchTerm);
      return matchesSearch;
    });
  }, [stocks, searchTerm]);

  if (!isOpen) return null;

  const addItem = () => {
    setItems([...items, {
      stock_id: "",
      new_quantity: 0,
      reference: "",
      reason: "",
      customReason: ""
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, idx) => idx !== index));
    }
  };

  const updateItem = (index: number, field: keyof AdjustmentItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!activeStore?.id) {
      setError("Aucun magasin actif ne vous est assigné. Veuillez contacter un administrateur.");
      return;
    }
    if (!items.every((item) => item.stock_id && Number(item.new_quantity) >= 0)) {
      setError("Veuillez remplir correctement toutes les lignes.");
      return;
    }
    if (!items.every((item) => {
      if (item.reason === "Autre (à préciser)") {
        return item.customReason && item.customReason.trim() !== "";
      }
      return item.reason && item.reason.trim() !== "";
    })) {
      setError("Veuillez sélectionner un motif pour chaque ligne, ou préciser le motif si 'Autre' est sélectionné.");
      return;
    }

    // Créer chaque mouvement d'ajustement
    for (const item of items) {
      const finalReason = item.reason === "Autre (à préciser)" 
        ? (item.customReason || "Autre") 
        : item.reason;

      const r = await createStockMovement({
        stock_id: item.stock_id,
        type: "adjustment",
        quantity: Number(item.new_quantity),
        reference: item.reference || null,
        reason: finalReason || null,
      });

      if (!r.success) {
        setError(`Erreur pour le stock ${item.stock_id}: ${r.message || "Une erreur est survenue."}`);
        return;
      }
    }

    setItems([{
      stock_id: "",
      new_quantity: 0,
      reference: "",
      reason: "",
      customReason: ""
    }]);
    onSuccess();
    onClose();
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajustement de Stock"
      icon={<AlertTriangle size={18} />}
      onSubmit={submit}
      submitting={submitting}
      error={error}
    >
      <div className="row g-4">
        <div className="col-12">
          <div className="alert alert-info fs-7 mb-3">
            <div className="d-flex align-items-start gap-2">
              <Info size={16} className="flex-shrink-0 mt-0-5" />
              <div>
                <strong>Comment fonctionne l'ajustement :</strong>
                <ul className="mb-0 mt-1 ps-3">
                  <li>La quantité saisie représente la <strong>nouvelle quantité physique</strong> du stock</li>
                  <li>Exemple : Si le stock actuel est 10 et que 3 produits sont défectueux, saisissez <strong>7</strong></li>
                  <li>Le système calculera automatiquement la différence et enregistrera le mouvement</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="section-box">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary fs-7 fw-normal">Lignes d'ajustement ({items.length})</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary fw-normal"
                style={{ fontSize: "0.75rem" }}
                onClick={addItem}
              >
                Ajouter une ligne
              </button>
            </div>
            <div className="mb-2">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Rechercher par nom, SKU ou code-barres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {items.map((item, index) => {
              const selectedStock = filteredStocks.find((s: any) => s.id === item.stock_id);
              const currentQuantity = selectedStock?.quantity || 0;
              const difference = Number(item.new_quantity) - currentQuantity;
              
              return (
                <div key={index} className="card mb-2 p-3">
                  <div className="row g-2 align-items-center mb-2">
                    <div className="col-6">
                      <fieldset className="custom-fieldset mb-0">
                        <legend>Stock</legend>
                        <select
                          value={item.stock_id}
                          onChange={(e) => updateItem(index, 'stock_id', e.target.value)}
                          required
                        >
                          <option value="">Sélectionner un stock</option>
                          {filteredStocks.map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {s.product?.name} — {s.product?.sku} (Actuel: {s.quantity})
                            </option>
                          ))}
                        </select>
                      </fieldset>
                    </div>
                    <div className="col-3">
                      <fieldset className="custom-fieldset mb-0">
                        <legend>Nouvelle quantité</legend>
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={item.new_quantity}
                          onChange={(e) => updateItem(index, 'new_quantity', Number(e.target.value))}
                          className="form-control form-control-sm"
                          required
                        />
                      </fieldset>
                    </div>
                    <div className="col-2 d-flex align-items-center justify-content-end">
                      {item.stock_id && (
                        <div className={`text-center small ${difference > 0 ? 'text-success' : difference < 0 ? 'text-danger' : 'text-muted'}`}>
                          {difference > 0 ? `+${difference}` : difference}
                        </div>
                      )}
                    </div>
                    <div className="col-1 d-flex justify-content-end">
                      {items.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-link text-danger p-0"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <fieldset className="custom-fieldset mb-0">
                        <legend>Référence</legend>
                        <input
                          type="text"
                          value={item.reference}
                          onChange={(e) => updateItem(index, 'reference', e.target.value)}
                          className="form-control form-control-sm"
                        />
                      </fieldset>
                    </div>
                    <div className="col-md-8">
                      <fieldset className="custom-fieldset mb-0">
                        <legend>Motif</legend>
                        <select
                          value={item.reason}
                          onChange={(e) => updateItem(index, 'reason', e.target.value)}
                          className="form-control form-control-sm"
                        >
                          <option value="">Sélectionner un motif</option>
                          {ADJUSTMENT_REASONS.map((reason) => (
                            <option key={reason} value={reason}>
                              {reason}
                            </option>
                          ))}
                        </select>
                        {item.reason === "Autre (à préciser)" && (
                          <input
                            type="text"
                            className="form-control form-control-sm mt-2"
                            placeholder="Précisez le motif..."
                            value={item.customReason}
                            onChange={(e) => updateItem(index, 'customReason', e.target.value)}
                          />
                        )}
                      </fieldset>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </FormModal>
  );
}
