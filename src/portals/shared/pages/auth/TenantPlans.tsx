import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Building2, Check, ChevronLeft, Sparkles, Store, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/api/axiosInterceptor';
import './TenantPlans.css';

interface SubscriptionPlan {
  id: string | number;
  name: string;
  description?: string | null;
  price: number | string;
  currency: string;
  billing_interval: string;
  max_stores?: number | null;
  max_users?: number | null;
  features?: string[] | null;
  is_recommended?: boolean;
  is_popular?: boolean;
}

interface PlansResponse {
  data?: SubscriptionPlan[];
}

const intervalLabels: Record<string, string> = {
  monthly: 'mois',
  quarterly: 'trimestre',
  yearly: 'an',
  lifetime: 'à vie',
};

function formatPrice(plan: SubscriptionPlan) {
  const amount = Number(plan.price);
  if (!Number.isFinite(amount)) return `${plan.price} ${plan.currency}`;
  if (amount === 0) return 'Gratuit';
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: plan.currency || 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString('fr-FR')} ${plan.currency}`;
  }
}

function priceInterval(plan: SubscriptionPlan) {
  if (Number(plan.price) === 0 || plan.billing_interval === 'lifetime') return '';
  return `/ ${intervalLabels[plan.billing_interval] || plan.billing_interval}`;
}

function TenantPlanSkeleton({ index }: { index: number }) {
  return (
    <div className="col-12 col-md-6 col-xl-4" aria-hidden="true">
      <article className="tenant-plan-card tenant-plan-skeleton h-100">
        <div className="tenant-plan-heading">
          <span className={`tenant-plan-icon ${index % 2 === 1 ? 'is-warm' : ''}`}>
            <span className="dashboard-skeleton-shimmer rounded" style={{ width: 21, height: 21 }} />
          </span>
          <div className="flex-grow-1">
            <div className="dashboard-skeleton-shimmer rounded mb-2" style={{ width: '55%', height: 17 }} />
            <div className="dashboard-skeleton-shimmer rounded" style={{ width: '86%', height: 11 }} />
          </div>
        </div>
        <div className="tenant-plan-price">
          <span className="dashboard-skeleton-shimmer rounded" style={{ width: 112, height: 29 }} />
          <span className="dashboard-skeleton-shimmer rounded" style={{ width: 42, height: 12 }} />
        </div>
        <div className="tenant-plan-divider" />
        <div className="tenant-plan-features">
          {[62, 52, 68].map((width, row) => (
            <div className="tenant-plan-feature" key={row}>
              <span className="dashboard-skeleton-shimmer rounded" style={{ width: 16, height: 16 }} />
              <span className="dashboard-skeleton-shimmer rounded" style={{ width: `${width}%`, height: 11 }} />
            </div>
          ))}
        </div>
        <div className="dashboard-skeleton-shimmer rounded-3 mt-auto" style={{ height: 46 }} />
      </article>
    </div>
  );
}

export default function TenantPlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const fetchPlans = async () => {
      try {
        const response = await axiosInstance.get<PlansResponse>('/public/subscription-plans');
        if (!active) return;
        if (!Array.isArray(response.data?.data)) {
          throw new Error('La liste des forfaits reçue est invalide.');
        }
        setPlans(response.data.data);
        if (response.data.data.length === 0) {
          setError('Aucun forfait n’est disponible pour le moment. Veuillez réessayer plus tard.');
        }
      } catch {
        if (active) setError('Impossible de charger les forfaits. Veuillez réessayer plus tard.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchPlans();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="tenant-plans-page">
      <div className="container tenant-plans-container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Link to="/login" className="tenant-plans-back">
            <ChevronLeft size={18} />
            <span>Retour</span>
          </Link>
          <span className="tenant-plans-step">CRÉATION D’ENTREPRISE</span>
          <span className="tenant-plans-step-spacer" aria-hidden="true" />
        </div>

        <section className="tenant-plans-hero text-center">
          <span className="tenant-plans-eyebrow">
            <Sparkles size={15} />
            <span>VOTRE ENTREPRISE, À VOTRE RYTHME</span>
          </span>
          <h1>Choisissez votre forfait</h1>
          <p>Les bons outils pour démarrer, piloter et faire grandir votre activité.</p>
        </section>

        {loading && (
          <div className="row g-4 tenant-plans-grid" role="status" aria-label="Chargement des forfaits">
            {Array.from({ length: 3 }, (_, index) => (
              <TenantPlanSkeleton key={index} index={index} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="tenant-plans-error" role="alert">
            <Building2 size={22} />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div className="row g-4 tenant-plans-grid">
            {plans.map((plan, index) => {
              const recommended = Boolean(plan.is_recommended || plan.is_popular);
              const features = plan.features?.filter(feature => typeof feature === 'string') ?? [];
              const selectedPlan = {
                id: String(plan.id),
                name: plan.name,
                description: plan.description || '',
              };

              return (
                <div className="col-12 col-md-6 col-xl-4" key={String(plan.id)}>
                  <article className={`tenant-plan-card h-100 ${recommended ? 'is-recommended' : ''}`}>
                    {recommended && (
                      <span className="tenant-plan-badge">
                        <Sparkles size={13} />
                        Recommandé
                      </span>
                    )}
                    <div className="tenant-plan-heading">
                      <span className={`tenant-plan-icon ${index % 2 === 1 ? 'is-warm' : ''}`}>
                        <Building2 size={21} />
                      </span>
                      <div>
                        <h2>{plan.name}</h2>
                        <p>{plan.description || 'Une formule adaptée à votre entreprise.'}</p>
                      </div>
                    </div>

                    <div className="tenant-plan-price">
                      <strong>{formatPrice(plan)}</strong>
                      {priceInterval(plan) && <span>{priceInterval(plan)}</span>}
                    </div>

                    <div className="tenant-plan-divider" />
                    <div className="tenant-plan-features">
                      <div className="tenant-plan-feature">
                        <Store size={16} />
                        <span>Jusqu’à {plan.max_stores ?? '∞'} magasin(s)</span>
                      </div>
                      <div className="tenant-plan-feature">
                        <Users size={16} />
                        <span>Jusqu’à {plan.max_users ?? '∞'} utilisateur(s)</span>
                      </div>
                      {features.map(feature => (
                        <div className="tenant-plan-feature" key={feature}>
                          <Check size={16} />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className={`tenant-plan-action ${recommended ? 'is-recommended' : ''}`}
                      onClick={() => navigate(`/signup/${encodeURIComponent(selectedPlan.id)}`, { state: { plan: selectedPlan } })}
                    >
                      Choisir ce forfait
                      {recommended ? <BadgeCheck size={17} /> : <ArrowRight size={17} />}
                    </button>
                  </article>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && (
          <p className="tenant-plans-footer">Vous pourrez configurer votre entreprise après la création du compte.</p>
        )}
      </div>
    </main>
  );
}
