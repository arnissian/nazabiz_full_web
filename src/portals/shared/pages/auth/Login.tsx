import React, { useContext, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, LogIn, KeyRound } from "lucide-react";
import { AppContext } from "../../context/AppContext";
import { Spinner } from "../../components/common/Spinner";
import { useIsAuthenticated } from "../../utils/auth/useIsAuthenticated";
import { TenantLogo } from "../../components/common/TenantLogo";
import { getInitialRoute } from "../../utils/auth/getInitialRoute";


export default function Login() {
  const { login, tenantSettings, auth } = useContext(AppContext);
  const nav = useNavigate();
  const location = useLocation();
  const isAuthenticated= useIsAuthenticated();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // ✅ ajout du state loading

  const handleLogin = async () => {
    setError("");

    if (!email.trim() || !password) {
      setError("Veuillez renseigner vos identifiants.");
      return;
    }

    setLoading(true); // ✅ active le spinner
    try {
      const result = await login(email, password);
      if (result.authenticated) {
        const permissions = result.permissions || [];
        nav(getInitialRoute(permissions, result.roles, result.activeStoreId), { replace: true });
      } else if (result.challengeToken) {
        nav("/login/otp", { state: { challengeToken: result.challengeToken } });
      } else {
        setError("Impossible de vous connecter. Vérifiez vos identifiants.");
      }
    } catch {
      setError("Erreur inattendue lors de la connexion.");
    } finally {
      setLoading(false); // ✅ désactive le spinner
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };
  if (isAuthenticated) {
    return <Navigate to={getInitialRoute(auth?.permissions || [], auth?.user?.roles || [])} replace />;
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-3" style={{ backgroundColor: 'rgba(15, 23, 42, 0.05)' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
            <div className="card shadow-lg border-0 rounded-3 overflow-hidden">
              
              {/* En-tête */}
              <div className="border-bottom bg-white py-3 px-4">
                <h5 className="modal-title text-dark d-flex align-items-center text-primary gap-2 m-0 fs-6 fw-normal">
                  <div className="bg-primary-subtle p-2 rounded bg-light text-turquoise d-flex align-items-center justify-content-center" style={{ width: 38, height: 38 }}>
                    {tenantSettings?.logo_path
                      ? <TenantLogo style={{ width: 32, height: 32 }} />
                      : <LogIn size={18} className="text-primary" />}
                  </div>
                  <span className="d-flex flex-column">
                    <span>{tenantSettings?.name || 'Connexion'}</span>
                    {tenantSettings?.name && <span className="text-muted small">Connexion</span>}
                  </span>
                </h5>
              </div>

              {/* Corps */}
              <div className="pt-4 px-4 pb-2 bg-white fw-normal" onKeyDown={handleKeyDown}>
                <p className="text-secondary d-flex align-items-center gap-1 mb-3 fs-7 fw-normal">
                  <KeyRound size={14} /> Accédez à votre espace de gestion
                </p>

                {error && (
                  <div className="alert alert-danger py-2 mb-3 fs-7" role="alert">
                    {error}
                  </div>
                )}
                {location.state?.passwordReset && (
                  <div className="alert alert-success py-2 mb-3 fs-7" role="status">
                    Votre mot de passe a été réinitialisé. Vous pouvez vous connecter.
                  </div>
                )}

                <fieldset className="custom-fieldset mb-3">
                  <legend className="d-flex align-items-center gap-1">
                    <Mail size={12} /> Adresse e-mail <span className="text-danger">*</span>
                  </legend>
                  <input
                    type="email"
                    placeholder="nom@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading} // ✅ désactive pendant le chargement
                  />
                </fieldset>

                <fieldset className="custom-fieldset mb-0">
                  <legend className="d-flex align-items-center gap-1">
                    <LockKeyhole size={12} /> Mot de passe <span className="text-danger">*</span>
                  </legend>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading} // ✅ désactive pendant le chargement
                  />
                </fieldset>
                <div className="text-end mt-2">
                  <Link to="/forgot-password" className="small">Mot de passe oublié ?</Link>
                </div>
              </div>

              {/* Bouton */}
              <div className="border-top pt-3 pb-4 px-4 d-flex justify-content-end">
                <div className="w-100">
                  <button
                    type="button"
                    onClick={handleLogin}
                    className="btn btn-primary px-4 fw-normal d-flex align-items-center gap-2 w-100 justify-content-center"
                    disabled={loading}
                  >
                    {loading && <Spinner />}
                    Se connecter
                  </button>
                  <div className="text-center small mt-3">
                    Nouvelle entreprise ? <a href={import.meta.env.VITE_WEB_SIGNUP_URL || 'http://localhost:5175'}>Créer un compte</a>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
