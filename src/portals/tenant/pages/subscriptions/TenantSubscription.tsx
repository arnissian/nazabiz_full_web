import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowRight, Check, CreditCard, RefreshCw, Store, Users, ShieldAlert } from 'lucide-react';
import axiosInstance from '../../../shared/services/api/axiosInterceptor';
import { useNavigate } from 'react-router-dom';
import TenantSubscriptionSkeleton from './TenantSubscriptionSkeleton';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  billing_interval: string;
  max_stores: number | null;
  max_users: number | null;
  features: string[] | null;
}

interface Subscription {
  id: string;
  status: string;
  starts_at: string;
  ends_at: string | null;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  price: string;
  currency: string;
  billing_interval: string;
  plan: Plan;
}

interface SubscriptionData {
  current: Subscription | null;
  pending: Subscription | null;
  plans: Plan[];
  can_access_management: boolean;
  usage: {
    stores: { used: number; limit: number | null };
    users: { used: number; limit: number | null };
  };
}

function formatDate(date: string | null): string {
  return date ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(date)) : 'Sans échéance';
}

function formatMoney(price: string, currency: string): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(Number(price));
}

function readableStatus(status: string): string {
  return ({
    trial: 'Période d’essai',
    active: 'Actif',
    pending: 'En attente',
    past_due: 'En retard',
    expired: 'Expiré',
    cancelled: 'Résilié',
  } as Record<string, string>)[status] || status;
}

