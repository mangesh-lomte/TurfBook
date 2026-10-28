import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { OwnerAnalytics } from '../../types';
import { formatCurrency, formatDate, formatTime, getStatusColor } from '../../lib/utils';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  PlusCircle,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['owner-overview'],
    queryFn: () => api.get<OwnerAnalytics>('/owner/overview'),
  });

  return (
    <div className="min-h-screen bg-gradient-dashboard text-charcoal py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-charcoal tracking-tight">
              Facility Analytics & Overview
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
              Real-time pitch occupancy, revenue summaries, and incoming match reservations.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/owner/venues/create"
              className="px-5 py-2.5 bg-gradient-booking hover:opacity-95 text-charcoal font-black text-xs rounded-xl shadow-lime-sm transition-all flex items-center gap-1.5 border border-emerald-300"
            >
              <PlusCircle className="w-4 h-4 text-charcoal" />
              <span>Register New Venue</span>
            </Link>
            <Link
              to="/owner/reservations"
              className="px-4 py-2.5 border border-turfborder bg-white hover:bg-forest-50/60 text-forest-900 font-extrabold text-xs rounded-xl shadow-xs transition-all"
            >
              All Reservations
            </Link>
          </div>
        </div>

        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="dashboard-card-surface p-5 rounded-2xl border border-turfborder shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-charcoal-muted uppercase tracking-wider">
                Total Revenue
              </span>
              <div className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-forest-900">
              {isLoading ? '...' : formatCurrency(analytics?.totalRevenue || 0)}
            </div>
            <span className="text-[11px] text-emerald-800 font-bold block mt-1">
              PostgreSQL Settled
            </span>
          </div>

          <div className="dashboard-card-surface p-5 rounded-2xl border border-turfborder shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-charcoal-muted uppercase tracking-wider">
                Total Bookings
              </span>
              <div className="p-2 bg-forest-50 border border-emerald-100 text-forest-900 rounded-xl">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-charcoal">
              {isLoading ? '...' : analytics?.totalBookings || 0}
            </div>
            <span className="text-[11px] text-charcoal-muted font-bold block mt-1">
              {analytics?.confirmedBookings || 0} confirmed reservations
            </span>
          </div>

          <div className="dashboard-card-surface p-5 rounded-2xl border border-turfborder shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-charcoal-muted uppercase tracking-wider">
                Today's Games
              </span>
              <div className="p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-charcoal">
              {isLoading ? '...' : analytics?.todayBookings || 0}
            </div>
            <span className="text-[11px] text-amber-800 font-bold block mt-1">
              Scheduled Today
            </span>
          </div>

          <div className="dashboard-card-surface p-5 rounded-2xl border border-turfborder shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-charcoal-muted uppercase tracking-wider">
                Occupancy Rate
              </span>
              <div className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-forest-900">
              {isLoading ? '...' : `${analytics?.occupancyRate || 0}%`}
            </div>
            <span className="text-[11px] text-charcoal-muted font-medium block mt-1">
              Current Month Capacity
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Reservations Table */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-turfborder p-6 sm:p-8 shadow-card">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-turfborder">
              <div>
                <h2 className="text-xl font-black text-charcoal tracking-tight">
                  Recent Customer Reservations
                </h2>
                <p className="text-xs text-charcoal-muted mt-1">Live booking activity on your grounds</p>
              </div>
              <Link
                to="/owner/reservations"
                className="text-xs font-extrabold text-forest-900 hover:text-emerald-700 flex items-center gap-1 group"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 bg-forest-50/60 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : analytics?.recentReservations && analytics.recentReservations.length > 0 ? (
              <div className="divide-y divide-turfborder">
                {analytics.recentReservations.map((b) => (
                  <div
                    key={b.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-forest-50/40 -mx-4 px-4 rounded-xl transition-colors"
                  >
                    <div>
                      <div className="font-black text-charcoal text-sm">
                        {b.customer?.fullName}
                      </div>
                      <div className="text-charcoal-muted font-bold mt-0.5">
                        {b.ground?.venue?.name} • {b.ground?.name} ({b.ground?.sport?.name})
                      </div>
                      <div className="text-charcoal-muted text-[11px] mt-0.5 flex items-center gap-2">
                        <span>{formatDate(b.startTime)}</span>
                        <span>•</span>
                        <span>{formatTime(b.startTime)} — {formatTime(b.endTime)}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 pt-2 sm:pt-0">
                      <div className="font-black text-forest-900 text-sm">
                        {formatCurrency(b.totalPrice)}
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${getStatusColor(
                          b.status
                        )}`}
                      >
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-charcoal-muted text-xs">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-charcoal-muted/50" />
                <p className="font-black text-charcoal">No reservations recorded yet</p>
                <p className="text-charcoal-muted mt-1">As players book your grounds, they will show up here in real time.</p>
              </div>
            )}
          </div>

          {/* Right Side: Quick Management Shortcuts */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-turfborder p-6 shadow-card space-y-4">
              <h3 className="font-black text-charcoal text-base">Facility Management</h3>
              <p className="text-xs text-charcoal-muted leading-relaxed font-normal">
                Quick access to configure operating hours, add new playable turfs, or block downtime for maintenance.
              </p>

              <div className="space-y-2.5">
                <Link
                  to="/owner/venues"
                  className="w-full p-3.5 rounded-2xl bg-forest-50/40 hover:bg-forest-50 border border-turfborder hover:border-emerald-300 text-xs font-black text-forest-900 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-emerald-700" />
                    <span>My Venues & Pitches</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-charcoal-muted" />
                </Link>

                <Link
                  to="/owner/reservations"
                  className="w-full p-3.5 rounded-2xl bg-forest-50/40 hover:bg-forest-50 border border-turfborder hover:border-emerald-300 text-xs font-black text-forest-900 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    <span>Match Schedule & Receipts</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-charcoal-muted" />
                </Link>

                <Link
                  to="/owner/venues/create"
                  className="w-full p-3.5 rounded-2xl bg-gradient-booking hover:opacity-95 text-charcoal text-xs font-black transition-all flex items-center justify-between shadow-lime-sm border border-emerald-300"
                >
                  <div className="flex items-center gap-2.5">
                    <PlusCircle className="w-4 h-4 text-charcoal" />
                    <span>Register Another Venue</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Concurrency Architecture Notice - Cinematic Dark Green Highlight */}
            <div className="bg-gradient-dark-content rounded-3xl p-6 border border-emerald-900/60 shadow-elevated-dark text-white space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-lime uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-lime" />
                <span>Atomic Protection</span>
              </div>
              <h4 className="font-black text-sm text-white">PostgreSQL Exclusion Active</h4>
              <p className="text-xs text-turftext-ondark-secondary leading-relaxed font-normal">
                Double bookings are blocked at the engine level by your PostgreSQL GiST range constraint. TurfBook protects your facility from overlapping match bookings even under peak concurrency.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
