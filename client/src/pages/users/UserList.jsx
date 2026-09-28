import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate, formatTimeAgo, getStatusBadgeClass, getRoleBadgeClass } from '../../utils/formatters';
import { PERMISSIONS } from '../../utils/permissions';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import EmptyState from '../../components/feedback/EmptyState';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Eye,
  Edit2,
  UserCheck,
  UserX,
  Trash2,
  AlertCircle,
  Building,
  Phone,
  Mail,
  Lock,
  ShieldAlert
} from 'lucide-react';

const UserList = () => {
  const { user: currentUser, canUser } = useAuth();
  const { showToast } = useNotification();

  // State
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalUsers: 0, limit: 10 });

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    department: '',
    phone: '',
    status: 'active'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDanger: false,
    loading: false
  });

  // Fetch roles for selector
  const fetchRoles = useCallback(async () => {
    try {
      const res = await api.get('/roles');
      if (res.data.success) {
        setRoles(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  }, []);

  // Fetch users with filters
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        search,
        role: roleFilter,
        status: statusFilter,
        sortBy,
        sortOrder
      };

      const res = await api.get('/users', { params });
      if (res.data.success) {
        setUsers(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error loading users', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, search, roleFilter, statusFilter, sortBy, sortOrder, showToast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: roles[0]?._id || '',
      department: 'General',
      phone: '',
      status: 'active'
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (targetUser) => {
    setEditingUser(targetUser);
    setFormData({
      name: targetUser.name,
      email: targetUser.email,
      password: '',
      role: targetUser.role?._id || targetUser.role,
      department: targetUser.department || '',
      phone: targetUser.phone || '',
      status: targetUser.status || 'active'
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Submit User Create / Update
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    // Basic frontend validation
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) errors.email = 'Email address is required';
    if (!editingUser && !formData.password) errors.password = 'Initial password is required';
    if (!formData.role) errors.role = 'Role selection is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      if (editingUser) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;

        const res = await api.put(`/users/${editingUser._id}`, payload);
        if (res.data.success) {
          showToast('User profile updated successfully', 'success');
          setIsFormModalOpen(false);
          fetchUsers();
        }
      } else {
        const res = await api.post('/users', formData);
        if (res.data.success) {
          showToast('New user account created successfully', 'success');
          setIsFormModalOpen(false);
          fetchUsers();
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save user.';
      showToast(msg, 'error');
      if (err.response?.data?.errors) {
        const fieldErrors = {};
        err.response.data.errors.forEach((e) => {
          fieldErrors[e.field] = e.message;
        });
        setFormErrors(fieldErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Status toggle handler
  const handleToggleStatus = (targetUser, newStatus) => {
    setConfirmDialog({
      isOpen: true,
      title: `${newStatus === 'active' ? 'Reactivate' : 'Deactivate'} User Account`,
      message: `Are you sure you want to change the status of "${targetUser.name}" to ${newStatus}?`,
      isDanger: newStatus !== 'active',
      confirmText: newStatus === 'active' ? 'Activate Account' : 'Deactivate Account',
      loading: false,
      onConfirm: async () => {
        try {
          setConfirmDialog((prev) => ({ ...prev, loading: true }));
          const res = await api.patch(`/users/${targetUser._id}/status`, { status: newStatus });
          if (res.data.success) {
            showToast(`User status changed to ${newStatus}`, 'success');
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
            fetchUsers();
          }
        } catch (err) {
          showToast(err.response?.data?.message || 'Status change failed', 'error');
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Delete user handler
  const handleDeleteUser = (targetUser) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Permanently Delete User Account',
      message: `This will permanently remove "${targetUser.name}" (${targetUser.email}) and cannot be undone. Confirm deletion?`,
      isDanger: true,
      confirmText: 'Delete User Permanently',
      loading: false,
      onConfirm: async () => {
        try {
          setConfirmDialog((prev) => ({ ...prev, loading: true }));
          const res = await api.delete(`/users/${targetUser._id}`);
          if (res.data.success) {
            showToast('User record permanently removed', 'success');
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
            fetchUsers();
          }
        } catch (err) {
          showToast(err.response?.data?.message || 'Deletion failed', 'error');
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Directory of corporate users, role assignments, and account statuses.
          </p>
        </div>

        {canUser(PERMISSIONS.USERS_CREATE) && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Add New User
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or department..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, currentPage: 1 }));
            }}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPagination((p) => ({ ...p, currentPage: 1 }));
            }}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="all">All Roles</option>
            {roles.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((p) => ({ ...p, currentPage: 1 }));
            }}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          {/* Sorting */}
          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split(':');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="createdAt:desc">Newest First</option>
            <option value="createdAt:asc">Oldest First</option>
            <option value="name:asc">Name (A-Z)</option>
            <option value="name:desc">Name (Z-A)</option>
            <option value="lastLogin:desc">Recent Login</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Fetching user directory from database..." />
        ) : users.length === 0 ? (
          <EmptyState
            title="No matching users found"
            description="Try adjusting your search criteria or role filters."
            actionText={canUser(PERMISSIONS.USERS_CREATE) ? 'Add New User' : undefined}
            onAction={handleOpenAddModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">User Details</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Last Activity</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((u) => {
                  const isCurrent = String(u._id) === String(currentUser?._id);
                  const isSuperAdmin = u.role?.name === 'Super Admin';

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Email & Initials */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center border border-slate-200/60 shrink-0">
                            {u.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .substring(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/users/${u._id}`}
                              className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                            >
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                                  You
                                </span>
                              )}
                            </Link>
                            <p className="text-xs text-slate-400 font-mono truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs ${getRoleBadgeClass(
                            u.role?.name
                          )}`}
                        >
                          {u.role?.name || 'Unassigned'}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                        {u.department || 'General'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadgeClass(
                            u.status
                          )}`}
                        >
                          {u.status}
                        </span>
                      </td>

                      {/* Last Activity */}
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {formatTimeAgo(u.lastActivity || u.lastLogin)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/users/${u._id}`}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Profile Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {canUser(PERMISSIONS.USERS_UPDATE) && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(u)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Edit User"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Toggle Status (Active / Inactive) */}
                              {!isCurrent && (
                                <button
                                  onClick={() =>
                                    handleToggleStatus(u, u.status === 'active' ? 'inactive' : 'active')
                                  }
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    u.status === 'active'
                                      ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                      : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                  title={u.status === 'active' ? 'Deactivate User' : 'Reactivate User'}
                                >
                                  {u.status === 'active' ? (
                                    <UserX className="w-4 h-4" />
                                  ) : (
                                    <UserCheck className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </>
                          )}

                          {canUser(PERMISSIONS.USERS_DELETE) && !isCurrent && !isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete User Permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalUsers}
          limit={pagination.limit}
          onPageChange={(page) => setPagination((p) => ({ ...p, currentPage: page }))}
        />
      </div>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingUser ? `Edit User: ${editingUser.name}` : 'Add New Organization User'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Alexander Pierce"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
            />
            {formErrors.name && <p className="text-xs text-rose-600 mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="alexander@adminsphere.io"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
            />
            {formErrors.email && <p className="text-xs text-rose-600 mt-1">{formErrors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {editingUser ? 'New Password (Leave blank to keep current)' : 'Initial Password'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? '••••••••' : 'Minimum 6 characters'}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
            />
            {formErrors.password && (
              <p className="text-xs text-rose-600 mt-1">{formErrors.password}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
              >
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
              {formErrors.role && <p className="text-xs text-rose-600 mt-1">{formErrors.role}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Engineering, Sales, HR..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {editingUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((p) => ({ ...p, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        isDanger={confirmDialog.isDanger}
        loading={confirmDialog.loading}
      />
    </div>
  );
};

export default UserList;
