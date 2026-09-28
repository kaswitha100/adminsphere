import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { formatDate, formatTimeAgo } from '../../utils/formatters';
import { useNotification } from '../../context/NotificationContext';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import EmptyState from '../../components/feedback/EmptyState';
import Modal from '../../components/common/Modal';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  User,
  Shield,
  Clock,
  Eye,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Code
} from 'lucide-react';

const AuditLogs = () => {
  const { showToast } = useNotification();

  const [logs, setLogs] = useState([]);
  const [availableActions, setAvailableActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalLogs: 0, limit: 15 });

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [actorEmail, setActorEmail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Log Modal for JSON Metadata inspector
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        search,
        action: actionFilter,
        actorEmail: actorEmail ? actorEmail.trim() : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };

      const res = await api.get('/audit', { params });
      if (res.data.success) {
        setLogs(res.data.data);
        setAvailableActions(res.data.availableActions || []);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch audit logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, search, actionFilter, actorEmail, startDate, endDate, showToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleResetFilters = () => {
    setSearch('');
    setActionFilter('all');
    setActorEmail('');
    setStartDate('');
    setEndDate('');
    setPagination((p) => ({ ...p, currentPage: 1 }));
  };

  const getActionBadgeColor = (action) => {
    if (action.includes('CREATE') || action.includes('SUCCESS') || action.includes('ACTIVATED')) {
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
    }
    if (action.includes('DELETE') || action.includes('FAILED') || action.includes('DEACTIVATED')) {
      return 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20';
    }
    if (action.includes('UPDATE') || action.includes('CHANGED')) {
      return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
    }
    return 'bg-slate-100 text-slate-700 ring-1 ring-slate-500/20';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Audit Logs &amp; Security Trail</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Immutable forensic record of all administrative changes, logins, and system events.
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* General Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search details, actor, or resource..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, currentPage: 1 }));
              }}
              className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPagination((p) => ({ ...p, currentPage: 1 }));
              }}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
            >
              <option value="all">All Actions</option>
              {availableActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPagination((p) => ({ ...p, currentPage: 1 }));
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              title="Start Date"
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPagination((p) => ({ ...p, currentPage: 1 }));
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              title="End Date"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500">
            Total recorded events: <strong className="text-slate-800">{pagination.totalLogs}</strong>
          </span>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Querying MongoDB audit log documents..." />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No audit entries found"
            description="Try widening your date range or adjusting search keywords."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Resource</th>
                  <th className="py-3.5 px-6">Event Details</th>
                  <th className="py-3.5 px-4">IP / Agent</th>
                  <th className="py-3.5 px-6 text-right">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div className="text-xs font-semibold text-slate-900">
                        {formatDate(log.createdAt)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatTimeAgo(log.createdAt)}
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-semibold text-slate-800">
                        {log.actor?.name || 'System'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {log.actor?.email}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Resource */}
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                      <span>{log.resource}</span>
                      {log.resourceId && (
                        <span className="block text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                          #{log.resourceId}
                        </span>
                      )}
                    </td>

                    {/* Event Details */}
                    <td className="py-3.5 px-6 text-xs text-slate-600 max-w-xs">
                      <p className="line-clamp-2 leading-relaxed">{log.details}</p>
                    </td>

                    {/* IP & User Agent */}
                    <td className="py-3.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                      <div className="font-mono text-slate-700">{log.ipAddress || '127.0.0.1'}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[130px]" title={log.userAgent}>
                        {log.userAgent}
                      </div>
                    </td>

                    {/* Meta Inspector */}
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                          title="Inspect Metadata Payload"
                        >
                          <Code className="w-3.5 h-3.5" />
                          Inspect
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalLogs}
          limit={pagination.limit}
          onPageChange={(p) => setPagination((prev) => ({ ...prev, currentPage: p }))}
        />
      </div>

      {/* Metadata Inspector Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Metadata Inspector"
        maxWidth="max-w-xl"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Action:</span>
                <span className="font-mono font-semibold text-slate-800">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Actor:</span>
                <span className="font-medium text-slate-800">
                  {selectedLog.actor?.name} ({selectedLog.actor?.email})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="font-mono text-slate-800">{formatDate(selectedLog.createdAt)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payload / Metadata Details (JSON)
              </label>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto max-h-72">
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
              >
                Close Inspector
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogs;
