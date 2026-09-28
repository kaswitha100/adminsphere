import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import UserList from '../pages/users/UserList';
import UserDetail from '../pages/users/UserDetail';
import RoleManagement from '../pages/roles/RoleManagement';
import AuditLogs from '../pages/audit/AuditLogs';
import Analytics from '../pages/analytics/Analytics';
import NotificationCenter from '../pages/notifications/NotificationCenter';
import ProfileSettings from '../pages/profile/ProfileSettings';
import SystemSettings from '../pages/settings/SystemSettings';

import { PERMISSIONS } from '../utils/permissions';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected Administrative Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* User Management */}
        <Route
          path="users"
          element={
            <ProtectedRoute requiredPermission={PERMISSIONS.USERS_VIEW}>
              <UserList />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/:id"
          element={
            <ProtectedRoute requiredPermission={PERMISSIONS.USERS_VIEW}>
              <UserDetail />
            </ProtectedRoute>
          }
        />

        {/* Roles & Permissions */}
        <Route
          path="roles"
          element={
            <ProtectedRoute requiredPermission={PERMISSIONS.ROLES_MANAGE}>
              <RoleManagement />
            </ProtectedRoute>
          }
        />

        {/* Audit Logs */}
        <Route
          path="audit"
          element={
            <ProtectedRoute requiredPermission={PERMISSIONS.AUDIT_VIEW}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />

        {/* Analytics & Reports */}
        <Route
          path="analytics"
          element={
            <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS_VIEW}>
              <Analytics />
            </ProtectedRoute>
          }
        />

        {/* Notifications & Communications */}
        <Route path="notifications" element={<NotificationCenter />} />

        {/* Self-service Profile */}
        <Route path="profile" element={<ProfileSettings />} />

        {/* System Settings */}
        <Route
          path="settings"
          element={
            <ProtectedRoute requiredPermission={PERMISSIONS.SETTINGS_MANAGE}>
              <SystemSettings />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
