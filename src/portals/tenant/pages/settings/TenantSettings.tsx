import { useCallback, useContext, useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import { Banknote, Building2, Globe2, Save, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';
import { SettingsPageSkeleton } from '../../../shared/components/common/SettingsPageSkeleton';
import ImageUpload from '../../components/common/ImageUpload';
import { useSettingsData } from '../../../shared/hooks/settings/useSettingsData';
import type { CurrencyFormat } from '../../../shared/types/currencyFormat';
import { CurrencyFormatter } from '../../../shared/services/currencyFormatter';
import { uploads } from '../../../shared/config/env';
import { AppContext } from '../../../shared/context/AppContext';
import type { TenantSettingsData } from '../../types/tenantSettings';
import { Link } from 'react-router-dom';

const defaultCurrencyFormat: CurrencyFormat = {
  locale: 'fr',
  thousandsSeparator: ' ',
  decimalSeparator: ',',
  decimalPlaces: 2,
  symbolPosition: 'suffix',
};

const emptySettings: TenantSettingsData = {
  tenant_id: '',
  name: '',
  slug: null,
  phone: null,
  email: null,
  address: null,
  website: null,
  logo_path: null,
  default_currency: '',
  default_language: '',
  timezone: 'Africa/Kinshasa',
  default_tax: '16',
  currency_format: defaultCurrencyFormat,
  invoice_prefix: 'FAC-',
  enable_2fa: false,
};

const mergeSettings = (data: Partial<TenantSettingsData>): TenantSettingsData => ({
  ...emptySettings,
  ...data,
  currency_format: { ...defaultCurrencyFormat, ...data.currency_format },
});

export default function TenantSettings() {
  const [settings, setSettings] = useState<TenantSettingsData>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const { getTenantSettings, updateTenantSettings } = useContext(AppContext);
  const { devises, languages, loading: optionsLoading } = useSettingsData();

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedSettings = await getTenantSettings();
      if (!loadedSettings) {
        throw new Error('Les paramètres de l’entreprise sont indisponibles.');
      }
      setSettings(mergeSettings(loadedSettings));
      setLogo(null);
      setRemoveLogo(false);
    } catch (loadError: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(loadError)
        ? loadError.response?.data?.message
        : null;
      setError(message || 'Impossible de charger les paramètres de l’entreprise.');
    } finally {
      setLoading(false);
    }
  }, [getTenantSettings]);

  useEffect(() => {
    // Load the authenticated tenant's settings when this route is opened.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSettings();
  }, [loadSettings]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('name', settings.name);
      formData.append('phone', settings.phone || '');
      formData.append('email', settings.email || '');
      formData.append('address', settings.address || '');
      formData.append('website', settings.website || '');
      formData.append('default_currency', settings.default_currency || '');
      formData.append('default_language', settings.default_language || '');
      formData.append('timezone', settings.timezone);
      formData.append('default_tax', String(settings.default_tax));
      formData.append('invoice_prefix', settings.invoice_prefix);
      Object.entries(settings.currency_format).forEach(([key, value]) => {
        formData.append(`currency_format[${key}]`, String(value));
      });
      formData.append('enable_2fa', settings.enable_2fa ? '1' : '0');
      formData.append('remove_logo', removeLogo ? '1' : '0');
      if (logo) formData.append('logo', logo);

      const response = await axiosInstance.post('/tenant/settings', formData);
      const updatedSettings = mergeSettings(response.data?.data || settings);
      setSettings(updatedSettings);
      updateTenantSettings(updatedSettings);
      setLogo(null);
      setRemoveLogo(false);
      toast.success(response.data?.message || 'Paramètres de l’entreprise enregistrés.');
    } catch (saveError: unknown) {
      const message = axios.isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(saveError)
        ? Object.values(saveError.response?.data?.errors || {}).flat()[0]
          || saveError.response?.data?.message
        : null;
      toast.error(message || 'Impossible d’enregistrer les paramètres de l’entreprise.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <SettingsPageSkeleton />;

  if (error) {
    return (
      <div className="container-fluid p-3 p-md-4">
        <div className="alert alert-danger" role="alert">
          {error}
          <button type="button" className="btn btn-sm btn-outline-danger ms-3" onClick={() => void loadSettings()}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const update = <K extends keyof TenantSettingsData>(key: K, value: TenantSettingsData[K]) => {
    setSettings(current => ({ ...current, [key]: value }));
  };
  const handleLogo = (_base64: string | null, imageFile: File | null) => {
    setLogo(imageFile);
    setRemoveLogo(imageFile === null && Boolean(settings.logo_path));
  };

  return (
    <div className="container-fluid p-3 p-md-4 min-vh-100">
      <div className="d-flex align-items-center justify-content-between mb-4 gap-2">
        <div>
          <h1 className="fw-bold text-dark mb-0 fs-5">Paramètres de l’entreprise</h1>
          <div className="text-muted small">Informations et valeurs par défaut communes aux magasins du tenant.</div>
        </div>
        <button
          type="submit"
          form="tenant-settings-form"
          className="btn btn-primary btn-sm d-flex align-items-center gap-2"
          disabled={submitting}
        >
          {submitting ? <span className="spinner-border spinner-border-sm" /> : <Save size={15} />}
          Enregistrer
        </button>
      </div>

      <form id="tenant-settings-form" onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-lg-6">
            <section className="card border-0 shadow-sm rounded-3 p-4 h-100">
              <h2 className="h6 fw-bold d-flex align-items-center gap-2 mb-3">
                <Building2 size={18} className="text-primary" /> Identité de l’entreprise
              </h2>
              <label className="form-label">Nom de l’entreprise *</label>
              <input
                className="form-control mb-3"
                required
                maxLength={191}
                value={settings.name}
                onChange={event => update('name', event.target.value)}
              />
              <div className="mb-3">
                <label className="form-label">Logo de l’entreprise</label>
                <ImageUpload
                  defaultImage={settings.logo_path ? `${uploads}/${settings.logo_path}` : undefined}
                  onImage={handleLogo}
                />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Téléphone</label>
                  <input className="form-control" value={settings.phone || ''} onChange={event => update('phone', event.target.value)} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={settings.email || ''} onChange={event => update('email', event.target.value)} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Site web</label>
                <input type="url" className="form-control" value={settings.website || ''} onChange={event => update('website', event.target.value)} placeholder="https://" />
              </div>
              <div>
                <label className="form-label">Adresse du siège</label>
                <textarea rows={3} className="form-control" value={settings.address || ''} onChange={event => update('address', event.target.value)} />
              </div>
            </section>
          </div>

          <div className="col-lg-6">
            <section className="card border-0 shadow-sm rounded-3 p-4 h-100">
              <h2 className="h6 fw-bold d-flex align-items-center gap-2 mb-3">
                <Globe2 size={18} className="text-success" /> Valeurs par défaut de l’entreprise
              </h2>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <label className="form-label mb-1">Devise par défaut de l’entreprise</label>
                    <Link to="/tenant/devises" className="small text-decoration-none">Gérer les devises</Link>
                  </div>
                  <select
                    className="form-select"
                    value={settings.default_currency || ''}
                    disabled={optionsLoading}
                    onChange={event => update('default_currency', event.target.value)}
                  >
                    <option value="">Non définie</option>
                    {devises.map(currency => <option key={currency.id} value={currency.id}>{currency.code} — {currency.name}</option>)}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Langue par défaut</label>
                  <select
                    className="form-select"
                    value={settings.default_language || ''}
                    disabled={optionsLoading}
                    onChange={event => update('default_language', event.target.value)}
                  >
                    <option value="">Non définie</option>
                    {languages.map(language => <option key={language.id} value={language.id}>{language.name}</option>)}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Fuseau horaire</label>
                  <input className="form-control" required value={settings.timezone} onChange={event => update('timezone', event.target.value)} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Taxe par défaut (%)</label>
                  <input type="number" min="0" max="100" step="0.01" required className="form-control" value={settings.default_tax} onChange={event => update('default_tax', event.target.value)} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Préfixe des factures</label>
                  <input
                    maxLength={30}
                    className="form-control"
                    value={settings.invoice_prefix}
                    onChange={event => update('invoice_prefix', event.target.value)}
                    placeholder="FAC-"
                  />
                </div>
              </div>
              <p className="text-muted small mb-0">
                Ces paramètres appartiennent à l’entreprise. Les paramètres opérationnels de chaque point de vente restent configurables séparément.
              </p>
            </section>
          </div>
          <div className="col-12">
            <section className="card border-0 shadow-sm rounded-3 p-4">
              <h2 className="h6 fw-bold d-flex align-items-center gap-2 mb-1">
                <Banknote size={18} className="text-warning" /> Personnalisation du format de devise
              </h2>
              <p className="text-muted small mb-4">
                Ce format par défaut est commun à tous les magasins. Chaque magasin peut ensuite définir son propre format.
              </p>

              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Langue et format régional</label>
                  <select
                    className="form-select"
                    value={settings.currency_format.locale}
                    onChange={event => update('currency_format', {
                      ...settings.currency_format,
                      locale: event.target.value as CurrencyFormat['locale'],
                    })}
                  >
                    <option value="fr">Français</option>
                    <option value="en">Anglais</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Séparateur des milliers</label>
                  <select
                    className="form-select"
                    value={settings.currency_format.thousandsSeparator}
                    onChange={event => update('currency_format', {
                      ...settings.currency_format,
                      thousandsSeparator: event.target.value as CurrencyFormat['thousandsSeparator'],
                    })}
                  >
                    <option value=" ">Espace</option>
                    <option value=",">Virgule</option>
                    <option value=".">Point</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Séparateur décimal</label>
                  <select
                    className="form-select"
                    value={settings.currency_format.decimalSeparator}
                    onChange={event => update('currency_format', {
                      ...settings.currency_format,
                      decimalSeparator: event.target.value as CurrencyFormat['decimalSeparator'],
                    })}
                  >
                    <option value=",">Virgule</option>
                    <option value=".">Point</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Nombre de décimales</label>
                  <select
                    className="form-select"
                    value={settings.currency_format.decimalPlaces}
                    onChange={event => update('currency_format', {
                      ...settings.currency_format,
                      decimalPlaces: Number(event.target.value),
                    })}
                  >
                    {[0, 1, 2, 3, 4].map(value => <option key={value} value={value}>{value}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Position du symbole</label>
                  <select
                    className="form-select"
                    value={settings.currency_format.symbolPosition}
                    onChange={event => update('currency_format', {
                      ...settings.currency_format,
                      symbolPosition: event.target.value as CurrencyFormat['symbolPosition'],
                    })}
                  >
                    <option value="prefix">Avant le montant</option>
                    <option value="suffix">Après le montant</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Exemple</label>
                  <div className="form-control bg-light fw-bold">
                    {CurrencyFormatter.format(
                      1234567.89,
                      settings.currency_format,
                      devises.find(currency => currency.id === settings.default_currency)?.symbol || '$',
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
          <div className="col-12">
            <section className="card border-0 shadow-sm rounded-3 p-4">
              <h2 className="h6 fw-bold d-flex align-items-center gap-2 mb-2">
                <ShieldCheck size={18} className="text-danger" /> Sécurité de connexion de l’entreprise
              </h2>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="tenant-enable-2fa"
                  checked={settings.enable_2fa}
                  onChange={event => update('enable_2fa', event.target.checked)}
                />
                <label className="form-check-label fw-semibold" htmlFor="tenant-enable-2fa">
                  Exiger un code de vérification par e-mail pour se connecter à web_tenant
                </label>
              </div>
              <p className="text-muted small mt-2 mb-0">
                Ce réglage concerne uniquement les connexions à l’espace entreprise. Chaque magasin possède son propre réglage pour web_store.
              </p>
            </section>
          </div>
        </div>
      </form>
    </div>
  );
}
