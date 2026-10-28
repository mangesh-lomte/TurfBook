import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';
import { Booking } from '../../types';
import { formatCurrency, formatDate, formatTime, getStatusColor } from '../../lib/utils';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  Search,
  Filter,
  Check,
} from 'lucide-react';

export const OwnerReservations: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { data: reservationsData, isLoading } = useQuery({
    queryKey: ['owner-reservations'],
    queryFn: () => api.get<Booking[]>('/owner/bookings'),
  });

  const reservations = reservationsData || [];

  const completeMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return api.post(`/bookings/${bookingId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['owner-overview'] });
      setActionSuccess('Match marked as COMPLETED successfully.');
      setTimeout(() => setActionSuccess(null), 4000);
    },
  });

  const filtered = reservations.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      r.bookingNumber.toLowerCase().includes(term) ||
      r.customer?.fullName.toLowerCase().includes(term) ||
      r.ground?.name.toLowerCase().includes(term) ||
      r.ground?.venue?.name.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-dashboard text-charcoal py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-charcoal tracking-tight">
              Customer Reservations
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
              Track active player bookings, customer contact details, and mark matches as completed.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-turfborder rounded-xl shadow-xs w-full sm:w-80 focus-within:ring-2 focus-within:ring-emerald-600/20 focus-within:border-emerald-600 transition-all">
            <Search className="w-4 h-4 text-charcoal-muted shrink-0" />
            <label htmlFor="owner-search-booking" className="sr-only">
              Search booking number or customer
            </label>
            <input
              id="owner-search-booking"
              type="text"
              placeholder="Search booking # or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm text-charcoal focus:outline-none font-medium placeholder:text-charcoal-muted/60"
            />
          </div>
        </div>

        {actionSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-forest-900 font-bold mb-6 flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-turfborder pb-3 mb-6 overflow-x-auto">
          {(['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === tab
                  ? 'bg-gradient-brand text-white font-black shadow-brand'
                  : 'bg-white text-charcoal-muted border border-turfborder hover:bg-forest-50/60'
              }`}
            >
              {tab === 'ALL'
                ? `All (${reservations.length})`
                : tab === 'CONFIRMED'
                ? 'Confirmed'
                : tab === 'COMPLETED'
                ? 'Completed'
                : 'Cancelled'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-forest-50/60 rounded-3xl animate-pulse border border-turfborder" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-turfborder shadow-card p-8 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-forest-50 text-forest-800 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-charcoal mb-1">No Reservations Found</h3>
            <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
              {search ? 'No match found for your search query.' : 'As customers book slots on your grounds, they will appear here.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-turfborder overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-[#F8FAF7] border-b border-turfborder text-charcoal-muted font-black uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Ref & Customer</th>
                    <th className="px-6 py-4">Ground & Sport</th>
                    <th className="px-6 py-4">Match Date & Time</th>
                    <th className="px-6 py-4">Paid Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-turfborder">
                  {filtered.map((b) => (
                    <tr key={b.id} className="hover:bg-forest-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono font-black text-forest-900 mb-0.5">
                          #{b.bookingNumber}
                        </div>
                        <div className="font-black text-charcoal text-sm">{b.customer?.fullName}</div>
                        <div className="text-[11px] text-charcoal-muted flex items-center gap-1 mt-0.5 font-medium">
                          <Phone className="w-3 h-3 text-emerald-700" />
                          <span>{b.customer?.phone || 'No phone'}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-black text-charcoal">{b.ground?.name}</div>
                        <div className="text-charcoal-muted font-medium">{b.ground?.venue?.name}</div>
                        <span className="text-[10px] text-forest-900 bg-forest-50 px-2 py-0.5 rounded font-bold border border-emerald-100 inline-block mt-1">
                          {b.ground?.sport?.name}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-black text-charcoal">{formatDate(b.startTime)}</div>
                        <div className="text-charcoal-muted font-medium mt-0.5">
                          {formatTime(b.startTime)} — {formatTime(b.endTime)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-black text-forest-900 text-sm">
                          {formatCurrency(b.totalPrice)}
                        </div>
                        <div className="text-[10px] text-emerald-800 font-bold">Payment Settled</div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${getStatusColor(
                            b.status
                          )}`}
                        >
                          {b.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {b.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            onClick={() => completeMutation.mutate(b.id)}
                            disabled={completeMutation.isPending}
                            className="px-3.5 py-1.5 bg-gradient-brand hover:opacity-95 text-white rounded-xl font-black text-xs transition-all shadow-brand disabled:opacity-50"
                          >
                            {completeMutation.isPending ? 'Updating...' : 'Mark Completed'}
                          </button>
                        )}
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
