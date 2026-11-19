import React, { useEffect, useState } from "react";
import { Edit, Loader2, Package, Layers, Image as ImageIcon } from "lucide-react";
import { useUpdateProduct } from "../../hooks/products/useUpdateProduct";
import ImageUpload from "../../components/common/ImageUpload";
import { uploads } from "../../../shared/config/env";
import axiosInstance from "../../../shared/services/api/axiosInterceptor";

export default function ProductEdit({ item, isOpen, onClose, onSuccess }: any) {
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [description, setDescription] = useState("");
  const [domain_id, setDomain] = useState("");
  const [category_id, setCategory] = useState("");
  const [subcategory_id, setSubcategory] = useState("");
  const [brand_id, setBrand] = useState("");
  const [unit_id, setUnit] = useState("");
  const [is_active, setActive] = useState(true);
  const [image, setImage] = useState<any>("");
  const [existingImage, setexistingImage] = useState<any>("");

  const [domains, setDomains] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [error, setError] = useState("");

  const { updateProduct, submitting } = useUpdateProduct();

  // Pré-remplissage des champs avec les informations du produit sélectionné
  useEffect(() => {
    if (item && isOpen) {
      setName(item.name || "");
      setBarcode(item.barcode || "");
      setDescription(item.description || "");
      setDomain(item.domain_id || item.domain?.id || "");
      setCategory(item.category_id || item.category?.id || "");
      setSubcategory(item.subcategory_id || item.subcategory?.id || "");
      setBrand(item.brand_id || item.brand?.id || "");
      setUnit(item.unit_id || item.unit?.id || "");
      setActive(item.is_active ?? true);
      setexistingImage(uploads + "/" + item.image || "");
      setError("");
    }
  }, [item, isOpen]);

  // Chargement des listes déroulantes
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const [r1, r2, r3, r4, r5] = await Promise.all([
          axiosInstance.get("/domains", { params: { per_page: 100, is_active: true } }),
          axiosInstance.get("/categories", { params: { per_page: 100, is_active: true } }),
          axiosInstance.get("/subcategories", { params: { per_page: 100, is_active: true } }),
          axiosInstance.get("/brands", { params: { per_page: 100, is_active: true } }),
          axiosInstance.get("/units", { params: { per_page: 100, is_active: true } }),
        ]);
        const rows = (r: any) =>
          Array.isArray(r.data?.data) ? r.data.data : r.data?.data?.data || [];
        setDomains(rows(r1));
        setCategories(rows(r2));
        setSubcategories(rows(r3));
        setBrands(rows(r4));
        setUnits(rows(r5));
      } catch (e) {
        console.error(e);
      }
    })();
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const submit = async (e: any) => {
    e.preventDefault();
    const r = await updateProduct(item.id, {
      domain_id,
      category_id,
      subcategory_id: subcategory_id || null,
      brand_id: brand_id || null,
      unit_id,
      name,
      barcode: barcode || null,
      description: description || null,
      image,
      is_active,
    });
    if (r.success) {
      onSuccess();
      onClose();
    } else {
      setError(r.message);
    }
  };

  const handleImage = (base64: any, object: any) => {
    setImage(object);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(15, 23, 42, 0.6)" }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 position-relative rounded-3 overflow-hidden">
          <div></div>
          {/* Bouton fermeture */}
          <button
            type="button"
            onClick={onClose}
            className="
            position-absolute 
            rounded-circle btn-turquoise 
            d-flex align-items-center 
            justify-content-center shadow-sm,
            bg-primary
            "
            style={{
              top: "12px",
              right: "12px",
              width: "28px",
              height: "28px",
              zIndex: 1055,
              cursor: "pointer",
            }}
          >
            ✕
          </button>

          <div className="modal-header border-bottom bg-white py-3 px-4">
            <h5 className="modal-title text-dark d-flex align-items-center text-primary gap-2 m-0 fs-6 fw-normal">
              <div className="bg-primary-subtle p-2 rounded bg-light text-turquoise d-flex align-items-center justify-content-center">
                <Edit size={18} />
              </div>
              Modifier le Produit
            </h5>
          </div>

          <form onSubmit={submit}>
            <div className="modal-body p-4 bg-white fw-normal">
              {error && <div className="alert alert-danger py-2 mb-3 fs-7">{error}</div>}

              <div className="row g-4">
                {/* COLONNE GAUCHE : Informations primordiales */}
                <div className="col-lg-8 border-end pe-lg-4">
                  <div className="mb-3">
                    <span className="text-secondary d-flex align-items-center gap-1 mb-2 fs-7 fw-normal">
                      <Package size={14} /> Informations générales
                    </span>
                    <div className="row g-2">
                      <div className="col-md-8">
                        <fieldset className="custom-fieldset">
                          <legend>Nom du produit <span className="text-danger">*</span></legend>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="ex: Clavier Mécanique Sans Fil"
                            required
                          />
                        </fieldset>
                      </div>
                      <div className="col-md-4">
                        <fieldset className="custom-fieldset">
                          <legend>Unité <span className="text-danger">*</span></legend>
                          <select
                            value={unit_id}
                            onChange={(e) => setUnit(e.target.value)}
                            required
                          >
                            <option value="">Sélectionner</option>
                            {units.map((x) => (
                              <option key={x.id} value={x.id}>
                                {x.name}
                              </option>
                            ))}
                          </select>
                        </fieldset>
                      </div>
                    </div>
                  </div>

                  <div className="section-box mb-3">
                    <span className="text-secondary d-flex align-items-center gap-1 mb-2 fs-7 fw-normal">
                      <Layers size={14} /> Classification & Marque
                    </span>
                    <div className="row g-2">
                      <div className="col-md-4">
                        <fieldset className="custom-fieldset">
                          <legend>Domaine <span className="text-danger">*</span></legend>
                          <select
                            value={domain_id}
                            onChange={(e) => setDomain(e.target.value)}
                            required
                          >
                            <option value="">Sélectionner</option>
                            {domains.map((x) => (
                              <option key={x.id} value={x.id}>
                                {x.name}
                              </option>
                            ))}
                          </select>
                        </fieldset>
                      </div>

                      <div className="col-md-4">
                        <fieldset className="custom-fieldset">
                          <legend>Catégorie <span className="text-danger">*</span></legend>
                          <select
                            value={category_id}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                          >
                            <option value="">Sélectionner</option>
                            {categories
                              .filter((x) => !domain_id || x.domain_id === domain_id)
                              .map((x) => (
                                <option key={x.id} value={x.id}>
                                  {x.name}
                                </option>
                              ))}
                          </select>
                        </fieldset>
                      </div>

                      <div className="col-md-4">
                        <fieldset className="custom-fieldset">
                          <legend>Sous-catégorie</legend>
                          <select
                            value={subcategory_id}
                            onChange={(e) => setSubcategory(e.target.value)}
                          >
                            <option value="">Aucune</option>
                            {subcategories
                              .filter((x) => !category_id || x.category_id === category_id)
                              .map((x) => (
                                <option key={x.id} value={x.id}>
                                  {x.name}
                                </option>
                              ))}
                          </select>
                        </fieldset>
                      </div>

                      <div className="col-md-12">
                        <fieldset className="custom-fieldset mb-0">
                          <legend>Marque</legend>
                          <select
                            value={brand_id}
                            onChange={(e) => setBrand(e.target.value)}
                          >
                            <option value="">Aucune</option>
                            {brands.map((x) => (
                              <option key={x.id} value={x.id}>
                                {x.name}
                              </option>
                            ))}
                          </select>
                        </fieldset>
                      </div>
                    </div>
                  </div>

                  <fieldset className="custom-fieldset mb-0">
                    <legend>Description du produit</legend>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Détails du produit..."
                    />
                  </fieldset>
                </div>

                {/* COLONNE DROITE : Média, Statut & Identifiants */}
                <div className="col-lg-4 ps-lg-3">
                  <div className="mb-3">
                    <label className="text-secondary d-flex gap-1 mb-2 fs-7 fw-normal">
                      <ImageIcon size={14} /> Image du produit
                    </label>
                    <ImageUpload
                      onImage={handleImage}
                      defaultImage={existingImage}
                    />
                  </div>

                  <div className="section-box mb-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-dark fs-7 fw-normal">Statut du produit</span>
                      <div className="form-check form-switch m-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          checked={is_active}
                          onChange={(e) => setActive(e.target.checked)}
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                    </div>
                    <small className="text-muted d-block mt-1 fw-normal" style={{ fontSize: "0.7rem" }}>
                      {is_active ? "Produit visible et disponible à la vente." : "Produit désactivé."}
                    </small>
                  </div>

                  <div className="section-box">
                    <span className="text-secondary d-block mb-2 fs-7 fw-normal">Identification</span>
                    <fieldset className="custom-fieldset mb-0">
                      <legend>Code-barres</legend>
                      <input
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="EX: 789123456789"
                      />
                    </fieldset>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-top bg-light py-2 px-4">
              <button
                type="button"
                className="btn btn-outline-dark px-3 fw-normal"
                onClick={onClose}
                style={{ fontSize: "0.8rem" }}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary px-4 fw-normal d-flex align-items-center gap-1"
                disabled={submitting}
                style={{ fontSize: "0.8rem" }}
              >
                {submitting && <Loader2 size={14} className="spinner-border spinner-border-sm me-1" />}
                Mettre à jour
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}