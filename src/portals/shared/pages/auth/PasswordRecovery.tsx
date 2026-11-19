import { useContext, useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import axiosInstance from '../../services/api/axiosInterceptor';
import OtpInput from '../../components/common/OtpInput';
import PasswordSecurity from '../../components/common/PasswordSecurity';
import { AppContext } from '../../context/AppContext';
import { TenantLogo } from '../../components/common/TenantLogo';

type RecoveryStep = 'email' | 'otp' | 'reset';
type RecoveryState = { email?: string; reset_token?: string };
type RecoveryResponse = { status: number; message?: string; reset_token?: string };

export default function PasswordRecovery({ step }: { step: RecoveryStep }) {
  const { tenantSettings } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const recoveryState = (location.state ?? {}) as RecoveryState;
  const emailFromState = recoveryState.email ?? '';
  const resetToken = recoveryState.reset_token ?? '';

  const [email, setEmail] = useState(step === 'email' ? '' : emailFromState);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    if ((step === 'otp' && !emailFromState) || (step === 'reset' && (!emailFromState || !resetToken))) {
      navigate('/forgot-password', { replace: true });
    }
  }, [emailFromState, navigate, resetToken, step]);

  useEffect(() => {
    if (step !== 'otp' || resendTimer <= 0) return;
    const timer = window.setTimeout(() => setResendTimer(current => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendTimer, step]);

  const getErrorMessage = (requestError: unknown) => {
    if (axios.isAxiosError<{ message?: string }>(requestError)) {
      return requestError.response?.data?.message ?? 'Erreur serveur, veuillez réessayer.';
    }
    return requestError instanceof Error ? requestError.message : 'Une erreur inattendue est survenue.';
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 'otp' && otp.length !== 6) {
      setError('Veuillez saisir le code à 6 chiffres.');
      return;
    }
    if (step === 'reset' && (!isPasswordValid || password !== passwordConfirmation)) {
      setError(password !== passwordConfirmation
        ? 'Les mots de passe ne correspondent pas.'
        : 'Veuillez choisir un mot de passe plus sécurisé.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (step === 'email') {
        const response = await axiosInstance.post<RecoveryResponse>('/auth/email-verify', { email });
        if (response.data.status !== 200) throw new Error(response.data.message || 'Impossible d’envoyer le code.');
        navigate('/otp-verify', { state: { email } });
      } else if (step === 'otp') {
        const response = await axiosInstance.post<RecoveryResponse>('/auth/otp-verify', { email: emailFromState, otp });
        if (response.data.status !== 200 || !response.data.reset_token) {
          throw new Error(response.data.message || 'Code de vérification invalide.');
        }
        navigate('/password-reset', {
          state: { email: emailFromState, reset_token: response.data.reset_token },
        });
      } else {
        if (password !== passwordConfirmation) {
          throw new Error('Les mots de passe ne correspondent pas.');
        }
        const response = await axiosInstance.post<RecoveryResponse>('/auth/reset-password', {
          email: emailFromState,
          password,
          password_confirmation: passwordConfirmation,
          reset_token: resetToken,
        });
        if (response.data.status !== 200) throw new Error(response.data.message || 'La réinitialisation a échoué.');
        navigate('/login', { replace: true, state: { passwordReset: true } });
      }
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendTimer > 0 || loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.post<RecoveryResponse>('/auth/email-verify', { email: emailFromState });
      if (response.data.status !== 200) throw new Error(response.data.message || 'Impossible de renvoyer le code.');
      setResendTimer(60);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<RecoveryStep, string> = {
    email: 'Mot de passe oublié',
    otp: 'Vérifier le code',
    reset: 'Nouveau mot de passe',
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-3" style={{ backgroundColor: 'rgba(15, 23, 42, 0.05)' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
            <div className="card shadow-lg border-0 rounded-3 overflow-hidden">
              <div className="border-bottom bg-white py-3 px-4">
                <h1 className="modal-title text-dark d-flex align-items-center gap-2 m-0 fs-6 fw-normal">
                  <span className="bg-light text-primary p-2 rounded d-flex align-items-center justify-content-center">
                    {tenantSettings?.logo_path
                      ? <TenantLogo style={{ width: 22, height: 22 }} />
                      : <ShieldCheck size={18} />}
                  </span>
                  {tenantSettings?.name ? `${tenantSettings.name} — ${titles[step]}` : titles[step]}
                </h1>
              </div>

              <form onSubmit={event => void submit(event)}>
                <div className="pt-1 px-4 pb-2  bg-white">
                  <p className="text-secondary ">
                      {step === 'email' && 'Recevez un code de vérification par e-mail.'}
                    {step === 'otp' && `Saisissez le code envoyé à ${emailFromState}.`}
                    {step === 'reset' && 'Choisissez un nouveau mot de passe sécurisé.'}
                  </p>

                  {error && <div className="alert alert-danger py-2 mb-3 fs-7" role="alert">{error}</div>}

                  {step === 'email' && (
                    <fieldset className="custom-fieldset mb-3">
                      <legend className="d-flex align-items-center gap-1"><Mail size={12} />Adresse e-mail <span className="text-danger">*</span></legend>
                      <input type="email" autoComplete="email" placeholder="nom@exemple.com" required value={email} onChange={event => setEmail(event.target.value)} disabled={loading} />
                    </fieldset>
                  )}

                  {step === 'otp' && (
                        <OtpInput otp={otp} setOtp={setOtp} disabled={loading} />
                    )}

                  {step === 'reset' && (
                    <>
                      <fieldset className="custom-fieldset mb-3">
                        <legend className="d-flex align-items-center gap-1"><LockKeyhole size={12} />Nouveau mot de passe <span className="text-danger">*</span></legend>
                        <input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} disabled={loading} />
                      </fieldset>
                      <fieldset className="custom-fieldset mb-3">
                        <legend className="d-flex align-items-center gap-1"><LockKeyhole size={12} />Confirmer le mot de passe <span className="text-danger">*</span></legend>
                        <input type="password" autoComplete="new-password" minLength={8} required value={passwordConfirmation} onChange={event => setPasswordConfirmation(event.target.value)} disabled={loading} />
                      </fieldset>
                      {passwordConfirmation && (
                        <p className={password === passwordConfirmation ? 'text-success small' : 'text-danger small'}>
                          {password === passwordConfirmation ? 'Les mots de passe correspondent.' : 'Les mots de passe ne correspondent pas.'}
                        </p>
                      )}
                      <PasswordSecurity password={password} onValidate={setIsPasswordValid} />
                    </>
                  )}
                </div>

                <div className="border-top pt-3 pb-4 px-4 bg-white">
                  <button
                    type="submit"
                    className="btn btn-primary px-4 fw-normal d-flex align-items-center gap-2 w-100 justify-content-center"
                    disabled={loading || (step === 'otp' && otp.length !== 6) || (step === 'reset' && (!isPasswordValid || password !== passwordConfirmation))}
                  >
                    {loading ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : <ShieldCheck size={16} />}
                    {step === 'email' && 'Envoyer le code'}
                    {step === 'otp' && 'Vérifier le code'}
                    {step === 'reset' && 'Réinitialiser le mot de passe'}
                  </button>
                  {step === 'otp' && (
                    <button type="button" className="btn btn-link w-100 mt-2" onClick={() => void resendCode()} disabled={loading || resendTimer > 0}>
                      {resendTimer > 0 ? `Renvoyer le code dans ${resendTimer}s` : 'Renvoyer le code'}
                    </button>
                  )}
                  <div className="text-center small mt-3">
                    <Link to="/login" className="d-inline-flex align-items-center gap-1"><ArrowLeft size={14} />Retour à la connexion</Link>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
