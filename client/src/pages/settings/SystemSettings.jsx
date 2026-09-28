import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { PERMISSIONS } from '../../utils/permissions';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import {
  Settings,
  Shield,
  Bell,
  Building,
  Lock,
  Mail,
  CheckCircle2,
  Save,
  Globe
} from 'lucide-react';

const SystemSettings = () => {
  const { canUser } = useAuth();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'security' | 'notifications'
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states per tab
  const [generalForm, setGeneralForm] = useState({
    organizationName: '',
    supportEmail: '',
    timezone: 'UTC'
  });

  const [securityForm, setSecurityForm] = useState({
    twoFactorRequired: false,
    sessionTimeoutMinutes: 60,
    maxFailedLogins: 5,
    strictAuditLogging: true
  });

  const [notificationsForm, setNotificationsForm] = useState({
    emailNotificationsEnabled: true,
    securityAlertBroadcast: true
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data.success) {
        const { general, security, notifications } = res.data.data;
        setSettings(res.data.data);

        if (general) {
          setGeneralForm({
            organizationName: general.organizationName || 'AdminSphere Global Enterprise',
            supportEmail: general.supportEmail || 'support@adminsphere.io',
            timezone: general.timezone || 'UTC'
          });
        }

        if (security) {
          setSecurityForm({
            twoFactorRequired: !!security.twoFactorRequired,
            sessionTimeoutMinutes: security.sessionTimeoutMinutes ?? 60,
            maxFailedLogins: security.maxFailedLogins ?? 5,
            strictAuditLogging: security.strictAuditLogging !== false
          });
        }

        if (notifications) {
          setNotificationsForm({
            emailNotificationsEnabled: notifications.emailNotificationsEnabled !== false,
            securityAlertBroadcast: notifications.securityAlertBroadcast !== false
          });
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load system settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveCategory = async (category, payload) => {
    try {
      setSaving(true);
      const res = await api.put('/settings', {
        category,
        settings: payload
      });

      if (res.data.success) {
        showToast(res.data.message || 'Settings saved successfully', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading organization system parameters..." />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Organization &amp; System Settings
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure organization profiles, security restrictions, and automated notification triggers.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          General &amp; Profile
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          Security Policies
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'notifications'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          Notification Alerts
        </button>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">General Platform Information</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Legal entity and tenant-wide organization defaults.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveCategory('general', generalForm);
            }}
            className="space-y-4 max-w-xl"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organization / Brand Name
              </label>
              <input
                type="text"
                required
                value={generalForm.organizationName}
                onChange={(e) =>
                  setGeneralForm({ ...generalForm, organizationName: e.target.value })
                }
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Support &amp; Escalation Contact Email
              </label>
              <input
                type="email"
                required
                value={generalForm.supportEmail}
                onChange={(e) =>
                  setGeneralForm({ ...generalForm, supportEmail: e.target.value })
                }
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Audit Timezone
              </label>
              <select
                value={generalForm.timezone}
                onChange={(e) => setGeneralForm({ ...generalForm, timezone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">Eastern Time (US &amp; Canada)</option>
                <option value="America/Los_Angeles">Pacific Time (US &amp; Canada)</option>
                <option value="Europe/London">London (GMT / BST)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save General Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Security &amp; Access Controls</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enforce strict authentication policies, idle thresholds, and lockout triggers.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveCategory('security', securityForm);
            }}
            className="space-y-5 max-w-xl"
          >
            <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <input
                type="checkbox"
                id="twoFactor"
                checked={securityForm.twoFactorRequired}
                onChange={(e) =>
                  setSecurityForm({ ...securityForm, twoFactorRequired: e.target.checked })
                }
                className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="twoFactor" className="text-xs cursor-pointer">
                <span className="font-bold text-slate-900 block">
                  Mandatory Multi-Factor Authentication (MFA)
                </span>
                <span className="text-slate-500 block mt-0.5">
                  Require all users with elevated privileges (Super Admin, Admin, Manager) to verify a second factor.
                </span>
              </label>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <input
                type="checkbox"
                id="strictAudit"
                checked={securityForm.strictAuditLogging}
                onChange={(e) =>
                  setSecurityForm({ ...securityForm, strictAuditLogging: e.target.checked })
                }
                className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="strictAudit" className="text-xs cursor-pointer">
                <span className="font-bold text-slate-900 block">
                  Strict Audit Logging
                </span>
                <span className="text-slate-500 block mt-0.5">
                  Record detailed IP addresses, client user-agents, and JSON request payloads for forensic compliance.
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Session Idle Timeout (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={securityForm.sessionTimeoutMinutes}
                  onChange={(e) =>
                    setSecurityForm({
                      ...securityForm,
                      sessionTimeoutMinutes: parseInt(e.target.value, 10) || 60
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lockout After Failed Logins
                </label>
                <input
                  type="number"
                  min="3"
                  max="20"
                  value={securityForm.maxFailedLogins}
                  onChange={(e) =>
                    setSecurityForm({
                      ...securityForm,
                      maxFailedLogins: parseInt(e.target.value, 10) || 5
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save Security Policies'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications Settings */}
      {activeTab === 'notifications' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Notification Preferences</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Control which system notices and alerts generate broadcast events.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveCategory('notifications', notificationsForm);
            }}
            className="space-y-4 max-w-xl"
          >
            <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <input
                type="checkbox"
                id="emailNotifs"
                checked={notificationsForm.emailNotificationsEnabled}
                onChange={(e) =>
                  setNotificationsForm({
                    ...notificationsForm,
                    emailNotificationsEnabled: e.target.checked
                  })
                }
                className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="emailNotifs" className="text-xs cursor-pointer">
                <span className="font-bold text-slate-900 block">
                  Email Dispatch Gateway
                </span>
                <span className="text-slate-500 block mt-0.5">
                  Send critical security notices and account activations via corporate email relay.
                </span>
              </label>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <input
                type="checkbox"
                id="secAlert"
                checked={notificationsForm.securityAlertBroadcast}
                onChange={(e) =>
                  setNotificationsForm({
                    ...notificationsForm,
                    securityAlertBroadcast: e.target.checked
                  })
                }
                className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="secAlert" className="text-xs cursor-pointer">
                <span className="font-bold text-slate-900 block">
                  Immediate Security Broadcasts
                </span>
                <span className="text-slate-500 block mt-0.5">
                  Automatically alert all active administrators on failed brute-force logins or privilege escalations.
                </span>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save Notification Preferences'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
