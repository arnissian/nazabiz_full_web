import React, { useEffect, useState, type FormEvent } from "react";
import { Plus, Undo2 } from "lucide-react";
import { useCreatePurchaseReturn } from "../../hooks/purchase-returns/useCreatePurchaseReturn";
import { usePurchases, type Purchase } from "../../hooks/purchases/usePurchases";
import FormModal from "../../../shared/components/common/FormModal";
import { Loader } from "../../../shared/components/common/Loader";

interface PurchaseReturnCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ReturnablePurchaseItem {
  product_id: string | number;
  quantity: number | string;
  received_quantity: number | string;
  available_return_quantity: number | string;
  product?: { name?: string } | null;
}

interface ReturnablePurchase extends Record<string, unknown> {
  id: string | number;
  reference: string;
  supplier?: { name?: string } | null;
  items: ReturnablePurchaseItem[];
}

interface ReturnLine {
  product_id: string;
  quantity: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNumericValue(value: unknown): value is number | string {
  return (typeof value === "number" || (typeof value === "string" && value.trim() !== ""))
    && Number.isFinite(Number(value));
}

function isReturnablePurchase(purchase: Purchase): purchase is ReturnablePurchase {
  return (typeof purchase.id === "string" || typeof purchase.id === "number")
    && typeof purchase.reference === "string"
    && Array.isArray(purchase.items)
    && (purchase.supplier == null
      || (isRecord(purchase.supplier)
        && (purchase.supplier.name === undefined || typeof purchase.supplier.name === "string")))
    && purchase.items.every((item: unknown) =>
      isRecord(item)
      && (typeof item.product_id === "string" || typeof item.product_id === "number")
      && isNumericValue(item.quantity)
      && isNumericValue(item.received_quantity)
      && isNumericValue(item.available_return_quantity)
      && (item.product == null
        || (isRecord(item.product)
          && (item.product.name === undefined || typeof item.product.name === "string"))),
    );
}

export default function PurchaseReturnCreate({ isOpen, onClose, onSuccess }: PurchaseReturnCreateProps) {
  const { purchases: purchaseData, loading, error: purchasesError, reFetch } = usePurchases({
    page: 1,
    per_page: 100,
    returnable: true,
  });
  const purchases = purchaseData.filter(isReturnablePurchase);
  const hasInvalidPurchaseData = purchases.length !== purchaseData.length;
  const [purchase_id, setPurchase] = useState(""),
    [reason, setReason] = useState(""),
    [items, setItems] = useState<ReturnLine[]>([]),
    [error, setError] = useState("");
  const { createPurchaseReturn, submitting } = useCreatePurchaseReturn();
  const selected = purchases.find((purchase) => String(purchase.id) === purchase_id);

  useEffect(() => {
    if (isOpen) {
      void reFetch();
    }
  }, [isOpen, reFetch]);

  if (!isOpen) return null;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const returnItems = items
      .filter((item) => Number(item.quantity) > 0)
      .map((item) => ({ product_id: item.product_id, quantity: Number(item.quantity) }));

    if (!purchase_id || returnItems.length === 0) {
      setError("Sélectionnez un achat et indiquez au moins une quantité à retourner.");
      return;
    }

    const r = await createPurchaseReturn({
      purchase_id,
      reason: reason || null,
      items: returnItems,
    });
    if (r.success) {
      onSuccess();
      onClose();
    } else setError(r.message);
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouveau retour d'achat"
      icon={<Plus size={18} />}
      size="modal-lg"
      onSubmit={submit}
      submitting={submitting}
      submitLabel="Enregistrer le retour"
      error={error}
    >
      <span className="text-secondary d-flex align-items-center gap-1 mb-2 fs-7 fw-normal">
        <Undo2 size={14} /> Retour fournisseur
      </span>
      <fieldset className="custom-fieldset">
        <legend>
          Achat <span className="text-danger">*</span>
        </legend>
        <select
          value={purchase_id}
          onChange={(e) => {
            const id = e.target.value;
            const purchase = purchases.find((candidate) => String(candidate.id) === id);
            setPurchase(id);
            setItems((purchase?.items || []).map((line) => ({
              product_id: String(line.product_id),
              quantity: "0",
            })));
            setError("");
          }}
          required
          disabled={loading || purchases.length === 0}
        >
          <option value="">Sélectionner</option>
          {purchases.map((purchase) => (
            <option key={purchase.id} value={purchase.id}>
              {purchase.reference} — {purchase.supplier?.name || "Fournisseur"}
            </option>
          ))}
        </select>
      </fieldset>
      {loading ? (
        <Loader height="60px" />
      ) : purchasesError ? (
        <div className="alert alert-danger py-2">{purchasesError}</div>
      ) : hasInvalidPurchaseData ? (
        <div className="alert alert-danger py-2">
          Certaines données d'achat reçues sont incomplètes et ne peuvent pas être proposées au retour.
        </div>
      ) : purchases.length === 0 ? (
        <div className="alert alert-info py-2">
          Aucun achat ne contient de quantité réceptionnée encore disponible au retour.
          Réceptionnez d’abord les produits dans le module Achats.
        </div>
      ) : null}
      <fieldset className="custom-fieldset">
        <legend>Motif</legend>
        <input value={reason} onChange={(e) => setReason(e.target.value)} />
      </fieldset>

      <div className="section-box">
        <span className="text-secondary d-block mb-2 fs-7 fw-normal">Lignes du retour</span>
        {selected?.items.map((x, i) => (
          <div className="row g-2 mb-2" key={i}>
            <div className="col-8">
              <fieldset className="custom-fieldset mb-0">
                <legend>Produit</legend>
                <input value={x.product?.name || x.product_id} readOnly />
              </fieldset>
            </div>
            <div className="col-4">
              <fieldset className="custom-fieldset mb-0">
                <legend>Quantité</legend>
                <input
                  type="number"
                  min="0"
                  max={x.available_return_quantity}
                  step="0.001"
                  value={items[i]?.quantity ?? "0"}
                  onChange={(e) => {
                    setItems((current) => current.map((line, index) =>
                      index === i ? { ...line, quantity: e.target.value } : line,
                    ));
                  }}
                />
                <small className="text-muted">
                  Disponible : {x.available_return_quantity}
                </small>
              </fieldset>
            </div>
          </div>
        ))}
        {!selected && <div className="text-muted small">Les produits de l'achat apparaîtront après sélection.</div>}
      </div>
    </FormModal>
  );
}
