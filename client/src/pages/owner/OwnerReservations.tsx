import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';
import { Booking } from '../../types';
import { formatCurrency, formatDate, formatTime, getStatusColor } from '../../lib/utils';
import { Calendar, Clock, User, Phone, Mail, CheckCircle2, Search } from 'lucide-react';

export const OwnerReservations: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

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
    },
  });

  const filtered = reservations.filter((r) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      r.bookingNumber.toLowerCase().includes(term) ||
      r.customer?.fullName.toLowerCase().includes(term) ||
      r.ground?.name.toLowerCase().includes(term) ||
      r.ground?.venue?.name.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Customer Reservations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track active player bookings, customer contact details, and mark matches as completed.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-xs w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search booking # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-800 focus:outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Reservations Found</h3>
          <p className="text-xs text-slate-400 mt-1">
            As soon as customers book slots on your grounds, they will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Ref & Customer</th>
                  <th className="px-6 py-4">Ground & Sport</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Paid Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-slate-900 mb-0.5">
                        #{b.bookingNumber}
                      </div>
                      <div className="font-semibold text-slate-800">{b.customer?.fullName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{b.customer?.phone || 'No phone'}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{b.ground?.name}</div>
                      <div className="text-slate-500">{b.ground?.venue?.name}</div>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                        {b.ground?.sport?.name}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{formatDate(b.startTime)}</div>
                      <div className="text-slate-500">
                        {formatTime(b.startTime)} — {formatTime(b.endTime)}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-900 text-sm">
                        {formatCurrency(b.totalPrice)}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">Payment Verified</div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusColor(
                          b.status
                        )}`}
                      >
                        {b.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {b.status === 'CONFIRMED' && (
                        <button
                          onClick={() => completeMutation.mutate(b.id)}
                          disabled={completeMutation.isPending}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs transition-colors"
                        >
                          Mark Completed
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
  );
};
