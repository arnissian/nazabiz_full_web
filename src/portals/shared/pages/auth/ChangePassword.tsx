import { useContext, useState, type FormEvent } from 'react';
import axios from 'axios';
import { LockKeyhole } from 'lucide-react';
import { toast } from 'react-toastify';
import { AppContext } from '../../context/AppContext';
import axiosInstance from '../../services/api/axiosInterceptor';
import PasswordSecurity from '../../components/common/PasswordSecurity';

type ChangePasswordResponse = {
  status: number;
  message?: string;
  data?: { token?: string };
};

export default function ChangePassword() {
  const { auth, saveAuth, saveToken } = useContext(AppContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth?.user) {
      setError('La session utilisateur est indisponible.');
      return;
    }
    if (password.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.post<ChangePasswordResponse>('/auth/change-password', {
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      });
      const token = response.data.data?.token;
      if (response.data.status !== 200 || !token) {
        throw new Error(response.data.message || 'Réponse de changement de mot de passe invalide.');
      }

      saveToken(token);
      saveAuth({ ...auth, token });
      setCurrentPassword('');
      setPassword('');
      setPasswordConfirmation('');
      toast.success(response.data.message || 'Mot de passe modifié avec succès.');
    } catch (requestError: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(requestError)
        ? requestError.response?.data?.message
        : requestError instanceof Error ? requestError.message : null;
      setError(message || 'Impossible de modifier le mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h1 className="h5 d-flex align-items-center gap-2 mb-3">
                <LockKeyhole size={20} className="text-primary" />
                Changer le mot de passe
              </h1>
              <p className="text-secondary">Saisissez votre mot de passe actuel et choisissez-en un nouveau.</p>
              {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
              <form onSubmit={event => void submit(event)}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="current-password">Mot de passe actuel</label>
                  <input
                    id="current-password"
                    className="form-control"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={currentPassword}
                    onChange={event => setCurrentPassword(event.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="new-password">Nouveau mot de passe</label>
                  <input
                    id="new-password"
                    className="form-control"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    disabled={loading}
                  />
                  <PasswordSecurity password={password} />
                </div>
                <div className="mb-4">
                  <label className="form-label" htmlFor="password-confirmation">Confirmer le nouveau mot de passe</label>
                  <input
                    id="password-confirmation"
                    className="form-control"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={passwordConfirmation}
                    onChange={event => setPasswordConfirmation(event.target.value)}
                    disabled={loading}
                  />
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Enregistrement...' : 'Enregistrer le nouveau mot de passe'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
