import React, { useEffect, useState } from 'react';
import { Pause, Play, Trash2, X, ShoppingCart, Clock } from 'lucide-react';
import type { HeldSale } from '../../hooks/pos/useHeldSales';

interface HeldSalesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  heldSales: HeldSale[];
  onResume: (sale: HeldSale) => void;
  onDelete: (id: string) => void;
  formatCurrency: (amount: number) => string;
}

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `il y a ${diffInSeconds} sec`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `il y a ${diffInMinutes} min`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `il y a ${diffInHours} h`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `il y a ${diffInDays} j`;
};

const HeldSalesDrawer: React.FC<HeldSalesDrawerProps> = ({ isOpen, onClose, heldSales, onResume, onDelete, formatCurrency }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => setTick(t => t + 1), 60000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="offcanvas-backdrop fade show" 
        style={{ zIndex: 1044 }} 
        onClick={onClose}
      />
      <div 
        className="offcanvas offcanvas-end show shadow-lg" 
        tabIndex={-1} 
        style={{ zIndex: 1045, width: '400px', transition: 'transform 0.3s ease-in-out' }}
      >
        <div className="offcanvas-header bg-light border-bottom">
          <h5 className="offcanvas-title d-flex align-items-center">
            <Pause className="me-2 text-warning" size={24} />
            Ventes en attente
            <span className="badge bg-warning text-dark ms-2 rounded-pill">{heldSales.length}</span>
          </h5>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
        </div>
        
        <div className="offcanvas-body p-0">
          {heldSales.length === 0 ? (
            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted p-4 text-center">
              <ShoppingCart size={48} className="mb-3 opacity-50" />
              <p>Aucune vente en attente</p>
            </div>
          ) : (
            <ul className="list-group list-group-flush">
              {heldSales.map((sale) => (
                <li key={sale.id} className="list-group-item p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="mb-1 text-primary">{sale.label || 'Sans étiquette'}</h6>
                      {sale.customer && (
                        <small className="text-muted d-block mb-1">
                          Client: {sale.customer.name}
                        </small>
                      )}
                    </div>
                    <h5 className="mb-0 text-success fw-bold">
                      {formatCurrency(sale.total)}
                    </h5>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="badge bg-light text-dark border d-flex align-items-center">
                      <ShoppingCart size={12} className="me-1" />
                      {sale.cart.length} article(s)
                    </span>
                    <small className="text-muted d-flex align-items-center">
                      <Clock size={12} className="me-1" />
                      {formatRelativeTime(sale.heldAt)}
                    </small>
                  </div>
                  
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-outline-primary btn-sm flex-grow-1 d-flex align-items-center justify-content-center"
                      onClick={() => {
                        onResume(sale);
                        onClose();
                      }}
                    >
                      <Play size={16} className="me-1" /> Reprendre
                    </button>
                    <button 
                      className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center"
                      onClick={() => onDelete(sale.id)}
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default HeldSalesDrawer;
