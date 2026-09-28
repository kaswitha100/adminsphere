import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate, formatTimeAgo, getStatusBadgeClass, getRoleBadgeClass } from '../../utils/formatters';
import { PERMISSIONS } from '../../utils/permissions';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  Shield,
  Activity,
  UserCheck,
  UserX,
  Trash2,
  Edit2,
  CheckCircle2,
  Lock,
  AlertTriangle
} from 'lucide-react';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, canUser } = useAuth();
  const { showToast } = useNotification();

  const [user, setUser] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    phone: '',
    status: 'active'
  });
  const [submitting, setSubmitting] = useState(false);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDanger: false
  });

  const fetchUserDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/users/${id}`);
      if (res.data.success) {
        setUser(res.data.user);
        setRecentActivity(res.data.recentActivity || []);
        setFormData({
          name: res.data.user.name,
          email: res.data.user.email,
          role: res.data.user.role?._id || '',
          department: res.data.user.department || '',
          phone: res.data.user.phone || '',
          status: res.data.user.status || 'active'
        });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load user profile', 'error');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles');
      if (res.data.success) setRoles(res.data.data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchUserDetails();
    fetchRoles();
  }, [fetchUserDetails]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.put(`/users/${id}`, formData);
      if (res.data.success) {
        showToast('User profile updated successfully', 'success');
        setIsEditOpen(false);
        fetchUserDetails();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    setConfirmDialog({
      isOpen: true,
      title: `${newStatus === 'active' ? 'Reactivate' : 'Deactivate'} User`,
      message: `Change account status of "${user.name}" to ${newStatus}?`,
      isDanger: newStatus !== 'active',
      onConfirm: async () => {
        try {
          const res = await api.patch(`/users/${id}/status`, { status: newStatus });
          if (res.data.success) {
            showToast(`User status updated to ${newStatus}`, 'success');
            setConfirmDialog((p) => ({ ...p, isOpen: false }));
            fetchUserDetails();
          }
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to update status', 'error');
          setConfirmDialog((p) => ({ ...p, isOpen: false }));
        }
      }
    });
  };

  const handleDelete = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Permanently Delete User Account',
      message: `Permanently delete account for "${user.name}" (${user.email})? This action cannot be reversed.`,
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await api.delete(`/users/${id}`);
          if (res.data.success) {
            showToast('User permanently removed', 'success');
            setConfirmDialog((p) => ({ ...p, isOpen: false }));
            navigate('/users');
          }
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to delete user', 'error');
          setConfirmDialog((p) => ({ ...p, isOpen: false }));
        }
      }
    });
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading user profile..." />;
  }

  if (!user) return null;

  const isCurrent = String(user._id) === String(currentUser?._id);
  const isSuperAdmin = user.role?.name === 'Super Admin';

  return (
    <div className="space-y-6">
      {/* Back button and page title */}
      <div className="flex items-center justify-between">
        <Link
          to="/users"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users Directory
        </Link>
        <span className="text-xs font-mono text-slate-400">UID: {user._id}</span>
      </div>

      {/* Main Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            {user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2)}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900">{user.name}</h1>
              {isCurrent && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                  Your Account
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 font-mono">{user.email}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs ${getRoleBadgeClass(user.role?.name)}`}>
                {user.role?.name || 'Unassigned'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs capitalize ${getStatusBadgeClass(user.status)}`}>
                {user.status}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {canUser(PERMISSIONS.USERS_UPDATE) && (
            <>
              <button
                onClick={() => setIsEditOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Account
              </button>

              {!isCurrent && (
                <button
                  onClick={() => handleStatusChange(user.status === 'active' ? 'inactive' : 'active')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all shadow-sm ${
                    user.status === 'active'
                      ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
                      : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  {user.status === 'active' ? (
                    <>
                      <UserX className="w-3.5 h-3.5" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      Reactivate
                    </>
                  )}
                </button>
              )}
            </>
          )}

          {canUser(PERMISSIONS.USERS_DELETE) && !isCurrent && !isSuperAdmin && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Account
            </button>
          )}
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account Details & Permissions */}
        <div className="space-y-6 lg:col-span-1">
          {/* Information Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Account Attributes
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <Building className="w-3.5 h-3.5" /> Department
                </span>
                <span className="font-semibold text-slate-800">{user.department || 'General'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" /> Phone
                </span>
                <span className="font-semibold text-slate-800">{user.phone || 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Registered On
                </span>
                <span className="font-medium text-slate-700">{formatDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Last Login
                </span>
                <span className="font-medium text-slate-700">{formatDate(user.lastLogin)}</span>
              </div>
            </div>
          </div>

          {/* Role & Permissions Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                Security Role &amp; Permissions
              </h3>
            </div>

            <p className="text-xs text-slate-600">{user.role?.description}</p>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Effective Granted Permissions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {user.role?.permissions?.map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200/60"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: User-Specific Audit & Activity Timeline */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                Audit Trail &amp; Activity Log
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Historical records of actions performed by or targeting this account
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivity.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No recorded audit events for this user
              </div>
            ) : (
              recentActivity.map((log) => (
                <div key={log._id} className="py-3.5 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800">{log.details}</p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatTimeAgo(log.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600">
                        {log.action}
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-[11px] text-slate-500">
                        IP: <span className="font-mono">{log.ipAddress || '127.0.0.1'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Profile: ${user.name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
              <select
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
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((p) => ({ ...p, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDanger={confirmDialog.isDanger}
      />
    </div>
  );
};

export default UserDetail;
