import { useContext, useState, type FormEvent } from 'react';
import { KeyRound, LogIn, ShieldCheck } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import OtpInput from '../../components/common/OtpInput';
import { Spinner } from '../../components/common/Spinner';
import { TenantLogo } from '../../components/common/TenantLogo';
import { getInitialRoute } from '../../utils/auth/getInitialRoute';

type LoginOtpState = {
  challengeToken?: string;
};

export default function LoginOtp() {
  const { verifyLoginOtp, tenantSettings } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as LoginOtpState;
  const challengeToken = state.challengeToken;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  if (!challengeToken) {
    return <Navigate to="/login" replace />;
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (otp.length !== 6 || loading) return;

    setLoading(true);
    try {
      const result = await verifyLoginOtp(challengeToken, otp);
      if (result?.authenticated) {
        navigate(getInitialRoute(result.permissions || [], result.roles, result.activeStoreId), { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-3" style={{ backgroundColor: 'rgba(15, 23, 42, 0.05)' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
            <div className="card shadow-lg border-0 rounded-3 overflow-hidden">
              <div className="border-bottom bg-white py-3 px-4">
                <h5 className="modal-title text-dark d-flex align-items-center gap-2 m-0 fs-6 fw-normal">
                  <span className="bg-light text-primary d-flex align-items-center justify-content-center p-2 rounded">
                    {tenantSettings?.logo_path
                      ? <TenantLogo style={{ width: 22, height: 22 }} />
                      : <LogIn size={18} />}
                  </span>
                  {tenantSettings?.name
                    ? `${tenantSettings.name} — vérification de connexion`
                    : 'Vérification de connexion'}
                </h5>
              </div>

              <form onSubmit={event => void submit(event)}>
                <div className="pt-4 px-4 pb-2 bg-white fw-normal">
                  <p className="text-secondary d-flex align-items-center gap-1 mb-3 fs-7">
                    <KeyRound size={14} />
                    Saisissez le code à 6 chiffres envoyé à votre adresse e-mail.
                  </p>
                  <fieldset className="custom-fieldset mb-3">
                    <legend className="d-flex align-items-center gap-1">
                      <ShieldCheck size={12} /> Code de vérification <span className="text-danger">*</span>
                    </legend>
                    <OtpInput otp={otp} setOtp={setOtp} disabled={loading} />
                  </fieldset>
                </div>

                <div className="border-top pt-3 pb-4 px-4 bg-white">
                  <button
                    type="submit"
                    className="btn btn-primary px-4 fw-normal d-flex align-items-center gap-2 w-100 justify-content-center"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? <Spinner /> : <ShieldCheck size={16} />}
                    Vérifier et se connecter
                  </button>
                  <div className="text-center small mt-3">
                    <Link to="/login" className="d-inline-flex align-items-center gap-1">
                      Retour à la connexion
                    </Link>
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
