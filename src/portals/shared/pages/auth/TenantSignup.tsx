import { useContext, useEffect, useState, type FormEvent } from 'react';
import { BadgeCheck, Building2, CheckCircle2, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import axiosInstance from '../../services/api/axiosInterceptor';
import OtpInput from '../../components/common/OtpInput';
import { Spinner } from '../../components/common/Spinner';
import { TenantLogo } from '../../components/common/TenantLogo';
import { AppContext } from '../../context/AppContext';
import './TenantSignup.css';

interface SubscriptionPlan {
  id: string | number;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  billing_interval: string;
}

interface SignupForm {
  tenant_name: string;
  owner_name: string;
  email: string;
  subscription_plan_id: string;
}

interface SignupResponse {
  success: boolean;
  status?: number;
  token?: string;
  message?: string;
  errors?: Record<string, string[]>;
  data?: SubscriptionPlan[];
}

type SignupStep = 'details' | 'verification' | 'complete';

const SIGNUP_FAILURE = 'Impossible de traiter l’inscription pour le moment. Veuillez réessayer plus tard.';
const VERIFICATION_FAILURE = 'Impossible de finaliser l’inscription pour le moment. Veuillez réessayer plus tard.';

export default function TenantSignup() {
  const { tenantSettings } = useContext(AppContext);
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [form, setForm] = useState<SignupForm>({
    tenant_name: '',
    owner_name: '',
    email: '',
    subscription_plan_id: '',
  });
  const [step, setStep] = useState<SignupStep>('details');
  const [activationToken, setActivationToken] = useState('');
  const [otp, setOtp] = useState('');
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let active = true;
    const fetchPlans = async () => {
      try {
        const response = await axiosInstance.get<SignupResponse>('/public/subscription-plans');
        if (active) {
          const availablePlans = response.data.data ?? [];
          setPlans(availablePlans);
          if (availablePlans.length === 0) {
            setError('Aucune offre n’est disponible pour le moment. Veuillez réessayer plus tard.');
          }
          const routePlan = availablePlans.find(plan => String(plan.id) === planId);
          setForm(current => ({
            ...current,
            subscription_plan_id: routePlan ? String(routePlan.id) : '',
          }));
          if (!routePlan) {
            setError('Veuillez choisir un forfait disponible pour continuer.');
          }
        }
      } catch {
        if (active) setError('Impossible de charger les offres. Veuillez réessayer plus tard.');
      } finally {
        if (active) setLoadingPlans(false);
      }
    };

    void fetchPlans();
    return () => {
      active = false;
    };
  }, [planId]);

  const getRequestError = (requestError: unknown, fallback: string) => {
    if (axios.isAxiosError<SignupResponse>(requestError)) {
      const status = requestError.response?.status;
      if (!status || status >= 500) return fallback;

      const fieldError = Object.values(requestError.response?.data?.errors ?? {}).flat()[0];
      return fieldError
        ?? requestError.response?.data?.message
        ?? fallback;
    }

    return requestError instanceof Error
      ? requestError.message
      : fallback;
  };

  const createRegistration = async () => {
    if (loading) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await axiosInstance.post<SignupResponse>('/public/tenant-registrations', form);
      if (!response.data.success || !response.data.token) {
        throw new Error(response.data.status && response.data.status >= 500
          ? SIGNUP_FAILURE
          : 'Impossible de créer le compte entreprise. Veuillez vérifier les informations saisies.');
      }

      setActivationToken(response.data.token);
      setStep('verification');
      setSuccessMessage(`Un code de vérification a été envoyé à ${form.email}.`);
    } catch (requestError: unknown) {
      setError(getRequestError(requestError, SIGNUP_FAILURE));
    } finally {
      setLoading(false);
    }
  };

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createRegistration();
  };

  const verifyRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (otp.length !== 6 || loading) {
      if (otp.length !== 6) setError('Veuillez saisir le code de vérification à 6 chiffres.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.post<SignupResponse>(
        '/public/tenant-registrations/verify-otp',
        { email: form.email, otp, token: activationToken },
      );
      if (response.data.status !== 200) {
        throw new Error(response.data.status >= 500
          ? VERIFICATION_FAILURE
          : response.data.message || 'Le code de vérification est invalide ou expiré.');
      }

      setStep('complete');
    } catch (requestError: unknown) {
      setError(getRequestError(requestError, VERIFICATION_FAILURE));
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setOtp('');
    await createRegistration();
  };

  const formatPrice = (plan: SubscriptionPlan) => {
    const amount = Number(plan.price);
    if (amount === 0) return 'Gratuit';
    const price = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: plan.currency || 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
    const interval = ({
      monthly: 'mois',
      quarterly: 'trimestre',
      yearly: 'an',
      lifetime: 'à vie',
    } as Record<string, string>)[plan.billing_interval] || plan.billing_interval;
    return `${price} / ${interval}`;
  };
  const selectedPlan = plans.find(plan => String(plan.id) === form.subscription_plan_id);

  return (
    <div className="tenant-signup-page d-flex align-items-start justify-content-center py-4" style={{ backgroundColor: 'rgba(15, 23, 42, 0.05)' }}>
      <div className="container my-auto">
        <div className="row justify-content-center">
          <div className="col-12 col-md-9 col-lg-7 col-xl-6">
            <div className="card shadow-lg border-0 rounded-3 overflow-hidden">
              <div className="border-bottom bg-white py-3 px-4">
                <h1 className="d-flex align-items-center gap-2 m-0 fs-5 fw-semibold text-dark">
                  <span className="bg-light text-primary p-2 rounded d-flex align-items-center justify-content-center">
                    {tenantSettings?.logo_path
                      ? <TenantLogo style={{ width: 24, height: 24 }} />
                      : <Building2 size={20} />}
                  </span>
                  Créer un compte entreprise
                </h1>
              </div>

              {step === 'complete' ? (
                <div className="p-4 p-md-5 bg-white text-center">
                  <CheckCircle2 size={48} className="text-success mb-3" />
                  <h2 className="fs-4 fw-bold">Compte vérifié</h2>
                  <p className="text-secondary mb-4">
                    Votre entreprise est créée. Les informations de connexion ont été envoyées à <strong>{form.email}</strong>.
                  </p>
                  <button type="button" className="btn btn-primary px-4" onClick={() => navigate('/login', { replace: true, state: { signupCompleted: true } })}>
                    Aller à la connexion
                  </button>
                </div>
              ) : (
                <form onSubmit={event => void (step === 'details' ? submitRegistration(event) : verifyRegistration(event))}>
                  <div className="p-4 bg-white">
                    {step === 'details' ? (
                      <>
                        <p className="text-secondary mb-4">
                          Créez l’espace de votre entreprise et son compte administrateur.
                        </p>

                        {loadingPlans ? (
                          <section className="signup-selected-plan signup-selected-plan-skeleton" role="status" aria-label="Chargement du forfait">
                            <span className="signup-selected-plan-icon">
                              <span className="dashboard-skeleton-shimmer rounded" style={{ width: 20, height: 20 }} />
                            </span>
                            <div className="signup-selected-plan-main" aria-hidden="true">
                              <div className="dashboard-skeleton-shimmer rounded mb-2" style={{ width: 112, height: 10 }} />
                              <div className="dashboard-skeleton-shimmer rounded" style={{ width: '68%', height: 14 }} />
                              <div className="dashboard-skeleton-shimmer rounded mt-2" style={{ width: 88, height: 12 }} />
                            </div>
                            <div className="dashboard-skeleton-shimmer rounded" style={{ width: 50, height: 12 }} />
                          </section>
                        ) : selectedPlan ? (
                          <section className="signup-selected-plan" aria-label="Forfait sélectionné">
                            <span className="signup-selected-plan-icon">
                              <BadgeCheck size={20} />
                            </span>
                            <div className="signup-selected-plan-main">
                              <small className="signup-selected-plan-label">Forfait sélectionné</small>
                              <strong className="signup-selected-plan-name">{selectedPlan.name}</strong>
                              <span className="signup-selected-plan-price">{formatPrice(selectedPlan)}</span>
                            </div>
                            <Link to="/signup" className="signup-change-plan">Modifier</Link>
                          </section>
                        ) : null}
                        {selectedPlan?.description && (
                          <p className="signup-selected-plan-hint">{selectedPlan.description}</p>
                        )}

                        <fieldset className="custom-fieldset mb-3">
                          <legend className="d-flex align-items-center gap-1"><Building2 size={12} />Nom de l’entreprise <span className="text-danger">*</span></legend>
                          <input
                            type="text"
                            autoComplete="organization"
                            maxLength={191}
                            required
                            placeholder="Ex. Entreprise Exemple"
                            value={form.tenant_name}
                            onChange={event => setForm(current => ({ ...current, tenant_name: event.target.value }))}
                            disabled={loading}
                          />
                        </fieldset>

                        <fieldset className="custom-fieldset mb-3">
                          <legend className="d-flex align-items-center gap-1"><UserRound size={12} />Votre nom complet <span className="text-danger">*</span></legend>
                          <input
                            type="text"
                            autoComplete="name"
                            maxLength={150}
                            required
                            placeholder="Ex. Marie Dupont"
                            value={form.owner_name}
                            onChange={event => setForm(current => ({ ...current, owner_name: event.target.value }))}
                            disabled={loading}
                          />
                        </fieldset>

                        <fieldset className="custom-fieldset mb-3">
                          <legend className="d-flex align-items-center gap-1"><Mail size={12} />Adresse e-mail professionnelle <span className="text-danger">*</span></legend>
                          <input
                            type="email"
                            autoComplete="email"
                            maxLength={191}
                            required
                            placeholder="nom@entreprise.com"
                            value={form.email}
                            onChange={event => setForm(current => ({ ...current, email: event.target.value }))}
                            disabled={loading}
                          />
                        </fieldset>
                        <p className="small text-muted mb-0">
                          Un code sera envoyé par e-mail pour vérifier votre adresse. Après vérification, vos informations de connexion vous seront envoyées.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-secondary text-center mb-3">
                          Saisissez le code à 6 chiffres envoyé à <strong>{form.email}</strong>.
                        </p>
                        <OtpInput otp={otp} setOtp={setOtp} disabled={loading} />
                        <button
                          type="button"
                          className="btn btn-link w-100"
                          onClick={() => void resendCode()}
                          disabled={loading}
                        >
                          Renvoyer le code
                        </button>
                        <button
                          type="button"
                          className="btn btn-link w-100 pt-0"
                          onClick={() => {
                            setError('');
                            setSuccessMessage('');
                            setStep('details');
                          }}
                          disabled={loading}
                        >
                          Modifier les informations
                        </button>
                      </>
                    )}

                    {error && <div className="alert alert-danger py-2 mb-0 mt-3" role="alert">{error}</div>}
                    {successMessage && step === 'verification' && (
                      <div className="alert alert-success py-2 mb-0 mt-3" role="status">{successMessage}</div>
                    )}
                  </div>

                  <div className="border-top pt-3 pb-4 px-4 bg-white">
                    {step === 'details' ? (
                      <button
                        type="submit"
                        className="btn btn-primary d-flex align-items-center gap-2 w-100 justify-content-center"
                        disabled={loading || loadingPlans || !selectedPlan}
                      >
                        {loading ? <Spinner /> : <Building2 size={16} />}
                        Créer mon compte entreprise
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="btn btn-primary d-flex align-items-center gap-2 w-100 justify-content-center"
                        disabled={loading || otp.length !== 6}
                      >
                        {loading ? <Spinner /> : <ShieldCheck size={16} />}
                        Vérifier mon adresse e-mail
                      </button>
                    )}
                    <div className="text-center small mt-3">
                      Déjà un compte ? <Link to="/login">Se connecter</Link>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
