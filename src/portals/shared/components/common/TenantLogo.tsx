import { useContext } from 'react';
import type { CSSProperties } from 'react';
import { AppContext } from '../../context/AppContext';
import { uploads } from '../../config/env';

interface TenantLogoProps {
  alt?: string;
  className?: string;
  style?: CSSProperties;
}

export function TenantLogo({ alt, className, style }: TenantLogoProps) {
  const { tenantSettings } = useContext(AppContext);
  if (!tenantSettings?.logo_path) return null;

  return (
    <img
      src={`${uploads}/${tenantSettings.logo_path.replace(/^\/+/, '')}`}
      alt={alt || `${tenantSettings.name || 'Entreprise'} — logo`}
      className={className}
      style={{ objectFit: 'contain', ...style }}
    />
  );
}
