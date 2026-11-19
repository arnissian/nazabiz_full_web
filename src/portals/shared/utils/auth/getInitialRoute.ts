const permissionRoutes: Array<[string, string]> = [
  ['pos.access', '/pos'],
  ['products.view', '/pos/stocks'],
  ['sales.view', '/pos/sales'],
  ['customers.view', '/pos/customers'],
  ['quotations.view', '/pos/quotations'],
  ['purchases.view', '/pos/purchases'],
  ['expenses.view', '/pos/expenses'],
  ['reports.sales', '/pos/reports'],
  ['reports.stocks', '/pos/reports'],
  ['reports.financial', '/pos/reports'],
];

type Role = {
  name?: string;
  permissions?: Array<string | { name?: string }>;
};

export function getInitialRoute(permissions: string[], roles: Role[] = [], activeStoreId?: string): string {
  const effectivePermissions = [
    ...permissions,
    ...roles.flatMap(role => role.permissions?.map(
      permission => typeof permission === 'string' ? permission : permission.name || ''
    ) || []),
  ];
  if (effectivePermissions.includes('*') || roles.some(role => role.name === 'super_admin')) {
    return '/tenant-dashboard';
  }

  return permissionRoutes.find(([permission]) => effectivePermissions.includes(permission))?.[1]
    ?? (effectivePermissions.includes('settings.manage') && activeStoreId
      ? `/pos/stores/${activeStoreId}/settings`
      : '/access-denied');
}
