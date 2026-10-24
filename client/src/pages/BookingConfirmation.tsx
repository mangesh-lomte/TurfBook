import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Booking } from '../types';
import { formatCurrency, formatDate, formatTime } from '../lib/utils';
import { CheckCircle2, Calendar, MapPin, Download, ArrowRight, ShieldCheck } from 'lucide-react';

export const BookingConfirmation: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => api.get<Booking>(`/bookings/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Retrieving booking receipt...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Booking details not found</h2>
        <Link to="/explore" className="text-sm text-emerald-600 underline mt-2 block">
          Return to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-8 sm:p-10 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full border border-emerald-200 mb-3 inline-block">
          Reservation Confirmed
        </span>

        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
          You're Ready to Play!
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          Your slot has been authoritatively reserved in PostgreSQL. We've notified the venue owner.
        </p>

        {/* Receipt Box */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 text-left space-y-4 mb-8">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <span className="text-xs uppercase font-bold text-slate-400">Booking Reference</span>
            <span className="text-sm font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              {booking.bookingNumber}
            </span>
          </div>

          <div>
            <div className="text-xs text-slate-400 font-semibold">Arena & Ground</div>
            <div className="text-base font-bold text-slate-900">{booking.ground?.venue?.name}</div>
            <div className="text-xs text-slate-600">{booking.ground?.name} ({booking.ground?.surfaceType})</div>
          </div>

          <div className="flex items-start gap-2 text-xs text-slate-600">
            <MapPin className="w-4 h-4 text-turf shrink-0 mt-0.5" />
            <span>{booking.ground?.venue?.address}, {booking.ground?.venue?.city}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block">Date</span>
              <span className="font-bold text-slate-900">{formatDate(booking.startTime)}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Time Slot</span>
              <span className="font-bold text-slate-900">
                {formatTime(booking.startTime)} — {formatTime(booking.endTime)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-200">
            <span className="text-xs font-bold uppercase text-slate-500">Amount Paid</span>
            <span className="text-lg font-black text-emerald-700">
              {formatCurrency(booking.totalPrice)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/customer/bookings"
            className="w-full sm:flex-1 py-3 bg-forest-900 hover:bg-forest-800 text-turf-bright font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <span>View My Bookings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/explore"
            className="w-full sm:w-auto px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-colors"
          >
            Explore More Turfs
          </Link>
        </div>
      </div>
    </div>
  );
};
