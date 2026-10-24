import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { AdminAnalytics } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const AdminOverview: React.FC = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get<AdminAnalytics>('/admin/overview'),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase font-bold text-rose-600 tracking-wider block mb-1">
            Platform Administrator
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Platform Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            System-wide metrics, venue verification queue, registered users, and security logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/venues/pending"
            className="px-4 py-2.5 bg-forest-900 hover:bg-forest-800 text-turf-bright font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>Approval Queue</span>
            {analytics?.pendingVenues && analytics.pendingVenues > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {analytics.pendingVenues}
              </span>
            ) : null}
          </Link>
          <Link
            to="/admin/users"
            className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-colors"
          >
            Manage Users
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Users
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {isLoading ? '...' : analytics?.totalUsers || 0}
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">Customers & Owners</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Venues (Approved/Total)
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {isLoading
              ? '...'
              : `${analytics?.approvedVenues || 0} / ${analytics?.totalVenues || 0}`}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">
            {analytics?.pendingVenues || 0} pending review
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Platform Bookings
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {isLoading ? '...' : analytics?.totalBookings || 0}
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">Total Match Hours</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Platform Volume
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {isLoading ? '...' : formatCurrency(analytics?.platformRevenue || 0)}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">Settled Payments</span>
        </div>
      </div>

      {/* Audit Log Overview */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Platform Audit Log</h3>
            <p className="text-xs text-slate-500">Live operational & security events</p>
          </div>
          <Link
            to="/admin/audit-logs"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>View Full Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {analytics?.recentAuditLogs?.map((log) => (
            <div key={log.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px] mr-2">
                  {log.action}
                </span>
                <span className="text-slate-600 font-medium">
                  {log.resourceType} {log.resourceId ? `(${log.resourceId.slice(0, 8)}...)` : ''}
                </span>
                <span className="text-slate-400 ml-2">
                  by {log.user?.fullName || 'System'} ({log.user?.role || 'SYSTEM'})
                </span>
              </div>
              <span className="text-slate-400">{formatDate(log.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
