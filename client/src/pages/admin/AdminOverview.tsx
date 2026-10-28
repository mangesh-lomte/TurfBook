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
  Shield,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const AdminOverview: React.FC = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get<AdminAnalytics>('/admin/overview'),
  });

  return (
    <div className="min-h-screen bg-gradient-dashboard text-charcoal py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-charcoal tracking-tight">
              Administrator Overview
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
              System-wide platform metrics, venue verification queue, registered users, and security logs.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/admin/venues/pending"
              className="px-5 py-2.5 bg-gradient-booking hover:opacity-95 text-charcoal font-black text-xs rounded-xl shadow-lime-sm transition-all flex items-center gap-2 border border-emerald-300"
            >
              <span>Approval Queue</span>
              {analytics?.pendingVenues && analytics.pendingVenues > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                  {analytics.pendingVenues} Pending
                </span>
              ) : null}
            </Link>
            <Link
              to="/admin/users"
              className="px-4 py-2.5 border border-turfborder bg-white hover:bg-forest-50/60 text-forest-900 font-extrabold text-xs rounded-xl shadow-xs transition-all"
            >
              Manage Users
            </Link>
          </div>
        </div>

        {/* Pending Queue Attention Banner */}
        {analytics?.pendingVenues && analytics.pendingVenues > 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5 border border-amber-200">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-black text-amber-950 text-sm">
                  {analytics.pendingVenues} Venue Submissions Awaiting Inspection
                </h2>
                <p className="text-xs text-amber-900/80 mt-0.5 leading-relaxed font-medium">
                  Venue owners have submitted facility details, grass specifications, and operating schedules awaiting administrator approval.
                </p>
              </div>
            </div>
            <Link
              to="/admin/venues/pending"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-xs transition-all whitespace-nowrap self-start sm:self-auto"
            >
              Review Submissions
            </Link>
          </div>
        ) : null}

        {/* KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="dashboard-card-surface p-5 rounded-2xl border border-turfborder shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-charcoal-muted uppercase tracking-wider">
                Total Users
              </span>
              <div className="p-2 bg-sky-50 border border-sky-100 text-sky-800 rounded-xl">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-charcoal">
              {isLoading ? '...' : analytics?.totalUsers || 0}
            </div>
            <span className="text-[11px] text-charcoal-muted font-bold block mt-1">
              Players, Owners & Admins
            </span>
          </div>

          <div className="dashboard-card-surface p-5 rounded-2xl border border-turfborder shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-charcoal-muted uppercase tracking-wider">
                Arenas (Live/Total)
              </span>
              <div className="p-2 bg-forest-50 border border-emerald-100 text-forest-900 rounded-xl">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-charcoal">
              {isLoading
                ? '...'
                : `${analytics?.approvedVenues || 0} / ${analytics?.totalVenues || 0}`}
            </div>
            <span className="text-[11px] text-emerald-800 font-bold block mt-1">
              {analytics?.pendingVenues || 0} pending review
            </span>
          </div>

          <div className="dashboard-card-surface p-5 rounded-2xl border border-turfborder shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-charcoal-muted uppercase tracking-wider">
                Match Bookings
              </span>
              <div className="p-2 bg-purple-50 border border-purple-100 text-purple-800 rounded-xl">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-charcoal">
              {isLoading ? '...' : analytics?.totalBookings || 0}
            </div>
            <span className="text-[11px] text-charcoal-muted font-bold block mt-1">
              Total Hourly Reservations
            </span>
          </div>

          <div className="dashboard-card-surface p-5 rounded-2xl border border-turfborder shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-charcoal-muted uppercase tracking-wider">
                Platform Volume
              </span>
              <div className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-forest-900">
              {isLoading ? '...' : formatCurrency(analytics?.platformRevenue || 0)}
            </div>
            <span className="text-[11px] text-charcoal-muted font-bold block mt-1">
              Settled Transactions
            </span>
          </div>
        </div>

        {/* Audit Log Overview */}
        <div className="bg-white rounded-3xl border border-turfborder p-6 sm:p-8 shadow-card">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-turfborder">
            <div>
              <h2 className="text-xl font-black text-charcoal tracking-tight">
                Platform Security & Audit Trails
              </h2>
              <p className="text-xs text-charcoal-muted mt-1">Live operational, authentication, and booking events</p>
            </div>
            <Link
              to="/admin/audit-logs"
              className="text-xs font-black text-forest-900 hover:text-emerald-700 flex items-center gap-1 group"
            >
              <span>View Full Log</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-12 bg-forest-50/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-turfborder">
              {analytics?.recentAuditLogs?.map((log) => (
                <div
                  key={log.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-forest-50/30 -mx-4 px-4 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-forest-900 bg-forest-50 px-2 py-0.5 rounded-md text-[11px] border border-emerald-100">
                      {log.action}
                    </span>
                    <span className="text-charcoal font-black">
                      {log.resourceType}
                    </span>
                    {log.resourceId && (
                      <span className="text-charcoal-muted font-mono text-[10px]">
                        ({log.resourceId.slice(0, 8)}...)
                      </span>
                    )}
                    <span className="text-charcoal-muted text-[11px]">
                      by <strong className="text-charcoal font-bold">{log.user?.fullName || 'System'}</strong> ({log.user?.role || 'SYSTEM'})
                    </span>
                  </div>
                  <span className="text-charcoal-muted font-medium text-[11px] shrink-0">
                    {formatDate(log.createdAt)} {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
