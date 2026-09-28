import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Building2, Shield, Lock, Mail, ArrowRight, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('superadmin@adminsphere.io');
  const [password, setPassword] = useState('Admin@123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const demoAccounts = [
    {
      role: 'Super Admin',
      email: 'superadmin@adminsphere.io',
      pass: 'Admin@123456',
      badge: 'bg-purple-100 text-purple-700'
    },
    {
      role: 'Admin',
      email: 'admin@adminsphere.io',
      pass: 'Admin@123456',
      badge: 'bg-indigo-100 text-indigo-700'
    },
    {
      role: 'Manager',
      email: 'manager@adminsphere.io',
      pass: 'Manager@123456',
      badge: 'bg-blue-100 text-blue-700'
    },
    {
      role: 'Standard User',
      email: 'user@adminsphere.io',
      pass: 'User@123456',
      badge: 'bg-slate-100 text-slate-700'
    }
  ];

  const handleSelectDemo = (demo) => {
    setEmail(demo.email);
    setPassword(demo.pass);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      showToast(`Welcome back, ${user.name}!`, 'success');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900">
      {/* Left Column: Branding Showcase */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-r border-slate-800 text-white relative overflow-hidden">
        {/* Glow ambient effects */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">
                Admin<span className="text-indigo-400">Sphere</span>
              </span>
              <span className="block text-xs uppercase tracking-widest text-slate-400 font-semibold">
                Enterprise Operations
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            Production-Grade Administration Architecture
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Centralized Organization, Access Control, and Audit Governance.
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Enterprise RBAC with granular permissions, live MongoDB operational analytics, full audit trails, and security oversight.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-indigo-400 mb-2" />
              <h4 className="text-sm font-semibold text-white">Granular RBAC</h4>
              <p className="text-xs text-slate-400 mt-1">Hierarchical roles and module-level permission enforcement.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-indigo-400 mb-2" />
              <h4 className="text-sm font-semibold text-white">Full Audit Trail</h4>
              <p className="text-xs text-slate-400 mt-1">Non-repudiable logs of all administrative modifications.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          AdminSphere Enterprise &copy; {new Date().getFullYear()} — Secure Operations Portal
        </div>
      </div>

      {/* Right Column: Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-slate-50">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div>
            <div className="flex lg:hidden items-center gap-2 mb-6">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-slate-900">
                Admin<span className="text-indigo-600">Sphere</span>
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign in to AdminSphere
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter your corporate credentials to access the administrative portal.
            </p>
          </div>

          {/* Quick Demo Credentials Switcher */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>Quick Demo Role Switcher (1-Click Fill)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((demo) => (
                <button
                  key={demo.role}
                  type="button"
                  onClick={() => handleSelectDemo(demo)}
                  className={`text-left p-2 rounded-xl border text-xs transition-all ${
                    email === demo.email
                      ? 'border-indigo-500 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mb-1 ${demo.badge}`}>
                    {demo.role}
                  </span>
                  <p className="font-mono text-[11px] text-slate-700 truncate">{demo.email}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Corporate Email or Identifier
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="superadmin@adminsphere.io or superadminsphere.io"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500">
            Protected by enterprise encryption &amp; audit tracking.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
