import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { PERMISSIONS } from '../../utils/permissions';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Plus,
  Edit2,
  Check,
  Lock,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

const RoleManagement = () => {
  const { user: currentUser, canUser } = useAuth();
  const { showToast } = useNotification();

  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchRoleData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/roles'),
        api.get('/roles/permissions')
      ]);

      if (rolesRes.data.success) {
        setRoles(rolesRes.data.data);
      }
      if (permsRes.data.success) {
        setAllPermissions(permsRes.data.data);
        setGroupedPermissions(permsRes.data.grouped);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error fetching roles', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchRoleData();
  }, [fetchRoleData]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: []
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || []
    });
    setIsModalOpen(true);
  };

  // Toggle permission checkbox in modal
  const handleTogglePermission = (permKey) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permKey);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permKey)
          : [...prev.permissions, permKey]
      };
    });
  };

  // Toggle all permissions in a module
  const handleToggleModule = (moduleName) => {
    const modulePerms = (groupedPermissions[moduleName] || []).map((p) => p.key);
    const allSelected = modulePerms.every((k) => formData.permissions.includes(k));

    setFormData((prev) => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter((k) => !modulePerms.includes(k))
        : Array.from(new Set([...prev.permissions, ...modulePerms]))
    }));
  };

  // Save role
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Role name is required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      if (editingRole) {
        const res = await api.put(`/roles/${editingRole._id}`, formData);
        if (res.data.success) {
          showToast(`Role "${formData.name}" updated successfully`, 'success');
          setIsModalOpen(false);
          fetchRoleData();
        }
      } else {
        const res = await api.post('/roles', formData);
        if (res.data.success) {
          showToast(`Custom role "${formData.name}" created`, 'success');
          setIsModalOpen(false);
          fetchRoleData();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save role', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading role hierarchy & permissions matrix..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Roles &amp; Permissions
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Define security boundaries, module access, and organizational privileges.
          </p>
        </div>

        {canUser(PERMISSIONS.ROLES_MANAGE) && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Custom Role
          </button>
        )}
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => {
          const isSuperAdmin = role.name === 'Super Admin';
          const assignedCount = role.userCount || 0;

          return (
            <div
              key={role._id}
              className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                {/* Role Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSuperAdmin
                          ? 'bg-purple-100 text-purple-700'
                          : role.name === 'Admin'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{role.name}</h3>
                        {role.isSystem && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            System
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>{assignedCount} users assigned</span>
                      </div>
                    </div>
                  </div>

                  {canUser(PERMISSIONS.ROLES_MANAGE) && !isSuperAdmin && (
                    <button
                      onClick={() => handleOpenEdit(role)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Edit Role & Permissions"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="mt-4 text-xs text-slate-600 leading-relaxed min-h-[36px]">
                  {role.description || 'No description specified for this organizational role.'}
                </p>

                {/* Permissions Breakdown */}
                <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                      Permission Entitlements
                    </span>
                    <span className="font-mono text-slate-500">
                      {isSuperAdmin
                        ? 'Universal Access (*)'
                        : `${role.permissions?.length || 0} / ${allPermissions.length}`}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {isSuperAdmin ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        Full Wildcard Platform Administration
                      </span>
                    ) : role.permissions && role.permissions.length > 0 ? (
                      role.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-50 text-slate-700 border border-slate-200/60"
                        >
                          {perm}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No permissions assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Role Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Custom Role'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role Name</label>
            <input
              type="text"
              required
              disabled={editingRole?.isSystem}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Compliance Auditor"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Operational responsibilities and scope of this role..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
            />
          </div>

          {/* Granular Permission Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">Assign Permissions</label>
              <span className="text-[11px] text-slate-500 font-mono">
                {formData.permissions.length} selected
              </span>
            </div>

            <div className="space-y-4 max-h-72 overflow-y-auto pr-2 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              {Object.entries(groupedPermissions).map(([moduleName, perms]) => {
                const moduleKeys = perms.map((p) => p.key);
                const allSelected = moduleKeys.every((k) => formData.permissions.includes(k));

                return (
                  <div key={moduleName} className="space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        {moduleName} Module
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleModule(moduleName)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {perms.map((p) => {
                        const isChecked = formData.permissions.includes(p.key);
                        return (
                          <label
                            key={p.key}
                            className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-medium'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(p.key)}
                              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                              <p className="font-semibold leading-tight">{p.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{p.key}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RoleManagement;
