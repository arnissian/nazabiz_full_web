import { AppContext } from '../../context/AppContext';
import { useContext } from 'react';
import { TenantLogo } from './TenantLogo';

export function TenantDocumentHeader() {
  const { tenantSettings } = useContext(AppContext);

  return (
    <header className="d-none d-print-flex align-items-center gap-3 border-bottom pb-3 mb-4">
      {tenantSettings?.logo_path && (
        <TenantLogo style={{ maxWidth: 100, maxHeight: 64 }} />
      )}
      <div>
        <h2 className="h5 fw-bold mb-1">{tenantSettings?.name || 'Entreprise'}</h2>
        <div className="small text-muted">
          {[tenantSettings?.address, tenantSettings?.phone, tenantSettings?.email]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </div>
    </header>
  );
}
