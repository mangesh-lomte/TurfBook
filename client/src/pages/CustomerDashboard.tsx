import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { CustomerAnalytics } from '../types';
import { formatCurrency, formatDate, formatTime, getStatusColor } from '../lib/utils';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  ArrowRight,
  Compass,
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['customer-overview'],
    queryFn: () => api.get<CustomerAnalytics>('/customer/overview'),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase font-bold text-turf tracking-wider block mb-1">
            Player Dashboard
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your match reservations, review past venues, and discover new turfs.
          </p>
        </div>

        <Link
          to="/explore"
          className="px-5 py-2.5 bg-forest-900 hover:bg-forest-800 text-turf-bright font-bold text-sm rounded-xl shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Compass className="w-4 h-4" />
          <span>Book New Slot</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Upcoming
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {isLoading ? '...' : analytics?.upcomingBookings || 0}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">Active Reservations</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Completed
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {isLoading ? '...' : analytics?.pastBookings || 0}
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">Matches Played</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cancelled
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {isLoading ? '...' : analytics?.cancelledBookings || 0}
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">Refunded</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Spent
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {isLoading ? '...' : formatCurrency(analytics?.totalSpent || 0)}
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">Tracked on DB</span>
        </div>
      </div>

      {/* Recent Reservations */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Match Bookings</h3>
            <p className="text-xs text-slate-500">Your latest reservations across venues</p>
          </div>
          <Link
            to="/customer/bookings"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {analytics?.recentBookings && analytics.recentBookings.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {analytics.recentBookings.map((b) => (
              <div
                key={b.id}
                onClick={() => navigate('/customer/bookings')}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 -mx-6 px-6 transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900 text-sm">
                      {b.ground?.venue?.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      • {b.ground?.name} ({b.ground?.sport?.name})
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(b.startTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatTime(b.startTime)} — {formatTime(b.endTime)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">
                      {formatCurrency(b.totalPrice)}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      #{b.bookingNumber}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(
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
          <div className="text-center py-10 text-slate-400 text-xs">
            No bookings made yet. Explore turfs and book your first slot!
          </div>
        )}
      </div>
    </div>
  );
};