export default function TenantSubscription() {
  const navigate = useNavigate();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadSubscription = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/tenant/subscription');
      const subscriptionData = response.data.data as SubscriptionData;
      setData(subscriptionData);
      setSelectedPlanId(current => current || subscriptionData.plans[0]?.id || '');
    } catch (loadError: unknown) {
      setError(axios.isAxiosError<{ message?: string }>(loadError)
        ? loadError.response?.data?.message || 'Impossible de charger votre abonnement.'
        : 'Une erreur inattendue est survenue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadSubscription);
  }, [loadSubscription]);

  const requestPlan = async () => {
    if (!selectedPlanId) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await axiosInstance.post('/tenant/subscription/requests', { subscription_plan_id: selectedPlanId });
      setSuccess('Votre demande a été envoyée. L’administration validera manuellement le nouvel abonnement.');
      await loadSubscription();
    } catch (requestError: unknown) {
      setError(axios.isAxiosError<{ message?: string }>(requestError)
        ? requestError.response?.data?.message || 'Impossible d’envoyer la demande.'
        : 'Une erreur inattendue est survenue.');
    } finally {
      setSaving(false);
    }
  };

  const cancelSubscription = async () => {
    if (!window.confirm('Résilier maintenant l’essai ou l’abonnement ? Les fonctions opérationnelles seront suspendues.')) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await axiosInstance.post('/tenant/subscription/cancel');
      setSuccess('Votre abonnement est résilié.');
      await loadSubscription();
    } catch (cancelError: unknown) {
      setError(axios.isAxiosError<{ message?: string }>(cancelError)
        ? cancelError.response?.data?.message || 'Impossible de résilier cet abonnement.'
        : 'Une erreur inattendue est survenue.');
    } finally {
      setSaving(false);
    }
  };

  const current = data?.current;
  const validUntil = current?.status === 'trial' ? current.trial_ends_at || current.ends_at : current?.ends_at;

  return (
    <div className="container py-4 px-xl-5" style={{ maxWidth: '1200px' }}>
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <div>
          <span className="text-uppercase tracking-wider text-primary fw-bold small">Facturation &amp; Forfait</span>
          <h1 className="h3 fw-bold text-dark mb-0 mt-1">Abonnement entreprise</h1>
        </div>
        <button type="button" className="btn btn-light border btn-sm d-flex align-items-center gap-2 shadow-sm" onClick={() => void loadSubscription()} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'fa-spin' : ''} /> Actualiser
        </button>
      </div>

      {error && <div className="alert alert-danger rounded-3 border-0 shadow-sm" role="alert">{error}</div>}
      {success && <div className="alert alert-success rounded-3 border-0 shadow-sm" role="status">{success}</div>}
      {loading && <TenantSubscriptionSkeleton />}
 
      {!loading && data && (
        <div className="row ">

          
          {/* <div className={`alert ${data.can_access_management ? 'alert-success' : 'alert-warning'} d-flex justify-content-between align-items-center gap-3 flex-wrap`}>
            <span>
              {data.can_access_management
                ? 'Abonnement en cours.'
                : 'La gestion de l’entreprise est suspendue. Choisissez un plan ou contactez l’administration pour rétablir l’accès.'}
            </span>
               {current&& (
                  <div className="small text-muted mb-3">
                    <div className="d-flex justify-content-between py-1 border-bottom">
                      <span>Échéance :</span>
                      <strong className="text-dark">{formatDate(validUntil || null)}</strong>
                    </div>
                  </div>
                ) }

            {data.can_access_management && (
              <button type="button" className="btn btn-success" onClick={() => navigate('/tenant-dashboard')}>
                Accéder à la gestion <ArrowRight size={16} className="ms-2" />
              </button>
            )}
          </div> */}

          {data.pending && (
            <div className=" col-lg-12 alert alert-warning d-flex justify-content-between gap-3 align-items-start">
              <div><strong>Demande en attente :</strong> {data.pending.plan.name} ({formatMoney(data.pending.price, data.pending.currency)} / {data.pending.billing_interval}). L’administration doit la valider.</div>
              <span className="badge text-bg-warning">En attente</span>
            </div>
          )}

         
          {/* Colonne Gauche : État actuel & Usage */}
          <div className="col-lg-4">
            <div className="card  shadow-sm rounded-3 mb-4 bg-white overflow-hidden">
              <div className="p-4 bg-gradient m-1 border-bottom">
                <div className="d-flex justify-content-between align-items-center mb-2 ">
                  <span className="text-muted small fw-medium">Statut</span>
                  {current && (
                    <span className={`badge px-3 py-1 rounded-pill ${current.status === 'active' ? 'bg-success-subtle text-success' : current.status === 'trial' ? 'bg-primary-subtle text-primary' : 'bg-secondary-subtle text-secondary'}`}>
                      {readableStatus(current.status)}
                    </span>
                  )}
                </div>
                <h3 className="h4 fw-bold mb-1 text-dark">{current?.plan.name || 'Aucun abonnement'}</h3>
                {current && (
                  <div className="text-primary fw-semibold mt-2">
                    {formatMoney(current.price, current.currency)} <span className="text-muted fw-normal small">/ {current.billing_interval}</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                {current ? (
                  <div className="small text-muted mb-3">
                    <div className="d-flex justify-content-between py-1 border-bottom">
                      <span>Échéance :</span>
                      <strong className="text-dark">{formatDate(validUntil || null)}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="small text-muted">Aucun plan actif actuellement rattaché.</p>
                )}

                {/* Utilisation */}
                <div className="mt-3">
                  <h6 className="text-uppercase small fw-bold text-muted mb-3">Consommation des ressources</h6>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="d-flex align-items-center gap-2"><Store size={14} className="text-primary" /> Magasins</span>
                      <strong>{data.usage.stores.used} / {data.usage.stores.limit ?? '∞'}</strong>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div className="progress-bar bg-primary rounded-pill" style={{ width: `${data.usage.stores.limit ? Math.min((data.usage.stores.used / data.usage.stores.limit) * 100, 100) : 10}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="d-flex align-items-center gap-2"><Users size={14} className="text-primary" /> Utilisateurs</span>
                      <strong>{data.usage.users.used} / {data.usage.users.limit ?? '∞'}</strong>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div className="progress-bar bg-primary rounded-pill" style={{ width: `${data.usage.users.limit ? Math.min((data.usage.users.used / data.usage.users.limit) * 100, 100) : 10}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Accès gestion */}
                <div className="mt-4 pt-3 border-top">
                  {data.can_access_management ? (
                    <button type="button" className="btn btn-dark w-100 rounded-3 py-2 d-flex align-items-center justify-content-center gap-2" onClick={() => navigate('/tenant-dashboard')}>
                      Tableau de bord <ArrowRight size={16} />
                    </button>
                  ) : (
                    <div className="alert alert-warning p-2 small mb-0 rounded-3 d-flex align-items-center gap-2">
                      <ShieldAlert size={18} className="flex-shrink-0" />
                      <span>Gestion suspendue. Choisissez un plan ci-contre.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

         
          </div>

          {/* Colonne Droite : Sélection des plans (Grille moderne) */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-3 p-4 bg-white">
              <div className="d-flex align-items-center gap-2 mb-3">
                <CreditCard size={20} className="text-primary" />
                <h2 className="h5 fw-bold mb-0">Modifier ou choisir un plan</h2>
              </div>
              <p className="text-muted small mb-4">Sélectionnez la formule adaptée à vos besoins. L'activation sera validée par l'administration.</p>

              <div className="row g-3">
                {data.plans.map(plan => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <div className="col-md-6" key={plan.id}>
                      <div 
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`card h-100 p-3 rounded-4 cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary-subtle bg-opacity-10 shadow-sm' : 'border bg-light text-muted'}`}
                        style={{ cursor: 'pointer', borderWidth: isSelected ? '2px' : '1px' }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5 className="fw-bold text-dark mb-0">{plan.name}</h5>
                          {isSelected && <span className="badge bg-primary rounded-pill">Sélectionné</span>}
                        </div>
                        <div className="h4 fw-bold text-primary mb-2">
                          {formatMoney(plan.price, plan.currency)} <small className="fs-6 fw-normal text-muted">/ {plan.billing_interval}</small>
                        </div>
                        <p className="small text-muted mb-3" style={{ minHeight: '35px' }}>{plan.description || 'Offre standard'}</p>
                        
                        <div className="mt-auto pt-2 border-top">
                          <div className="small fw-semibold text-dark mb-2">Inclus :</div>
                          {plan.features?.map(f => (
                            <div key={f} className="small d-flex align-items-center gap-2 text-dark mb-1">
                              <Check size={14} className="text-success" /> {f}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-3">
                <button type="button" className="btn btn-primary px-4 py-2 rounded-3 fw-medium" onClick={() => void requestPlan()} disabled={saving || !selectedPlanId}>
                  {saving ? 'Traitement en cours…' : 'Soumettre la demande de plan'}
                </button>

                {current && ['active', 'trial'].includes(current.status) && (
                  <button type="button" className="btn btn-outline-danger btn-sm rounded-3" onClick={() => void cancelSubscription()} disabled={saving}>
                    Résilier l'abonnement
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}