import { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { getInitialRoute } from '../../utils/auth/getInitialRoute';

function requiredPermissions(path: string): string[] | null {
  const segments = path.split('/').filter(Boolean);
  const [section, page, thirdSegment] = segments;

  if (section === 'tenant-subscription' || section === 'tenant-dashboard'
    || section === 'stores' || section === 'financial-accounts'
    || section === 'tenant-settings' || section === 'devises' || section === 'languages') {
    return ['settings.manage'];
  }
  if (section === 'users') return ['users.manage'];
  if (section === 'roles') return ['roles.manage'];
  if (['domains', 'categories', 'subcategories', 'brands', 'units', 'products'].includes(section)) {
    return ['products.view'];
  }
  if (section === 'suppliers') return ['suppliers.view'];
  if (section !== 'pos') return null;

  if (!page || page === 'dashboard' || page === 'sessions') return ['pos.access'];
  if (page === 'financial-accounts') return ['settings.manage'];
  if (['stocks', 'stock-movements', 'inventories', 'stock-transfers'].includes(page)) {
    return ['products.view'];
  }
  if (page === 'customers') return ['customers.view'];
  if (page === 'sales') return segments.includes('edit') ? ['sales.edit'] : ['sales.view'];
  if (page === 'quotations') return ['quotations.view'];
  if (['deliveries', 'payments', 'sale-returns', 'receivables'].includes(page)) return ['sales.view'];
  if (['purchases', 'purchase-payments', 'purchase-returns'].includes(page)) return ['purchases.view'];
  if (page === 'expenses') {
    return thirdSegment === 'categories' ? ['expenses.categories.manage'] : ['expenses.view'];
  }
  if (page === 'reports') return ['reports.sales', 'reports.stocks', 'reports.financial'];
  if (page === 'stores') return ['settings.manage'];

  return null;
}

export default function RoleAccessGate() {
  const { auth, hasPermission } = useContext(AppContext);
  const location = useLocation();
  const required = requiredPermissions(location.pathname);
  const isSuperAdmin = auth?.user?.roles?.some(role => role.name === 'super_admin') ?? false;
  const requiresCompanyAdmin = location.pathname !== '/'
    && location.pathname !== '/change-password'
    && !location.pathname.startsWith('/pos')
    && location.pathname !== '/access-denied';
  const isSaleEdit = location.pathname.startsWith('/pos/sales/') && location.pathname.endsWith('/edit');
  const allowed = (!requiresCompanyAdmin || isSuperAdmin)
    && (!required || required.some(hasPermission))
    && (!isSaleEdit || hasPermission('sales.view'));

  if (location.pathname === '/access-denied' && auth) {
    const destination = getInitialRoute(
      auth.permissions || [],
      auth.user?.roles || [],
      auth.active_store?.id,
    );
    if (destination !== '/access-denied') {
      return <Navigate to={destination} replace />;
    }
  }

  if (allowed) return <Outlet />;

  const destination = getInitialRoute(auth?.permissions || [], auth?.user?.roles || [], auth?.active_store?.id);
  if (destination !== location.pathname) {
    return <Navigate to={destination} replace />;
  }

  return (
    <div className="container py-4">
      <div className="alert alert-danger" role="alert">
        Votre rôle ne vous autorise pas à accéder à cette page.
      </div>
    </div>
  );
}
