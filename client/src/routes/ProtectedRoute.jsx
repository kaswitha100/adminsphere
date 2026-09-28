import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/feedback/LoadingSpinner';
import { ShieldAlert } from 'lucide-react';

const ProtectedRoute = ({ children, requiredPermission, requiredRole }) => {
  const { user, isAuthenticated, loading, canUser, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" message="Verifying security credentials..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check required permission
  if (requiredPermission && !canUser(requiredPermission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md">
          Your role (<span className="font-semibold text-slate-800">{user?.role?.name}</span>) does not possess the permission required to access this resource:
        </p>
        <div className="mt-3 px-3 py-1 bg-slate-100 rounded-lg text-xs font-mono text-slate-700">
          {Array.isArray(requiredPermission) ? requiredPermission.join(', ') : requiredPermission}
        </div>
        <button
          onClick={() => window.history.back()}
          className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Check required role
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-100">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Elevated Role Required</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md">
          This operation is strictly limited to role: <span className="font-semibold text-slate-800">{Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole}</span>.
        </p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
