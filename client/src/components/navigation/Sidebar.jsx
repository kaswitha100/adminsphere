import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';
import { getRoleBadgeClass } from '../../utils/formatters';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  FileText,
  BarChart3,
  Settings,
  UserCheck,
  Building2,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, canUser } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      to: '/dashboard',
      icon: LayoutDashboard,
      show: true
    },
    {
      name: 'User Management',
      to: '/users',
      icon: Users,
      show: canUser(PERMISSIONS.USERS_VIEW)
    },
    {
      name: 'Roles & Permissions',
      to: '/roles',
      icon: ShieldCheck,
      show: canUser(PERMISSIONS.ROLES_MANAGE) || user?.role?.name === 'Super Admin'
    },
    {
      name: 'Audit Logs',
      to: '/audit',
      icon: FileText,
      show: canUser(PERMISSIONS.AUDIT_VIEW)
    },
    {
      name: 'Analytics & Reports',
      to: '/analytics',
      icon: BarChart3,
      show: canUser(PERMISSIONS.REPORTS_VIEW)
    },
    {
      name: 'System Settings',
      to: '/settings',
      icon: Settings,
      show: canUser(PERMISSIONS.SETTINGS_MANAGE) || user?.role?.name === 'Super Admin'
    },
    {
      name: 'Profile & Security',
      to: '/profile',
      icon: UserCheck,
      show: true
    }
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-slate-300">
      <div>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">
                Admin<span className="text-indigo-400">Sphere</span>
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Enterprise Hub
              </span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="px-4 py-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-3">
            Administration
          </div>
          <nav className="space-y-1.5">
            {navigation
              .filter((item) => item.show)
              .map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0 transition-colors" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
          </nav>
        </div>
      </div>

      {/* User Status Footer Card */}
      <div className="p-4 border-t border-slate-800 m-3 rounded-2xl bg-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold flex items-center justify-center text-sm">
            {user?.name
              ? user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2)
              : 'AS'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.name || 'Administrator'}
            </p>
            <div className="mt-0.5">
              <span
                className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${getRoleBadgeClass(
                  user?.role?.name
                )}`}
              >
                {user?.role?.name || 'User'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:border-r lg:border-slate-800">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85%] bg-slate-900 shadow-2xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
