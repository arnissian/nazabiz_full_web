import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search, ShoppingCart, Trash2, Plus, Minus, CreditCard,
  Banknote, Smartphone, Check, AlertCircle, RefreshCw,
  Clock, Store, User, Layers, Receipt, X, UserPlus, Pause, Moon, Sun
} from 'lucide-react';
import { useStocks } from '../../hooks/stocks/useStocks';
import { useCategories } from '../../../shared/hooks/categories/useCategories';
import { useCustomers } from '../../hooks/customers/useCustomers';
import { usePOSSessions } from '../../hooks/pos/usePOSSessions';
import { usePOSSale } from '../../hooks/pos/usePOSSale';
import { useStoreCurrencyConverter } from '../../hooks/currency/useStoreCurrencyConverter';
import type { POSCartItem } from '../../types/pos';
import POSReceiptModal from './POSReceiptModal';
import POSSessionModal from './POSSessionModal';
import QuickCustomerModal from './QuickCustomerModal';
import SplitPaymentModal from './SplitPaymentModal';
import HeldSalesDrawer from './HeldSalesDrawer';
import { useHeldSales } from '../../hooks/pos/useHeldSales';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../../shared/context/AppContext';
import { Loader } from '../../../shared/components/common/Loader';

export default function POS() {
  const navigate = useNavigate();
  const { activeStore, hasPermission } = React.useContext(AppContext);
  const canApplyDiscount = hasPermission('pos.discount');
  const canManagePosSession = hasPermission('pos.session_manage');
  const currentStoreId = activeStore?.id || '';

  const { stocks, loading: loadingStocks, reFetch: reFetchStocks } = useStocks({
    page: 1,
    per_page: 200,
    store_id: currentStoreId || undefined,
    is_active: true
  });

  const { categories } = useCategories({ page: 1, per_page: 100, is_active: true });
  const { customers } = useCustomers({ page: 1, per_page: 100, is_active: true });
  const {
    activeSession,
    openSession,
    closeSession,
    reFetch: reFetchSessions
  } = usePOSSessions();

  const { processPOSSale, submitting: processingSale } = usePOSSale();
  const { formatFromUSD } = useStoreCurrencyConverter();
  const { heldSales, holdSale, deleteSale, count: heldCount } = useHeldSales();

  // POS State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);

  // Modals
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isQuickCustomerModalOpen, setIsQuickCustomerModalOpen] = useState(false);
  const [quickCustomer, setQuickCustomer] = useState<{ id: string; name: string; phone: string } | null>(null);

  const [isHeldSalesOpen, setIsHeldSalesOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('pos-dark-mode') === 'true');
  const searchInputRef = useRef<HTMLInputElement>(null);


  // Filter stocks
  const filteredStocks = useMemo(() => {
    return stocks.filter((s: any) => {
      const product = s.product;
      if (!product) return false;

      const matchesSearch =
        !searchTerm ||
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.includes(searchTerm);
      const matchesCategory =
        !selectedCategoryId || product.category_id === selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [stocks, searchTerm, selectedCategoryId]);

  // Cart operations
  const addToCart = (stock: any) => {
    const existing = cart.find((item) => item.stock_id === stock.id);
    const unitPrice = Number(stock.selling_price || 0);
    const product = stock.product;
    const availableStock = Number(stock.quantity || 0);

    if (existing) {
      const newQuantity = existing.quantity + 1;
      if (newQuantity > availableStock) {
        alert(`Stock insuffisant ! Disponible : ${availableStock}`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.stock_id === stock.id
            ? {
                ...item,
                quantity: newQuantity,
                total: newQuantity * item.price - item.discount
              }
            : item
        )
      );
    } else {
      if (availableStock < 1) {
        alert('Stock épuisé !');
        return;
      }
      setCart([
        ...cart,
        {
          id: 'item_' + Date.now() + '_' + stock.id,
          stock_id: stock.id,
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          price: unitPrice,
          quantity: 1,
          discount: 0,
          total: unitPrice,
          unit_name: product.unit?.name || 'Pce',
          stock: availableStock
        }
      ]);
    }
  };

  const updateQuantity = (stockId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(stockId);
      return;
    }
    const item = cart.find((item) => item.stock_id === stockId);
    if (item && qty > item.stock) {
      alert(`Stock insuffisant ! Disponible : ${item.stock}`);
      return;
    }
    setCart(
      cart.map((item) =>
        item.stock_id === stockId
          ? {
              ...item,
              quantity: qty,
              total: qty * item.price - item.discount
            }
          : item
      )
    );
  };

  const removeFromCart = (stockId: string) => {
    setCart(cart.filter((item) => item.stock_id !== stockId));
  };

  const clearCart = () => {
    setCart([]);
    setGlobalDiscount(0);
    setQuickCustomer(null);
    setSelectedCustomerId('');
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  }, [cart]);

  const totalDiscount = useMemo(() => {
    if (!canApplyDiscount) return 0;
    const itemDiscounts = cart.reduce((sum, item) => sum + item.discount, 0);
    return itemDiscounts + (Number(globalDiscount) || 0);
  }, [cart, globalDiscount, canApplyDiscount]);

  const taxAmount = useMemo(() => {
    const taxable = Math.max(0, subtotal - totalDiscount);
    return (taxable * (Number(taxRate) || 0)) / 100;
  }, [subtotal, totalDiscount, taxRate]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - totalDiscount + taxAmount);
  }, [subtotal, totalDiscount, taxAmount]);

  const currentCustomer = customers.find((c: any) => c.id === selectedCustomerId);

  // --- Ventes en attente (Hold / Park) ---
  const holdCurrentSale = () => {
    if (cart.length === 0) return;
    holdSale({
      cart,
      customer: quickCustomer,
      selectedCustomerId,
      globalDiscount,
      taxRate,
      total: grandTotal,
      label: quickCustomer?.name || currentCustomer?.name || `Ticket ${heldCount + 1}`,
    });
    clearCart();
  };

  const resumeHeldSale = (sale: any) => {
    if (cart.length > 0) {
      holdCurrentSale();
    }
    setCart(sale.cart);
    setQuickCustomer(sale.customer);
    setSelectedCustomerId(sale.selectedCustomerId || '');
    setGlobalDiscount(sale.globalDiscount || 0);
    setTaxRate(sale.taxRate || 0);
    setIsHeldSalesOpen(false);
  };

  // --- Raccourcis clavier ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if (e.key === 'Escape') (e.target as HTMLInputElement).blur();
        return;
      }
      switch (e.key) {
        case 'F2': e.preventDefault(); searchInputRef.current?.focus(); break;
        case 'F4': e.preventDefault(); setIsQuickCustomerModalOpen(true); break;
        case 'F8': e.preventDefault(); openPaymentModal(); break;
        case 'F9': e.preventDefault(); holdCurrentSale(); break;
        case 'Escape':
          e.preventDefault();
          setIsPaymentModalOpen(false);
          setIsQuickCustomerModalOpen(false);
          setIsSessionModalOpen(false);
          setIsHeldSalesOpen(false);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // --- Dark mode persistence ---
  useEffect(() => {
    localStorage.setItem('pos-dark-mode', isDarkMode.toString());
  }, [isDarkMode]);

  const openPaymentModal = () => {
    if (cart.length === 0) return;
    setIsPaymentModalOpen(true);
  };

  const handleValidateSale = async (payments: Array<{ payment_method: string; amount: number; reference?: string }>) => {
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    const res = await processPOSSale({
      store_id: currentStoreId,
      customer_id: quickCustomer?.id || selectedCustomerId || null,
      items: cart.map((i) => ({
        stock_id: i.stock_id,
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.price,
        discount: i.discount
      })),
      payments,
      discount: totalDiscount,
      tax: taxAmount,
      notes: 'Vente directe caisse'
    });

    if (res.success || !res.errors) {
      const changeDue = Math.max(0, totalPaid - grandTotal);
      const mainMethod = payments[0]?.payment_method || 'cash';
      setReceiptData({
        receiptNumber: res.data?.reference || ('REC-' + Date.now().toString().slice(-6)),
        date: new Date().toISOString(),
        storeName: activeStore?.name || 'Boutique Principale',
        customerName: quickCustomer?.name || currentCustomer?.name || 'Client Comptant',
        customerPhone: quickCustomer?.phone || currentCustomer?.phone || null,
        items: cart.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          total: i.total
        })),
        subtotal,
        discount: totalDiscount,
        tax: taxAmount,
        total: grandTotal,
        paid: totalPaid,
        change: changeDue,
        paymentMethod: payments.length > 1
          ? `Mixte (${payments.length} modes)`
          : mainMethod === 'cash' ? 'Espèces'
          : mainMethod === 'card' ? 'Carte Bancaire'
          : mainMethod === 'mobile_money' ? 'Mobile Money'
          : 'Virement'
      });

      if (activeSession) {
        activeSession.total_sales = (activeSession.total_sales || 0) + grandTotal;
        const cashTotal = payments.filter(p => p.payment_method === 'cash').reduce((s, p) => s + p.amount, 0);
        if (cashTotal > 0) {
          activeSession.cash_sales = (activeSession.cash_sales || 0) + cashTotal;
        }
      }

      setIsPaymentModalOpen(false);
      clearCart();
      reFetchStocks();
    }
    return res;
  };

  return (
    <div className={`container-fluid p-2 p-md-3 min-vh-100 ${isDarkMode ? 'bg-dark text-light' : 'bg-light'}`} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Top POS Navigation Bar */}
      <div className="card shadow-xs rounded-3 mb-3 bg-white">
        <div className="card-body p-2 p-md-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary-subtle text-primary p-2 rounded-3">
                <ShoppingCart size={20} />
              </span>
              <div>
                <h5 className="fw-bold mb-0 text-dark fs-6">Point de Vente (POS)</h5>
                <div className="d-flex align-items-center gap-2 text-muted small">
                  <Store size={13} className="text-primary" />
                  <span className="fw-semibold text-dark">{activeStore?.name || "Aucun magasin affecté"}</span>
                  <span className="badge bg-success-subtle text-success py-0 px-2 rounded-pill" style={{ fontSize: 10 }}>Affectation active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Session status */}
            {activeSession && activeSession.status === 'open' ? (
              <div className="d-flex align-items-center gap-2 bg-success-subtle text-success px-3 py-1 rounded-pill small fw-medium">
                <span className="spinner-grow spinner-grow-sm text-success" role="status" style={{ width: 8, height: 8 }} />
                <span>Caisse ouverte ({formatFromUSD(activeSession.total_sales || 0)})</span>
                {canManagePosSession && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger py-0 px-2 ms-1 rounded-pill"
                    style={{ fontSize: '11px' }}
                    onClick={() => setIsSessionModalOpen(true)}
                  >
                    Clôturer
                  </button>
                )}
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2 bg-warning-subtle text-warning px-3 py-1 rounded-pill small fw-medium">
                <AlertCircle size={14} />
                <span>Caisse fermée</span>
                {canManagePosSession && (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary py-0 px-2 ms-1 rounded-pill"
                    style={{ fontSize: '11px' }}
                    onClick={() => setIsSessionModalOpen(true)}
                  >
                    Ouvrir la caisse
                  </button>
                )}
              </div>
            )}

            {/* Ventes en attente */}
            <button
              type="button"
              className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1 position-relative"
              onClick={() => setIsHeldSalesOpen(true)}
              title="Ventes en attente (F9 pour mettre en attente)"
            >
              <Pause size={14} /> En attente
              {heldCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark" style={{ fontSize: '10px' }}>
                  {heldCount}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              className={`btn btn-sm d-flex align-items-center gap-1 ${isDarkMode ? 'btn-light' : 'btn-outline-secondary'}`}
              onClick={() => setIsDarkMode(!isDarkMode)}
              title="Mode sombre"
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
              onClick={() => navigate('/pos/sessions')}
              title="Historique des sessions"
            >
              <Clock size={14} /> Sessions
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Products Catalog on Left, Cart on Right */}
      <div className="row g-3">
        {/* Left Column: Product Search, Categories & Catalog */}
        <div className="col-lg-7 col-xl-8">
          <div className="card shadow-xs rounded-3 h-100 bg-white d-flex flex-column">
            {/* Search & Category Header */}
            <div className="card-header bg-white border-bottom p-3">
              <div className="row g-2 align-items-center">
                <div className="col-md-7">
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <Search size={16} />
                    </span>
                    <input
                      ref={searchInputRef}
                      type="text"
                      className="form-control bg-light border-start-0 ps-0"
                      placeholder="Scanner code-barre, SKU ou chercher un produit... (F2)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchTerm.trim()) {
                          const matches = filteredStocks.filter((s: any) => {
                            const p = s.product;
                            return p?.barcode === searchTerm.trim() || p?.sku === searchTerm.trim();
                          });
                          if (matches.length === 1) {
                            addToCart(matches[0]);
                            setSearchTerm('');
                          }
                        }
                      }}
                    />
                    {searchTerm && (
                      <button className="btn btn-light border" onClick={() => setSearchTerm('')}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-md-5 d-flex justify-content-end">
                  <button
                    className="btn btn-light btn-sm text-muted d-flex align-items-center gap-1"
                    onClick={() => reFetchStocks()}
                    title="Actualiser le stock"
                  >
                    <RefreshCw size={13} /> Actualiser
                  </button>
                </div>
              </div>

              {/* Category Pills */}
              <div className="d-flex align-items-center gap-2 overflow-auto pt-2 pb-1 scrollbar-none">
                <button
                  type="button"
                  className={`btn btn-sm text-nowrap rounded-pill ${
                    selectedCategoryId === '' ? 'btn-primary' : 'btn-light text-secondary'
                  }`}
                  onClick={() => setSelectedCategoryId('')}
                  style={{ fontSize: '12px' }}
                >
                  Tous les articles ({stocks.length})
                </button>
                {categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`btn btn-sm text-nowrap rounded-pill ${
                      selectedCategoryId === cat.id ? 'btn-primary' : 'btn-light text-secondary'
                    }`}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    style={{ fontSize: '12px' }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock Cards Grid */}
            <div className="card-body p-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
              {loadingStocks ? (
              <Loader />
              ) : filteredStocks.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <Layers size={36} className="mb-2 opacity-50" />
                  <p className="mb-0">Aucun stock trouvé pour ce magasin.</p>
                  <div className="mt-2">
                    <small className="text-muted">
                      Total stocks: {stocks.length} | Magasin actif: {activeStore?.name || 'Non défini'} | ID: {currentStoreId || 'Non défini'}
                    </small>
                  </div>
                </div>
              ) : (
                <div className="row row-cols-2 row-cols-sm-3 row-cols-md-3 row-cols-xl-4 g-2">
                  {filteredStocks.map((s: any) => {
                    const product = s.product;
                    if (!product) return null;

                    const price = Number(s.selling_price || 0);
                    const stock = Number(s.quantity || 0);
                    const isOutOfStock = stock <= 0;

                    return (
                      <div key={s.id} className="col">
                        <div
                          className={`card h-100 border shadow-2xs rounded-3 p-2 text-start position-relative transition-all cursor-pointer ${
                            isOutOfStock ? 'opacity-50 bg-light' : 'hover-shadow bg-white'
                          }`}
                          onClick={() => !isOutOfStock && addToCart(s)}
                          style={{ userSelect: 'none' }}
                        >
                       

                          <div className="fw-semibold text-dark text-truncate" style={{ fontSize: '13px' }} title={product.name}>
                            {product.name}
                          </div>

                         
                          <div className="mt-auto d-flex justify-content-between align-items-center pt-1 border-top border-light">
                            <span className="fw-bold text-primary fs-6">{formatFromUSD(price)} / {product.unit?.name} </span>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center"
                              style={{ width: 20, height: 20 }}
                              disabled={isOutOfStock}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isOutOfStock) addToCart(s);
                              }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Cart & Checkout */}
        <div className="col-lg-5 col-xl-4">
          <div className="card shadow-xs rounded-3 h-100 bg-white d-flex flex-column">
            {/* Cart Header */}
            <div className="card-header bg-white border-bottom p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center gap-2">
                  <Receipt size={18} className="text-primary" />
                  <span className="fw-bold text-dark fs-6">Ticket en cours</span>
                  <span className="badge bg-primary rounded-pill">{cart.length}</span>
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm py-0 px-2 d-flex align-items-center gap-1"
                    style={{ fontSize: '11px' }}
                    onClick={clearCart}
                  >
                    <Trash2 size={12} /> Vider
                  </button>
                )}
              </div>

              {/* Customer Selector — Enregistrement rapide ou sélection */}
              <div className="d-flex align-items-center gap-2">
                <div className="flex-grow-1 d-flex align-items-center gap-2 bg-light p-1 rounded-2">
                  <User size={14} className="text-muted ms-2" />
                  {quickCustomer ? (
                    <div className="d-flex align-items-center justify-content-between w-100 ps-1 pe-2">
                      <span className="fw-medium small text-dark">
                        {quickCustomer.name} ({quickCustomer.phone})
                      </span>
                      <button
                        type="button"
                        className="btn btn-link text-danger p-0 border-0"
                        onClick={() => {
                          setQuickCustomer(null);
                          setSelectedCustomerId('');
                        }}
                        title="Retirer le client"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <select
                      className="form-select form-select-sm border-0 bg-transparent fw-medium"
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                    >
                      <option value="">Client de passage (Comptant)</option>
                      {customers.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm d-flex align-items-center gap-1 rounded-2 text-nowrap"
                  onClick={() => setIsQuickCustomerModalOpen(true)}
                  title="Enregistrement rapide d'un client"
                >
                  <UserPlus size={14} /> Nouveau
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="card-body p-2 overflow-y-auto flex-grow-1" style={{ minHeight: '260px', maxHeight: '380px' }}>
              {cart.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <ShoppingCart size={32} className="mb-2 opacity-30" />
                  <p className="small mb-0">Le panier est vide.</p>
                  <span style={{ fontSize: '11px' }}>Cliquez sur les produits pour les ajouter.</span>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {cart.map((item) => (
                    <div key={item.product_id} className="p-2 rounded-2 border bg-light-subtle d-flex align-items-center justify-content-between gap-2">
                      <div className="flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>
                        <div className="fw-semibold text-dark text-truncate" style={{ fontSize: '12px' }}>
                          {item.name}
                        </div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>
                          {formatFromUSD(item.price)} / {item.unit_name} 
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="d-flex align-items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-white btn-sm border p-0 rounded d-flex align-items-center justify-content-center"
                          style={{ width: 24, height: 24 }}
                          onClick={() => updateQuantity(item.stock_id, item.quantity - 1)}
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          className="form-control form-control-sm text-center p-0 border-0 bg-white fw-bold"
                          style={{ width: 36, height: 24, fontSize: '12px' }}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.stock_id, parseInt(e.target.value) || 0)}
                        />
                        <button
                          type="button"
                          className="btn btn-white btn-sm border p-0 rounded d-flex align-items-center justify-content-center"
                          style={{ width: 24, height: 24 }}
                          onClick={() => updateQuantity(item.stock_id, item.quantity + 1)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Total and delete */}
                      <div className="text-end" style={{ minWidth: '70px' }}>
                        <div className="fw-bold text-dark" style={{ fontSize: '13px' }}>
                          {formatFromUSD(item.total)}
                        </div>
                        <button
                          type="button"
                          className="btn btn-link text-danger p-0 border-0 text-decoration-none"
                          onClick={() => removeFromCart(item.stock_id)}
                          title="Retirer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Summary & Checkout Button */}
            <div className="card-footer bg-white border-top p-3 mt-auto">
              <div className="d-flex justify-content-between mb-1 small text-muted">
                <span>Sous-total:</span>
                <span className="fw-semibold text-dark">{formatFromUSD(subtotal)}</span>
              </div>

              <div className="row g-2 mb-2">
                {canApplyDiscount && (
                  <div className="col-6">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-light text-muted" style={{ fontSize: '11px' }}>Remise</span>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="0"
                        value={globalDiscount || ''}
                        onChange={(e) => setGlobalDiscount(Number(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )}
                <div className={canApplyDiscount ? "col-6" : "col-12"}>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light text-muted" style={{ fontSize: '11px' }}>TVA %</span>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      placeholder="0"
                      value={taxRate || ''}
                      onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center py-2 border-top border-bottom my-2">
                <span className="fw-bold text-dark fs-6">TOTAL TTC :</span>
                <span className="fw-black text-primary fs-4">{formatFromUSD(grandTotal)}</span>
              </div>

              {/* Raccourcis clavier */}
              <div className="d-flex flex-wrap gap-1 mb-2">
                <span className="badge bg-light text-muted border" style={{ fontSize: '10px' }}>F2 Recherche</span>
                <span className="badge bg-light text-muted border" style={{ fontSize: '10px' }}>F4 Client</span>
                <span className="badge bg-light text-muted border" style={{ fontSize: '10px' }}>F8 Encaisser</span>
                <span className="badge bg-light text-muted border" style={{ fontSize: '10px' }}>F9 Attente</span>
              </div>

              <div className="d-flex gap-2 mb-0">
                <button
                  type="button"
                  className="btn btn-outline-warning flex-shrink-0 d-flex align-items-center gap-1"
                  disabled={cart.length === 0}
                  onClick={holdCurrentSale}
                  title="Mettre en attente (F9)"
                >
                  <Pause size={16} />
                </button>
                <button
                  type="button"
                  className="btn btn-primary flex-grow-1 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  disabled={cart.length === 0}
                  onClick={openPaymentModal}
                >
                  <CreditCard size={18} /> ENCAISSER ({formatFromUSD(grandTotal)})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de paiement fractionn\u00e9 */}
      <SplitPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        grandTotal={grandTotal}
        onValidate={handleValidateSale}
        processing={processingSale}
        formatCurrency={formatFromUSD}
      />

      {/* POS Session Modal (Open / Close Cash Register) */}
      {canManagePosSession && (
        <POSSessionModal
          isOpen={isSessionModalOpen}
          onClose={() => setIsSessionModalOpen(false)}
          activeSession={activeSession}
          currentStoreId={currentStoreId}
          currentStoreName={activeStore?.name || 'Aucun magasin actif'}
          onOpenSession={openSession}
          onCloseSession={closeSession}
          onSuccess={() => {
            reFetchSessions();
          }}
        />
      )}

      {/* Printable Receipt Modal */}
      <POSReceiptModal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        saleData={receiptData}
      />

      {/* Modal d'enregistrement rapide du client */}
      <QuickCustomerModal
        isOpen={isQuickCustomerModalOpen}
        onClose={() => setIsQuickCustomerModalOpen(false)}
        onCustomerSelected={(customer) => {
          setQuickCustomer(customer);
          setSelectedCustomerId(customer.id);
        }}
      />

      {/* Tiroir des ventes en attente */}
      <HeldSalesDrawer
        isOpen={isHeldSalesOpen}
        onClose={() => setIsHeldSalesOpen(false)}
        heldSales={heldSales}
        onResume={resumeHeldSale}
        onDelete={deleteSale}
        formatCurrency={formatFromUSD}
      />
    </div>
  );
}
