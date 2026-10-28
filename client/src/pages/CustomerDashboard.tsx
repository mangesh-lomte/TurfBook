import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { CustomerAnalytics } from '../types';
import { formatCurrency, formatDate, formatTime, getStatusColor } from '../lib/utils';
import { SportIcon } from '../components/SportIcon';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  ArrowRight,
  Compass,
  Trophy,
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['customer-overview'],
    queryFn: () => api.get<CustomerAnalytics>('/customer/overview'),
  });

  return (
    <div className="min-h-screen bg-gradient-dashboard text-[#18231D] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Bar - No kickers per Impeccable Craft Floor */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#18231D] tracking-tight">
              Welcome back, {user?.fullName?.split(' ')[0] || 'Player'}!
            </h1>
            <p className="text-xs sm:text-sm text-[#526158] mt-1.5 font-normal">
              Manage your match reservations, review completed games, and explore verified sports turfs.
            </p>
          </div>

          <Link
            to="/explore"
            className="px-6 py-3 bg-[#123B2A] hover:bg-[#176443] text-white font-bold text-xs rounded-xl shadow-brand hover:shadow-card-hover transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Compass className="w-4 h-4 text-[#B9F65A]" />
            <span>Book Match Slot</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-white p-5 rounded-2xl border border-[#DFE6DF] shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#526158] uppercase tracking-wider">
                Upcoming
              </span>
              <div className="p-2 bg-[#F0F6EE] border border-[#C5E1BF] text-[#123B2A] rounded-xl">
                <Calendar className="w-4 h-4 text-[#27864F]" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#18231D] font-mono tabular-nums">
              {isLoading ? '...' : analytics?.upcomingBookings || 0}
            </div>
            <span className="text-[11px] text-[#27864F] font-bold block mt-1">
              Active Reservations
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#DFE6DF] shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#526158] uppercase tracking-wider">
                Completed
              </span>
              <div className="p-2 bg-[#F0F6EE] border border-[#C5E1BF] text-[#27864F] rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-[#27864F]" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#18231D] font-mono tabular-nums">
              {isLoading ? '...' : analytics?.pastBookings || 0}
            </div>
            <span className="text-[11px] text-[#526158] font-semibold block mt-1">
              Matches Played
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#DFE6DF] shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#526158] uppercase tracking-wider">
                Cancelled
              </span>
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#18231D] font-mono tabular-nums">
              {isLoading ? '...' : analytics?.cancelledBookings || 0}
            </div>
            <span className="text-[11px] text-[#526158] font-semibold block mt-1">
              Refunded to Player
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#DFE6DF] shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#526158] uppercase tracking-wider">
                Total Spent
              </span>
              <div className="p-2 bg-[#F0F6EE] border border-[#C5E1BF] text-[#123B2A] rounded-xl">
                <CreditCard className="w-4 h-4 text-[#27864F]" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#123B2A] font-mono tabular-nums">
              {isLoading ? '...' : formatCurrency(analytics?.totalSpent || 0)}
            </div>
            <span className="text-[11px] text-[#526158] font-semibold block mt-1">
              Verified Payments
            </span>
          </div>
        </div>

        {/* Recent Reservations */}
        <div className="bg-white rounded-3xl border border-[#DFE6DF] p-6 sm:p-8 shadow-card">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#DFE6DF]">
            <div>
              <h2 className="text-xl font-bold text-[#18231D] tracking-tight">Recent Match Bookings</h2>
              <p className="text-xs text-[#526158] mt-1">Your latest slot reservations across venues</p>
            </div>
            <Link
              to="/customer/bookings"
              className="text-xs font-bold text-[#123B2A] hover:text-[#176443] flex items-center gap-1.5 group cursor-pointer"
            >
              <span>All Bookings</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-[#27864F]" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 bg-[#F8FAF7] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : analytics?.recentBookings && analytics.recentBookings.length > 0 ? (
            <div className="divide-y divide-[#DFE6DF]">
              {analytics.recentBookings.map((b) => (
                <div
                  key={b.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate('/customer/bookings')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate('/customer/bookings');
                    }
                  }}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F0F6EE]/60 -mx-6 px-6 transition-colors cursor-pointer rounded-xl"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <SportIcon sport={b.ground?.sport?.name || ''} className="w-4 h-4 text-[#27864F]" />
                      <span className="font-bold text-[#18231D] text-sm">
                        {b.ground?.venue?.name}
                      </span>
                      <span className="text-xs text-[#526158] font-medium">
                        • {b.ground?.name} ({b.ground?.sport?.name})
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#526158]">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-[#27864F]" />
                        <span className="font-mono tabular-nums">{formatDate(b.startTime)}</span>
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#27864F]" />
                        <span className="font-mono tabular-nums">{formatTime(b.startTime)} — {formatTime(b.endTime)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="text-sm font-black text-[#123B2A] font-mono tabular-nums">
                        {formatCurrency(b.totalPrice)}
                      </div>
                      <span className="text-[10px] text-[#526158] font-mono block">
                        #{b.bookingNumber}
                      </span>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
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
            <div className="text-center py-12 text-[#526158] text-xs">
              <Calendar className="w-10 h-10 text-[#526158] mx-auto mb-2" />
              <p className="font-bold text-[#18231D] text-sm">No bookings made yet</p>
              <p className="text-[#526158] mt-1 mb-4">Explore our verified turfs and schedule your first game!</p>
              <Link
                to="/explore"
                className="px-5 py-2.5 bg-[#123B2A] hover:bg-[#176443] text-white font-bold rounded-xl text-xs inline-block shadow-brand transition-all cursor-pointer"
              >
                Discover Turfs
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
