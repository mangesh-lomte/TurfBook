import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Shield, Clock, FileText, Search } from 'lucide-react';

interface AuditLogItem {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
    role: string;
  } | null;
  metadata?: Record<string, unknown> | null;
}

export const AdminAuditLogs: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => api.get<AuditLogItem[]>('/admin/audit-logs'),
  });

  const logs = logsData || [];

  const filtered = logs.filter((l) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(term) ||
      l.resourceType.toLowerCase().includes(term) ||
      (l.user?.fullName && l.user.fullName.toLowerCase().includes(term)) ||
      (l.user?.email && l.user.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-gradient-dashboard text-charcoal py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-charcoal tracking-tight">
              Security & Audit Logs
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
              Immutable system event log of user logins, venue approvals, slot reservations, and cancellations.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-turfborder rounded-2xl w-full sm:w-80 focus-within:ring-2 focus-within:ring-emerald-600/20 focus-within:border-emerald-600 shadow-xs transition-all">
            <Search className="w-4 h-4 text-charcoal-muted shrink-0" />
            <label htmlFor="search-audit-logs" className="sr-only">
              Search audit logs
            </label>
            <input
              id="search-audit-logs"
              type="text"
              placeholder="Search by action, resource, or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm text-charcoal focus:outline-none placeholder:text-charcoal-muted/60 font-medium"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 bg-forest-50/60 rounded-3xl animate-pulse border border-turfborder" />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-turfborder p-8 max-w-md mx-auto shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-forest-50 text-forest-800 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-charcoal">No Events Found</h3>
            <p className="text-xs text-charcoal-muted mt-1">Try clearing your search query.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-turfborder overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-[#F8FAF7] border-b border-turfborder text-charcoal-muted font-black uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Event Action</th>
                    <th className="px-6 py-4">Target Resource</th>
                    <th className="px-6 py-4">Triggered By</th>
                    <th className="px-6 py-4">Client IP</th>
                    <th className="px-6 py-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-turfborder">
                  {filtered.map((l) => (
                    <tr key={l.id} className="hover:bg-forest-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-forest-900 bg-forest-50 px-2.5 py-1 rounded-md text-[11px] border border-emerald-100">
                          {l.action}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-black text-charcoal">{l.resourceType}</div>
                        {l.resourceId && (
                          <div className="font-mono text-[10px] text-charcoal-muted mt-0.5">
                            {l.resourceId}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-black text-charcoal">
                          {l.user?.fullName || 'Anonymous / System'}
                        </div>
                        <div className="text-[10px] text-charcoal-muted font-mono mt-0.5">
                          {l.user?.email || 'N/A'}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-charcoal-muted text-[11px]">
                        {l.ipAddress || '127.0.0.1'}
                      </td>

                      <td className="px-6 py-4 text-charcoal-muted">
                        <div className="font-bold text-charcoal">{formatDate(l.createdAt)}</div>
                        <div className="text-[10px] text-charcoal-muted">
                          {new Date(l.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
