export const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (e) {
    return dateString;
  }
};

export const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Never';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return formatDate(dateString);
  } catch (e) {
    return dateString;
  }
};

export const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
    case 'inactive':
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-500/20';
    case 'suspended':
      return 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20';
    default:
      return 'bg-slate-100 text-slate-600';
  }
};

export const getRoleBadgeClass = (roleName) => {
  switch (roleName) {
    case 'Super Admin':
      return 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20 font-semibold';
    case 'Admin':
      return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20 font-medium';
    case 'Manager':
      return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20 font-medium';
    case 'User':
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-500/20';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};
