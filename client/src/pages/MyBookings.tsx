import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import { Booking } from '../types';
import { formatCurrency, formatDate, formatTime, getStatusColor } from '../lib/utils';
import { RatingStars } from '../components/RatingStars';
import {
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  X,
  Star,
  CheckCircle2,
  Trash2,
  Phone,
} from 'lucide-react';

export const MyBookings: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('ALL');

  // Cancel Modal State
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Review Modal State
  const [reviewModalBooking, setReviewModalBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => api.get<Booking[]>('/bookings/my'),
  });

  const bookings = bookingsData || [];

  // Filter bookings based on tab
  const filteredBookings = bookings.filter((b) => {
    const isPast = new Date(b.endTime).getTime() <= Date.now();
    if (activeTab === 'UPCOMING') return b.status === 'CONFIRMED' && !isPast;
    if (activeTab === 'COMPLETED') return b.status === 'COMPLETED' || (b.status === 'CONFIRMED' && isPast);
    if (activeTab === 'CANCELLED') return b.status === 'CANCELLED';
    return true;
  });

  // Cancel Mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!cancelModalBooking) return;
      return api.post(`/bookings/${cancelModalBooking.id}/cancel`, {
        reason: cancelReason || 'Schedule conflict',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['customer-overview'] });
      setCancelModalBooking(null);
      setCancelReason('');
      setCancelError(null);
    },
    onError: (err: ApiError) => {
      setCancelError(err.message || 'Failed to cancel booking');
    },
  });

  // Review Mutation
  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!reviewModalBooking) return;
      return api.post(`/reviews/booking/${reviewModalBooking.id}`, {
        rating,
        comment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      setReviewModalBooking(null);
      setComment('');
      setReviewError(null);
    },
    onError: (err: ApiError) => {
      setReviewError(err.message || 'Failed to submit review');
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          My Match Reservations
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your upcoming game slots, cancellation receipts, and submit verified feedback.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-8 overflow-x-auto">
        {(['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              activeTab === tab
                ? 'bg-forest-900 text-turf-bright shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab === 'ALL'
              ? `All (${bookings.length})`
              : tab === 'UPCOMING'
              ? 'Upcoming'
              : tab === 'COMPLETED'
              ? 'Completed'
              : 'Cancelled'}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl h-44 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No bookings in this tab</h3>
          <p className="text-xs text-slate-400 mt-1">
            Check your other tabs or head over to Explore to schedule a game!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const isPast = new Date(b.endTime).getTime() <= Date.now();
            const canCancel = b.status === 'CONFIRMED' && !isPast;
            const canReview = (b.status === 'COMPLETED' || isPast) && b.status !== 'CANCELLED' && !b.review;

            return (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                      #{b.bookingNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(
                        b.status
                      )}`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">
                      {b.ground?.venue?.name}
                    </h3>
                    <div className="text-xs text-slate-600 font-medium">
                      {b.ground?.name} • {b.ground?.sport?.name} ({b.ground?.surfaceType})
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-turf shrink-0" />
                      {formatDate(b.startTime)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      {formatTime(b.startTime)} — {formatTime(b.endTime)} ({b.totalHours} hr)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      {b.ground?.venue?.city}
                    </span>
                  </div>

                  {b.cancellationReason && (
                    <div className="text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 inline-block">
                      Cancellation reason: {b.cancellationReason}
                    </div>
                  )}

                  {b.review && (
                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <span className="text-slate-400 font-semibold">Your rating:</span>
                      <RatingStars rating={b.review.rating} size={14} />
                      <span className="text-slate-600 italic">"{b.review.comment}"</span>
                    </div>
                  )}
                </div>

                {/* Right side Price & Actions */}
                <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 shrink-0 gap-3">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Total Paid
                    </span>
                    <span className="text-lg font-black text-slate-900">
                      {formatCurrency(b.totalPrice)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {canCancel && (
                      <button
                        onClick={() => {
                          setCancelModalBooking(b);
                          setCancelReason('');
                          setCancelError(null);
                        }}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Cancel Booking</span>
                      </button>
                    )}

                    {canReview && (
                      <button
                        onClick={() => {
                          setReviewModalBooking(b);
                          setRating(5);
                          setComment('');
                          setReviewError(null);
                        }}
                        className="px-3.5 py-1.5 bg-forest-900 hover:bg-forest-800 text-turf-bright text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>Rate & Review</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Booking Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-lg">Cancel Reservation</h3>
              <button
                onClick={() => setCancelModalBooking(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to cancel booking{' '}
              <strong className="text-slate-900 font-mono">
                #{cancelModalBooking.bookingNumber}
              </strong>
              ? Your slot will be released back into availability and your simulated payment will be
              marked as <span className="text-emerald-600 font-bold">REFUNDED</span>.
            </p>

            {cancelError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {cancelError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Reason for Cancellation
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Heavy rain, players unavailable, schedule change..."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setCancelModalBooking(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="flex-1 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-sm"
              >
                {cancelMutation.isPending ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Submission Modal */}
      {reviewModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-lg">Submit Verified Review</h3>
              <button
                onClick={() => setReviewModalBooking(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Reviewing <strong className="text-slate-900">{reviewModalBooking.ground?.venue?.name}</strong>{' '}
              ({reviewModalBooking.ground?.name})
            </div>

            {reviewError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {reviewError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                Your Rating (1 to 5 Stars)
              </label>
              <RatingStars
                rating={rating}
                interactive={true}
                size={28}
                onRatingChange={(newVal) => setRating(newVal)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Comment
              </label>
              <textarea
                rows={3}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was the turf quality, lighting, parking, and staff behavior?"
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setReviewModalBooking(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => reviewMutation.mutate()}
                disabled={reviewMutation.isPending || !comment.trim()}
                className="flex-1 py-2.5 text-xs font-bold bg-forest-900 hover:bg-forest-800 text-turf-bright rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {reviewMutation.isPending ? 'Submitting...' : 'Post Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
