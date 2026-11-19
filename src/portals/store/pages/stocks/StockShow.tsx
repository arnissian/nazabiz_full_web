import { Building2, CalendarDays, Hash, Layers, Package, Tag, User, X } from 'lucide-react';

interface StockShowProps {
  item: Record<string, any> | null;
  isOpen: boolean;
  onClose: () => void;
}

// Fonction utilitaire pour associer un label personnalisé et une icône selon la clé
const getFieldConfig = (key: string) => {
  switch (key) {
    case 'id':
      return { label: 'ID', icon: <Hash size={14} className="text-primary" /> };
    case 'product':
    case 'product_id':
      return { label: 'Produit', icon: <Package size={14} className="text-primary" /> };
    case 'store':
    case 'store_id':
      return { label: 'Magasin', icon: <Building2 size={14} className="text-primary" /> };
    case 'quantity':
      return { label: 'Quantité en stock', icon: <Layers size={14} className="text-primary" /> };
    case 'alert_quantity':
    case 'min_quantity':
      return { label: "Quantité d'alerte", icon: <Tag size={14} className="text-primary" /> };
    case 'created_at':
      return { label: "Date de création", icon: <CalendarDays size={14} className="text-primary" /> };
    case 'updated_at':
      return { label: 'Dernière mise à jour', icon: <CalendarDays size={14} className="text-primary" /> };
    case 'user':
    case 'user_id':
      return { label: 'Utilisateur', icon: <User size={14} className="text-primary" /> };
    default:
      // Transformation basique de la clé (ex: "unit_price" -> "Unit Price")
      const formatted = key.replace(/_/g, ' ');
      return {
        label: formatted.charAt(0).toUpperCase() + formatted.slice(1),
        icon: <Tag size={14} className="text-muted" />,
      };
  }
};

// Fonction pour formater l'affichage de la valeur (gère les objets imbriqués comme product.name ou store.name)
const formatValue = (value: any) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') {
    // Si c'est un objet (ex: product ou store), essaie d'afficher le nom ou la référence, sinon convertit en JSON propre
    return value.name || value.reference || value.title || JSON.stringify(value);
  }
  return String(value);
};

export default function StockShow({ item, isOpen, onClose }: StockShowProps) {
  if (!isOpen || !item) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 rounded-3 overflow-hidden">
          
          {/* Header */}
          <div className="modal-header border-bottom bg-white py-3 px-4">
            <h5 className="modal-title text-dark d-flex align-items-center gap-2 m-0 fs-6 fw-normal">
              <span className="bg-light text-primary p-2 rounded d-flex align-items-center justify-content-center">
                <Package size={16} />
              </span>
              Détails du Stock
              {item.reference || item.id ? (
                <span className="text-muted small ms-2">#{item.reference || item.id}</span>
              ) : null}
            </h5>
            <button
              type="button"
              onClick={onClose}
              className="btn-close shadow-none"
              aria-label="Fermer"
            ></button>
          </div>

          {/* Body personnalisé */}
          <div className="modal-body p-4 bg-light">
            <div className="bg-white p-3 rounded-3 shadow-2xs border">
              <div className="row g-3">
                {Object.entries(item).map(([k, v]) => {
                  const config = getFieldConfig(k);
                  return (
                    <div className="col-sm-6 col-lg-4" key={k}>
                      <div className="p-2 border rounded-3 bg-light h-100">
                        <div className="text-muted small fw-semibold mb-1 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                          {config.icon} {config.label}
                        </div>
                        <div className="fw-semibold text-dark text-truncate" title={formatValue(v)}>
                          {formatValue(v)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer border-top bg-white py-2 px-4">
            <button type="button" className="btn btn-outline-dark btn-sm px-3" onClick={onClose}>
              Fermer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}