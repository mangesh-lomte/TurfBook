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
} from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['owner-overview'],
    queryFn: () => api.get<OwnerAnalytics>('/owner/overview'),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase font-bold text-emerald-600 tracking-wider block mb-1">
            Owner Management Portal
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Facility Analytics & Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time occupancy, revenue summaries, and incoming match reservations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/owner/venues/create"
            className="px-4 py-2.5 bg-forest-900 hover:bg-forest-800 text-turf-bright font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Venue</span>
          </Link>
          <Link
            to="/owner/reservations"
            className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-colors"
          >
            All Reservations
          </Link>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {isLoading ? '...' : formatCurrency(analytics?.totalRevenue || 0)}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">PostgreSQL Payments</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Bookings
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {isLoading ? '...' : analytics?.totalBookings || 0}
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            {analytics?.confirmedBookings || 0} confirmed
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Today's Games
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {isLoading ? '...' : analytics?.todayBookings || 0}
          </div>
          <span className="text-[11px] text-amber-600 font-semibold">Playing Today</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Occupancy Rate
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {isLoading ? '...' : `${analytics?.occupancyRate || 0}%`}
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">Current Month</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Reservations Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Recent Customer Reservations</h3>
              <p className="text-xs text-slate-500">Live booking activity on your grounds</p>
            </div>
            <Link
              to="/owner/reservations"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {analytics?.recentReservations && analytics.recentReservations.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {analytics.recentReservations.map((b) => (
                <div key={b.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {b.customer?.fullName}
                    </div>
                    <div className="text-slate-500">
                      {b.ground?.venue?.name} • {b.ground?.name}
                    </div>
                    <div className="text-slate-400 mt-0.5">
                      {formatDate(b.startTime)} ({formatTime(b.startTime)} — {formatTime(b.endTime)})
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-slate-900 text-sm">
                      {formatCurrency(b.totalPrice)}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border mt-1 inline-block ${getStatusColor(
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
            <p className="text-xs text-slate-400 text-center py-8">
              No reservations recorded yet.
            </p>
          )}
        </div>

        {/* Most Booked Grounds */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Top Playable Grounds</h3>
          <p className="text-xs text-slate-500 mb-6">Highest reserved facilities</p>

          <div className="space-y-4">
            {analytics?.topGrounds && analytics.topGrounds.length > 0 ? (
              analytics.topGrounds.map((g, idx) => (
                <div key={g.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 text-xs">
                      #{idx + 1} {g.name}
                    </span>
                    <span className="text-xs font-black text-emerald-700">
                      {g.bookingCount} bookings
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {g.venueName} • {g.sportName}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700 mt-1">
                    Rate: {formatCurrency(g.hourlyRate)}/hr
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No grounds data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
