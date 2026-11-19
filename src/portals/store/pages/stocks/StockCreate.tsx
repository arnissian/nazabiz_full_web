import React, { useEffect, useState, useContext, useMemo } from "react";
import { Plus, Package, DollarSign, Store, Trash2, ArrowUpDown } from "lucide-react";
import { useCreateStock } from "../../hooks/stocks/useCreateStock";
import { useProducts } from "../../../shared/hooks/products/useProducts";
import { AppContext } from "../../../shared/context/AppContext";
import FormModal from "../../../shared/components/common/FormModal";

interface StockCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface StockItem {
  product_id: string;
  quantity: number;
  purchase_price: number;
  selling_price: number;
  minimum_stock: number;
  maximum_stock: number;
  is_active: boolean;
}

export default function StockCreate({ isOpen, onClose, onSuccess }: StockCreateProps) {
  const { activeStore } = useContext(AppContext);
  const { products } = useProducts({ page: 1, per_page: 100, is_active: true });
  
  const [items, setItems] = useState<StockItem[]>([{
    product_id: "",
    quantity: 0,
    purchase_price: 0,
    selling_price: 0,
    minimum_stock: 0,
    maximum_stock: 1000,
    is_active: true
  }]);
  const [movementType, setMovementType] = useState("purchase");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string>("");

  const { createStock, submitting } = useCreateStock();

  // Filtrer les produits
  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      const matchesSearch =
        !searchTerm ||
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode?.includes(searchTerm);
      return matchesSearch;
    });
  }, [products, searchTerm]);

  if (!isOpen) return null;

  const addItem = () => {
    setItems([...items, {
      product_id: "",
      quantity: 0,
      purchase_price: 0,
      selling_price: 0,
      minimum_stock: 0,
      maximum_stock: 1000,
      is_active: true
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, idx) => idx !== index));
    }
  };

  const updateItem = (index: number, field: keyof StockItem, value: any) => {
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
    if (!items.every((item) => item.product_id && Number(item.quantity) >= 0)) {
      setError("Veuillez remplir correctement toutes les lignes.");
      return;
    }

    // Créer chaque stock avec le type de mouvement
    for (const item of items) {
      const payload = {
        product_id: item.product_id,
        store_id: activeStore.id,
        quantity: Number(item.quantity),
        purchase_price: Number(item.purchase_price),
        selling_price: Number(item.selling_price),
        minimum_stock: Number(item.minimum_stock),
        maximum_stock: Number(item.maximum_stock),
        is_active: item.is_active,
        movement_type: movementType,
      };

      const res = await createStock(payload);

      if (!res.success) {
        setError(`Erreur pour le produit ${item.product_id}: ${res.message || "Une erreur est survenue."}`);
        return;
      }
    }

    setItems([{
      product_id: "",
      quantity: 0,
      purchase_price: 0,
      selling_price: 0,
      minimum_stock: 0,
      maximum_stock: 1000,
      is_active: true
    }]);
    onSuccess();
    onClose();
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouveaux Stocks"
      icon={<Plus size={18} />}
      onSubmit={submit}
      submitting={submitting}
      error={error}
    >
      <div className="row g-4">
        <div className="col-12">
          <div className="row g-2 mb-3">
            <div className="col-md-12">
              <fieldset className="custom-fieldset mb-0">
                <legend>Type de mouvement initial</legend>
                <select value={movementType} onChange={(e) => setMovementType(e.target.value)}>
                  <option value="purchase">Achat</option>
                  <option value="gift">Don</option>
                  <option value="donation">Donation</option>
                  <option value="transfer_in">Transfert entrant</option>
                  <option value="inventory">Inventaire</option>
                </select>
              </fieldset>
            </div>
          </div>

          <div className="section-box">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary fs-7 fw-normal">Lignes de stock ({items.length})</span>
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
            {items.map((item, index) => (
              <div key={index} className="card mb-2 p-3">
                <div className="row g-2 align-items-center mb-2">
                  <div className="col-8">
                    <fieldset className="custom-fieldset mb-0">
                      <legend>Produit</legend>
                      <select
                        value={item.product_id}
                        onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                        required
                      >
                        <option value="">Sélectionner un produit</option>
                        {filteredProducts.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {p.sku}
                          </option>
                        ))}
                      </select>
                    </fieldset>
                  </div>
                  <div className="col-3 d-flex align-items-center">
                    <span className="fw-semibold text-dark" style={{ fontSize: '12px' }}>
                      Ligne {index + 1}
                    </span>
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
                  <div className="col-md-2">
                    <fieldset className="custom-fieldset mb-0">
                      <legend>Qté</legend>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                        className="form-control form-control-sm"
                      />
                    </fieldset>
                  </div>
                  <div className="col-md-2">
                    <fieldset className="custom-fieldset mb-0">
                      <legend>Prix achat</legend>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={item.purchase_price}
                        onChange={(e) => updateItem(index, 'purchase_price', Number(e.target.value))}
                        className="form-control form-control-sm"
                      />
                    </fieldset>
                  </div>
                  <div className="col-md-2">
                    <fieldset className="custom-fieldset mb-0">
                      <legend>Prix vente</legend>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={item.selling_price}
                        onChange={(e) => updateItem(index, 'selling_price', Number(e.target.value))}
                        className="form-control form-control-sm"
                      />
                    </fieldset>
                  </div>
                  <div className="col-md-2">
                    <fieldset className="custom-fieldset mb-0">
                      <legend>Min</legend>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={item.minimum_stock}
                        onChange={(e) => updateItem(index, 'minimum_stock', Number(e.target.value))}
                        className="form-control form-control-sm"
                      />
                    </fieldset>
                  </div>
                  <div className="col-md-2">
                    <fieldset className="custom-fieldset mb-0">
                      <legend>Max</legend>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={item.maximum_stock}
                        onChange={(e) => updateItem(index, 'maximum_stock', Number(e.target.value))}
                        className="form-control form-control-sm"
                      />
                    </fieldset>
                  </div>
                  <div className="col-md-2 d-flex align-items-center">
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={item.is_active}
                        onChange={(e) => updateItem(index, 'is_active', e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                    </div>
                    <span className="ms-2" style={{ fontSize: '11px' }}>Actif</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FormModal>
  );
}
