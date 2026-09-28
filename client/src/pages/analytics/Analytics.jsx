import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import {
  BarChart3,
  TrendingUp,
  Users,
  ShieldCheck,
  FileCheck,
  Building2,
  Calendar,
  RefreshCw,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

const Analytics = () => {
  const { showToast } = useNotification();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/analytics');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load analytics', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" message="Compiling enterprise analytics from MongoDB..." />;
  }

  const { summary, registrationTrend, departmentBreakdown, activityCategories, dailyLogins } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Operational Analytics &amp; Reports
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time organizational telemetry, user growth velocity, and system load.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          Refresh Metrics
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Directory Size
            </span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">
            {summary?.totalUsers ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">Total accounts provisioned</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Ratio
            </span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-emerald-600">
            {summary?.activeRatio ?? 0}%
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {summary?.activeUsers} active accounts
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Role Profiles
            </span>
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">
            {summary?.totalRoles ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">Access permission tiers</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Audit Records
            </span>
            <FileCheck className="w-5 h-5 text-purple-600" />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">
            {summary?.totalAudits ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">Immutable ledger entries</p>
        </div>
      </div>

      {/* Row 1: Registration Velocity & Daily Logins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registration Velocity */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">User Acquisition Velocity</h3>
            <p className="text-xs text-slate-500">Monthly new user onboarding volume</p>
          </div>

          <div className="h-64 w-full">
            {registrationTrend && registrationTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={registrationTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="users" fill="#4f46e5" radius={[4, 4, 0, 0]} name="New Users" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No user registrations recorded
              </div>
            )}
          </div>
        </div>

        {/* Daily Login Volume */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">14-Day Authentication Density</h3>
            <p className="text-xs text-slate-500">Daily successful logins timeline</p>
          </div>

          <div className="h-64 w-full">
            {dailyLogins && dailyLogins.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyLogins}>
                  <defs>
                    <linearGradient id="loginDensity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="_id" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#loginDensity)"
                    name="Logins"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No login history available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Department Breakdown & Administrative Event Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Department Headcount</h3>
            <p className="text-xs text-slate-500">User distribution across business divisions</p>
          </div>

          <div className="space-y-3">
            {departmentBreakdown && departmentBreakdown.length > 0 ? (
              departmentBreakdown.map((dept) => {
                const percent = summary?.totalUsers
                  ? Math.round((dept.count / summary.totalUsers) * 100)
                  : 0;
                return (
                  <div key={dept.department} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{dept.department}</span>
                      <span className="text-slate-500">
                        {dept.count} users ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No department data</p>
            )}
          </div>
        </div>

        {/* Audit Categories */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Top Audit Event Triggers</h3>
            <p className="text-xs text-slate-500">Most frequent administrative and security actions</p>
          </div>

          <div className="divide-y divide-slate-100">
            {activityCategories && activityCategories.length > 0 ? (
              activityCategories.map((item) => (
                <div key={item.action} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-mono font-medium text-slate-800">
                      {item.action}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {item.count} events
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No audit records</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
