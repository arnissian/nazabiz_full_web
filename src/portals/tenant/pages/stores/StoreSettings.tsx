import React, { useState, useContext, useEffect } from 'react';
import { SettingsPageSkeleton } from '../../../shared/components/common/SettingsPageSkeleton';
import { SelectFieldSkeleton } from '../../../shared/components/common/FormSkeletons';
import {
  Settings as SettingsIcon, Building, DollarSign, Percent, FileText,
  Receipt, Shield, Save, Check, Globe, Mail, Phone, MapPin, Layout, Store,
  Truck, AlertTriangle, Package, Lock, Bell, Printer, CreditCard, RotateCcw
} from 'lucide-react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';
import { toast } from 'react-toastify';
import { useSettingsData } from '../../../shared/hooks/settings/useSettingsData';
import type { CurrencyFormat } from '../../../shared/types/currencyFormat';
import { CurrencyFormatter } from '../../../shared/services/currencyFormatter';
import { Link, useParams } from 'react-router-dom';
import { AppContext } from '../../../shared/context/AppContext';
import { useDevises } from '../../../shared/hooks/devises/useDevises';

type SettingsSection = 'general' | 'stock_sales' | 'cash_payment' | 'logistics' | 'system';

export default function Settings() {
  const { activeStore, getStoreSettings, hasPermission } = useContext(AppContext);
  const { id } = useParams<{ id: string }>();
  const storeId = id || activeStore?.id;
  const { devises: storeDevises, loading: devisesLoading } = useDevises(
    { page: 1, per_page: 100, is_active: true },
    storeId,
    Boolean(storeId),
  );

  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { languages, loading: dataLoading } = useSettingsData();
  const [storeSettingsSection, setStoreSettingsSection] = useState<SettingsSection>('general');

  // ============ ÉTATS GÉNÉRAUX & INFOS MAGASIN ============
  const [storeName, setStoreName] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [storeLanguage, setStoreLanguage] = useState('');
  const [defaultCurrencyId, setDefaultCurrencyId] = useState('');
  const [storeTax, setStoreTax] = useState('16');
  const [storePhone, setStorePhone] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [timezone, setTimezone] = useState('Africa/Kinshasa');
  const [dateFormat, setDateFormat] = useState('d/m/Y');
  const [discountMaxPercent, setDiscountMaxPercent] = useState('20');
  const [creditLimit, setCreditLimit] = useState('0');
  const [allowCredit, setAllowCredit] = useState(false);

  // ============ ÉTATS STOCK & VENTES ============
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [outOfStockThreshold, setOutOfStockThreshold] = useState('0');
  const [enableExpiryManagement, setEnableExpiryManagement] = useState(false);
  const [enableBatchManagement, setEnableBatchManagement] = useState(false);
  const [reorderPoint, setReorderPoint] = useState('5');
  const [minSalePrice, setMinSalePrice] = useState('0');
  const [requireCustomerForSale, setRequireCustomerForSale] = useState(false);
  const [allowPercentageDiscount, setAllowPercentageDiscount] = useState(true);
  const [allowZeroPriceSale, setAllowZeroPriceSale] = useState(false);

  // ============ ÉTATS CAISSE & PAIEMENTS ============
  const [defaultOpeningAmount, setDefaultOpeningAmount] = useState('0');
  const [requireCloseCashRegister, setRequireCloseCashRegister] = useState(true);
  const [cashTolerance, setCashTolerance] = useState('0');
  const [cashierPin, setCashierPin] = useState('');
  const [autoLockMinutes, setAutoLockMinutes] = useState('15');
  const [enableMobileMoney, setEnableMobileMoney] = useState(false);
  const [enableCardPayment, setEnableCardPayment] = useState(false);
  const [enableTransferPayment, setEnableTransferPayment] = useState(false);

  // ============ ÉTATS LOGISTIQUE ============
  const [defaultShippingCost, setDefaultShippingCost] = useState('0');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('0');
  const [returnPeriodDays, setReturnPeriodDays] = useState('30');
  const [returnConditions, setReturnConditions] = useState('');
  const [requireReceiptForReturn, setRequireReceiptForReturn] = useState(true);

  // ============ ÉTATS SYSTÈME ============
  const [enableStockAlerts, setEnableStockAlerts] = useState(true);
  const [enableSalesNotifications, setEnableSalesNotifications] = useState(false);
  const [enableCashRegisterNotifications, setEnableCashRegisterNotifications] = useState(true);
  const [notificationEmails, setNotificationEmails] = useState('');
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState('30');
  const [maxConcurrentSessions, setMaxConcurrentSessions] = useState('1');
  const [requirePinForSensitive, setRequirePinForSensitive] = useState(false);
  const [enableTwoFactor, setEnableTwoFactor] = useState(false);

  // ============ AUTRES ============
  const [autoReorderEnabled, setAutoReorderEnabled] = useState(false);
  const [defaultExportFormat, setDefaultExportFormat] = useState('xlsx');
  const [currencyFormat, setCurrencyFormat] = useState<CurrencyFormat>({
    locale: 'fr',
    thousandsSeparator: ' ',
    decimalSeparator: ',',
    decimalPlaces: 2,
    symbolPosition: 'suffix',
  });
  const [storeReceiptHeader, setStoreReceiptHeader] = useState('Bienvenue chez MyBusiness');
  const [storeReceiptFooter, setStoreReceiptFooter] = useState('Les marchandises vendues ne sont ni reprises ni échangées. Merci de votre confiance !');
  const [quotationPrefix, setQuotationPrefix] = useState('DEV-');
  const [quotationHeader, setQuotationHeader] = useState('');
  const [quotationFooter, setQuotationFooter] = useState('');
  const [quotationDefaultTerms, setQuotationDefaultTerms] = useState('');

  const getDefaultCurrencySymbol = () => {
    const selectedCurrency = storeDevises.find((devise) => String(devise.id) === defaultCurrencyId && devise.is_active)
      || storeDevises.find((devise) => devise.code.toUpperCase() === 'USD');
    return selectedCurrency?.symbol || '$';
  };

  // Récupération des données du magasin et de ses paramètres depuis l'API
  useEffect(() => {
    const fetchStoreAndSettings = async () => {
      if (!storeId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(`/stores/${storeId}/settings`);
        const storeData = response.data?.data || response.data;
        setStore(storeData);
      } catch (err) {
        console.error("Erreur chargement store settings:", err);
        setError("Impossible de charger les informations du magasin.");
      } finally {
        setLoading(false);
      }
    };

    fetchStoreAndSettings();
  }, [storeId]);

  // ============ CHARGEMENT DES PARAMÈTRES DANS LES ÉTATS (Basé sur store & store.settings) ============
  useEffect(() => {
    if (!store) return;
    
    // Infos de base du magasin
    if (store.name) setStoreName(store.name);
    if (store.code) setStoreCode(store.code);
    if (store.phone) setStorePhone(store.phone);
    if (store.email) setStoreEmail(store.email);
    if (store.address) setStoreAddress(store.address);

    // Paramètres situés dans store.settings
    const s = store.settings || {};
    
    if (s.default_language) setStoreLanguage(s.default_language);
    setDefaultCurrencyId(s.default_currency ? String(s.default_currency) : '');
    if (s.default_tax !== undefined) setStoreTax(s.default_tax.toString());
    if (s.timezone) setTimezone(s.timezone);
    if (s.date_format) setDateFormat(s.date_format);

    // Format de devise (gère si c'est un string JSON ou un objet)
    if (s.currency_format) {
      try {
        const parsedFormat = typeof s.currency_format === 'string' ? JSON.parse(s.currency_format) : s.currency_format;
        setCurrencyFormat(prev => ({ ...prev, ...parsedFormat }));
      } catch (e) {
        console.error("Erreur de parsing currency_format", e);
      }
    }

    if (s.pos_receipt_header) setStoreReceiptHeader(s.pos_receipt_header);
    if (s.pos_receipt_footer) setStoreReceiptFooter(s.pos_receipt_footer);
    setQuotationPrefix(s.quotation_prefix || 'DEV-');
    setQuotationHeader(s.quotation_header || '');
    setQuotationFooter(s.quotation_footer || '');
    setQuotationDefaultTerms(s.quotation_default_terms || '');
    if (s.discount_max_percent !== undefined) setDiscountMaxPercent(s.discount_max_percent.toString());
    if (s.credit_limit !== undefined) setCreditLimit(s.credit_limit.toString());
    if (s.allow_credit !== undefined) setAllowCredit(Boolean(s.allow_credit));

    if (s.low_stock_threshold !== undefined) setLowStockThreshold(s.low_stock_threshold.toString());
    if (s.out_of_stock_threshold !== undefined) setOutOfStockThreshold(s.out_of_stock_threshold.toString());
    if (s.enable_expiry_management !== undefined) setEnableExpiryManagement(Boolean(s.enable_expiry_management));
    if (s.enable_batch_management !== undefined) setEnableBatchManagement(Boolean(s.enable_batch_management));
    if (s.reorder_point !== undefined) setReorderPoint(s.reorder_point.toString());

    if (s.min_sale_price !== undefined) setMinSalePrice(s.min_sale_price.toString());
    if (s.require_customer_for_sale !== undefined) setRequireCustomerForSale(Boolean(s.require_customer_for_sale));
    if (s.allow_percentage_discount !== undefined) setAllowPercentageDiscount(Boolean(s.allow_percentage_discount));
    if (s.allow_zero_price_sale !== undefined) setAllowZeroPriceSale(Boolean(s.allow_zero_price_sale));

    if (s.default_opening_amount !== undefined) setDefaultOpeningAmount(s.default_opening_amount.toString());
    if (s.require_close_cash_register !== undefined) setRequireCloseCashRegister(Boolean(s.require_close_cash_register));
    if (s.cash_tolerance !== undefined) setCashTolerance(s.cash_tolerance.toString());
    if (s.cashier_pin) setCashierPin(s.cashier_pin);
    if (s.auto_lock_minutes !== undefined) setAutoLockMinutes(s.auto_lock_minutes.toString());

    if (s.enable_mobile_money !== undefined) setEnableMobileMoney(Boolean(s.enable_mobile_money));
    if (s.enable_card_payment !== undefined) setEnableCardPayment(Boolean(s.enable_card_payment));
    if (s.enable_transfer_payment !== undefined) setEnableTransferPayment(Boolean(s.enable_transfer_payment));

    if (s.default_shipping_cost !== undefined) setDefaultShippingCost(s.default_shipping_cost.toString());
    if (s.free_shipping_threshold !== undefined) setFreeShippingThreshold(s.free_shipping_threshold.toString());

    if (s.return_period_days !== undefined) setReturnPeriodDays(s.return_period_days.toString());
    if (s.return_conditions) setReturnConditions(s.return_conditions);
    if (s.require_receipt_for_return !== undefined) setRequireReceiptForReturn(Boolean(s.require_receipt_for_return));

    if (s.enable_stock_alerts !== undefined) setEnableStockAlerts(Boolean(s.enable_stock_alerts));
    if (s.enable_sales_notifications !== undefined) setEnableSalesNotifications(Boolean(s.enable_sales_notifications));
    if (s.enable_cash_register_notifications !== undefined) setEnableCashRegisterNotifications(Boolean(s.enable_cash_register_notifications));
    if (s.notification_emails) setNotificationEmails(s.notification_emails);

    if (s.session_timeout_minutes !== undefined) setSessionTimeoutMinutes(s.session_timeout_minutes.toString());
    if (s.max_concurrent_sessions !== undefined) setMaxConcurrentSessions(s.max_concurrent_sessions.toString());
    if (s.require_pin_for_sensitive !== undefined) setRequirePinForSensitive(Boolean(s.require_pin_for_sensitive));
    if (s.enable_2fa !== undefined) setEnableTwoFactor(Boolean(s.enable_2fa));

    if (s.auto_reorder_enabled !== undefined) setAutoReorderEnabled(Boolean(s.auto_reorder_enabled));
    if (s.default_export_format) setDefaultExportFormat(s.default_export_format);

  }, [store]);

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!storeId) {
      toast.error('Aucun magasin actif sélectionné');
      setSubmitting(false);
      return;
    }

    const payload = {
      name: storeName,
      code: storeCode,
      phone: storePhone, 
      email: storeEmail, 
      address: storeAddress,
      defaultLanguage: storeLanguage,
      defaultCurrency: storeDevises.find((devise) => String(devise.id) === defaultCurrencyId && devise.is_active)?.id
        || storeDevises.find((devise) => devise.code.toUpperCase() === 'USD')?.id
        || (devisesLoading ? store?.settings?.default_currency : undefined),
      currencyFormat, 
      defaultTax: storeTax,
      posReceiptHeader: storeReceiptHeader, 
      posReceiptFooter: storeReceiptFooter,
      quotationPrefix,
      quotationHeader,
      quotationFooter,
      quotationDefaultTerms,
      discountMaxPercent, 
      creditLimit, 
      allowCredit: allowCredit ? 1 : 0, 
      timezone, 
      dateFormat,
      lowStockThreshold, 
      outOfStockThreshold, 
      enableExpiryManagement: enableExpiryManagement ? 1 : 0,
      enableBatchManagement: enableBatchManagement ? 1 : 0, 
      reorderPoint, 
      minSalePrice, 
      requireCustomerForSale: requireCustomerForSale ? 1 : 0,
      allowPercentageDiscount: allowPercentageDiscount ? 1 : 0, 
      allowZeroPriceSale: allowZeroPriceSale ? 1 : 0, 
      defaultOpeningAmount,
      requireCloseCashRegister: requireCloseCashRegister ? 1 : 0, 
      cashTolerance, 
      cashierPin, 
      autoLockMinutes,
      enableMobileMoney: enableMobileMoney ? 1 : 0, 
      enableCardPayment: enableCardPayment ? 1 : 0, 
      enableTransferPayment: enableTransferPayment ? 1 : 0,
      defaultShippingCost, 
      freeShippingThreshold, 
      returnPeriodDays,
      returnConditions, 
      requireReceiptForReturn: requireReceiptForReturn ? 1 : 0, 
      enableStockAlerts: enableStockAlerts ? 1 : 0,
      enableSalesNotifications: enableSalesNotifications ? 1 : 0, 
      enableCashRegisterNotifications: enableCashRegisterNotifications ? 1 : 0, 
      notificationEmails,
      sessionTimeoutMinutes, 
      maxConcurrentSessions, 
      requirePinForSensitive: requirePinForSensitive ? 1 : 0,
      enableTwoFactor: enableTwoFactor ? 1 : 0,
      autoReorderEnabled: autoReorderEnabled ? 1 : 0, 
      defaultExportFormat,
    };

    try {
      const res = await axiosInstance.post(`/stores/${storeId}/settings`, payload);
      if (res.data?.success || res.data?.status === 200) {
        toast.success(res.data?.message || 'Paramètres magasin enregistrés !');
        if (getStoreSettings) getStoreSettings();
      } else {
        toast.error(res.data?.message || 'Erreur lors de la sauvegarde');
      }
    } catch (err: any) {
      const responseData = err?.response?.data;
      const validationMessage = responseData?.errors?.code?.[0];
      toast.error(validationMessage || responseData?.message || 'Erreur serveur');
    } finally {
      setSubmitting(false);
    }
  };

  // ============ COMPOSANTS RÉUTILISABLES ============
  const CardHeader = ({ icon: Icon, title, color = 'info' }: { icon: any; title: string; color?: string }) => (
    <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
      <Icon size={18} className={`text-${color}`} />
      <h6 className="fw-bold mb-0 text-dark">{title}</h6>
    </div>
  );

  const Field = ({ legend, children }: { legend: string; children: React.ReactNode }) => (
    <fieldset className="custom-fieldset">
      <legend>{legend}</legend>
      {children}
    </fieldset>
  );

  const CheckboxField = ({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="form-check mb-2">
      <input className="form-check-input" type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <label className="form-check-label" htmlFor={id}>{label}</label>
    </div>
  );

  // ============ SECTION GÉNÉRAL ============
  const renderGeneral = () => (
    <div className="row g-4">
      <div className="col-lg-6">
        <div className="card shadow-2xs rounded-3 p-4 bg-white h-100">
          <CardHeader icon={Store} title="Informations Générales" color="info" />

          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <Field legend="Nom du magasin">
                <input type="text" className="form-control" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
              </Field>
            </div>
            <div className="col-md-6">
              <Field legend="Code magasin">
                <input type="text" className="form-control font-monospace" value={storeCode} onChange={(e) => setStoreCode(e.target.value)} required />
              </Field>
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <Field legend="Devise">
                <select
                  className="form-select"
                  value={storeDevises.some((devise) => String(devise.id) === defaultCurrencyId && devise.is_active)
                    ? defaultCurrencyId
                    : String(storeDevises.find((devise) => devise.code.toUpperCase() === 'USD')?.id ?? '')}
                  onChange={(event) => setDefaultCurrencyId(event.target.value)}
                  disabled={devisesLoading || storeDevises.length === 0}
                >
                  <option value="">Sélectionner la devise par défaut</option>
                  {storeDevises.map((devise) => (
                    <option key={devise.id} value={devise.id}>{devise.code} — {devise.name}</option>
                  ))}
                </select>
                {hasPermission('settings.manage') && (
                  <Link
                    to={`/stores/${storeId}/devises`}
                    className="btn btn-sm btn-outline-primary mt-2"
                  >
                    Gérer les devises du magasin
                  </Link>
                )}
              </Field>
            </div>
            <div className="col-md-6">
              <Field legend="Langue">
                {dataLoading ? (
                  <SelectFieldSkeleton label="Chargement des langues" />
                ) : (
                  <select className="form-select" value={storeLanguage} onChange={(e) => setStoreLanguage(e.target.value)}>
                    <option value="">Sélectionner</option>
                    {languages.map((l) => <option key={l.id} value={l.id}>{l.flag} {l.name}</option>)}
                  </select>
                )}
              </Field>
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <Field legend="TVA (%)">
                <input type="number" step="0.1" className="form-control" value={storeTax} onChange={(e) => setStoreTax(e.target.value)} />
              </Field>
            </div>
            <div className="col-md-6">
              <Field legend="Fuseau horaire">
                <select className="form-select" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                  <option value="Africa/Kinshasa">Africa/Kinshasa</option>
                  <option value="Africa/Lagos">Africa/Lagos</option>
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <Field legend="Téléphone">
                <input type="text" className="form-control" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} />
              </Field>
            </div>
            <div className="col-md-6">
              <Field legend="Email">
                <input type="email" className="form-control" value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} />
              </Field>
            </div>
          </div>

          <Field legend="Adresse">
            <textarea className="form-control" rows={2} value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="col-lg-6">
        <div className="card shadow-2xs rounded-3 p-4 bg-white h-100">
          <CardHeader icon={Layout} title="Format de Devise" color="info" />

          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <Field legend="Modèle">
                <select className="form-select" value={currencyFormat.locale} onChange={(e) => setCurrencyFormat({ ...currencyFormat, locale: e.target.value as 'fr' | 'en' })}>
                  <option value="fr">Français</option>
                  <option value="en">Anglais</option>
                </select>
              </Field>
            </div>
            <div className="col-md-6">
              <Field legend="Séparateur milliers">
                <select className="form-select" value={currencyFormat.thousandsSeparator || ' '} onChange={(e) => setCurrencyFormat({ ...currencyFormat, thousandsSeparator: e.target.value as ',' | '.' | ' ' })}>
                  <option value=" ">Espace</option>
                  <option value=",">Virgule</option>
                  <option value=".">Point</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <Field legend="Séparateur décimal">
                <select className="form-select" value={currencyFormat.decimalSeparator} onChange={(e) => setCurrencyFormat({ ...currencyFormat, decimalSeparator: e.target.value as ',' | '.' })}>
                  <option value=",">Virgule</option>
                  <option value=".">Point</option>
                </select>
              </Field>
            </div>
            <div className="col-md-6">
              <Field legend="Décimales">
                <input type="number" min="0" max="4" className="form-control" value={currencyFormat.decimalPlaces} onChange={(e) => setCurrencyFormat({ ...currencyFormat, decimalPlaces: parseInt(e.target.value) || 0 })} />
              </Field>
            </div>
          </div>

          <div className="alert alert-info mb-3">
            <strong>Prévisualisation :</strong>
            <div className="mt-2 fs-5 fw-bold">
              {CurrencyFormatter.format(1234.56, currencyFormat, getDefaultCurrencySymbol())}
            </div>
          </div>

          <CardHeader icon={DollarSign} title="Financier" color="success" />

          <div className="row g-2 mb-2">
            <div className="col-md-6">
              <Field legend="Remise max (%)">
                <input type="number" step="0.1" className="form-control" value={discountMaxPercent} onChange={(e) => setDiscountMaxPercent(e.target.value)} />
              </Field>
            </div>
            <div className="col-md-6">
              <Field legend="Limite de crédit">
                <input type="number" step="0.01" className="form-control" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
              </Field>
            </div>
          </div>
          <CheckboxField id="allowCredit" label="Autoriser les ventes à crédit" checked={allowCredit} onChange={setAllowCredit} />
        </div>
      </div>

      <div className="col-12">
        <div className="card shadow-2xs rounded-3 p-4 bg-white">
          <CardHeader icon={Receipt} title="Tickets de Caisse" color="warning" />
          <div className="row g-3">
            <div className="col-md-6">
              <Field legend="En-tête">
                <input type="text" className="form-control" value={storeReceiptHeader} onChange={(e) => setStoreReceiptHeader(e.target.value)} />
              </Field>
            </div>
            <div className="col-md-6">
              <Field legend="Pied de page">
                <textarea className="form-control" rows={2} value={storeReceiptFooter} onChange={(e) => setStoreReceiptFooter(e.target.value)} />
              </Field>
            </div>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="card shadow-2xs rounded-3 p-4 bg-white">
          <CardHeader icon={FileText} title="Personnalisation des devis" color="primary" />
          <p className="text-muted small mb-3">
            Ces réglages s’appliquent uniquement aux devis créés dans ce magasin.
          </p>
          <div className="row g-3">
            <div className="col-md-4">
              <Field legend="Préfixe de référence">
                <input
                  type="text"
                  maxLength={30}
                  className="form-control"
                  value={quotationPrefix}
                  onChange={(event) => setQuotationPrefix(event.target.value)}
                  placeholder="DEV-"
                />
              </Field>
            </div>
            <div className="col-md-8">
              <Field legend="En-tête du devis">
                <textarea
                  className="form-control"
                  rows={2}
                  maxLength={10000}
                  value={quotationHeader}
                  onChange={(event) => setQuotationHeader(event.target.value)}
                  placeholder="Texte personnalisé affiché en haut du devis"
                />
              </Field>
            </div>
            <div className="col-md-6">
              <Field legend="Conditions par défaut">
                <textarea
                  className="form-control"
                  rows={3}
                  maxLength={10000}
                  value={quotationDefaultTerms}
                  onChange={(event) => setQuotationDefaultTerms(event.target.value)}
                  placeholder="Conditions préremplies lors de la création d’un devis"
                />
              </Field>
            </div>
            <div className="col-md-6">
              <Field legend="Pied de page du devis">
                <textarea
                  className="form-control"
                  rows={3}
                  maxLength={10000}
                  value={quotationFooter}
                  onChange={(event) => setQuotationFooter(event.target.value)}
                  placeholder="Texte personnalisé affiché en bas du devis"
                />
              </Field>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ============ SECTION STOCK & VENTES ============
  const renderStockSales = () => (
    <div className="row g-4">
      <div className="col-lg-6">
        <div className="card shadow-2xs rounded-3 p-4 bg-white h-100">
          <CardHeader icon={Package} title="Gestion du Stock" color="primary" />
          <div className="row g-2 mb-3">
            <div className="col-md-4">
              <Field legend="Seuil bas">
                <input type="number" className="form-control" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} />
              </Field>
            </div>
            <div className="col-md-4">
              <Field legend="Seuil rupture">
                <input type="number" className="form-control" value={outOfStockThreshold} onChange={(e) => setOutOfStockThreshold(e.target.value)} />
              </Field>
            </div>
            <div className="col-md-4">
              <Field legend="Point réappro.">
                <input type="number" className="form-control" value={reorderPoint} onChange={(e) => setReorderPoint(e.target.value)} />
              </Field>
            </div>
          </div>
          <CheckboxField id="enableExpiry" label="Gérer les dates de péremption" checked={enableExpiryManagement} onChange={setEnableExpiryManagement} />
          <CheckboxField id="enableBatch" label="Gérer les lots" checked={enableBatchManagement} onChange={setEnableBatchManagement} />
          <CheckboxField id="autoReorder" label="Réapprovisionnement automatique" checked={autoReorderEnabled} onChange={setAutoReorderEnabled} />
        </div>
      </div>

      <div className="col-lg-6">
        <div className="card shadow-2xs rounded-3 p-4 bg-white h-100">
          <CardHeader icon={Percent} title="Paramètres de Vente" color="success" />
          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <Field legend="Prix minimum de vente">
                <input type="number" step="0.01" className="form-control" value={minSalePrice} onChange={(e) => setMinSalePrice(e.target.value)} />
              </Field>
            </div>
          </div>
          <CheckboxField id="requireCustomer" label="Exiger un client pour chaque vente" checked={requireCustomerForSale} onChange={setRequireCustomerForSale} />
          <CheckboxField id="allowDiscount" label="Autoriser les remises en pourcentage" checked={allowPercentageDiscount} onChange={setAllowPercentageDiscount} />
          <CheckboxField id="allowZeroPrice" label="Autoriser les ventes à prix zéro" checked={allowZeroPriceSale} onChange={setAllowZeroPriceSale} />
        </div>
      </div>
    </div>
  );

  // ============ SECTION CAISSE & PAIEMENTS ============
  const renderCashPayment = () => (
    <div className="row g-4">
      <div className="col-lg-6">
        <div className="card shadow-2xs rounded-3 p-4 bg-white h-100">
          <CardHeader icon={Receipt} title="Paramètres de Caisse" color="warning" />
          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <Field legend="Montant ouverture">
                <input type="number" step="0.01" className="form-control" value={defaultOpeningAmount} onChange={(e) => setDefaultOpeningAmount(e.target.value)} />
              </Field>
            </div>
            <div className="col-md-6">
              <Field legend="Tolérance espèces">
                <input type="number" step="0.01" className="form-control" value={cashTolerance} onChange={(e) => setCashTolerance(e.target.value)} />
              </Field>
            </div>
          </div>
          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <Field legend="Verrouillage auto (min)">
                <input type="number" className="form-control" value={autoLockMinutes} onChange={(e) => setAutoLockMinutes(e.target.value)} />
              </Field>
            </div>
            <div className="col-md-6">
              <Field legend="PIN caissier">
                <input type="password" className="form-control" value={cashierPin} onChange={(e) => setCashierPin(e.target.value)} />
              </Field>
            </div>
          </div>
          <CheckboxField id="requireClose" label="Exiger la clôture de caisse" checked={requireCloseCashRegister} onChange={setRequireCloseCashRegister} />
        </div>
      </div>

      <div className="col-lg-6">
        <div className="card shadow-2xs rounded-3 p-4 bg-white h-100">
          <CardHeader icon={CreditCard} title="Modes de Paiement" color="info" />
          <CheckboxField id="mobileMoney" label="Activer Mobile Money" checked={enableMobileMoney} onChange={setEnableMobileMoney} />
          <CheckboxField id="cardPayment" label="Activer le paiement par carte bancaire" checked={enableCardPayment} onChange={setEnableCardPayment} />
          <CheckboxField id="transferPayment" label="Activer le virement bancaire" checked={enableTransferPayment} onChange={setEnableTransferPayment} />
        </div>
      </div>
    </div>
  );

  // ============ SECTION LOGISTIQUE ============
  const renderLogistics = () => (
    <div className="row g-4">
      <div className="col-lg-6">
        <div className="card shadow-2xs rounded-3 p-4 bg-white h-100">
          <CardHeader icon={Truck} title="Expédition & Livraison" color="primary" />
          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <Field legend="Coût d'expédition par défaut">
                <input type="number" step="0.01" className="form-control" value={defaultShippingCost} onChange={(e) => setDefaultShippingCost(e.target.value)} />
              </Field>
            </div>
            <div className="col-md-6">
              <Field legend="Seuil de livraison gratuite">
                <input type="number" step="0.01" className="form-control" value={freeShippingThreshold} onChange={(e) => setFreeShippingThreshold(e.target.value)} />
              </Field>
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-6">
        <div className="card shadow-2xs rounded-3 p-4 bg-white h-100">
          <CardHeader icon={RotateCcw} title="Politique de Retour" color="warning" />
          <div className="mb-3">
            <Field legend="Période de retour (jours)">
              <input type="number" className="form-control" value={returnPeriodDays} onChange={(e) => setReturnPeriodDays(e.target.value)} />
            </Field>
          </div>
          <div className="mb-3">
            <Field legend="Conditions de retour">
              <textarea className="form-control" rows={3} value={returnConditions} onChange={(e) => setReturnConditions(e.target.value)} />
            </Field>
          </div>
          <CheckboxField id="requireReceipt" label="Exiger le reçu pour tout retour" checked={requireReceiptForReturn} onChange={setRequireReceiptForReturn} />
        </div>
      </div>
    </div>
  );

  // ============ SECTION SYSTÈME ============
  const renderSystem = () => (
    <div className="row g-4">
      <div className="col-lg-6">
        <div className="card shadow-2xs rounded-3 p-4 bg-white h-100">
          <CardHeader icon={Bell} title="Notifications & Alertes" color="danger" />
          <CheckboxField id="stockAlerts" label="Alertes de stock" checked={enableStockAlerts} onChange={setEnableStockAlerts} />
          <CheckboxField id="salesNotif" label="Notifications de vente" checked={enableSalesNotifications} onChange={setEnableSalesNotifications} />
          <CheckboxField id="cashNotif" label="Notifications de caisse" checked={enableCashRegisterNotifications} onChange={setEnableCashRegisterNotifications} />
          <div className="mt-3">
            <Field legend="Emails de notification (séparés par des virgules)">
              <input type="text" className="form-control" value={notificationEmails} onChange={(e) => setNotificationEmails(e.target.value)} />
            </Field>
          </div>
        </div>
      </div>

      <div className="col-lg-6">
        <div className="card shadow-2xs rounded-3 p-4 bg-white h-100">
          <CardHeader icon={Lock} title="Sécurité" color="secondary" />
          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <Field legend="Inactivité (minutes)">
                <input type="number" className="form-control" value={sessionTimeoutMinutes} onChange={(e) => setSessionTimeoutMinutes(e.target.value)} />
              </Field>
            </div>
            <div className="col-md-6">
              <Field legend="Sessions simultanées max">
                <input type="number" className="form-control" value={maxConcurrentSessions} onChange={(e) => setMaxConcurrentSessions(e.target.value)} />
              </Field>
            </div>
          </div>
          <CheckboxField id="pinSensitive" label="Exiger un PIN pour les actions sensibles" checked={requirePinForSensitive} onChange={setRequirePinForSensitive} />
          <div className="form-check form-switch mb-2">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="storeTwoFactor"
              checked={enableTwoFactor}
              onChange={event => setEnableTwoFactor(event.target.checked)}
            />
            <label className="form-check-label fw-semibold" htmlFor="storeTwoFactor">
              Exiger un code 2FA à chaque connexion à ce magasin
            </label>
          </div>
          <p className="text-muted small mb-0">
            Ce réglage concerne uniquement les connexions à web_store et est indépendant de la sécurité de l’entreprise.
            Désactivé, le magasin utilise la connexion par défaut.
          </p>
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (storeSettingsSection) {
      case 'general': return renderGeneral();
      case 'stock_sales': return renderStockSales();
      case 'cash_payment': return renderCashPayment();
      case 'logistics': return renderLogistics();
      case 'system': return renderSystem();
      default: return null;
    }
  };

  const sections = [
    { id: 'general', label: 'Général', icon: Store },
    { id: 'stock_sales', label: 'Stock & Ventes', icon: Package },
    { id: 'cash_payment', label: 'Caisse & Paiements', icon: CreditCard },
    { id: 'logistics', label: 'Logistique', icon: Truck },
    { id: 'system', label: 'Système', icon: Shield },
  ];

  if (loading) {
    return <SettingsPageSkeleton />;
  }

  return (
    <div className="container-fluid p-3 p-md-4 min-vh-100 bg-light">
        {/* <pre>{JSON.stringify(store,null,2)}</pre> */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Paramètres du Magasin</h2>
          <p className="text-muted small mb-0">
            Configuration du point de vente : <strong className="text-primary">{storeName || store?.name || activeStore?.name || 'Aucun magasin sélectionné'}</strong>
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveStore}>
        <div className="d-flex gap-2 overflow-auto pb-3 mb-3 flex-wrap">
          {sections.map((sec) => {
            const IconComp = sec.icon;
            return (
              <button
                key={sec.id}
                type="button"
                className={`btn btn-sm d-flex align-items-center gap-1.5 px-3 py-2 ${storeSettingsSection === sec.id ? 'btn-dark' : 'btn-outline-secondary bg-white'}`}
                onClick={() => setStoreSettingsSection(sec.id as SettingsSection)}
              >
                <IconComp size={14} /> {sec.label}
              </button>
            );
          })}
        </div>

        <div className="mb-4">{renderSection()}</div>

        <div className="d-flex justify-content-end">
          <button type="submit" className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-2xs" disabled={submitting}>
            <Save size={16} /> {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  );
}