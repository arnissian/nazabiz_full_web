import { useEffect } from 'react';

interface PasswordSecurityProps {
  password: string;
  onValidate?: (isValid: boolean) => void;
}

type SecurityLevel = {
  score: number;
  level: 'faible' | 'moyen' | 'élevé';
  color: string;
};

function checkPasswordStrength(password: string): SecurityLevel {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score >= 5) return { score, level: 'élevé', color: '#22c55e' };
  if (score >= 3) return { score, level: 'moyen', color: '#eab308' };
  return { score, level: 'faible', color: '#ef4444' };
}

export default function PasswordSecurity({ password, onValidate }: PasswordSecurityProps) {
  const security = checkPasswordStrength(password);

  useEffect(() => {
    onValidate?.(checkPasswordStrength(password).level !== 'faible');
  }, [onValidate, password]);

  if (!password) return null;

  const activeBars = security.level === 'élevé' ? 3 : security.level === 'moyen' ? 2 : 1;
  const description = security.level === 'élevé'
    ? 'Mot de passe très sécurisé'
    : security.level === 'moyen'
      ? 'Mot de passe acceptable'
      : 'Mot de passe trop faible';

  return (
    <div style={{ margin: '8px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', gap: 4, height: 4, marginBottom: 8 }}>
        {[1, 2, 3].map(bar => (
          <span
            key={bar}
            title={['Faible', 'Moyen', 'Élevé'][bar - 1]}
            style={{
              flex: 1,
              backgroundColor: bar <= activeBars ? security.color : '#e5e7eb',
              transition: 'background-color 0.3s ease',
            }}
          />
        ))}
      </div>
      <p style={{ color: security.color, fontSize: 12, fontWeight: 500, margin: 0 }}>
        {description}
      </p>
    </div>
  );
}
