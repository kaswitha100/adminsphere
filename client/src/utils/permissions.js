export const PERMISSIONS = {
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  ROLES_MANAGE: 'roles.manage',
  REPORTS_VIEW: 'reports.view',
  AUDIT_VIEW: 'audit.view',
  NOTIFICATIONS_MANAGE: 'notifications.manage',
  SETTINGS_MANAGE: 'settings.manage'
};

/**
 * Check if the current user possesses the required permission
 */
export const canUser = (user, permission) => {
  if (!user || !user.role) return false;
  // Super Admin has universal access
  if (user.role.name === 'Super Admin') return true;

  const permissions = user.role.permissions || [];
  if (Array.isArray(permission)) {
    return permission.some((p) => permissions.includes(p));
  }
  return permissions.includes(permission);
};
