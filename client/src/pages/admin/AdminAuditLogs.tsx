import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Shield, Clock, FileText } from 'lucide-react';

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
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => api.get<AuditLogItem[]>('/admin/audit-logs'),
  });

  const logs = logsData || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Security & Audit Logs</h1>
        <p className="text-xs text-slate-500 mt-1">
          Immutable event log of user logins, venue approvals, slot reservations, and cancellations.
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 bg-white rounded-3xl animate-pulse border border-slate-200" />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Event Action</th>
                  <th className="px-6 py-4">Target Resource</th>
                  <th className="px-6 py-4">Triggered By</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {l.action}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{l.resourceType}</div>
                      {l.resourceId && (
                        <div className="font-mono text-[10px] text-slate-400">
                          {l.resourceId}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        {l.user?.fullName || 'Anonymous / System'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{l.user?.email}</div>
                    </td>

                    <td className="px-6 py-4 font-mono text-slate-500 text-[11px]">
                      {l.ipAddress || '127.0.0.1'}
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      <div>{formatDate(l.createdAt)}</div>
                      <div className="text-[10px] text-slate-400">
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
  );
};
